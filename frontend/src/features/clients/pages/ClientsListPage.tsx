import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, Client } from '../api/clients.api';
import { ClientFormDialog } from '../components/ClientFormDialog';
import { Search, Edit, Trash2, MapPin, Phone, Mail, FileText } from 'lucide-react';

export function ClientsListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { search, page }],
    queryFn: () => clientsApi.getAll({ search, page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Greška pri brisanju klijenta');
    },
  });

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete klijenta "${client.name}"?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleAddNew = () => {
    setSelectedClient(undefined);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('clients.title')}</h1>
        <button
          onClick={handleAddNew}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + {t('clients.addClient')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
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
      </div>

      {/* Clients List */}
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
                      {t('clients.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('auth.city')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('clients.contact')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('clients.totalInvoices')}
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.data.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          {client.pib && (
                            <div className="text-sm text-gray-500">PIB: {client.pib}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                          {client.city}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {client.phone && (
                            <div className="flex items-center text-gray-700">
                              <Phone className="mr-1 h-4 w-4 text-gray-400" />
                              {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center text-gray-700">
                              <Mail className="mr-1 h-4 w-4 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <FileText className="mr-1 h-4 w-4 text-gray-400" />
                          {client._count?.invoices || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            title={t('common.edit')}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
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

      <ClientFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}
