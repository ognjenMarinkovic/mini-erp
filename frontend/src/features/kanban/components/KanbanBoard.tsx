import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskStatus, KanbanColumns } from '../api/tasks.api';
import { tasksApi } from '../api/tasks.api';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { TaskForm } from './TaskForm';

interface KanbanBoardProps {
  clientId: string;
  columns: KanbanColumns;
}

const columnConfig: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'ONBOARDING', title: 'Onboarding', color: 'bg-purple-200' },
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-200' },
  { id: 'IN_PROGRESS', title: 'U toku', color: 'bg-blue-200' },
  { id: 'REVIEW', title: 'Review', color: 'bg-amber-200' },
  { id: 'DONE', title: 'Završeno', color: 'bg-green-200' },
  { id: 'ARCHIVE', title: 'Arhiva', color: 'bg-slate-200' },
];

export function KanbanBoard({ clientId, columns: initialColumns }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<KanbanColumns>(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sinhronizuj lokalni state sa props-om kad se podaci promene
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Sensors za drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Mutation za pomeranje taska
  const moveMutation = useMutation({
    mutationFn: ({ taskId, status, position }: { taskId: string; status: TaskStatus; position: number }) =>
      tasksApi.move(taskId, { status, position }),
    onSuccess: () => {
      // Osveži podatke sa servera nakon uspešnog pomeranja
      queryClient.invalidateQueries({ queryKey: ['kanban', clientId] });
      queryClient.invalidateQueries({ queryKey: ['gantt', clientId] });
    },
    onError: () => {
      // Ako failuje, rollback na prethodno stanje
      queryClient.invalidateQueries({ queryKey: ['kanban', clientId] });
    },
  });

  // Svi taskovi kao flat lista za DnD
  const allTasks = useMemo(() => {
    return Object.values(columns).flat();
  }, [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = allTasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Pronađi kolone
    const activeColumn = (Object.keys(columns) as TaskStatus[]).find((col) =>
      columns[col].some((t) => t.id === activeId)
    );

    let overColumn: TaskStatus | undefined;

    // Da li je over kolona ili task
    if (columnConfig.some((c) => c.id === overId)) {
      overColumn = overId as TaskStatus;
    } else {
      overColumn = (Object.keys(columns) as TaskStatus[]).find((col) =>
        columns[col].some((t) => t.id === overId)
      );
    }

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Premesti task u drugu kolonu (optimistic update)
    setColumns((prev) => {
      const activeItems = [...prev[activeColumn]];
      const overItems = [...prev[overColumn!]];

      const activeIndex = activeItems.findIndex((t) => t.id === activeId);
      const [movedTask] = activeItems.splice(activeIndex, 1);

      // Pronađi gde da ubacimo
      let overIndex = overItems.length;
      if (overId !== overColumn) {
        overIndex = overItems.findIndex((t) => t.id === overId);
      }

      // Ubaci task
      overItems.splice(overIndex, 0, { ...movedTask, status: overColumn! });

      return {
        ...prev,
        [activeColumn]: activeItems,
        [overColumn!]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Pronađi kolonu gde se task nalazi
    const activeColumn = (Object.keys(columns) as TaskStatus[]).find((col) =>
      columns[col].some((t) => t.id === activeId)
    );

    if (!activeColumn) return;

    // Da li je over kolona ili task
    let overColumn: TaskStatus;
    if (columnConfig.some((c) => c.id === overId)) {
      overColumn = overId as TaskStatus;
    } else {
      const foundColumn = (Object.keys(columns) as TaskStatus[]).find((col) =>
        columns[col].some((t) => t.id === overId)
      );
      if (!foundColumn) return;
      overColumn = foundColumn;
    }

    // Izračunaj novu poziciju
    const columnTasks = columns[overColumn];
    let newPosition = columnTasks.findIndex((t) => t.id === activeId);
    if (newPosition === -1) {
      newPosition = columnTasks.length - 1;
    }

    // Sortiranje unutar kolone
    if (activeColumn === overColumn && activeId !== overId) {
      setColumns((prev) => {
        const items = [...prev[activeColumn]];
        const oldIndex = items.findIndex((t) => t.id === activeId);
        const newIndex = items.findIndex((t) => t.id === overId);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        return {
          ...prev,
          [activeColumn]: reordered,
        };
      });
    }

    // Pošalji API poziv
    moveMutation.mutate({
      taskId: activeId,
      status: overColumn,
      position: Math.max(0, newPosition),
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(null);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {columnConfig.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={columns[col.id]}
              onTaskClick={handleTaskClick}
              showAddButton={col.id === 'BACKLOG'}
              onAddTask={() => setShowTaskForm(true)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={handleEditTask}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          clientId={clientId}
          task={editingTask}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
}
