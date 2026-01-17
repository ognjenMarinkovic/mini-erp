import api from '@/lib/axios';

export const clientSettingsApi = {
  // Postavljanje šifre preko tokena
  setupPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/client-auth/setup-password', {
      token,
      password,
    });
    return response.data;
  },

  // Promena šifre (za autentifikovane korisnike)
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch('/client-auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Ažuriranje profila
  updateProfile: async (firstName: string, lastName: string): Promise<void> => {
    await api.patch('/client-auth/profile', {
      firstName,
      lastName,
    });
  },

  // Ažuriranje notification preferences
  updateNotificationPreferences: async (preferences: {
    notifyTaskInProgress?: boolean;
    notifyTaskReview?: boolean;
    notifyTaskCompleted?: boolean;
    notifyNewComment?: boolean;
  }): Promise<void> => {
    await api.patch('/client-auth/notification-preferences', preferences);
  },

  // Ponovno slanje email-a za postavljanje šifre (samo SUPERADMIN)
  resendSetupEmail: async (clientUserId: string): Promise<{ message: string }> => {
    const response = await api.post(`/client-auth/resend-setup-email/${clientUserId}`);
    return response.data;
  },
};
