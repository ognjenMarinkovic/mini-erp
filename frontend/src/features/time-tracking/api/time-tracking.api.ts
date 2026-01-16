import api from '@/lib/axios';

export interface TimeEntry {
  id: string;
  clientId: string;
  taskId: string | null;
  userId: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null; // u minutima
  billable: boolean;
  hourlyRate: number | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
  } | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TimeEntriesResponse {
  entries: TimeEntry[];
  summary: {
    totalEntries: number;
    totalMinutes: number;
    totalFormatted: string;
    billableMinutes: number;
  };
}

export interface TimeStats {
  period: 'day' | 'week' | 'month';
  totalMinutes: number;
  totalHours: number;
  billableMinutes: number;
  billableHours: number;
  entriesCount: number;
  byClient: Record<string, number>;
}

export interface CreateTimeEntryDto {
  clientId: string;
  taskId?: string;
  description?: string;
  startTime: string;
  endTime?: string;
  billable?: boolean;
  hourlyRate?: number;
}

export interface UpdateTimeEntryDto {
  taskId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  billable?: boolean;
  hourlyRate?: number;
}

export const timeTrackingApi = {
  // Kreiraj time entry (start timer)
  create: async (dto: CreateTimeEntryDto): Promise<TimeEntry> => {
    const { data } = await api.post('/time-tracking', dto);
    return data;
  },

  // Zaustavi timer
  stopTimer: async (id: string, endTime: string): Promise<TimeEntry> => {
    const { data } = await api.post(`/time-tracking/${id}/stop`, { endTime });
    return data;
  },

  // Dohvati sve time entries
  getAll: async (filters?: {
    clientId?: string;
    taskId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    billable?: boolean;
  }): Promise<TimeEntriesResponse> => {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.billable !== undefined) params.append('billable', String(filters.billable));

    const { data } = await api.get(`/time-tracking?${params.toString()}`);
    return data;
  },

  // Aktivni timeri
  getActiveTimers: async (): Promise<TimeEntry[]> => {
    const { data } = await api.get('/time-tracking/active');
    return data;
  },

  // Statistika
  getStats: async (period: 'day' | 'week' | 'month' = 'week'): Promise<TimeStats> => {
    const { data } = await api.get(`/time-tracking/stats?period=${period}`);
    return data;
  },

  // Dohvati jedan entry
  getOne: async (id: string): Promise<TimeEntry> => {
    const { data } = await api.get(`/time-tracking/${id}`);
    return data;
  },

  // Ažuriraj
  update: async (id: string, dto: UpdateTimeEntryDto): Promise<TimeEntry> => {
    const { data } = await api.patch(`/time-tracking/${id}`, dto);
    return data;
  },

  // Obriši
  delete: async (id: string): Promise<void> => {
    await api.delete(`/time-tracking/${id}`);
  },
};
