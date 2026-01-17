import api from '@/lib/axios';

export interface ClientFile {
  id: string;
  clientId: string;
  uploaderId: string;
  uploaderType: 'ADMIN' | 'CLIENT';
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export const clientFilesApi = {
  // Dohvati listu fajlova
  getMyFiles: async (): Promise<ClientFile[]> => {
    const response = await api.get('/client/files');
    return response.data;
  },

  // Upload fajla
  upload: async (file: File): Promise<ClientFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/client/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download fajla sa autorizacijom
  download: async (fileId: string, fileName: string): Promise<void> => {
    const response = await api.get(`/client/files/${fileId}/download`, {
      responseType: 'blob',
    });
    
    // Kreiraj blob i pokreni download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Obriši fajl
  delete: async (fileId: string): Promise<void> => {
    await api.delete(`/client/files/${fileId}`);
  },
};
