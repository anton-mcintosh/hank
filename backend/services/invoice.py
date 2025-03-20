import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
COMPANY_NAME = os.getenv("COMPANY_NAME", "Auto Shop")
COMPANY_ADDRESS = os.getenv("COMPANY_ADDRESS", "123 Main St, Anytown, USA")
COMPANY_PHONE = os.getenv("COMPANY_PHONE", "(555) 123-4567")
COMPANY_EMAIL = os.getenv("COMPANY_EMAIL", "service@autoshop.com")
COMPANY_WEBSITE = os.getenv("COMPANY_WEBSITE", "www.yourautoshop.com")

async def generate_invoice_markdown(work_order, customer=None, vehicle=None, is_estimate=False):
    """
    Generate a markdown-formatted invoice or estimate using OpenAI
    
    Args:
        work_order: WorkOrder database object
        customer: Customer database object (optional)
        vehicle: Vehicle database object (optional)
        is_estimate: Boolean indicating if this is an estimate (True) or invoice (False)
        
    Returns:
        str: Markdown-formatted invoice/estimate
    """
    try:
        # Prepare customer data
        customer_data = {}
        if customer:
            customer_data = {
                "name": f"{customer.first_name} {customer.last_name}",
                "email": customer.email,
                "phone": customer.phone,
                "address": customer.address
            }
        else:
            # Use customer name from work order if available
            customer_data = {
                "name": work_order.customer_name if work_order.customer_name else "Customer",
                "email": "N/A",
                "phone": "N/A",
                "address": "N/A"
            }
        
        # Prepare vehicle data
        vehicle_data = {}
        if vehicle:
            vehicle_data = {
                "year": vehicle.year,
                "make": vehicle.make,
                "model": vehicle.model,
                "vin": vehicle.vin,
                "mileage": vehicle.mileage
            }
        else:
            # Use vehicle info from work order if available
            vi = work_order.vehicle_info
            vehicle_data = {
                "year": vi.get("year", "N/A"),
                "make": vi.get("make", "N/A"),
                "model": vi.get("model", "N/A"),
                "vin": vi.get("vin", "N/A"),
                "mileage": vi.get("mileage", "N/A")
            }
        
        # Format line items
        formatted_line_items = []
        for item in work_order.line_items:
            formatted_line_items.append({
                "description": item.get("description", ""),
                "type": item.get("type", "").capitalize(),
                "quantity": item.get("quantity", 0),
                "unit_price": item.get("unit_price", 0),
                "total": item.get("total", 0)
            })
        
        # Prepare document data
        document_type = "Estimate" if is_estimate else "Invoice"
        document_data = {
            "id": work_order.id[:8],  # Use first 8 chars of the ID
            "date": work_order.updated_at.strftime("%m/%d/%Y"),
            "type": document_type
        }
        
        # Prepare company data
        company_data = {
            "name": COMPANY_NAME,
            "address": COMPANY_ADDRESS,
            "phone": COMPANY_PHONE,
            "email": COMPANY_EMAIL,
            "website": COMPANY_WEBSITE
        }
        
        # Prepare data for OpenAI
        data_for_openai = {
            "company": company_data,
            "document": document_data,
            "customer": customer_data,
            "vehicle": vehicle_data,
            "work_summary": work_order.work_summary,
            "line_items": formatted_line_items,
            "totals": {
                "parts": work_order.total_parts,
                "labor": work_order.total_labor,
                "total": work_order.total
            }
        }
        
        # Create prompt for OpenAI
        prompt = f"""
        Generate a professional, well-formatted {document_type.lower()} in Markdown format using the following data:
        
        {json.dumps(data_for_openai, indent=2)}
        
        Requirements for the markdown format:
        1. Include a header with company information and {document_type.lower()} details (number, date)
        2. Include customer and vehicle information in a clean section
        3. Include the work summary
        4. Format the line items as a table with proper alignment
        5. Show the totals (parts, labor, grand total) at the bottom
        6. If this is an estimate, include a note that prices are estimates only
        7. Include payment terms and thank you message
        8. Make it professional and visually appealing when rendered in markdown
        
        The output should ONLY be the markdown content, with no additional explanation.
        Do not include the ```markdown``` code block. Only output the raw markdown text.
        """
        
        # Call OpenAI API
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}"
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You are an expert at creating professional, well-formatted business documents in markdown."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            }
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                markdown_content = response.json()["choices"][0]["message"]["content"].strip()
                return markdown_content
            else:
                print(f"OpenAI API error: {response.text}")
                return f"Error generating {document_type.lower()}. Please try again."
    
    except Exception as e:
        print(f"Error generating invoice markdown: {e}")
        return f"Error generating {document_type.lower()}: {str(e)}"
