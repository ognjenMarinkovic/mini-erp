import api from '@/lib/axios';

export interface Client {
  id: string;
  name: string;
  pib?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoices: number;
  };
}

export interface CreateClientData {
  name: string;
  pib?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  // Opciono kreiranje prvog ClientUser account-a
  createUserAccount?: boolean;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

export interface ClientsResponse {
  data: Client[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const clientsApi = {
  getAll: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ClientsResponse> => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data: CreateClientData): Promise<Client> => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateClientData>): Promise<Client> => {
    const response = await api.patch(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};
