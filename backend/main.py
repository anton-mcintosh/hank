import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes import setup_routes
from database.db import init_db
from dotenv import load_dotenv

load_dotenv()

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# Create upload directories
os.makedirs(os.path.join(UPLOAD_DIR, "audio"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)

# Initialize FastAPI app
app = FastAPI(title="Auto Shop Work Order API")

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

setup_routes(app, UPLOAD_DIR, OPENAI_API_KEY)


@app.get("/")
async def root():
    return {"message": "Auto Shop Work Order API is running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
