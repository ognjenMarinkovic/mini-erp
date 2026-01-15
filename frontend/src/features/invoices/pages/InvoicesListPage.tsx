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
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  PENDING: 'Na čekanju',
  PARTIAL: 'Delimično',
  PAID: 'Plaćeno',
  OVERDUE: 'Prekoračeno',
  CANCELLED: 'Otkazano',
};

export function InvoicesListPage() {
  const { t } = useTranslation();
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
        <h1 className="text-3xl font-bold text-gray-900">{t('invoices.title')}</h1>
        <button
          onClick={handleAddNew}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + {t('invoices.addInvoice')}
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Svi statusi</option>
          <option value="PENDING">Na čekanju</option>
          <option value="PARTIAL">Delimično</option>
          <option value="PAID">Plaćeno</option>
          <option value="OVERDUE">Prekoračeno</option>
        </select>
      </div>

      {/* Invoices List */}
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
                      {t('invoices.number')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('invoices.client')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('invoices.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('invoices.total')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('invoices.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.data.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center font-medium text-gray-900">
                          <FileText className="mr-2 h-4 w-4 text-gray-400" />
                          {invoice.number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{invoice.client?.name}</div>
                        <div className="text-xs text-gray-500">{invoice.client?.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                          {formatDate(invoice.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Rok: {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        {invoice.paidAmount > 0 && (
                          <div className="text-xs text-green-600">
                            Plaćeno: {formatCurrency(invoice.paidAmount)}
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
                            className="rounded p-1 text-purple-600 hover:bg-purple-50"
                            title="Preuzmi PDF"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          {invoice.status !== 'PAID' && (
                            <button
                              onClick={() => handleAddPayment(invoice)}
                              className="rounded p-1 text-green-600 hover:bg-green-50"
                              title="Dodaj uplatu"
                            >
                              <DollarSign className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(invoice)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title={t('common.edit')}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(invoice)}
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
