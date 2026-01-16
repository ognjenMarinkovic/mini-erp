import api from '@/lib/axios';

// Tipovi za Task
export type TaskStatus = 'ONBOARDING' | 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'ARCHIVE';

export type ServiceType = 
  | 'BRANDING'
  | 'LOGO_DESIGN'
  | 'WEB_DESIGN'
  | 'UI_UX'
  | 'WEBFLOW_DEV'
  | 'SOCIAL_MEDIA'
  | 'PITCH_DECK'
  | 'MOTION_GRAPHICS'
  | 'ILLUSTRATIONS'
  | 'PRINT_DESIGN'
  | 'OTHER';

export interface Task {
  id: string;
  clientId: string;
  createdById: string;
  createdByType: 'ADMIN' | 'CLIENT';
  title: string;
  description?: string;
  serviceType: ServiceType;
  deadline?: string;
  // Gantt polja
  startDate?: string;
  endDate?: string;
  isMilestone?: boolean;
  progress?: number;
  // Kanban
  status: TaskStatus;
  position: number;
  client: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumns {
  ONBOARDING: Task[];
  BACKLOG: Task[];
  IN_PROGRESS: Task[];
  REVIEW: Task[];
  DONE: Task[];
  ARCHIVE: Task[];
}

export interface KanbanResponse {
  columns: KanbanColumns;
  totalTasks: number;
}

export interface CreateTaskData {
  clientId: string;
  title: string;
  description?: string;
  serviceType: ServiceType;
  deadline?: string;
  // Gantt polja
  startDate?: string;
  endDate?: string;
  isMilestone?: boolean;
  progress?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  serviceType?: ServiceType;
  deadline?: string;
  status?: TaskStatus;
  // Gantt polja
  startDate?: string;
  endDate?: string;
  isMilestone?: boolean;
  progress?: number;
}

export interface MoveTaskData {
  status: TaskStatus;
  position: number;
}

export const tasksApi = {
  // Svi taskovi za kompaniju (opciono filtrirano po klijentu)
  getAll: async (clientId?: string): Promise<Task[]> => {
    const params = clientId ? { clientId } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Kanban prikaz za klijenta
  getKanban: async (clientId: string): Promise<KanbanResponse> => {
    const response = await api.get(`/tasks/kanban/${clientId}`);
    return response.data;
  },

  // Alias za getKanban (koristi se u drugim komponentama)
  getByClient: async (clientId: string): Promise<KanbanResponse> => {
    const response = await api.get(`/tasks/kanban/${clientId}`);
    return response.data;
  },

  // Kreiranje novog taska
  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Ažuriranje taska
  update: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  // Premesti task (drag & drop)
  move: async (id: string, data: MoveTaskData): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}/move`, data);
    return response.data;
  },

  // Obriši task
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Detalji taska
  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Statistika
  getStats: async (): Promise<{ total: number; byStatus: Record<TaskStatus, number> }> => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },
};
