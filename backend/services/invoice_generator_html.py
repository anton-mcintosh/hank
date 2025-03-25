import os
import uuid
from datetime import datetime
from pathlib import Path
import jinja2
from dotenv import load_dotenv
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)
from reportlab.lib.units import inch

load_dotenv()

# Configuration from environment variables
INVOICE_DIR = os.getenv("INVOICE_DIR", "./invoices")
TEMPLATE_DIR = os.getenv("TEMPLATE_DIR", "./backend/templates")
COMPANY_NAME = os.getenv("COMPANY_NAME", "Auto Shop")
COMPANY_ADDRESS = os.getenv("COMPANY_ADDRESS", "123 Main St, Anytown, USA")
COMPANY_PHONE = os.getenv("COMPANY_PHONE", "(555) 123-4567")
COMPANY_EMAIL = os.getenv("COMPANY_EMAIL", "service@autoshop.com")
COMPANY_WEBSITE = os.getenv("COMPANY_WEBSITE", "www.yourautoshop.com")

# Ensure directories exist
os.makedirs(INVOICE_DIR, exist_ok=True)
os.makedirs(TEMPLATE_DIR, exist_ok=True)

# Set up jinja2 environment
template_loader = jinja2.FileSystemLoader(searchpath=TEMPLATE_DIR)
template_env = jinja2.Environment(loader=template_loader)


async def generate_invoice_html(
    work_order, customer=None, vehicle=None, is_estimate=False
):
    """
    Generate an HTML invoice or estimate using a template

    Args:
        work_order: WorkOrder database object
        customer: Customer database object (optional)
        vehicle: Vehicle database object (optional)
        is_estimate: Boolean indicating if this is an estimate (True) or invoice (False)

    Returns:
        tuple: (HTML content, file path)
    """
    try:
        # Determine document type
        document_type = "ESTIMATE" if is_estimate else "INVOICE"

        # Generate file name and path
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        html_filename = f"{document_type.lower()}_{work_order.id[:8]}.html"
        html_path = os.path.join(INVOICE_DIR, html_filename)

        # Prepare customer data
        customer_data = {}
        if customer:
            customer_data = {
                "name": f"{customer.first_name} {customer.last_name}",
                "email": customer.email,
                "phone": customer.phone,
                "address": customer.address,
            }
        else:
            # Use customer name from work order if available
            customer_data = {
                "name": work_order.customer_name
                if work_order.customer_name
                else "Customer",
                "email": "N/A",
                "phone": "N/A",
                "address": "N/A",
            }

        # Prepare vehicle data
        vehicle_data = {}
        if vehicle:
            vehicle_data = {
                "year": vehicle.year,
                "make": vehicle.make,
                "model": vehicle.model,
                "vin": vehicle.vin,
                "mileage": f"{vehicle.mileage:,}" if vehicle.mileage else "N/A",
            }
        else:
            # Use vehicle info from work order if available
            vi = work_order.vehicle_info or {}
            vehicle_data = {
                "year": vi.get("year", "N/A"),
                "make": vi.get("make", "N/A"),
                "model": vi.get("model", "N/A"),
                "vin": vi.get("vin", "N/A"),
                "mileage": f"{vi.get('mileage', 'N/A'):,}"
                if vi.get("mileage")
                else "N/A",
            }

        # Format line items
        line_items = []
        for item in work_order.line_items:
            line_items.append(
                {
                    "description": item.get("description", ""),
                    "type": item.get("type", "").capitalize(),
                    "quantity": item.get("quantity", 0),
                    "unit_price": f"${item.get('unit_price', 0):.2f}",
                    "total": f"${item.get('total', 0):.2f}",
                }
            )

        # Prepare template data
        template_data = {
            # Company info
            "company_name": COMPANY_NAME,
            "company_address": COMPANY_ADDRESS,
            "company_phone": COMPANY_PHONE,
            "company_email": COMPANY_EMAIL,
            "company_website": COMPANY_WEBSITE,
            # Document info
            "document_type": document_type,
            "order_id": work_order.id[:8],
            "date": datetime.now().strftime("%m/%d/%Y"),
            # Customer info
            "customer_name": customer_data["name"],
            "customer_email": customer_data["email"],
            "customer_phone": customer_data["phone"],
            "customer_address": customer_data["address"],
            # Vehicle info
            "vehicle_year": vehicle_data["year"],
            "vehicle_make": vehicle_data["make"],
            "vehicle_model": vehicle_data["model"],
            "vehicle_vin": vehicle_data["vin"],
            "vehicle_mileage": vehicle_data["mileage"],
            # Work info
            "work_summary": work_order.work_summary,
            "line_items": line_items,
            "total_parts": f"${work_order.total_parts:.2f}",
            "total_labor": f"${work_order.total_labor:.2f}",
            "total": f"${work_order.total:.2f}",
            # Settings
            "is_estimate": is_estimate,
        }

        # Load template
        template = template_env.get_template("invoice_template.html")

        # Render HTML
        html_content = template.render(**template_data)

        # Save HTML file
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        return html_content, html_path, template_data

    except Exception as e:
        print(f"Error generating HTML invoice: {e}")
        import traceback

        traceback.print_exc()
        return None, None, None


