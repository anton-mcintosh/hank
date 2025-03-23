# Auto Shop Management System

A comprehensive backend system for auto repair shops to manage customers, vehicles, work orders, and invoices.

## Overview

This application provides a complete solution for auto repair shops to digitize their workflow:

- Create and manage customer records
- Track vehicle information with VIN decoding
- Generate work orders from technician audio notes
- Extract VIN numbers and odometer readings from images
- Create professional invoices and estimates in multiple formats

## Features

### Intelligent Data Extraction
- **VIN Extraction**: Automatically extract VIN numbers from door placard images
- **Odometer Reading**: Get mileage readings from dashboard images
- **Audio Transcription**: Convert technician voice memos to text
- **Work Summary Generation**: Create structured work summaries from audio transcripts

### Customer & Vehicle Management
- Complete CRUD operations for customer records
- Vehicle tracking with detailed information
- Automatic VIN decoding to retrieve make, model, and year

### Work Order Processing
- Create work orders from audio recordings and images
- Generate line items with parts and labor costs
- Track work order status throughout the repair process

### Invoice Generation
- Create professional invoices and estimates
- Multiple format support: HTML, PDF, and DOCX
- Customizable company information

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI Services**:
  - OpenAI GPT-4o for image analysis and work summary generation
  - OpenAI Whisper for audio transcription
- **External APIs**:
  - NHTSA for VIN decoding
- **Document Generation**:
  - ReportLab for PDF generation
  - python-docx for DOCX creation
  - Jinja2 for HTML templating

## Project Structure

```
backend/
├── api/
│   ├── __init__.py
│   ├── customer_routes.py    # Customer API endpoints
│   ├── invoice_routes.py     # Invoice generation endpoints
│   ├── models.py             # Pydantic models
│   ├── vehicle_routes.py     # Vehicle API endpoints
│   └── workorder_routes.py   # Work order API endpoints
├── database/
│   ├── __init__.py
│   ├── db.py                 # Database configuration and models
│   └── repos.py              # Repository pattern implementations
├── services/
│   ├── __init__.py
│   ├── audio.py              # Audio transcription service
│   ├── customer.py           # Customer service
│   ├── docx_generator.py     # Word document generation (not working)
│   ├── generate.py           # Work summary generation
│   ├── image.py              # Image processing (VIN, odometer)
│   ├── invoice.py            # AI Invoice markdown generation
│   ├── invoice_generator_html.py  # HTML invoice generation (to template)
│   ├── markdown_to_pdf.py    # Markdown to PDF conversion (deprecated)
│   ├── vehicle_info.py       # Vehicle information service
│   └── vin_decoder.py        # VIN decoding service
└── main.py                   # Application entry point
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- PostgreSQL
- OpenAI API key

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autoshop
OPENAI_API_KEY=your_openai_api_key
VISION_API_KEY=your_openai_api_key
UPLOAD_DIR=./uploads
INVOICE_DIR=./invoices
COMPANY_NAME=Your Auto Shop
COMPANY_ADDRESS=123 Main St, Anytown, USA
COMPANY_PHONE=(555) 123-4567
COMPANY_EMAIL=service@autoshop.com
COMPANY_WEBSITE=www.yourautoshop.com
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/auto-shop-system.git
   cd auto-shop-system
   ```

2. Create a virtual environment
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```
   pip install -r requirements.txt
   ```

4. Create necessary directories
   ```
   mkdir -p uploads/audio uploads/images invoices
   ```

5. Run the application
   ```
   cd backend
   python3 main.py
   ```

6. Access the API documentation at `http://localhost:8000/docs` (future)

## API Endpoints

### Customers
- `POST /api/v1/customers` - Create a new customer
- `GET /api/v1/customers` - List all customers
- `GET /api/v1/customers/{customer_id}` - Get customer details
- `PUT /api/v1/customers/{customer_id}` - Update customer
- `DELETE /api/v1/customers/{customer_id}` - Delete customer

### Vehicles
- `POST /api/v1/vehicles` - Add a vehicle
- `GET /api/v1/vehicles/{vehicle_id}` - Get vehicle details
- `GET /api/v1/customers/{customer_id}/vehicles` - List customer vehicles
- `PUT /api/v1/vehicles/{vehicle_id}` - Update vehicle
- `DELETE /api/v1/vehicles/{vehicle_id}` - Delete vehicle

### Work Orders
- `POST /api/v1/work-orders/create` - Create work order from audio and images
- `GET /api/v1/work-orders/{order_id}` - Get work order details
- `GET /api/v1/work-orders` - List all work orders
- `GET /api/v1/customers/{customer_id}/work-orders` - List customer work orders
- `PUT /api/v1/work-orders/{order_id}` - Update work order
- `DELETE /api/v1/work-orders/{order_id}` - Delete work order

### Invoices
- `POST /api/v1/work-orders/{order_id}/generate-invoice` - Generate invoice
- `POST /api/v1/work-orders/{order_id}/generate-estimate` - Generate estimate

## Future Enhancements

- Email integration for sending invoices
- Payment processing integration
- Mobile application for technicians
- Customer portal for scheduling and payment
- Integration with parts inventory systems

## License

[MIT License](LICENSE)
