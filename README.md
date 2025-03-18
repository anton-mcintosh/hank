# Auto Shop Work Order API

This is a FastAPI backend for an Auto Shop Work Order system that processes voice memos and images to create detailed work orders.

## Features

- Audio transcription using OpenAI Whisper
- Vehicle information extraction from images (VIN, odometer)
- Work summary generation using OpenAI GPT-4
- CRUD operations for work orders
- PostgreSQL database integration

## Setup

### 1. Create PostgreSQL Database

Make sure PostgreSQL is installed and running, then create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hank;

# Exit
\q
```

### 2. Set Up Environment

```bash
# Clone the repository
git clone <repository-url>
cd auto-shop-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 3. Run the Application

```bash
# Start the FastAPI server
python main.py
```

The API will be available at http://localhost:8000

### 4. API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `POST /work-orders/create` - Create a new work order with audio files and images
- `GET /work-orders/{order_id}` - Get a work order by ID
- `GET /work-orders` - List all work orders
- `PUT /work-orders/{order_id}` - Update a work order
- `DELETE /work-orders/{order_id}` - Delete a work order

## Project Structure

```
auto-shop-api/
├── api/
│   ├── __init__.py
│   ├── models.py       # Pydantic models for API
│   └── routes.py       # API endpoints
├── services/
│   ├── __init__.py
│   ├── audio.py        # Audio transcription service
│   ├── generate.py     # Work summary generation
│   └── image.py        # Image processing service
├── database.py         # Database connection and models
├── main.py             # Application entry point
├── .env                # Environment variables
├── .env.example        # Example environment variables
└── requirements.txt    # Project dependencies
```

## Dependencies

- FastAPI
- SQLAlchemy
- PostgreSQL
- httpx
- Pydantic
- OpenAI API
