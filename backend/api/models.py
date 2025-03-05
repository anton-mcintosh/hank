from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class WorkOrder(BaseModel):
    id: str
    customer_name: Optional[str] = None
    vehicle_info: Dict[str, Any] = {}
    work_summary: str = ""
    line_items: List[Dict[str, Any]] = []
    total_parts: float = 0
    total_labor: float = 0
    total: float = 0
    status: str = "draft"
    created_at: str
    updated_at: str

class VehicleInfo(BaseModel):
    vin: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    mileage: Optional[int] = None
