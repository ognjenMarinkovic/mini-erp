import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarRange, RefreshCw, AlertCircle } from 'lucide-react';
import { clientTasksApi } from '@/features/client-hub/api/client-tasks.api';
import type { GanttTask } from '@/features/gantt/api/gantt.api';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { GanttChart } from '@/features/gantt/components/GanttChart';
import { TaskDetailDrawer } from '@/features/kanban/components/TaskDetailDrawer';

export function ClientGanttPage() {
  const { t } = useTranslation();
  const { clientUser } = useClientAuthStore();
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);

  // Fetch Gantt podatke za klijenta
  const {
    data: ganttData,
    isLoading: ganttLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['client-gantt'],
    queryFn: () => clientTasksApi.getGantt(),
    enabled: !!clientUser?.clientId,
  });

  const handleTaskClick = (task: GanttTask) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('gantt.title')}</h1>
        </div>

        {/* Refresh button */}
        {clientUser && (
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        )}
      </div>

      {/* Content */}
      {ganttLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Učitavanje...</p>
        </div>
      ) : !clientUser ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400">Klijent nije pronađen</p>
          </div>
        </div>
      ) : ganttData && ganttData.tasks.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <GanttChart tasks={ganttData.tasks} onTaskClick={handleTaskClick} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <CalendarRange className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400">Nema taskova za prikaz</p>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          taskId={selectedTask.id}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
