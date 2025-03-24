import api from './client';
import { Customer, CustomerCreate, CustomerUpdate } from './types';

const customersApi = {
  /**
   * Get all customers
   */
  getAll: () => {
    return api.get<Customer[]>('/customers');
  },

  /**
   * Get a customer by ID
   */
  getById: (id: string) => {
    return api.get<Customer>(`/customers/${id}`);
  },

  /**
   * Create a new customer
   */
  create: (customer: CustomerCreate) => {
    return api.post<Customer>('/customers', customer);
  },

  /**
   * Update a customer
   */
  update: (id: string, customer: CustomerUpdate) => {
    return api.put<Customer>(`/customers/${id}`, customer);
  },

  /**
   * Delete a customer
   */
  delete: (id: string) => {
    return api.delete<{ message: string }>(`/customers/${id}`);
  },
};

export default customersApi;
