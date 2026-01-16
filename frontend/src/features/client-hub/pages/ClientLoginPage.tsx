import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Loader2, Building2 } from 'lucide-react';
import { clientAuthApi } from '../api/client-auth.api';
import { useClientAuthStore } from '@/stores/client-auth-store';

const loginSchema = z.object({
  email: z.string().email('Unesite validan email'),
  password: z.string().min(6, 'Lozinka mora imati najmanje 6 karaktera'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function ClientLoginPage() {
  const navigate = useNavigate();
  const { setClientAuth } = useClientAuthStore();
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md p-8">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Client Hub</h1>
          <p className="mt-2 text-sm text-gray-400">
            Pristupite vašim projektima i taskovima
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                placeholder="vas@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Lozinka
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
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
              className="text-sm text-gray-400 hover:text-white"
            >
              Admin? Prijavite se ovde
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Agency Management Platform
        </p>
      </div>
    </div>
  );
}
