import api from '@/lib/axios';

export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'SALARIES'
  | 'MATERIALS'
  | 'MARKETING'
  | 'TRANSPORT'
  | 'OTHER';

export interface Expense {
  id: string;
  companyId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface ExpensesResponse {
  data: Expense[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const expensesApi = {
  getAll: async (params?: {
    category?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ExpensesResponse> => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Expense> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateExpenseData>): Promise<Expense> => {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};
