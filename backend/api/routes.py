from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from typing import List
import uuid
from datetime import datetime
import os
import aiofiles
from sqlalchemy.orm import Session

from api.models import WorkOrder, WorkOrderCreate, WorkOrderUpdate
from services.audio import transcribe_audio
from services.image import extract_vin_from_image, read_odometer_image
from services.generate import generate_work_summary
from database.db import get_db, WorkOrderRepository


def setup_routes(app, UPLOAD_DIR, OPENAI_API_KEY):
    """Setup routes with dependencies injected"""

    @app.post("/work-orders/create", response_model=dict)
    async def create_work_order(
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        audio_files: List[UploadFile] = File(None),
        vin_image: UploadFile = File(None),
        odometer_image: UploadFile = File(None),
        customer_name: str = Form(None),
    ):
        """Create a new work order from audio files and images"""
        try:
            # Generate work order ID
            order_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Create initial work order
            work_order_data = {
                "id": order_id,
                "customer_name": customer_name,
                "created_at": timestamp,
                "updated_at": timestamp,
                "status": "pending",
            }

            # Save work order to database
            WorkOrderRepository.create(db, work_order_data)

            # Process uploads in background
            background_tasks.add_task(
                process_uploads, order_id, audio_files, vin_image, odometer_image
            )

            return {
                "order_id": order_id,
                "message": "Work order created. Files are being processed.",
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def process_uploads(order_id, audio_files, vin_image, odometer_image):
        """Process uploaded files and update work order"""
        try:
            # Create a new database session for background task
            db = next(get_db())

            # Get work order
            work_order = WorkOrderRepository.get_by_id(db, order_id)
            if not work_order:
                print(f"Work order {order_id} not found")
                return

            # Process vehicle information images
            vehicle_info = {}

            # Process VIN image
            if vin_image:
                # Ensure directory exists
                os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

                vin_path = os.path.join(
                    UPLOAD_DIR,
                    "images",
                    f"{order_id}_vin{os.path.splitext(vin_image.filename)[1]}",
                )
                print("Getting vin image")
                async with aiofiles.open(vin_path, "wb") as f:
                    content = await vin_image.read()
                    await f.write(content)

                vin = await extract_vin_from_image(vin_path)
                if vin:
                    vehicle_info["vin"] = vin

            # Process odometer image
            if odometer_image:
                os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

                content = await odometer_image.read()

                odometer_path = os.path.join(
                    UPLOAD_DIR,
                    "images",
                    f"{order_id}_odometer{os.path.splitext(odometer_image.filename)[1]}",
                )
                async with aiofiles.open(odometer_path, "wb") as f:
                    content = await odometer_image.read()
                    await f.write(content)

                mileage = await read_odometer_image(odometer_path)
                if mileage:
                    vehicle_info["mileage"] = mileage

            # Update work order with vehicle info
            update_data = {"vehicle_info": vehicle_info}

            # Process audio files
            all_transcripts = []

            if audio_files:
                os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)

                for i, audio_file in enumerate(audio_files):
                    # Skip if None
                    if audio_file is None:
                        continue
                    content = await audio_file.read()

                    # Save audio file
                    audio_path = os.path.join(
                        UPLOAD_DIR,
                        "audio",
                        f"{order_id}_{i}{os.path.splitext(audio_file.filename)[1]}",
                    )
                    async with aiofiles.open(audio_path, "wb") as f:
                        content = await audio_file.read()
                        await f.write(content)

                    # Transcribe audio
                    transcript = await transcribe_audio(audio_path, OPENAI_API_KEY)
                    if transcript:
                        all_transcripts.append(transcript)

            # Generate work summary if transcripts available
            if all_transcripts:
                full_transcript = " ".join(all_transcripts)
                summary_data = await generate_work_summary(
                    full_transcript, vehicle_info
                )

                # Update work order with summary data
                update_data.update(
                    {
                        "work_summary": summary_data.get("work_summary", ""),
                        "line_items": summary_data.get("line_items", []),
                        "total_parts": summary_data.get("total_parts", 0),
                        "total_labor": summary_data.get("total_labor", 0),
                        "total": summary_data.get("total", 0),
                        "status": "processed",
                    }
                )

            # Update work order in database
            WorkOrderRepository.update(db, order_id, update_data)

        except Exception as e:
            print(f"Error processing uploads: {e}")
            # Update work order status to error
            try:
                WorkOrderRepository.update(db, order_id, {"status": "error"})
            except Exception as update_error:
                print(f"Error updating work order status: {update_error}")
        finally:
            db.close()

    @app.get("/work-orders/{order_id}", response_model=WorkOrder)
    async def get_work_order(order_id: str, db: Session = Depends(get_db)):
        """Get a work order by ID"""
        work_order = WorkOrderRepository.get_by_id(db, order_id)
        if not work_order:
            raise HTTPException(status_code=404, detail="Work order not found")

        return work_order

    @app.get("/work-orders", response_model=List[WorkOrder])
    async def list_work_orders(db: Session = Depends(get_db)):
        """List all work orders"""
        return WorkOrderRepository.get_all(db)

    @app.put("/work-orders/{order_id}", response_model=WorkOrder)
    async def update_work_order(
        order_id: str, work_order: WorkOrderUpdate, db: Session = Depends(get_db)
    ):
        """Update a work order"""
        updated_work_order = WorkOrderRepository.update(
            db, order_id, work_order.dict(exclude_unset=True)
        )
        if not updated_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")

        return updated_work_order

    @app.delete("/work-orders/{order_id}")
    async def delete_work_order(order_id: str, db: Session = Depends(get_db)):
        """Delete a work order"""
        result = WorkOrderRepository.delete(db, order_id)
        if not result:
            raise HTTPException(status_code=404, detail="Work order not found")

        return {"message": "Work order deleted"}
