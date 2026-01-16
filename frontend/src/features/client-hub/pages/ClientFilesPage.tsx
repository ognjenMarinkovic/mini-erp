import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Loader2,
  File,
  Image,
  FileArchive,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { clientFilesApi, type ClientFile } from '../api/client-files.api';
import { useClientAuthStore } from '@/stores/client-auth-store';

export function ClientFilesPage() {
  const queryClient = useQueryClient();
  const { clientUser } = useClientAuthStore();
  const [isDragging, setIsDragging] = useState(false);

  // Fetch fajlovi
  const { data: files, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['client-files'],
    queryFn: clientFilesApi.getMyFiles,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => clientFilesApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => clientFilesApi.delete(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files'] });
    },
  });

  // Download handler
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await clientFilesApi.download(fileId, fileName);
    } catch (error) {
      console.error('Greška pri preuzimanju fajla:', error);
    }
  };

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach((file) => {
        uploadMutation.mutate(file);
      });
    },
    [uploadMutation]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
    e.target.value = ''; // Reset input
  };

  const handleDelete = (fileId: string, fileName: string) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete "${fileName}"?`)) {
      deleteMutation.mutate(fileId);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Moji fajlovi</h1>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Osveži</span>
        </button>
      </div>

      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-8 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            <p className="text-sm text-gray-600">Učitavanje...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-3 text-sm text-gray-600">
              Prevucite fajlove ovde ili{' '}
              <label className="cursor-pointer font-medium text-purple-600 hover:text-purple-700">
                izaberite sa računara
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Maksimalna veličina: 50MB po fajlu
            </p>
          </>
        )}
      </div>

      {/* Files list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : files?.length === 0 ? (
        <div className="rounded-xl bg-gray-50 py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nemate otpremljenih fajlova</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Naziv
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Veličina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Datum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files?.map((file) => {
                const FileIcon = getFileIcon(file.mimeType);
                return (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {file.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(file.createdAt), 'd. MMM yyyy', {
                        locale: sr,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file.id, file.fileName)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-purple-600"
                          title="Preuzmi"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {file.uploaderType === 'CLIENT' &&
                          file.uploaderId === clientUser?.id && (
                            <button
                              onClick={() => handleDelete(file.id, file.fileName)}
                              disabled={deleteMutation.isPending}
                              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              title="Obriši"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
