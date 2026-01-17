import api from '@/lib/axios';

export interface ClientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
  clientId: string;
  client: {
    id: string;
    name: string;
    companyId: string;
  };
  userType: 'CLIENT';
  notifyTaskInProgress?: boolean;
  notifyTaskReview?: boolean;
  notifyTaskCompleted?: boolean;
  notifyNewComment?: boolean;
}

export interface ClientLoginData {
  email: string;
  password: string;
}

export interface ClientLoginResponse {
  user: ClientUser;
  token: string;
  message: string;
}

export const clientAuthApi = {
  login: async (data: ClientLoginData): Promise<ClientLoginResponse> => {
    const response = await api.post('/client-auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<ClientUser> => {
    const response = await api.get('/client-auth/me');
    return response.data;
  },
};
