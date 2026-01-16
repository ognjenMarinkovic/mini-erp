import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, RefreshCw, Plus, MessageSquare } from 'lucide-react';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { tasksApi, type Task, type KanbanColumns } from '@/features/kanban/api/tasks.api';
import { ClientKanbanBoard } from '../components/ClientKanbanBoard';
import { ClientTaskForm } from '../components/ClientTaskForm';
import { ClientCommentSection } from '../components/ClientCommentSection';

const emptyColumns: KanbanColumns = {
  ONBOARDING: [],
  BACKLOG: [],
  IN_PROGRESS: [],
  REVIEW: [],
  DONE: [],
  ARCHIVE: [],
};

export function ClientTasksPage() {
  const { clientUser } = useClientAuthStore();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const {
    data: kanbanData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['client-kanban', clientUser?.clientId],
    queryFn: () => tasksApi.getKanban(clientUser!.clientId),
    enabled: !!clientUser?.clientId,
  });

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Moji taskovi</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Osveži</span>
          </button>

          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            <span>Novi zahtev</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-sm text-gray-500">Učitavanje...</p>
            </div>
          </div>
        ) : (
          <ClientKanbanBoard
            columns={kanbanData?.columns || emptyColumns}
            onTaskClick={(task) => setSelectedTask(task)}
          />
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && clientUser && (
        <ClientTaskForm
          clientId={clientUser.clientId}
          onClose={() => setShowTaskForm(false)}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <ClientTaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

// Komponenta za prikaz detalja taska
function ClientTaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    ONBOARDING: { label: 'Onboarding', color: 'bg-purple-100 text-purple-800' },
    BACKLOG: { label: 'Čeka', color: 'bg-gray-100 text-gray-800' },
    IN_PROGRESS: { label: 'U toku', color: 'bg-blue-100 text-blue-800' },
    REVIEW: { label: 'Na pregledu', color: 'bg-amber-100 text-amber-800' },
    DONE: { label: 'Završeno', color: 'bg-green-100 text-green-800' },
    ARCHIVE: { label: 'Arhiva', color: 'bg-slate-100 text-slate-800' },
  };

  const statusConfig = statusLabels[task.status];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-4 text-xl font-semibold">{task.title}</h2>

            {task.description && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Opis</h3>
                <p className="whitespace-pre-wrap text-gray-600">{task.description}</p>
              </div>
            )}

            {task.deadline && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Rok</h3>
                <p className="text-gray-600">
                  {new Date(task.deadline).toLocaleDateString('sr-RS', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* Komentari */}
            <div className="border-t pt-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Komentari</h3>
              </div>
              <ClientCommentSection taskId={task.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
