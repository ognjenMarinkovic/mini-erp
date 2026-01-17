import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, KanbanColumns } from '@/features/kanban/api/tasks.api';
import { ServiceTypeBadge } from '@/features/kanban/components/ServiceTypeBadge';

interface ClientKanbanBoardProps {
  columns: KanbanColumns;
  onTaskClick: (task: Task) => void;
}

export function ClientKanbanBoard({ columns, onTaskClick }: ClientKanbanBoardProps) {
  const { t } = useTranslation();

  // Klijent vidi samo 4 kolone (bez ONBOARDING i ARCHIVE)
  const visibleColumns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'BACKLOG', title: t('kanban.clientColumns.backlog'), color: 'bg-gray-200' },
    { id: 'IN_PROGRESS', title: t('kanban.clientColumns.inProgress'), color: 'bg-blue-200' },
    { id: 'REVIEW', title: t('kanban.clientColumns.review'), color: 'bg-amber-200' },
    { id: 'DONE', title: t('kanban.clientColumns.done'), color: 'bg-green-200' },
  ];
  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {visibleColumns.map((col) => (
        <ClientKanbanColumn
          key={col.id}
          title={col.title}
          color={col.color}
          tasks={columns[col.id]}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}

// Komponenta za kolonu
interface ClientKanbanColumnProps {
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function ClientKanbanColumn({ title, color, tasks, onTaskClick }: ClientKanbanColumnProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50">
      {/* Header */}
      <div className={cn('rounded-t-lg px-3 py-2', color)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-gray-700">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: '200px' }}>
        {tasks.map((task) => (
          <ClientTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}

        {tasks.length === 0 && (
          <div className="flex h-20 items-center justify-center text-sm text-gray-400">
            {t('kanban.noTasks')}
          </div>
        )}
      </div>
    </div>
  );
}

// Komponenta za karticu (bez drag & drop)
interface ClientTaskCardProps {
  task: Task;
  onClick: () => void;
}

function ClientTaskCard({ task, onClick }: ClientTaskCardProps) {
  const isDeadlineClose = task.deadline
    ? new Date(task.deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000
    : false;

  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() : false;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md"
    >
      {/* Service Type */}
      <div className="mb-2">
        <ServiceTypeBadge type={task.serviceType} />
      </div>

      {/* Title */}
      <h4 className="mb-2 font-medium text-gray-900 line-clamp-2">{task.title}</h4>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {task.deadline ? (
          <div
            className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-red-600',
              isDeadlineClose && !isOverdue && 'text-amber-600'
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(task.deadline), 'd. MMM yyyy', { locale: sr })}
            </span>
          </div>
        ) : (
          <span />
        )}

        {task._count.comments > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{task._count.comments}</span>
          </div>
        )}
      </div>
    </div>
  );
}
