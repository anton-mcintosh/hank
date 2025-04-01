from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    # what is this?
    class Config:
        extra = "ignore"


class Customer(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


# ------ Vehicle Models ------
class VehicleBase(BaseModel):
    id: str
    customer_id: str
    vin: Optional[str] = None
    plate: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    engine_code: Optional[str] = None
    engine_size: Optional[str] = None
    mileage: Optional[int] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    customer_id: Optional[str] = None
    vin: Optional[str] = None
    plate: Optional[str] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
    engine_code: Optional[str] = None
    engine_size: Optional[str] = None
    mileage: Optional[int] = None

    class Config:
        extra = "ignore"


class Vehicle(VehicleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


# ------ Line Item Model ------
class LineItem(BaseModel):
    description: str
    type: str  # "part" or "labor"
    quantity: float
    unit_price: float
    total: float


# ------ Work Order Models ------
class WorkOrderBase(BaseModel):
    customer_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_info: Dict[str, Any] = {}
    work_summary: str = ""
    line_items: List[Dict[str, Any]] = []
    total_parts: float = 0
    total_labor: float = 0
    total: float = 0
    status: str = "draft"


# what is this?
class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    work_summary: Optional[str] = None
    line_items: Optional[List[Dict[str, Any]]] = None
    total_parts: Optional[float] = None
    total_labor: Optional[float] = None
    total: Optional[float] = None
    status: Optional[str] = None
    processing_notes: Optional[List[str]] = None

    class Config:
        extra = "ignore"


class WorkOrder(WorkOrderBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}
