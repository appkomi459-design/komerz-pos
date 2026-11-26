import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ArrowRight, X, Lock, Sparkles } from 'lucide-react';
import type { PlanLimits } from '@/utils/planLimits';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceLabel: 'productos' | 'vendedores' | 'sucursales';
  currentCount: number;
  maxAllowed: number;
  limits: PlanLimits;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen,
  onClose,
  resourceLabel,
  currentCount,
  maxAllowed,
  limits,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/app/subscription');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900 dark:border-zinc-700 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-950 text-white p-5 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Límite de tu Plan {limits.planName}
                </span>
                <h3 className="text-base font-black text-white leading-tight">
                  Alcanzaste el máximo de {resourceLabel}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-zinc-400 capitalize">
              Uso actual de {resourceLabel}:
            </span>
            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
              {currentCount} / {maxAllowed}
            </span>
          </div>

          {limits.nextPlanName ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
              <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Actualiza al Plan {limits.nextPlanName} ({limits.nextPlanPrice})
              </p>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {limits.nextPlanName === 'Profesional'
                  ? 'Obtén hasta 5 vendedores, 250 productos en stock, 3 sucursales, QR Catálogo y escáner de código de barras.'
                  : 'Obtén hasta 20 vendedores, 600 productos en stock, 10 sucursales, auditoría completa y soporte 24/7.'}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Ya estás en el plan máximo (Empresarial). Contacta con soporte si necesitas ampliar tu capacidad.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-100 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Entendido
          </button>
          {limits.nextPlanName && (
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Subir a {limits.nextPlanName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
