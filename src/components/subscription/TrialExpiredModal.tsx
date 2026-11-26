import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Star,
  Check,
  Sparkles,
  Clock,
  ArrowRight,
  X,
  QrCode,
  ScanBarcode,
  Users,
  Package,
} from 'lucide-react';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  planName?: string;
  isTrial?: boolean;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  onClose,
  businessName,
  planName = 'Gratis / Prueba',
  isTrial = true,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToPlans = () => {
    onClose();
    navigate('/app/subscription');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900 dark:border-zinc-700 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera estilo Komerz */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 border-b-2 border-slate-900 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                <Clock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 mb-1">
                  <Sparkles className="w-3 h-3" />
                  {isTrial ? 'Tu prueba de 3 días finalizó' : `Tu ${planName} ha vencido`}
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
                  Activa un Plan para {businessName || 'tu Negocio'}
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Elige uno de nuestros planes para seguir vendiendo sin interrupciones.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar por ahora"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo con los 2 planes */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Profesional */}
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 flex flex-col justify-between shadow-md">
              <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                Más Popular
              </span>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Star className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white leading-none">
                      Profesional
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Ideal para negocios en crecimiento
                    </span>
                  </div>
                </div>

                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-950 dark:text-white">$25</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">USD / mes</span>
                </div>

                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Hasta 5 vendedores con roles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>250 productos en stock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>QR Catálogo público</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ScanBarcode className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Escáner código de barras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Hasta 3 sucursales</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleGoToPlans}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>Activar Profesional</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan Empresarial */}
            <div className="relative rounded-2xl border-2 border-slate-900/70 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-900/60 p-5 flex flex-col justify-between shadow-md">
              <span className="absolute -top-3 right-4 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                Todo Incluido
              </span>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center">
                    <Crown className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white leading-none">
                      Empresarial
                    </h3>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Para equipos y alto volumen
                    </span>
                  </div>
                </div>

                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-950 dark:text-white">$75</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">USD / mes</span>
                </div>

                <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Hasta 20 vendedores con roles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>600 productos en stock</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>QR Catálogo público</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ScanBarcode className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Escáner código de barras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Hasta 10 sucursales + Auditoría</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleGoToPlans}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span>Activar Empresarial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
            🎁 También puedes elegir facturación anual y obtener <strong>2 meses gratis</strong>.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-zinc-900/90 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Recordar más tarde
          </button>

          <button
            onClick={handleGoToPlans}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Ver Suscripción y Planes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
