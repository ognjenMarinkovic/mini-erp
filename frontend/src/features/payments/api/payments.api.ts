import api from '@/lib/axios';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
  notes?: string;
}

export const paymentsApi = {
  getAll: async (invoiceId: string): Promise<Payment[]> => {
    const response = await api.get('/payments', { params: { invoiceId } });
    return response.data;
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};
