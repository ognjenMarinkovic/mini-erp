import api from '@/lib/axios';
import type { Comment, CreateCommentData } from '@/features/kanban/api/comments.api';

export const clientCommentsApi = {
  // Dohvati komentare za task (client endpoint)
  getByTask: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get(`/client/comments/task/${taskId}`);
    return response.data;
  },

  // Kreiraj komentar (client endpoint)
  create: async (data: CreateCommentData): Promise<Comment> => {
    const response = await api.post('/client/comments', data);
    return response.data;
  },

  // Ažuriraj komentar
  update: async (id: string, content: string): Promise<Comment> => {
    const response = await api.patch(`/client/comments/${id}`, { content });
    return response.data;
  },

  // Obriši komentar
  delete: async (id: string): Promise<void> => {
    await api.delete(`/client/comments/${id}`);
  },
};
