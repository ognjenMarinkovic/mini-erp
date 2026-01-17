import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, Client, CreateClientData } from '../api/clients.api';
import { useAuthStore } from '@/stores/auth-store';
import { X } from 'lucide-react';

interface ClientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}

export function ClientFormDialog({ isOpen, onClose, client }: ClientFormDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    pib: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    createUserAccount: false,
    userEmail: '',
    userFirstName: '',
    userLastName: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        pib: client.pib || '',
        address: client.address,
        city: client.city,
        phone: client.phone || '',
        email: client.email || '',
      });
    } else {
      setFormData({
        name: '',
        pib: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        createUserAccount: false,
        userEmail: '',
        userFirstName: '',
        userLastName: '',
      });
    }
  }, [client, isOpen]);

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Ako je kreiran user account, prikaži poruku o email-u
      if (variables.createUserAccount) {
        alert('Klijent je uspešno kreiran!\n\nEmail sa linkom za postavljanje šifre bi trebalo da stigne na adresu korisnika.\n\nAko email ne stigne, možete ponovo poslati email preko opcije "Ponovo pošalji email" u listi klijenata.');
      }
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Greška pri kreiranju klijenta';
      
      // Ako je greška vezana za SUPERADMIN, dodaj instrukcije
      if (errorMessage.includes('superadmin') || errorMessage.includes('Samo superadmin') || errorMessage.includes('uloga')) {
        setError(
          `${errorMessage}\n\nMolimo vas da se izlogujete i ulogujete ponovo da biste dobili novi token sa ažuriranom ulogom.`
        );
      } else {
        setError(errorMessage);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateClientData>) => clientsApi.update(client!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Greška pri ažuriranju klijenta');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validacija pre slanja
    if (!client && formData.createUserAccount) {
      if (!formData.userEmail?.trim() || !formData.userFirstName?.trim() || !formData.userLastName?.trim()) {
        setError('Sva polja su obavezna za kreiranje user account-a');
        return;
      }
    }
    
    // Pripremi podatke za slanje
    const dataToSend: any = { ...formData };
    if (!dataToSend.createUserAccount) {
      // Ako se ne kreira account, ukloni user polja potpuno
      delete dataToSend.userEmail;
      delete dataToSend.userFirstName;
      delete dataToSend.userLastName;
      delete dataToSend.createUserAccount;
    } else {
      // Ako se kreira account, uvek trim-uj polja (čak i ako su prazna)
      // Backend će validirati da nisu prazna
      dataToSend.userEmail = (dataToSend.userEmail || '').trim();
      dataToSend.userFirstName = (dataToSend.userFirstName || '').trim();
      dataToSend.userLastName = (dataToSend.userLastName || '').trim();
    }
    
    // Debug logovanje
    console.log('Sending data to backend:', JSON.stringify(dataToSend, null, 2));
    
    if (client) {
      updateMutation.mutate(dataToSend);
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold dark:text-white">
            {client ? t('clients.editClient') : t('clients.addClient')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('clients.name')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.pib')}
              </label>
              <input
                type="text"
                name="pib"
                value={formData.pib}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.city')} *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.address')} *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.phone')}
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Opcija za kreiranje user account-a (samo pri kreiranju novog klijenta i samo za SUPERADMIN) */}
          {!client && isSuperAdmin && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="createUserAccount"
                    checked={formData.createUserAccount}
                    onChange={(e) =>
                      setFormData({ ...formData, createUserAccount: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="createUserAccount"
                    className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Kreiraj prvi Client Hub account
                  </label>
                </div>
              </div>

              {formData.createUserAccount && (
                <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Podaci za prvi Client Hub account
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ime *
                      </label>
                      <input
                        type="text"
                        name="userFirstName"
                        value={formData.userFirstName}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required={formData.createUserAccount}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Prezime *
                      </label>
                      <input
                        type="text"
                        name="userLastName"
                        value={formData.userLastName}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required={formData.createUserAccount}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email za login *
                    </label>
                    <input
                      type="email"
                      name="userEmail"
                      value={formData.userEmail}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                      required={formData.createUserAccount}
                    />
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Napomena:</strong> Korisnik će dobiti email sa linkom za postavljanje šifre. 
                      Ne morate uneti šifru ovde.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 rounded-md bg-blue-600 dark:bg-blue-700 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800"
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
