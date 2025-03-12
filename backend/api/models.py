from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class CustomerInfo(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    vehicles: Optional[List[Dict[str, Any]]] = None

class VehicleInfo(BaseModel):
    vin: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    mileage: Optional[int] = None


class LineItem(BaseModel):
    description: str
    type: str  # "part" or "labor"
    quantity: float
    unit_price: float
    total: float


class WorkOrderBase(BaseModel):
    customer_name: Optional[str] = None
    vehicle_info: Dict[str, Any] = {}
    work_summary: str = ""
    line_items: List[Dict[str, Any]] = []
    total_parts: float = 0
    total_labor: float = 0
    total: float = 0
    status: str = "draft"


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(WorkOrderBase):
    customer_name: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    work_summary: Optional[str] = None
    line_items: Optional[List[Dict[str, Any]]] = None
    total_parts: Optional[float] = None
    total_labor: Optional[float] = None
    total: Optional[float] = None
    status: Optional[str] = None

    class Config:
        # This allows partial updates
        extra = "ignore"


class WorkOrder(WorkOrderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        # Convert datetime to string for JSON serialization
        json_encoders = {datetime: lambda dt: dt.isoformat()}
