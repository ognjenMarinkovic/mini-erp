import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import {
  X,
  Calendar,
  MessageSquare,
  Trash2,
  Edit,
  User,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '../api/tasks.api';
import { tasksApi } from '../api/tasks.api';
import { ServiceTypeBadge } from './ServiceTypeBadge';
import { CommentSection } from './CommentSection';
import { useAuthStore } from '@/stores/auth-store';

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  ONBOARDING: { label: 'Onboarding', color: 'bg-purple-100 text-purple-800' },
  BACKLOG: { label: 'Backlog', color: 'bg-gray-100 text-gray-800' },
  IN_PROGRESS: { label: 'U toku', color: 'bg-blue-100 text-blue-800' },
  REVIEW: { label: 'Review', color: 'bg-amber-100 text-amber-800' },
  DONE: { label: 'Završeno', color: 'bg-green-100 text-green-800' },
  ARCHIVE: { label: 'Arhiva', color: 'bg-slate-100 text-slate-800' },
};

export function TaskDetailDrawer({ task, onClose, onEdit }: TaskDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(task!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', task!.clientId] });
      onClose();
    },
  });

  if (!task) return null;

  const statusConfig = statusLabels[task.status];

  const handleDelete = () => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovaj task?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusConfig.color)}>
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              title="Izmeni"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
              title="Obriši"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-32">
          <div className="p-6">
            {/* Service Type */}
            <div className="mb-4">
              <ServiceTypeBadge type={task.serviceType} size="md" />
            </div>

            {/* Title */}
            <h2 className="mb-2 text-xl font-semibold text-gray-900">{task.title}</h2>

            {/* Client */}
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{task.client.name}</span>
            </div>

            {/* Metadata */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              {task.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="font-medium">
                      {format(new Date(task.deadline), 'd. MMMM yyyy', { locale: sr })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Kreiran</p>
                  <p className="font-medium">
                    {format(new Date(task.createdAt), 'd. MMM yyyy', { locale: sr })}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Opis</h3>
                <p className="whitespace-pre-wrap text-sm text-gray-600">
                  {task.description}
                </p>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t pt-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">
                  Komentari
                </h3>
              </div>

              <CommentSection
                taskId={task.id}
                currentUserId={user?.id}
                currentUserType="ADMIN"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
