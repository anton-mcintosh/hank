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

from api.models import VehicleInfo, WorkOrder, WorkOrderCreate, WorkOrderUpdate
from services.audio import transcribe_audio
from services.image import extract_vin_from_image, read_odometer_image
from services.generate import generate_work_summary
from services.vehicle_info import get_year_make_model
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

            # Read file contents before they get closed
            audio_contents = []
            audio_filenames = []
            if audio_files:
                for audio_file in audio_files:
                    if audio_file:
                        content = await audio_file.read()
                        audio_contents.append(content)
                        audio_filenames.append(audio_file.filename)
                    else:
                        audio_contents.append(None)
                        audio_filenames.append(None)

            vin_content = None
            vin_filename = None
            if vin_image:
                vin_content = await vin_image.read()
                vin_filename = vin_image.filename

            odometer_content = None
            odometer_filename = None
            if odometer_image:
                odometer_content = await odometer_image.read()
                odometer_filename = odometer_image.filename

            # Process uploads in background with file contents instead of file objects
            background_tasks.add_task(
                process_uploads, 
                order_id, 
                audio_contents, 
                audio_filenames,
                vin_content, 
                vin_filename,
                odometer_content, 
                odometer_filename
            )

            return {
                "order_id": order_id,
                "message": "Work order created. Files are being processed.",
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def process_uploads(
    order_id, 
    audio_contents, 
    audio_filenames,
    vin_content, 
    vin_filename,
    odometer_content, 
    odometer_filename
    ):
        """Process uploaded file contents and update work order"""
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
            update_data = {}

            # Process VIN image
            if vin_content:
                # Ensure directory exists
                os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

                vin_path = os.path.join(
                    UPLOAD_DIR,
                    "images",
                    f"{order_id}_vin{os.path.splitext(vin_filename)[1]}",
                )
                print("Getting vin image")
                async with aiofiles.open(vin_path, "wb") as f:
                    await f.write(vin_content)

                vin = await extract_vin_from_image(vin_path)
                if vin:
                    vehicle_info["vin"] = vin
                    VehicleInfo.vin = vin
                    vehicle_info.update(await get_year_make_model(vin))
                    print("Vehicle Info with vin:", vehicle_info)

        # Similar changes for odometer and audio files...          # Process odometer image
            if odometer_content:
                os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)
                odo_path = os.path.join(UPLOAD_DIR, "images", f"{order_id}_odo{os.path.splitext(odometer_filename)[1]}")
                print("Getting odometer image")
                async with aiofiles.open(odo_path, "wb") as f:
                    await f.write(odometer_content)
                odo = await read_odometer_image(odo_path)
            # Update work order with vehicle info
            if odo:
                vehicle_info["odometer"] = odo
                VehicleInfo.mileage = odo
                print("Vehicle Info with odometer:", vehicle_info)

            all_transcripts = []

            if audio_contents:
                # Create audio directory if it doesn't exist
                os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
                
                for i, (audio_content, audio_filename) in enumerate(zip(audio_contents, audio_filenames)):
                    # Skip if None
                    if audio_content is None or audio_filename is None:
                        continue

                    try:
                        # Get file extension from the original filename
                        _, ext = os.path.splitext(audio_filename)
                        
                        # Create the file path with proper extension
                        audio_path = os.path.join(
                            UPLOAD_DIR,
                            "audio",
                            f"{order_id}_{i}{ext}",
                        )
                        
                        # Write the content to disk using aiofiles
                        print(f"Writing audio file {i}")
                        async with aiofiles.open(audio_path, "wb") as f:
                            await f.write(audio_content)
                        
                        # Now process the file on disk
                        if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                            transcript = await transcribe_audio(audio_path, OPENAI_API_KEY)
                            if transcript:
                                all_transcripts.append(transcript)
                        else:
                            print(f"Audio file not saved properly: {audio_path}")
                    except Exception as e:
                        print(f"Error processing audio file {i}: {e}")

            # Generate work summary if transcripts available
            if all_transcripts:
                full_transcript = " ".join(all_transcripts)
                summary_data = await generate_work_summary(
                    full_transcript, vehicle_info
                )

                # Update work order with summary data
                update_data.update({
                    "vehicle_info": vehicle_info,
                    "work_summary": summary_data.get("work_summary", ""),
                    "line_items": summary_data.get("line_items", []),
                    "total_parts": summary_data.get("total_parts", 0),
                    "total_labor": summary_data.get("total_labor", 0),
                    "total": summary_data.get("total", 0),
                    "status": "processed",
                })
            else:
                # If we have vehicle info but no transcripts, still mark as processed
                if vehicle_info:
                    update_data["status"] = "processed"

            # Update work order in database
            if update_data:
                WorkOrderRepository.update(db, order_id, update_data)

        except Exception as e:
            print(f"Error processing uploads: {e}")
            # Update work order status to error
            if db:
                try:
                    WorkOrderRepository.update(db, order_id, {"status": "error"})
                except Exception as update_error:
                    print(f"Error updating work order status: {update_error}")
        finally:
            if db:
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
