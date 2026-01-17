import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Loader2, Building2 } from 'lucide-react';
import { clientAuthApi } from '../api/client-auth.api';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { ThemeToggle } from '@/components/ThemeToggle';

const loginSchema = z.object({
  email: z.string().email('Unesite validan email'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function ClientLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setClientAuth } = useClientAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('setup') === 'success') {
      setSuccess('Šifra je uspešno postavljena! Možete se prijaviti.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: clientAuthApi.login,
    onSuccess: (data) => {
      setClientAuth(data.user, data.token);
      navigate('/client');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Greška pri prijavi');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md p-8">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 dark:bg-white/20 backdrop-blur">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Client Hub</h1>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-300">
            Pristupite vašim projektima i taskovima
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 p-8 shadow-xl backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {success && (
              <div className="rounded-lg bg-green-500/20 dark:bg-green-900/30 px-4 py-3 text-sm text-green-200 dark:text-green-300">
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-500/20 dark:bg-red-900/30 px-4 py-3 text-sm text-red-200 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200 dark:text-gray-300">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full rounded-lg border border-white/20 dark:border-gray-600 bg-white/10 dark:bg-gray-700/50 px-4 py-3 text-white dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-400 dark:focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-500"
                placeholder="vas@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 dark:text-red-300">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200 dark:text-gray-300">
                Lozinka
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full rounded-lg border border-white/20 dark:border-gray-600 bg-white/10 dark:bg-gray-700/50 px-4 py-3 text-white dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-400 dark:focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 dark:text-red-300">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 dark:bg-purple-700 py-3 font-medium text-white transition-colors hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Prijavljivanje...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Prijavi se</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-gray-100"
            >
              Admin? Prijavite se ovde
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Agency Management Platform
        </p>
      </div>
    </div>
  );
}
