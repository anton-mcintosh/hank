import api from './client';
import { Vehicle, VehicleCreate, VehicleUpdate } from './types';

const vehiclesApi = {
  /**
   * Get a vehicle by ID
   */
  getById: (id: string) => {
    return api.get<Vehicle>(`/vehicles/${id}`);
  },

  /**
   * Get all vehicles for a customer
   */
  getByCustomer: (customerId: string) => {
    return api.get<Vehicle[]>(`/customers/${customerId}/vehicles`);
  },

  /**
   * Create a new vehicle
   */
  create: (vehicle: VehicleCreate) => {
    return api.post<Vehicle>('/vehicles', vehicle);
  },

  /**
   * Update a vehicle
   */
  update: (id: string, vehicle: VehicleUpdate) => {
    return api.put<Vehicle>(`/vehicles/${id}`, vehicle);
  },

  /**
   * Delete a vehicle
   */
  delete: (id: string) => {
    return api.delete<{ message: string }>(`/vehicles/${id}`);
  },
};

export default vehiclesApi;
