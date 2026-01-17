import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, RefreshCw, AlertCircle } from 'lucide-react';
import { clientTasksApi } from '@/features/client-hub/api/client-tasks.api';
import type { KanbanColumns } from '@/features/kanban/api/tasks.api';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard';

const emptyColumns: KanbanColumns = {
  ONBOARDING: [],
  BACKLOG: [],
  IN_PROGRESS: [],
  REVIEW: [],
  DONE: [],
  ARCHIVE: [],
};

export function ClientKanbanPage() {
  const { t } = useTranslation();
  const { clientUser } = useClientAuthStore();

  // Fetch Kanban za klijenta
  const {
    data: kanbanData,
    isLoading: kanbanLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['client-kanban'],
    queryFn: () => clientTasksApi.getKanban(),
    enabled: !!clientUser?.clientId,
  });

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('kanban.title')}</h1>
        </div>

        {/* Refresh button */}
        {clientUser && (
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
        {!clientUser ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Klijent nije pronađen
              </h3>
            </div>
          </div>
        ) : kanbanLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        ) : kanbanData ? (
          <KanbanBoard
            clientId={clientUser.clientId}
            columns={kanbanData.columns}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <LayoutGrid className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">Nema taskova</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
