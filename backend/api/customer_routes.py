from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from api.models import Customer, CustomerCreate, CustomerUpdate
from database.db import get_db
from database.repos import CustomerRepository, VehicleRepository

router = APIRouter()

@router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):

    existing = CustomerRepository.get_by_email(db, customer.email)
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    
    customer_data = customer.dict()
    customer_data["id"] = str(uuid.uuid4())
    customer_data["created_at"] = datetime.now()
    customer_data["updated_at"] = datetime.now()
    
    return CustomerRepository.create(db, customer_data)

@router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, db: Session = Depends(get_db)):
    """Get a customer by ID"""
    customer = CustomerRepository.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.get("/customers", response_model=List[Customer])
async def list_customers(db: Session = Depends(get_db)):
    """List all customers"""
    return CustomerRepository.get_all(db)

@router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str, customer: CustomerUpdate, db: Session = Depends(get_db)
):
    """Update a customer"""
    updated_customer = CustomerRepository.update(
        db, customer_id, customer.dict(exclude_unset=True)
    )
    if not updated_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated_customer

@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    """Delete a customer"""
    # Check if customer has work orders before deleting
    result = CustomerRepository.delete(db, customer_id)
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}
