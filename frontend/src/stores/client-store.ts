import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface ClientStore {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  clearSelectedClient: () => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set) => ({
      selectedClient: null,
      setSelectedClient: (client) => set({ selectedClient: client }),
      clearSelectedClient: () => set({ selectedClient: null }),
    }),
    {
      name: 'selected-client',
    }
  )
);
