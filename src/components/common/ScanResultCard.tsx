import React from 'react';
import { createPortal } from 'react-dom';
import { Barcode, CheckCircle2, AlertTriangle, Sparkles, X, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export interface ScanResultData {
  code: string;
  name?: string;
  imageUrl?: string | null;
  price?: number;
  stock?: number;
  currency?: string;
  status: 'found' | 'new' | 'not_found' | 'online_match';
  message: string;
}

interface ScanResultCardProps {
  result: ScanResultData | null;
  onClose: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ result, onClose }) => {
  if (!result) return null;

  const isSuccess = result.status === 'found' || result.status === 'online_match';
  const borderColor =
    result.status === 'found'
      ? 'border-emerald-500 shadow-emerald-500/20'
      : result.status === 'online_match'
      ? 'border-blue-500 shadow-blue-500/20'
      : result.status === 'new'
      ? 'border-amber-500 shadow-amber-500/20'
      : 'border-rose-500 shadow-rose-500/20';

  const badgeBg =
    result.status === 'found'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : result.status === 'online_match'
      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
      : result.status === 'new'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300';

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] w-[92vw] max-w-md pointer-events-auto">
      <div
        className={`bg-white dark:bg-zinc-900 border-2 ${borderColor} rounded-2xl shadow-2xl p-3 flex items-center gap-3.5 transition-all`}
      >
        {/* Imagen del producto o icono */}
        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {result.imageUrl ? (
            <img
              src={result.imageUrl}
              alt={result.name || 'Producto'}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
          )}
        </div>

        {/* Info del producto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${badgeBg}`}
            >
              {result.status === 'found' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : result.status === 'online_match' ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              <span>{result.message}</span>
            </span>
          </div>

          <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate">
            {result.name || (isSuccess ? 'Producto' : 'Producto no registrado')}
          </h4>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
              <Barcode className="w-3 h-3" />
              {result.code}
            </span>

            {typeof result.price === 'number' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                {formatCurrency(result.price, result.currency || 'BOB')}
              </span>
            )}

            {typeof result.stock === 'number' && (
              <span>Stock: {result.stock}</span>
            )}
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 cursor-pointer flex-shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
};
