import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { clientSettingsApi } from '../api/client-settings.api';

export function SetupPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const setupMutation = useMutation({
    mutationFn: (password: string) => clientSettingsApi.setupPassword(token!, password),
    onSuccess: () => {
      // Redirect na login sa success porukom
      navigate('/client/login?setup=success');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Greška pri postavljanju šifre';
      setErrors({ password: errorMessage });
    },
  });

  useEffect(() => {
    if (!token) {
      setErrors({ password: 'Token nije pronađen u URL-u' });
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Očisti grešku kada korisnik počne da kuca
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!formData.password) {
      newErrors.password = 'Šifra je obavezna';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Šifra mora imati najmanje 6 karaktera';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potvrda šifre je obavezna';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Šifre se ne poklapaju';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrors({ password: 'Token nije pronađen' });
      return;
    }

    if (!validate()) {
      return;
    }

    setupMutation.mutate(formData.password);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Nevažeći link
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Link za postavljanje šifre nije validan ili je istekao.
            </p>
            <a
              href="/client/login"
              className="mt-6 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Nazad na prijavu
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Postavite svoju šifru
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Unesite novu šifru za pristup vašem Client Hub nalogu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nova šifra *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-md border ${
                errors.password
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
              placeholder="Minimum 6 karaktera"
              required
              minLength={6}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Potvrdite šifru *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full rounded-md border ${
                errors.confirmPassword
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
              placeholder="Ponovite šifru"
              required
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={setupMutation.isPending}
            className="w-full rounded-md bg-purple-600 dark:bg-purple-700 px-4 py-2 text-white hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {setupMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Postavljanje...
              </span>
            ) : (
              'Postavite šifru'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Link važi 7 dana. Ako je istekao, kontaktirajte administratora.
        </p>
      </div>
    </div>
  );
}
