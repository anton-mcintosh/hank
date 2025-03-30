from sqlalchemy import (
    create_engine,
    Column,
    String,
    Float,
    JSON,
    TIMESTAMP,
    MetaData,
    ForeignKey,
    Integer,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hank"
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class CustomerDB(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    vehicles = Column(JSON, default=[])
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now)


class VehicleDB(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    vin = Column(String, index=True, nullable=True)
    plate = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    make = Column(String, nullable=True)
    model = Column(String, nullable=True)
    engine_size = Column(String, nullable=True)
    engine_code = Column(String, nullable=True)
    mileage = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now)


class WorkOrderDB(Base):
    __tablename__ = "work_orders"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=True)
    vehicle_info = Column(JSON, default={})
    work_summary = Column(String, default="")
    line_items = Column(JSON, default=[])
    total_parts = Column(Float, default=0.0)
    total_labor = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    status = Column(String, default="draft")
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now)


# Create database tables
def init_db():
    # Base.metadata.drop_all(bind=engine)  # Drop all tables (for development)
    Base.metadata.create_all(bind=engine)


# Database dependency to use in FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# WorkOrder CRUD operations
