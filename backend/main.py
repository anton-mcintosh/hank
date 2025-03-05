from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Create app first so it can be imported by routes
app = FastAPI(title="Auto Repair Voice & Image Processing API")

# Configure directories
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

# In-memory storage (replace with database in production)
work_orders = {}

# Import after defining app and work_orders
from api.routes import setup_routes

# Setup routes with dependencies
setup_routes(app, work_orders, UPLOAD_DIR, os.getenv("OPENAI_API_KEY"))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
