import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, CreatePaymentData } from '../api/payments.api';
import { X } from 'lucide-react';
import { Invoice } from '@/features/invoices/api/invoices.api';
import { formatCurrency } from '@/lib/utils';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice;
}

export function PaymentDialog({ isOpen, onClose, invoice }: PaymentDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const remainingAmount = invoice ? invoice.totalAmount - invoice.paidAmount : 0;

  const [formData, setFormData] = useState<Omit<CreatePaymentData, 'invoiceId'>>({
    amount: remainingAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'BANK_TRANSFER',
    notes: '',
  });

  // Update amount when invoice changes
  useEffect(() => {
    if (invoice) {
      const remaining = invoice.totalAmount - invoice.paidAmount;
      setFormData((prev) => ({
        ...prev,
        amount: remaining,
      }));
    }
  }, [invoice]);

  const createMutation = useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Greška pri evidentiranju uplate');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setError('');
    createMutation.mutate({
      ...formData,
      invoiceId: invoice.id,
    });
  };

  // Early return AFTER all hooks
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Evidencija uplate</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 rounded-md bg-blue-50 p-3">
          <div className="text-sm text-gray-700">
            <div>Faktura: <strong>{invoice.number}</strong></div>
            <div>Ukupno: <strong>{formatCurrency(invoice.totalAmount)}</strong></div>
            <div>Plaćeno: <strong>{formatCurrency(invoice.paidAmount)}</strong></div>
            <div className="mt-2 text-lg font-bold text-blue-700">
              Preostalo: {formatCurrency(remainingAmount)}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Iznos uplate *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="0.01"
              max={remainingAmount}
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('payments.paymentDate')} *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Način plaćanja *
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value as any })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="BANK_TRANSFER">Bankovna transakcija</option>
              <option value="CASH">Gotovina</option>
              <option value="CARD">Kartica</option>
              <option value="OTHER">Ostalo</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Napomena
            </label>
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
              disabled={createMutation.isPending}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {createMutation.isPending ? 'Evidentiranje...' : 'Evidentiraj uplatu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
