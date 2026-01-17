import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center rounded-lg p-2 text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      aria-label={theme === 'dark' ? 'Prebaci na svetli mod' : 'Prebaci na tamni mod'}
      title={theme === 'dark' ? 'Prebaci na svetli mod' : 'Prebaci na tamni mod'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
