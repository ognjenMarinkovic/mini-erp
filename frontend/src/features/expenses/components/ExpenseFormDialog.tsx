import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, Expense, CreateExpenseData, ExpenseCategory } from '../api/expenses.api';
import { X } from 'lucide-react';

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
}

const categoryLabels: Record<ExpenseCategory, string> = {
  RENT: 'Kirija',
  UTILITIES: 'Režije',
  SALARIES: 'Plate',
  MATERIALS: 'Materijal',
  MARKETING: 'Marketing',
  TRANSPORT: 'Transport',
  OTHER: 'Ostalo',
};

export function ExpenseFormDialog({ isOpen, onClose, expense }: ExpenseFormDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateExpenseData>({
    category: 'OTHER',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        date: expense.date.split('T')[0],
        notes: expense.notes || '',
      });
    } else {
      setFormData({
        category: 'OTHER',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [expense, isOpen]);

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Greška pri kreiranju troška');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateExpenseData>) => expensesApi.update(expense!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Greška pri ažuriranju troška');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (expense) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {expense ? 'Izmena troška' : t('expenses.addExpense')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('expenses.category')} *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ExpenseCategory })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('expenses.description')} *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('expenses.amount')} *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('expenses.date')} *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Napomena</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {createMutation.isPending || updateMutation.isPending
                ? t('common.loading')
                : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
