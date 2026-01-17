import api from '@/lib/axios';
import type { Task, KanbanResponse, CreateTaskData, UpdateTaskData, MoveTaskData } from '@/features/kanban/api/tasks.api';
import type { GanttData } from '@/features/gantt/api/gantt.api';

export const clientTasksApi = {
  // Kanban prikaz za klijenta
  getKanban: async (): Promise<KanbanResponse> => {
    const response = await api.get('/client/tasks/kanban');
    return response.data;
  },

  // Gantt Chart prikaz za klijenta
  getGantt: async (): Promise<GanttData> => {
    const response = await api.get('/client/tasks/gantt');
    return response.data;
  },

  // Kreiranje novog taska
  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post('/client/tasks', data);
    return response.data;
  },

  // Ažuriranje taska
  update: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.patch(`/client/tasks/${id}`, data);
    return response.data;
  },

  // Detalji taska
  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/client/tasks/${id}`);
    return response.data;
  },
};
