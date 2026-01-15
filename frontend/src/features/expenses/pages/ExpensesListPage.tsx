import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, Expense, ExpenseCategory } from '../api/expenses.api';
import { ExpenseFormDialog } from '../components/ExpenseFormDialog';
import { Search, Edit, Trash2, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const categoryLabels: Record<ExpenseCategory, string> = {
  RENT: 'Kirija',
  UTILITIES: 'Režije',
  SALARIES: 'Plate',
  MATERIALS: 'Materijal',
  MARKETING: 'Marketing',
  TRANSPORT: 'Transport',
  OTHER: 'Ostalo',
};

export function ExpensesListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { search, category: categoryFilter, page }],
    queryFn: () =>
      expensesApi.getAll({
        search,
        category: categoryFilter || undefined,
        page,
        limit: 10,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Greška pri brisanju troška');
    },
  });

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete trošak "${expense.description}"?`)) {
      deleteMutation.mutate(expense.id);
    }
  };

  const handleAddNew = () => {
    setSelectedExpense(undefined);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('expenses.title')}</h1>
        <button
          onClick={handleAddNew}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + {t('expenses.addExpense')}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sve kategorije</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      <div className="rounded-lg bg-white shadow">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('common.noData')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('expenses.category')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('expenses.description')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('expenses.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('expenses.amount')}
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                          {categoryLabels[expense.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-xs text-gray-500">{expense.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                          {formatDate(expense.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title={t('common.edit')}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-3">
                <div className="text-sm text-gray-700">
                  Strana {data.meta.page} od {data.meta.totalPages} (ukupno: {data.meta.total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Prethodna
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page === data.meta.totalPages}
                    className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Sledeća
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ExpenseFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        expense={selectedExpense}
      />
    </div>
  );
}