async def generate_pdf_with_reportlab(template_data, output_path=None):
    """
    Generate a PDF invoice directly with ReportLab

    Args:
        template_data: Data dictionary used for the HTML template
        output_path: Path for output PDF file (optional)

    Returns:
        str: Path to generated PDF file
    """
    try:
        # Generate a filename if not provided
        if not output_path:
            document_type = (
                "estimate" if template_data.get("is_estimate", False) else "invoice"
            )
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            filename = f"{document_type}_{template_data['order_id']}_{timestamp}.pdf"
            output_path = os.path.join(INVOICE_DIR, filename)

        # Set up the document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
        )

        # Styles
        styles = getSampleStyleSheet()
        styles.add(
            ParagraphStyle(
                name="CenterHeading",
                parent=styles["Heading1"],
                alignment=1,
                spaceAfter=12,
            )
        )
        styles.add(
            ParagraphStyle(name="RightAligned", parent=styles["Normal"], alignment=2)
        )
        styles.add(
            ParagraphStyle(name="SmallText", parent=styles["Normal"], fontSize=8)
        )

        # Build the document elements
        elements = []

        # Header table - Company info and document info
        header_data = [
            [
                # Company info
                [
                    Paragraph(
                        f"<b>{template_data['company_name']}</b>", styles["Heading2"]
                    ),
                    Paragraph(template_data["company_address"], styles["Normal"]),
                    Paragraph(
                        f"Phone: {template_data['company_phone']}", styles["Normal"]
                    ),
                    Paragraph(
                        f"Email: {template_data['company_email']}", styles["Normal"]
                    ),
                    Paragraph(
                        f"Website: {template_data['company_website']}", styles["Normal"]
                    ),
                ],
                # Document info
                [
                    Paragraph(
                        f"<b>{template_data['document_type']}</b>",
                        styles["RightAligned"],
                    ),
                    Paragraph(
                        f"<b>Number:</b> {template_data['order_id']}",
                        styles["RightAligned"],
                    ),
                    Paragraph(
                        f"<b>Date:</b> {template_data['date']}", styles["RightAligned"]
                    ),
                ],
            ]
        ]

        header_table = Table(header_data, colWidths=[4 * inch, 3 * inch])
        header_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (0, 0), "LEFT"),
                    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ("VALIGN", (0, 0), (1, 0), "TOP"),
                ]
            )
        )
        elements.append(header_table)
        elements.append(Spacer(1, 20))

        # Customer Information
        elements.append(Paragraph("Customer Information", styles["Heading3"]))
        customer_data = [
            ["Name:", template_data["customer_name"]],
        ]
        if template_data["customer_phone"] != "N/A":
            customer_data.append(["Phone:", template_data["customer_phone"]])
        if template_data["customer_email"] != "N/A":
            customer_data.append(["Email:", template_data["customer_email"]])
        if template_data["customer_address"] != "N/A":
            customer_data.append(["Address:", template_data["customer_address"]])

        customer_table = Table(customer_data, colWidths=[1 * inch, 6 * inch])
        customer_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(customer_table)
        elements.append(Spacer(1, 15))

        # Vehicle Information
        elements.append(Paragraph("Vehicle Information", styles["Heading3"]))
        vehicle_table = Table(
            [
                [
                    Paragraph("<b>Year:</b>", styles["Normal"]),
                    template_data["vehicle_year"],
                    Paragraph("<b>Make:</b>", styles["Normal"]),
                    template_data["vehicle_make"],
                ],
                [
                    Paragraph("<b>Model:</b>", styles["Normal"]),
                    template_data["vehicle_model"],
                    Paragraph("<b>VIN:</b>", styles["Normal"]),
                    template_data["vehicle_vin"],
                ],
                [
                    Paragraph("<b>Mileage:</b>", styles["Normal"]),
                    template_data["vehicle_mileage"],
                    "",
                    "",
                ],
            ],
            colWidths=[0.75 * inch, 2.5 * inch, 0.75 * inch, 3 * inch],
        )

        vehicle_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                    ("BACKGROUND", (2, 0), (2, -1), colors.lightgrey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(vehicle_table)
        elements.append(Spacer(1, 15))

        # Work Summary
        elements.append(Paragraph("Work Summary", styles["Heading3"]))
        elements.append(Paragraph(template_data["work_summary"], styles["Normal"]))
        elements.append(Spacer(1, 15))

        # Line Items
        elements.append(Paragraph("Line Items", styles["Heading3"]))

        # Create table headers
        line_items_data = [["Description", "Type", "Quantity", "Unit Price", "Total"]]

        # Add line items
        for item in template_data["line_items"]:
            line_items_data.append(
                [
                    item["description"],
                    item["type"],
                    str(item["quantity"]),
                    item["unit_price"],
                    item["total"],
                ]
            )

        # Calculate column widths
        line_items_table = Table(
            line_items_data,
            colWidths=[3.5 * inch, 1 * inch, 0.75 * inch, 1 * inch, 0.75 * inch],
        )

        # Style the table
        line_items_table.setStyle(
            TableStyle(
                [
                    # Header row
                    ("BACKGROUND", (0, 0), (-1, 0), colors.blue),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    # Data rows - alternate colors
                    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                    ("ALIGN", (2, 1), (-1, -1), "RIGHT"),  # Right align numbers
                    # Grid
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    # Padding
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        # Apply zebra striping
        for i in range(1, len(line_items_data), 2):
            line_items_table.setStyle(
                TableStyle([("BACKGROUND", (0, i), (-1, i), colors.lightgrey)])
            )

        elements.append(line_items_table)
        elements.append(Spacer(1, 15))

        # Totals
        totals_data = [
            ["", "", "", "Parts Total:", template_data["total_parts"]],
            ["", "", "", "Labor Total:", template_data["total_labor"]],
            ["", "", "", "GRAND TOTAL:", template_data["total"]],
        ]

        totals_table = Table(
            totals_data,
            colWidths=[3.5 * inch, 1 * inch, 0.75 * inch, 1 * inch, 0.75 * inch],
        )

        totals_table.setStyle(
            TableStyle(
                [
                    # Align totals to right
                    ("ALIGN", (3, 0), (3, -1), "RIGHT"),
                    ("ALIGN", (4, 0), (4, -1), "RIGHT"),
                    # Bold font for totals
                    ("FONTNAME", (3, 0), (4, -1), "Helvetica-Bold"),
                    # Grand total row
                    ("LINEABOVE", (3, 2), (4, 2), 1, colors.black),
                    ("LINEBELOW", (3, 2), (4, 2), 1, colors.black),
                ]
            )
        )

        elements.append(totals_table)
        elements.append(Spacer(1, 20))

        # Footer
        if template_data.get("is_estimate", False):
            elements.append(
                Paragraph(
                    "<b>PLEASE NOTE:</b> This is an ESTIMATE only. Actual charges may vary based on additional parts or labor required. This estimate is valid for 30 days.",
                    styles["Normal"],
                )
            )
        else:
            elements.append(
                Paragraph(
                    "<b>PAYMENT TERMS:</b> Payment due upon completion of service. We accept cash, checks, and all major credit cards.",
                    styles["Normal"],
                )
            )

        elements.append(Spacer(1, 10))
        elements.append(
            Paragraph(
                f"Thank you for choosing {template_data['company_name']} for your vehicle maintenance needs. We appreciate your business!",
                styles["Normal"],
            )
        )

        # Build the PDF
        doc.build(elements)

        return output_path

    except Exception as e:
        print(f"Error generating PDF with ReportLab: {e}")
        import traceback

        traceback.print_exc()
        return None
