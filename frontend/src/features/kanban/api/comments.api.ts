import api from '@/lib/axios';

export interface CommentAttachment {
  id: string;
  commentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorType: 'ADMIN' | 'CLIENT';
  authorName: string;
  content: string | null;
  parentId: string | null;
  attachments: CommentAttachment[];
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  taskId: string;
  content: string;
  parentId?: string;
}

export const commentsApi = {
  // Dohvati komentare za task
  getByTask: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get(`/comments/task/${taskId}`);
    return response.data;
  },

  // Kreiraj komentar
  create: async (data: CreateCommentData): Promise<Comment> => {
    const response = await api.post('/comments', data);
    return response.data;
  },

  // Ažuriraj komentar
  update: async (id: string, content: string): Promise<Comment> => {
    const response = await api.patch(`/comments/${id}`, { content });
    return response.data;
  },

  // Obriši komentar
  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },

  // Upload attachment
  addAttachment: async (commentId: string, file: File): Promise<CommentAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/comments/${commentId}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obriši attachment
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await api.delete(`/comments/attachment/${attachmentId}`);
  },
};
