import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, RefreshCw, AlertCircle } from 'lucide-react';
import { tasksApi, type KanbanColumns } from '../api/tasks.api';
import { useClientStore } from '@/stores/client-store';
import { KanbanBoard } from '../components/KanbanBoard';

const emptyColumns: KanbanColumns = {
  ONBOARDING: [],
  BACKLOG: [],
  IN_PROGRESS: [],
  REVIEW: [],
  DONE: [],
  ARCHIVE: [],
};

export function KanbanPage() {
  const { t } = useTranslation();
  const { selectedClient } = useClientStore();

  // Fetch Kanban za izabranog klijenta
  const {
    data: kanbanData,
    isLoading: kanbanLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['kanban', selectedClient?.id],
    queryFn: () => tasksApi.getKanban(selectedClient!.id),
    enabled: !!selectedClient?.id,
  });

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('kanban.title')}</h1>
          {selectedClient && (
            <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedClient.name}
            </span>
          )}
        </div>

        {/* Refresh button */}
        {selectedClient && (
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!selectedClient ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {t('kanban.selectClientPrompt')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('kanban.selectClientDescription')}
              </p>
            </div>
          </div>
        ) : kanbanLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            clientId={selectedClient.id}
            columns={kanbanData?.columns || emptyColumns}
          />
        )}
      </div>
    </div>
  );
}
