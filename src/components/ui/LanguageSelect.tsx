import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageCode, LanguageInfo } from '@/contexts/LanguageContext';

interface LanguageSelectProps {
  label?: string;
  value: LanguageCode;
  onChange: (languageCode: LanguageCode) => void;
  error?: string;
  disabled?: boolean;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === value) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span>{label}</span>
        </label>
      )}

      {/* Botón trigger principal */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-left text-sm rounded-xl border ${
          disabled
            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border-gray-200 dark:border-zinc-700 cursor-not-allowed opacity-75'
            : error
            ? 'bg-white dark:bg-zinc-900 border-rose-500 cursor-pointer shadow-sm'
            : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-emerald-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm'
        } px-3.5 py-2.5 flex items-center justify-between transition-all`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={`https://flagcdn.com/w40/${selectedLanguage.countryCode}.png`}
            alt={selectedLanguage.name}
            className="w-5 h-3.5 object-cover rounded shadow-sm border border-black/10 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-bold text-gray-900 dark:text-zinc-100">
            {selectedLanguage.nativeName}
          </span>
          <span className="text-gray-400 dark:text-zinc-500 text-xs truncate">
            — {selectedLanguage.name}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Menú flotante con buscador */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-950/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar idioma..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((l) => {
                const isSelected = l.code === selectedLanguage.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSelect(l.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={`https://flagcdn.com/w40/${l.countryCode}.png`}
                        alt={l.name}
                        className="w-5 h-3.5 object-cover rounded shadow-sm border border-black/10 flex-shrink-0"
                      />
                      <span className="font-bold text-gray-900 dark:text-zinc-100">
                        {l.nativeName}
                      </span>
                      <span className="text-gray-500 dark:text-zinc-400 truncate">
                        — {l.name}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                No se encontraron idiomas para "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
