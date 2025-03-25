from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import os
from pathlib import Path

from database.db import get_db
from database.repos import WorkOrderRepository, CustomerRepository, VehicleRepository
from services.invoice_generator_html import (
    generate_invoice_html,
    generate_pdf_with_reportlab,
)
# from services.email_service import send_email_with_attachment

router = APIRouter()


class EmailRequest(BaseModel):
    """Request model for generating and sending invoices"""

    email: Optional[str] = None
    generate_pdf: bool = False
    send_email: bool = False


@router.post("/work-orders/{order_id}/generate-invoice")
async def generate_invoice(
    order_id: str,
    request: EmailRequest,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """
    Generate an invoice using HTML template and ReportLab for PDF

    Args:
        order_id: Work order ID
        request: Email and format options
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        dict: Response with HTML content and file paths if applicable
    """
    # Get work order
    work_order = WorkOrderRepository.get_by_id(db, order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Get customer and vehicle if available
    customer = None
    if work_order.customer_id:
        customer = CustomerRepository.get_by_id(db, work_order.customer_id)

    vehicle = None
    if work_order.vehicle_id:
        vehicle = VehicleRepository.get_by_id(db, work_order.vehicle_id)

    # Generate HTML invoice using template
    html_content, html_path, template_data = await generate_invoice_html(
        work_order, customer, vehicle, is_estimate=False
    )

    if not html_content:
        raise HTTPException(status_code=500, detail="Failed to generate invoice")

    # Update work order status
    WorkOrderRepository.update(db, order_id, {"status": "invoiced"})

    result = {"status": "success", "html_content": html_content, "html_path": html_path}

    # Generate PDF if requested
    pdf_path = None
    if request.generate_pdf:
        print("Generating PDF with ReportLab...")
        # Generate PDF using ReportLab
        pdf_path = await generate_pdf_with_reportlab(template_data)

        if pdf_path:
            result["pdf_path"] = pdf_path
        else:
            result["status"] = "partial"
            result["message"] = "Generated HTML but failed to create PDF"

    # # Send email if requested
    # if request.send_email and request.email:
    #     if background_tasks:
    #         # Send email in background
    #         attachment_path = pdf_path if request.generate_pdf and pdf_path else html_path
    #         background_tasks.add_task(
    #             send_email_with_attachment,
    #             request.email,
    #             f"Invoice #{order_id[:8]} from Your Auto Shop",
    #             html_content,  # HTML body
    #             attachment_path  # Attachment
    #         )
    #         result["email_status"] = "queued"
    #     else:
    #         # Code for synchronous email sending
    #         pass

    print(f"PDF generated: {result}")
    return result


@router.post("/work-orders/{order_id}/generate-estimate")
async def generate_estimate(
    order_id: str,
    request: EmailRequest,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """
    Generate an estimate using HTML template and ReportLab for PDF

    Args:
        order_id: Work order ID
        request: Email and format options
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        dict: Response with HTML content and file paths if applicable
    """
    # Get work order
    work_order = WorkOrderRepository.get_by_id(db, order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Get customer and vehicle if available
    customer = None
    if work_order.customer_id:
        customer = CustomerRepository.get_by_id(db, work_order.customer_id)

    vehicle = None
    if work_order.vehicle_id:
        vehicle = VehicleRepository.get_by_id(db, work_order.vehicle_id)

    # Generate HTML estimate using template
    html_content, html_path, template_data = await generate_invoice_html(
        work_order, customer, vehicle, is_estimate=True
    )

    if not html_content:
        raise HTTPException(status_code=500, detail="Failed to generate estimate")

    # Update work order status
    WorkOrderRepository.update(db, order_id, {"status": "estimated"})

    result = {"status": "success", "html_content": html_content, "html_path": html_path}

    # Generate PDF if requested
    pdf_path = None
    if request.generate_pdf:
        print("Generating PDF with ReportLab...")
        # Generate PDF using ReportLab
        pdf_path = await generate_pdf_with_reportlab(template_data)

        if pdf_path:
            result["pdf_path"] = pdf_path
        else:
            result["status"] = "partial"
            result["message"] = "Generated HTML but failed to create PDF"

    return result


@router.get("/invoices/{filename}")
async def get_invoice_pdf(filename: str):
    INVOICE_DIR = os.getenv("INVOICE_DIR", "invoices")

    file_path = Path(INVOICE_DIR) / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path.absolute()), media_type="application/pdf", filename=filename
    )
