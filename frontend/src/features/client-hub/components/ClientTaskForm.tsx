import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { tasksApi, type ServiceType } from '@/features/kanban/api/tasks.api';
import { serviceTypeConfig } from '@/features/kanban/components/ServiceTypeBadge';

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
});

type TaskFormData = z.infer<typeof taskSchema>;

interface ClientTaskFormProps {
  clientId: string;
  onClose: () => void;
}

export function ClientTaskForm({ clientId, onClose }: ClientTaskFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      serviceType: 'OTHER',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskFormData) =>
      tasksApi.create({
        ...data,
        clientId,
        deadline: data.deadline || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-kanban', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] });
      onClose();
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Novi zahtev</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-purple-50 px-6 py-3">
          <p className="text-sm text-purple-700">
            Vaš zahtev će biti dodat u listu čekanja i naš tim će ga pregledati u najkraćem roku.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Naslov zahteva *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Npr. Izmena logotipa, Novi banner za sajt..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Service Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tip usluge *
              </label>
              <select
                {...register('serviceType')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {(Object.keys(serviceTypeConfig) as ServiceType[]).map((type) => (
                  <option key={type} value={type}>
                    {serviceTypeConfig[type].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Željeni rok (opciono)
              </label>
              <input
                {...register('deadline')}
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Opis zahteva
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Opišite detaljno šta vam je potrebno..."
              />
            </div>
          </div>

          {/* Error message */}
          {createMutation.isError && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              Greška pri kreiranju zahteva. Pokušajte ponovo.
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Slanje...</span>
                </>
              ) : (
                <span>Pošalji zahtev</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
