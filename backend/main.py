import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.auth_routes import router as auth_router
from api.workorder_routes import router as workorder_router
from api.customer_routes import router as customer_router
from api.vehicle_routes import router as vehicle_router
from api.invoice_routes import router as invoice_router
from database.db import init_db
from dotenv import load_dotenv

load_dotenv()

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
INVOICE_DIR = os.getenv("INVOICE_DIR", "./invoices")

# Create upload directories
os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)
os.makedirs(INVOICE_DIR, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(title="Auto Shop Work Order API")

allowed_origins = [
    "http://localhost:8081",
    "http://localhost:19006",
    "exp://localhost:19006",  # Expo Go
    "192.168.0.3:*",
]
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(workorder_router, prefix="/api/v1", tags=["work orders"])
app.include_router(customer_router, prefix="/api/v1", tags=["customers"])
app.include_router(vehicle_router, prefix="/api/v1", tags=["vehicles"])
app.include_router(invoice_router, prefix="/api/v1", tags=["invoices"])


@app.get("/")
async def root():
    return {"message": "Auto Shop Work Order API is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
