import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsOpen(false);
  };

  // Zatvori dropdown kada se klikne izvan njega
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 w-full"
        title="Change language"
      >
        <Globe className="h-5 w-5" />
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {/* Dropdown - otvara se na gore */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 ${
                  i18n.language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
