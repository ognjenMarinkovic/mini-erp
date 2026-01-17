import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClientUser } from '@/features/client-hub/api/client-auth.api';

interface ClientAuthState {
  clientUser: ClientUser | null;
  clientToken: string | null;
  isClientAuthenticated: boolean;
  setClientAuth: (user: ClientUser, token: string) => void;
  clientLogout: () => void;
}

export const useClientAuthStore = create<ClientAuthState>()(
  persist(
    (set) => ({
      clientUser: null,
      clientToken: null,
      isClientAuthenticated: false,
      setClientAuth: (user, token) =>
        set({
          clientUser: user,
          clientToken: token,
          isClientAuthenticated: true,
        }),
      clientLogout: () =>
        set({
          clientUser: null,
          clientToken: null,
          isClientAuthenticated: false,
        }),
    }),
    {
      name: 'client-auth-storage',
    }
  )
);
