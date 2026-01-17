import api from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER' | 'ACCOUNTANT';
  company: {
    id: string;
    name: string;
    pib: string;
  };
  createdAt: string;
}

export interface AssignRoleData {
  role: 'ADMIN' | 'USER' | 'ACCOUNTANT';
}

export interface CreateAdminData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER' | 'ACCOUNTANT';
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createAdmin: async (data: CreateAdminData): Promise<User> => {
    const response = await api.post('/auth/users', data);
    return response.data;
  },

  assignRole: async (userId: string, role: 'ADMIN' | 'USER' | 'ACCOUNTANT'): Promise<User> => {
    const response = await api.patch(`/auth/users/${userId}/role`, { role });
    return response.data;
  },
};
