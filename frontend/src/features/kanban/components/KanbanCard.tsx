import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { Calendar, MessageSquare, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '../api/tasks.api';
import { ServiceTypeBadge } from './ServiceTypeBadge';

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDeadlineClose = task.deadline
    ? new Date(task.deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000
    : false;

  const isOverdue = task.deadline
    ? new Date(task.deadline) < new Date()
    : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-blue-400',
      )}
      onClick={onClick}
    >
      {/* Header sa drag handle i service type */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <ServiceTypeBadge type={task.serviceType} />
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Naslov */}
      <h4 className="mb-2 font-medium text-gray-900 line-clamp-2">{task.title}</h4>

      {/* Klijent */}
      <p className="mb-2 text-xs text-gray-500">{task.client.name}</p>

      {/* Footer sa deadline i komentarima */}
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
