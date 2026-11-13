import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { COUNTRIES, CountryInfo } from '@/utils/formatters';

interface CountrySelectProps {
  label?: string;
  value: string;
  onChange: (countryCode: string) => void;
  error?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  label,
  value,
  onChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.currency.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
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

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Botón trigger principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm rounded-xl border ${
          error ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-800'
        } hover:border-emerald-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 px-3.5 py-2.5 flex items-center justify-between transition-all cursor-pointer shadow-sm`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
            alt={selectedCountry.name}
            className="w-5 h-3.5 object-cover rounded shadow-sm border border-black/10 flex-shrink-0"
            onError={(e) => {
              // Fallback si la imagen no carga
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-semibold truncate">{selectedCountry.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/40">
            {selectedCountry.currency}
          </span>
          {selectedCountry.isDollarized && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black uppercase">
              Dolarizado
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Menú flotante con lista de banderas y buscador */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Buscador rápido */}
          <div className="p-2.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-950/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar país o moneda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Lista de países */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c: CountryInfo) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={c.name}
                        className="w-5 h-3.5 object-cover rounded shadow-sm border border-black/10 flex-shrink-0"
                      />
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {c.isDollarized && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                          USD
                        </span>
                      )}
                      <span className="font-mono font-bold text-[11px] text-gray-500 dark:text-zinc-400">
                        {c.currency}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                No se encontraron países para "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
