import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, Invoice } from '../api/invoices.api';
import { InvoiceFormDialog } from '../components/InvoiceFormDialog';
import { PaymentDialog } from '@/features/payments/components/PaymentDialog';
import { Search, Edit, Trash2, Calendar, FileText, DollarSign, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/axios';

const statusColors = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  PARTIAL: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  OVERDUE: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  CANCELLED: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
};

export function InvoicesListPage() {
  const { t } = useTranslation();
  
  const statusLabels = {
    PENDING: t('invoices.pending'),
    PARTIAL: t('invoices.partial'),
    PAID: t('invoices.paid'),
    OVERDUE: t('invoices.overdue'),
    CANCELLED: t('invoices.cancelled'),
  };
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { search, status: statusFilter, page }],
    queryFn: () =>
      invoicesApi.getAll({
        search,
        status: statusFilter || undefined,
        page,
        limit: 10,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Greška pri brisanju fakture');
    },
  });

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete fakturu ${invoice.number}?`)) {
      deleteMutation.mutate(invoice.id);
    }
  };

  const handleAddNew = () => {
    setSelectedInvoice(undefined);
    setIsDialogOpen(true);
  };

  const handleAddPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const response = await api.get(`/pdf/invoice/${invoice.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faktura-${invoice.number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert('Greška pri preuzimanju PDF-a');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h1>
        <button
          onClick={handleAddNew}
          className="rounded-md bg-blue-600 dark:bg-blue-700 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          + {t('invoices.addInvoice')}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2 pl-10 pr-4 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">Svi statusi</option>
          <option value="PENDING">Na čekanju</option>
          <option value="PARTIAL">Delimično</option>
          <option value="PAID">Plaćeno</option>
          <option value="OVERDUE">Prekoračeno</option>
        </select>
      </div>

      {/* Invoices List */}
      <div className="rounded-lg bg-white dark:bg-gray-800 shadow">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('common.noData')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('invoices.number')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('invoices.client')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('invoices.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('invoices.total')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('invoices.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.data.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center font-medium text-gray-900 dark:text-white">
                          <FileText className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {invoice.number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{invoice.client?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.client?.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <Calendar className="mr-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {formatDate(invoice.date)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('invoices.dueDate')}: {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        {invoice.paidAmount > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {t('invoices.paid')}: {formatCurrency(invoice.paidAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[invoice.status]}`}
                        >
                          {statusLabels[invoice.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDownloadPdf(invoice)}
                            className="rounded p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                            title={t('invoices.downloadPdf')}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          {invoice.status !== 'PAID' && (
                            <button
                              onClick={() => handleAddPayment(invoice)}
                              className="rounded p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                              title={t('payments.addPayment')}
                            >
                              <DollarSign className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(invoice)}
                            className="rounded p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title={t('common.edit')}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="rounded p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Strana {data.meta.page} od {data.meta.totalPages} (ukupno: {data.meta.total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Prethodna
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page === data.meta.totalPages}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Sledeća
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <InvoiceFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        invoice={selectedInvoice}
      />

      {selectedInvoice && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}
