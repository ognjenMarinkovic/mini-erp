import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Lock, User, CheckCircle, AlertCircle, Loader2, Bell } from 'lucide-react';
import { clientSettingsApi } from '../api/client-settings.api';
import { useClientAuthStore } from '@/stores/client-auth-store';

export function ClientSettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { clientUser, setClientAuth } = useClientAuthStore();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [profileForm, setProfileForm] = useState({
    firstName: clientUser?.firstName || '',
    lastName: clientUser?.lastName || '',
  });
  const [profileErrors, setProfileErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  const [notificationPreferences, setNotificationPreferences] = useState({
    notifyTaskInProgress: clientUser?.notifyTaskInProgress ?? true,
    notifyTaskReview: clientUser?.notifyTaskReview ?? true,
    notifyTaskCompleted: clientUser?.notifyTaskCompleted ?? true,
    notifyNewComment: clientUser?.notifyNewComment ?? true,
  });

  // Ažuriraj preference kada se clientUser promeni
  useEffect(() => {
    if (clientUser) {
      setNotificationPreferences({
        notifyTaskInProgress: clientUser.notifyTaskInProgress ?? true,
        notifyTaskReview: clientUser.notifyTaskReview ?? true,
        notifyTaskCompleted: clientUser.notifyTaskCompleted ?? true,
        notifyNewComment: clientUser.notifyNewComment ?? true,
      });
    }
  }, [clientUser]);

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      clientSettingsApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      alert('Šifra je uspešno promenjena');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Greška pri promeni šifre';
      setPasswordErrors({ currentPassword: errorMessage });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      clientSettingsApi.updateProfile(data.firstName, data.lastName),
    onSuccess: (data: any) => {
      // Ažuriraj store sa novim podacima
      if (clientUser) {
        setClientAuth(
          {
            ...clientUser,
            firstName: data.firstName,
            lastName: data.lastName,
          },
          useClientAuthStore.getState().clientToken || '',
        );
      }
      queryClient.invalidateQueries({ queryKey: ['client-me'] });
      alert('Profil je uspešno ažuriran');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Greška pri ažuriranju profila';
      setProfileErrors({ firstName: errorMessage });
    },
  });

  const updateNotificationPreferencesMutation = useMutation({
    mutationFn: (preferences: typeof notificationPreferences) =>
      clientSettingsApi.updateNotificationPreferences(preferences),
    onSuccess: (data: any) => {
      // Ažuriraj store sa novim podacima
      if (clientUser) {
        setClientAuth(
          {
            ...clientUser,
            notifyTaskInProgress: data.notifyTaskInProgress,
            notifyTaskReview: data.notifyTaskReview,
            notifyTaskCompleted: data.notifyTaskCompleted,
            notifyNewComment: data.notifyNewComment,
          },
          useClientAuthStore.getState().clientToken || '',
        );
      }
      queryClient.invalidateQueries({ queryKey: ['client-me'] });
      alert('Notification preferences su uspešno ažurirane');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Greška pri ažuriranju notification preferences');
    },
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors({ ...passwordErrors, [name]: undefined });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
    if (profileErrors[name as keyof typeof profileErrors]) {
      setProfileErrors({ ...profileErrors, [name]: undefined });
    }
  };

  const handleNotificationPreferenceChange = (key: keyof typeof notificationPreferences) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    });
  };

  const handleNotificationPreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationPreferencesMutation.mutate(notificationPreferences);
  };

  const validatePassword = () => {
    const errors: typeof passwordErrors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Trenutna šifra je obavezna';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Nova šifra je obavezna';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Nova šifra mora imati najmanje 6 karaktera';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Potvrda šifre je obavezna';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Šifre se ne poklapaju';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const validateProfile = () => {
    const errors: typeof profileErrors = {};

    if (!profileForm.firstName) {
      errors.firstName = 'Ime je obavezno';
    }

    if (!profileForm.lastName) {
      errors.lastName = 'Prezime je obavezno';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    updateProfileMutation.mutate({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Podešavanja</h1>
      </div>

      <div className="space-y-6">
        {/* Promena šifre */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Promena šifre</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trenutna šifra *
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full rounded-lg border ${
                  passwordErrors.currentPassword
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
                required
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nova šifra *
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className={`w-full rounded-lg border ${
                  passwordErrors.newPassword
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
                required
                minLength={6}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Potvrdite novu šifru *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full rounded-lg border ${
                  passwordErrors.confirmPassword
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
                required
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-purple-600 dark:bg-purple-700 px-4 py-2 text-white hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Čuvanje...</span>
                </>
              ) : (
                'Promeni šifru'
              )}
            </button>
          </form>
        </div>

        {/* Osnovni podaci */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Osnovni podaci</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ime *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className={`w-full rounded-lg border ${
                    profileErrors.firstName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
                  required
                />
                {profileErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {profileErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prezime *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className={`w-full rounded-lg border ${
                    profileErrors.lastName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400`}
                  required
                />
                {profileErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {profileErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-purple-600 dark:bg-purple-700 px-4 py-2 text-white hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Čuvanje...</span>
                </>
              ) : (
                'Sačuvaj izmene'
              )}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifikacije</h2>
          </div>

          <form onSubmit={handleNotificationPreferencesSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Izaberite za koje događaje želite da primate email notifikacije:
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.notifyTaskInProgress}
                  onChange={() => handleNotificationPreferenceChange('notifyTaskInProgress')}
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Task u toku (IN_PROGRESS)
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Primi email kada task pređe u kolonu "U toku"
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.notifyTaskReview}
                  onChange={() => handleNotificationPreferenceChange('notifyTaskReview')}
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Task na pregledu (REVIEW)
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Primi email kada task pređe u kolonu "Na pregledu"
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.notifyTaskCompleted}
                  onChange={() => handleNotificationPreferenceChange('notifyTaskCompleted')}
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Task završen (DONE)
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Primi email kada task pređe u kolonu "Završeno"
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.notifyNewComment}
                  onChange={() => handleNotificationPreferenceChange('notifyNewComment')}
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Novi komentari
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Primi email kada neko doda komentar na task
                  </p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={updateNotificationPreferencesMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-purple-600 dark:bg-purple-700 px-4 py-2 text-white hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
            >
              {updateNotificationPreferencesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Čuvanje...</span>
                </>
              ) : (
                'Sačuvaj izmene'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
