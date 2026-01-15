import api from '@/lib/axios';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  price: number;
  total?: number;
}

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    city: string;
  };
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    payments: number;
  };
}

export interface CreateInvoiceData {
  clientId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const invoicesApi = {
  getAll: async (params?: {
    search?: string;
    status?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }): Promise<InvoicesResponse> => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
};
