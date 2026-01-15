import api from '@/lib/axios';

export interface DashboardData {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    outstanding: number;
    clientsCount: number;
    invoicesThisMonth: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
  };
  overdueInvoices: Array<{
    id: string;
    number: string;
    totalAmount: number;
    dueDate: string;
    client: {
      id: string;
      name: string;
    };
  }>;
}

export const reportsApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getRevenue: async (fromDate: string, toDate: string) => {
    const response = await api.get('/reports/revenue', {
      params: { fromDate, toDate },
    });
    return response.data;
  },

  getExpenses: async (fromDate: string, toDate: string) => {
    const response = await api.get('/reports/expenses', {
      params: { fromDate, toDate },
    });
    return response.data;
  },

  getTopClients: async (limit = 10) => {
    const response = await api.get('/reports/top-clients', {
      params: { limit },
    });
    return response.data;
  },
};
