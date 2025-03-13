from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from .db import CustomerDB, VehicleDB, WorkOrderDB


class CustomerRepository:
    @staticmethod
    def create(db: Session, customer_data: Dict[str, Any]) -> CustomerDB:

        if "id" not in customer_data:
            customer_data["id"] = str(uuid.uuid4())

        customer_db = CustomerDB(**customer_data)
        db.add(customer_db)
        db.commit()
        db.refresh(customer_db)
        return customer_db

    @staticmethod
    def update(db: Session, customer_id: str, customer_data: Dict[str, Any]) -> Optional[CustomerDB]:
        customer = db.query(CustomerDB).filter(CustomerDB.id == customer_id).first()
        if not customer:
            return None

        # Update fields
        for key, value in customer_data.items():
            setattr(customer, key, value)

        # Always update the updated_at timestamp
        customer.updated_at = datetime.now()

        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def delete(db: Session, customer_id: str) -> bool:
        customer = db.query(CustomerDB).filter(CustomerDB.id == customer_id).first()
        if not customer:
            return False

        db.delete(customer)
        db.commit()
        return True

    @staticmethod
    def get_by_id(db: Session, customer_id: str) -> Optional[CustomerDB]:
        return db.query(CustomerDB).filter(CustomerDB.id == customer_id).first()

    @staticmethod
    def get_by_phone(db: Session, phone: str) -> Optional[CustomerDB]:
        return db.query(CustomerDB).filter(CustomerDB.phone == phone).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[CustomerDB]:
        return db.query(CustomerDB).filter(CustomerDB.email == email).first()

    @staticmethod
    def get_all(db: Session) -> List[CustomerDB]:
        return db.query(CustomerDB).all()

class VehicleRepository:
    
    @staticmethod
    def create(db: Session, vehicle_data: Dict[str, Any]) -> VehicleDB:

        if "id" not in vehicle_data:
            vehicle_data["id"] = str(uuid.uuid4())

        vehicle_db = VehicleDB(**vehicle_data)
        db.add(vehicle_db)
        db.commit()
        db.refresh(vehicle_db)
        return vehicle_db

    @staticmethod
    def update(db: Session, vehicle_id: str, vehicle_data: Dict[str, Any]) -> Optional[VehicleDB]:
        vehicle = db.query(VehicleDB).filter(VehicleDB.id == vehicle_id).first()
        if not vehicle:
            return None

        # Update fields
        for key, value in vehicle_data.items():
            setattr(vehicle, key, value)

        # Always update the updated_at timestamp
        vehicle.updated_at = datetime.now()

        db.commit()
        db.refresh(vehicle)
        return vehicle

    @staticmethod
    def delete(db: Session, vehicle_id: str) -> bool:
        vehicle = db.query(VehicleDB).filter(VehicleDB.id == vehicle_id).first()
        if not vehicle:
            return False

        db.delete(vehicle)
        db.commit()
        return True

    @staticmethod
    def get_by_id(db: Session, vehicle_id: str) -> Optional[VehicleDB]:
        return db.query(VehicleDB).filter(VehicleDB.id == vehicle_id).first()

    @staticmethod
    def get_by_vin(db: Session, vin: str) -> Optional[VehicleDB]:
        return db.query(VehicleDB).filter(VehicleDB.vin == vin).first()

    @staticmethod
    def get_by_customer(db: Session, vin: str) -> Optional[VehicleDB]:
        return db.query(VehicleDB).filter(VehicleDB.vin == vin).first()

    @staticmethod
    def get_all(db: Session) -> List[VehicleDB]:
        return db.query(VehicleDB).all()

class WorkOrderRepository:
    @staticmethod
    def create(db, work_order_data):
        work_order_db = WorkOrderDB(**work_order_data)
        db.add(work_order_db)
        db.commit()
        db.refresh(work_order_db)
        return work_order_db

    @staticmethod
    def update(db, order_id, work_order_data):
        work_order = db.query(WorkOrderDB).filter(WorkOrderDB.id == order_id).first()
        if not work_order:
            return None
        
        # Update fields
        for key, value in work_order_data.items():
            setattr(work_order, key, value)
        
        # Always update the updated_at timestamp
        work_order.updated_at = datetime.now()
        
        db.commit()
        db.refresh(work_order)
        return work_order

    @staticmethod
    def delete(db, order_id):
        work_order = db.query(WorkOrderDB).filter(WorkOrderDB.id == order_id).first()
        if not work_order:
            return False
        
        db.delete(work_order)
        db.commit()
        return True

    @staticmethod
    def get_by_id(db, order_id):
        return db.query(WorkOrderDB).filter(WorkOrderDB.id == order_id).first()

    @staticmethod
    def get_all(db):
        return db.query(WorkOrderDB).all()

