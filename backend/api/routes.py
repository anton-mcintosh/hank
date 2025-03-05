from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from typing import List
import uuid
from datetime import datetime
import os
import aiofiles

from api.models import WorkOrder
from services.audio import transcribe_audio
from services.image import extract_vin_from_image, read_odometer_image
from services.generate import generate_work_summary

def setup_routes(app, work_orders, UPLOAD_DIR, OPENAI_API_KEY):
    """Setup routes with dependencies injected"""

    @app.post("/work-orders/create")
    async def create_work_order(
        background_tasks: BackgroundTasks,
        audio_files: List[UploadFile] = File(None),
        vin_image: UploadFile = File(None),
        odometer_image: UploadFile = File(None),
        customer_name: str = Form(None)
    ):
        """Create a new work order from audio files and images"""
        try:
            # Generate work order ID
            order_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            # Create initial work order
            work_order = WorkOrder(
                id=order_id,
                customer_name=customer_name,
                created_at=timestamp,
                updated_at=timestamp
            )
            
            # Save work order
            work_orders[order_id] = work_order.dict()
            
            # Process uploads in background
            background_tasks.add_task(
                process_uploads, 
                order_id, 
                audio_files, 
                vin_image, 
                odometer_image
            )
            
            return {
                "order_id": order_id,
                "message": "Work order created. Files are being processed."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def process_uploads(order_id, audio_files, vin_image, odometer_image):
        """Process uploaded files and update work order"""
        try:
            # Get work order
            work_order = work_orders.get(order_id)
            if not work_order:
                print(f"Work order {order_id} not found")
                return
            
            # Process vehicle information images
            vehicle_info = {}
            
            # Process VIN image
            if vin_image:
                vin_path = os.path.join(UPLOAD_DIR, "images", f"{order_id}_vin{os.path.splitext(vin_image.filename)[1]}")
                async with aiofiles.open(vin_path, "wb") as f:
                    content = await vin_image.read()
                    await f.write(content)
                
                vin = await extract_vin_from_image(vin_path)
                if vin:
                    vehicle_info["vin"] = vin
            
            # Process odometer image
            if odometer_image:
                odometer_path = os.path.join(UPLOAD_DIR, "images", f"{order_id}_odometer{os.path.splitext(odometer_image.filename)[1]}")
                async with aiofiles.open(odometer_path, "wb") as f:
                    content = await odometer_image.read()
                    await f.write(content)
                
                mileage = await read_odometer_image(odometer_path)
                if mileage:
                    vehicle_info["mileage"] = mileage
            
            # Update work order with vehicle info
            work_order["vehicle_info"] = vehicle_info
            
            # Process audio files
            all_transcripts = []
            
            if audio_files:
                for i, audio_file in enumerate(audio_files):
                    # Skip if None
                    if audio_file is None:
                        continue
                        
                    # Save audio file
                    audio_path = os.path.join(UPLOAD_DIR, "audio", f"{order_id}_{i}{os.path.splitext(audio_file.filename)[1]}")
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
                summary_data = await generate_work_summary(full_transcript, vehicle_info)
                
                # Update work order with summary data
                work_order.update({
                    "work_summary": summary_data.get("work_summary", ""),
                    "line_items": summary_data.get("line_items", []),
                    "total_parts": summary_data.get("total_parts", 0),
                    "total_labor": summary_data.get("total_labor", 0),
                    "total": summary_data.get("total", 0),
                    "status": "processed",
                    "updated_at": datetime.now().isoformat()
                })
            
            # Update work order in storage
            work_orders[order_id] = work_order
        except Exception as e:
            print(f"Error processing uploads: {e}")
            # Update work order status
            if order_id in work_orders:
                work_orders[order_id]["status"] = "error"
                work_orders[order_id]["updated_at"] = datetime.now().isoformat()

    @app.get("/work-orders/{order_id}")
    async def get_work_order(order_id: str):
        """Get a work order by ID"""
        if order_id not in work_orders:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        return work_orders[order_id]

    @app.get("/work-orders")
    async def list_work_orders():
        """List all work orders"""
        return list(work_orders.values())

    @app.put("/work-orders/{order_id}")
    async def update_work_order(order_id: str, work_order: WorkOrder):
        """Update a work order"""
        if order_id not in work_orders:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        work_order_dict = work_order.dict()
        work_order_dict["updated_at"] = datetime.now().isoformat()
        work_orders[order_id] = work_order_dict
        
        return work_orders[order_id]

    @app.delete("/work-orders/{order_id}")
    async def delete_work_order(order_id: str):
        """Delete a work order"""
        if order_id not in work_orders:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        del work_orders[order_id]
        
        return {"message": "Work order deleted"}

