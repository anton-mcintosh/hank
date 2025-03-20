from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database.db import get_db
from database.repos import WorkOrderRepository, CustomerRepository, VehicleRepository
from services.invoice import generate_invoice_markdown
from services.markdown_to_pdf import convert_markdown_to_pdf
# from services.email_service import send_email_with_markdown

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
    db: Session = Depends(get_db)
):
    """
    Generate an invoice using AI for a work order
    
    Args:
        order_id: Work order ID
        request: Email and format options
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        dict: Response with markdown content and file path if applicable
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
    
    # Generate markdown invoice using OpenAI
    markdown_content = await generate_invoice_markdown(
        work_order, 
        customer, 
        vehicle, 
        is_estimate=False
    )
    
    if not markdown_content:
        raise HTTPException(status_code=500, detail="Failed to generate invoice")
    
    # Update work order status
    WorkOrderRepository.update(db, order_id, {"status": "invoiced"})
    
    result = {
        "status": "success",
        "markdown_content": markdown_content,
    }
    
    # Generate PDF if requested
    pdf_path = None
    if request.generate_pdf:
        print("Generating PDF...")
        pdf_path = await convert_markdown_to_pdf(
            markdown_content, 
            filename_prefix=f"Invoice_{order_id[:8]}"
        )

        if pdf_path:
            result["pdf_path"] = pdf_path
        else:
            result["status"] = "partial"
            result["message"] = "Generated markdown but failed to create PDF"

    # # Send email if requested
    # if request.send_email and request.email:
    #     if background_tasks:
    #         # Send email in background
    #         background_tasks.add_task(
    #             send_email_with_markdown,
    #             request.email,
    #             f"Invoice #{order_id[:8]} from Your Auto Shop",
    #             markdown_content,
    #             pdf_path if request.generate_pdf else None
    #         )
    #         result["email_status"] = "queued"
    #     else:
    #         # Send email synchronously
    #         email_sent = await send_email_with_markdown(
    #             request.email,
    #             f"Invoice #{order_id[:8]} from Your Auto Shop",
    #             markdown_content,
    #             pdf_path if request.generate_pdf else None
    #         )
    #
    #         if email_sent:
    #             result["email_status"] = "sent"
    #         else:
    #             result["email_status"] = "failed"
    
    return result

@router.post("/work-orders/{order_id}/generate-estimate")
async def generate_estimate(
    order_id: str,
    request: EmailRequest,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Generate an estimate using AI for a work order
    
    Args:
        order_id: Work order ID
        request: Email and format options
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        dict: Response with markdown content and file path if applicable
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
    
    # Generate markdown estimate using OpenAI
    markdown_content = await generate_invoice_markdown(
        work_order, 
        customer, 
        vehicle, 
        is_estimate=True
    )
    
    if not markdown_content:
        raise HTTPException(status_code=500, detail="Failed to generate estimate")
    
    # Update work order status
    WorkOrderRepository.update(db, order_id, {"status": "estimated"})
    
    result = {
        "status": "success",
        "markdown_content": markdown_content,
    }
    
    # # Generate PDF if requested
    # pdf_path = None
    # if request.generate_pdf:
    #     pdf_path = await convert_markdown_to_pdf(
    #         markdown_content, 
    #         filename_prefix=f"Estimate_{order_id[:8]}"
    #     )
    #
    #     if pdf_path:
    #         result["pdf_path"] = pdf_path
    #     else:
    #         result["status"] = "partial"
    #         result["message"] = "Generated markdown but failed to create PDF"
    #
    # # Send email if requested
    # if request.send_email and request.email:
    #     if background_tasks:
    #         # Send email in background
    #         background_tasks.add_task(
    #             send_email_with_markdown,
    #             request.email,
    #             f"Estimate #{order_id[:8]} from Your Auto Shop",
    #             markdown_content,
    #             pdf_path if request.generate_pdf else None
    #         )
    #         result["email_status"] = "queued"
    #     else:
    #         # Send email synchronously
    #         email_sent = await send_email_with_markdown(
    #             request.email,
    #             f"Estimate #{order_id[:8]} from Your Auto Shop",
    #             markdown_content,
    #             pdf_path if request.generate_pdf else None
    #         )
    #
    #         if email_sent:
    #             result["email_status"] = "sent"
    #         else:
    #             result["email_status"] = "failed"
    
    return result
