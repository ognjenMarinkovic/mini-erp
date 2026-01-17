import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarRange, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { ganttApi, type GanttTask } from '../api/gantt.api';
import { useClientStore } from '@/stores/client-store';
import { GanttChart } from '../components/GanttChart';
import { TaskDetailDrawer } from '@/features/kanban/components/TaskDetailDrawer';
import { TaskForm } from '@/features/kanban/components/TaskForm';

export function GanttPage() {
  const { t } = useTranslation();
  const { selectedClient } = useClientStore();
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Fetch Gantt podatke za izabranog klijenta
  const {
    data: ganttData,
    isLoading: ganttLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['gantt', selectedClient?.id],
    queryFn: () => ganttApi.getGantt(selectedClient!.id),
    enabled: !!selectedClient?.id,
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
          {selectedClient && (
            <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedClient.name}
            </span>
          )}
        </div>

        {/* Actions */}
        {selectedClient && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </button>

            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              {t('gantt.newTask')}
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden rounded-lg bg-white dark:bg-gray-800">
        {!selectedClient ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {t('gantt.selectClientPrompt')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('gantt.selectClientDescription')}
              </p>
            </div>
          </div>
        ) : ganttLoading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : ganttData ? (
          <GanttChart
            tasks={ganttData.tasks}
            onTaskClick={handleTaskClick}
          />
        ) : null}
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={{
            ...selectedTask,
            _count: { comments: 0 },
          }}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            // TODO: open edit form
          }}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && selectedClient && (
        <TaskForm
          clientId={selectedClient.id}
          onClose={() => setShowTaskForm(false)}
          onSuccess={() => {
            setShowTaskForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
