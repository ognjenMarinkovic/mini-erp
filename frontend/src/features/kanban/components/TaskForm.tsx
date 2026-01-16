import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { tasksApi, type Task, type ServiceType } from '../api/tasks.api';
import { serviceTypeConfig } from './ServiceTypeBadge';

const taskSchema = z.object({
  title: z.string().min(1, 'Naslov je obavezan'),
  description: z.string().optional(),
  serviceType: z.enum([
    'BRANDING',
    'LOGO_DESIGN',
    'WEB_DESIGN',
    'UI_UX',
    'WEBFLOW_DEV',
    'SOCIAL_MEDIA',
    'PITCH_DECK',
    'MOTION_GRAPHICS',
    'ILLUSTRATIONS',
    'PRINT_DESIGN',
    'OTHER',
  ]),
  deadline: z.string().optional(),
  // Gantt polja
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  clientId: string;
  task?: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TaskForm({ clientId, task, onClose, onSuccess }: TaskFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      serviceType: task?.serviceType || 'OTHER',
      deadline: task?.deadline ? task.deadline.split('T')[0] : '',
      startDate: (task as any)?.startDate ? (task as any).startDate.split('T')[0] : '',
      endDate: (task as any)?.endDate ? (task as any).endDate.split('T')[0] : '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskFormData) =>
      tasksApi.create({
        ...data,
        clientId,
        deadline: data.deadline || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', clientId] });
      queryClient.invalidateQueries({ queryKey: ['gantt', clientId] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Create task error:', error);
      alert(`Greška: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TaskFormData) =>
      tasksApi.update(task!.id, {
        ...data,
        deadline: data.deadline || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', clientId] });
      queryClient.invalidateQueries({ queryKey: ['gantt', clientId] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Update task error:', error);
      alert(`Greška: ${error.response?.data?.message || error.message}`);
    },
  });

  const onSubmit = (data: TaskFormData) => {
    console.log('TaskForm onSubmit called with:', data);
    console.log('ClientId:', clientId);
    console.log('IsEditing:', isEditing);
    
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Izmeni task' : 'Novi task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => {
          console.log('Form onSubmit event triggered');
          console.log('Form errors:', errors);
          handleSubmit(onSubmit)(e);
        }} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Naslov *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Unesite naslov taska..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Service Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tip servisa *
              </label>
              <select
                {...register('serviceType')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {(Object.keys(serviceTypeConfig) as ServiceType[]).map((type) => (
                  <option key={type} value={type}>
                    {serviceTypeConfig[type].label}
                  </option>
                ))}
              </select>
              {errors.serviceType && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceType.message}</p>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <input
                {...register('deadline')}
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Gantt datumi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Datum početka (Gantt)
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Datum završetka (Gantt)
                </label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Opis
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Opišite task..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Čuvanje...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
