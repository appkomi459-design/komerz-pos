import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
  countryCode: string;
}

export const CURRENCY_OPTIONS: CurrencyItem[] = [
  { code: 'BOB', symbol: 'Bs', name: 'Boliviano', countryCode: 'bo' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', countryCode: 'us' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', countryCode: 'br' },
  { code: 'PYG', symbol: '₲', name: 'Guaraní Paraguayo', countryCode: 'py' },
  { code: 'UYU', symbol: '$U', name: 'Peso Uruguayo', countryCode: 'uy' },
  { code: 'PEN', symbol: 'S/.', name: 'Sol Peruano', countryCode: 'pe' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano', countryCode: 'co' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano', countryCode: 'mx' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno', countryCode: 'cl' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino', countryCode: 'ar' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', countryCode: 'do' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', countryCode: 'gt' },
  { code: 'CRC', symbol: '₡', name: 'Colón Costarricense', countryCode: 'cr' },
  { code: 'HNL', symbol: 'L', name: 'Lempira Hondureño', countryCode: 'hn' },
  { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense', countryCode: 'ni' },
  { code: 'EUR', symbol: '€', name: 'Euro', countryCode: 'eu' },
];

interface CurrencySelectProps {
  label?: string;
  value: string;
  onChange: (currencyCode: string) => void;
  error?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  label,
  value,
  onChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCurrency =
    CURRENCY_OPTIONS.find((c) => c.code === value) || CURRENCY_OPTIONS[0];

  const filteredCurrencies = CURRENCY_OPTIONS.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
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
            src={`https://flagcdn.com/w40/${selectedCurrency.countryCode}.png`}
            alt={selectedCurrency.code}
            className="w-5 h-3.5 object-cover rounded shadow-sm border border-black/10 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-bold text-gray-900 dark:text-zinc-100">
            {selectedCurrency.code} ({selectedCurrency.symbol})
          </span>
          <span className="text-gray-400 dark:text-zinc-500 text-xs truncate">
            — {selectedCurrency.name}
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
                placeholder="Buscar moneda (Bs, $, USD, BOB, etc.)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((c) => {
                const isSelected = c.code === selectedCurrency.code;
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
                        src={`https://flagcdn.com/w40/${c.countryCode}.png`}
                        alt={c.code}
                        className="w-5 h-3.5 object-cover rounded shadow-sm border border-black/10 flex-shrink-0"
                      />
                      <span className="font-bold text-gray-900 dark:text-zinc-100">
                        {c.code} ({c.symbol})
                      </span>
                      <span className="text-gray-500 dark:text-zinc-400 truncate">
                        — {c.name}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">
                No se encontraron monedas para "{search}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
