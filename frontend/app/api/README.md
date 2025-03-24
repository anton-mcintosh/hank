# API Client for Auto Shop Management System

This directory contains the API client code for connecting the React Native frontend to the FastAPI backend.

## Structure

- `client.ts` - Base API client with fetch wrapper and error handling
- `types.ts` - TypeScript interfaces for API data models
- `customers.ts` - Endpoints for customer management
- `vehicles.ts` - Endpoints for vehicle management
- `workorders.ts` - Endpoints for work order management
- `invoices.ts` - Endpoints for invoice generation
- `index.ts` - Main export file that bundles all API modules together

## Usage

Import the API client in your components and use it to interact with the backend:

```typescript
import api from '../api';

// Example: Fetch all customers
const loadCustomers = async () => {
  try {
    const customers = await api.customers.getAll();
    setCustomers(customers);
  } catch (err) {
    console.error('Error loading customers:', err);
  }
};

// Example: Create a new vehicle
const createVehicle = async (vehicleData) => {
  try {
    const newVehicle = await api.vehicles.create(vehicleData);
    // Handle success
  } catch (err) {
    // Handle error
  }
};
```

## File Upload Example

For endpoints that require file uploads (like creating a work order with audio and images):

```typescript
const createWorkOrder = async () => {
  const formData = {
    customer_id: customer.id,
    audio_files: [audioFile], // File objects from React Native
    vin_image: vinImageFile,
    odometer_image: odometerImageFile
  };
  
  try {
    const result = await api.workorders.create(formData);
    console.log('Work order created:', result.order_id);
  } catch (err) {
    console.error('Error creating work order:', err);
  }
};
```

## Error Handling

The API client includes an `ApiError` class for consistent error handling:

```typescript
try {
  await api.customers.create(customerData);
} catch (err) {
  if (err instanceof ApiError) {
    // Access error details
    console.log(err.status); // HTTP status code
    console.log(err.message); // Error message
    console.log(err.data); // Additional error data from the server
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', err);
  }
}
```

## Environment Configuration

The API client automatically configures the base URL based on the current environment:

- In development mode: 
  - iOS: `http://localhost:8000/api/v1`
  - Android: `http://10.0.2.2:8000/api/v1`
- In production mode: `https://your-api-domain.com/api/v1`

To change these URLs, modify the `API_URL` configuration in `client.ts`.
