import httpx
import json
import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

async def generate_work_summary(transcript, vehicle_info):
    """Generate a structured work summary from the transcript"""
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}"
            }
            
            # Prepare context with vehicle info
            vehicle_context = ""
            if vehicle_info:
                vehicle_context = f"Vehicle information: VIN {vehicle_info.get('vin', 'unknown')}, Mileage: {vehicle_info.get('mileage', 'unknown')}"
            
            prompt = f"""
            Based on the following voice memo transcript from an auto technician, create:
            1. A summary of work performed
            2. A detailed list of parts used with prices
            3. An estimate of labor hours and cost (assume $100/hour)
            4. A total estimate
            
            {vehicle_context}
            
            Voice memo transcript:
            {transcript}
            
            Format the response as JSON with these fields:
            {{
                "work_summary": "Brief description of work done",
                "line_items": [
                    {{"description": "Part or labor description", "type": "part|labor", "quantity": number, "unit_price": number, "total": number}}
                ],
                "total_parts": number,
                "total_labor": number,
                "total": number
            }}
            """
            
            payload = {
                "model": "gpt-4-turbo",
                "messages": [
                    {"role": "system", "content": "You are an expert auto repair service writer who converts technician notes into professional work orders."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"]
                try:
                    return json.loads(result)
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON from response: {result}")
                    return {
                        "work_summary": "Error parsing work summary",
                        "line_items": [],
                        "total_parts": 0,
                        "total_labor": 0,
                        "total": 0
                    }
            else:
                print(f"OpenAI API error: {response.text}")
                return {
                    "work_summary": "Error generating work summary",
                    "line_items": [],
                    "total_parts": 0,
                    "total_labor": 0,
                    "total": 0
                }
    except Exception as e:
        print(f"Error generating work summary: {e}")
        return {
            "work_summary": f"Error: {str(e)}",
            "line_items": [],
            "total_parts": 0,
            "total_labor": 0, 
            "total": 0
        }
