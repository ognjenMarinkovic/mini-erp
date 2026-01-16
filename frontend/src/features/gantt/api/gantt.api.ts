import api from '@/lib/axios';

export interface GanttTask {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  serviceType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  isMilestone: boolean;
  progress: number;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  dependentOn: TaskDependency[];
  dependsOn: TaskDependency[];
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
  dependentTask?: { id: string; title: string };
  dependsOnTask?: { id: string; title: string };
}

export type DependencyType =
  | 'FINISH_TO_START'
  | 'START_TO_START'
  | 'FINISH_TO_FINISH'
  | 'START_TO_FINISH';

export interface GanttData {
  tasks: GanttTask[];
  dependencies: TaskDependency[];
  client: {
    id: string;
    name: string;
  };
}

export const ganttApi = {
  // Dohvati Gantt podatke za klijenta
  getGantt: async (clientId: string): Promise<GanttData> => {
    const { data } = await api.get(`/tasks/gantt/${clientId}`);
    return data;
  },

  // Ažuriraj datume taska
  updateDates: async (
    taskId: string,
    startDate: string | null,
    endDate: string | null
  ): Promise<GanttTask> => {
    const { data } = await api.patch(`/tasks/${taskId}/dates`, {
      startDate,
      endDate,
    });
    return data;
  },

  // Ažuriraj progress
  updateProgress: async (
    taskId: string,
    progress: number
  ): Promise<GanttTask> => {
    const { data } = await api.patch(`/tasks/${taskId}/progress`, { progress });
    return data;
  },

  // Dodaj dependency
  addDependency: async (
    dependentTaskId: string,
    dependsOnTaskId: string,
    type: DependencyType = 'FINISH_TO_START'
  ): Promise<TaskDependency> => {
    const { data } = await api.post('/task-dependencies', {
      dependentTaskId,
      dependsOnTaskId,
      type,
    });
    return data;
  },

  // Obriši dependency
  removeDependency: async (id: string): Promise<void> => {
    await api.delete(`/task-dependencies/${id}`);
  },
};
