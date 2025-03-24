import api from './client';
import { EmailRequest, InvoiceResponse } from './types';

const invoicesApi = {
  /**
   * Generate an invoice for a work order
   */
  generateInvoice: (orderId: string, options: EmailRequest) => {
    return api.post<InvoiceResponse>(`/work-orders/${orderId}/generate-invoice`, options);
  },

  /**
   * Generate an estimate for a work order
   */
  generateEstimate: (orderId: string, options: EmailRequest) => {
    return api.post<InvoiceResponse>(`/work-orders/${orderId}/generate-estimate`, options);
  },
};

export default invoicesApi;
