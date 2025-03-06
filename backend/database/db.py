from sqlalchemy import create_engine, Column, String, Float, JSON, TIMESTAMP, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hank")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Define WorkOrder model for database
class WorkOrderDB(Base):
    __tablename__ = "work_orders"

    id = Column(String, primary_key=True, index=True)
    customer_name = Column(String, nullable=True)
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
    Base.metadata.create_all(bind=engine)

# Database dependency to use in FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# WorkOrder CRUD operations
class WorkOrderRepository:
    @staticmethod
    def create(db, work_order_data):
        work_order_db = WorkOrderDB(**work_order_data)
        db.add(work_order_db)
        db.commit()
        db.refresh(work_order_db)
        return work_order_db

    @staticmethod
    def get_by_id(db, order_id):
        return db.query(WorkOrderDB).filter(WorkOrderDB.id == order_id).first()

    @staticmethod
    def get_all(db):
        return db.query(WorkOrderDB).all()

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
