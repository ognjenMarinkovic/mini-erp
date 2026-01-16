import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '../api/tasks.api';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  onTaskClick: (task: Task) => void;
  onAddTask?: () => void;
  showAddButton?: boolean;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  onTaskClick,
  onAddTask,
  showAddButton = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  });

  return (
    <div
      className={cn(
        'flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50',
        isOver && 'ring-2 ring-blue-400 ring-opacity-50'
      )}
    >
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
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto p-2"
        style={{ minHeight: '200px' }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Add task button */}
        {showAddButton && (
          <button
            onClick={onAddTask}
            className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Dodaj task</span>
          </button>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !showAddButton && (
          <div className="flex h-20 items-center justify-center text-sm text-gray-400">
            Nema taskova
          </div>
        )}
      </div>
    </div>
  );
}
