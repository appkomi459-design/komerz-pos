import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Globe,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Send,
  Calendar,
  Crown,
  Star,
  Smartphone,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';
import { usePlatform } from '@/hooks/usePlatform';

const APP_WEB_URL = 'https://komerz-pos.vercel.app';

const WHATSAPP_NUMBER = '59178652447';
const WHATSAPP_DISPLAY = '78652447';

// URLs de checkout de Hotmart (completar cuando estén publicados los productos en Hotmart)
const HOTMART_CHECKOUT_URLS: Record<string, string> = {
  pro_monthly: '',
  pro_yearly: '',
  enterprise_monthly: '',
  enterprise_yearly: '',
};

interface PlanCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planCode: 'pro' | 'enterprise';
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  monthlyPrice: number;
  yearlyPrice: number;
  businessName?: string;
}

export const PlanCheckoutModal: React.FC<PlanCheckoutModalProps> = ({
  isOpen,
  onClose,
  planCode,
  planName,
  billingCycle,
  monthlyPrice,
  yearlyPrice,
  businessName,
}) => {
  const [months, setMonths] = useState<number>(billingCycle === 'yearly' ? 12 : 1);
  const [hotmartNotice, setHotmartNotice] = useState(false);
  const { isTWA } = usePlatform();

  if (!isOpen) return null;

  const isAnnual = months === 12;
  const totalUsd = isAnnual ? yearlyPrice : monthlyPrice * months;
  const checkoutKey = `${planCode}_${isAnnual ? 'yearly' : 'monthly'}`;
  const hotmartUrl = HOTMART_CHECKOUT_URLS[checkoutKey];

  const buildWhatsAppUrl = (type: 'receipt' | 'other_methods') => {
    const bizText = businessName ? ` para el negocio *${businessName}*` : '';
    const durationText = isAnnual
      ? '12 meses (Plan Anual con 2 meses gratis)'
      : `${months} ${months === 1 ? 'mes' : 'meses'}`;

    const message =
      type === 'receipt'
        ? `¡Hola! Acabo de realizar el pago por Hotmart del *Plan ${planName}*${bizText} por *${durationText}* ($${totalUsd} USD). Adjunto mi comprobante para activar mi cuenta.`
        : `¡Hola! Quiero adquirir el *Plan ${planName}*${bizText} por *${durationText}* ($${totalUsd} USD). ¿Me podrían indicar los métodos de pago disponibles aparte de Hotmart?`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const handleOpenHotmart = () => {
    if (hotmartUrl) {
      window.open(hotmartUrl, '_blank', 'noopener,noreferrer');
      setHotmartNotice(true);
    } else {
      setHotmartNotice(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900 dark:border-zinc-700 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-slate-950 text-white p-5 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
                  planCode === 'enterprise'
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950'
                }`}
              >
                {planCode === 'enterprise' ? (
                  <Crown className="w-6 h-6" />
                ) : (
                  <Star className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Adquirir Suscripción
                </span>
                <h2 className="text-lg font-black text-white leading-tight">
                  Plan {planName} — ${totalUsd} USD
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Elige tu duración y método de pago preferido
                </p>
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {isTWA ? (
            /* ── Vista Android / TWA: sin links externos por política de Play Store ── */
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Gestiona tu suscripción desde la web
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Para adquirir o renovar tu <strong>Plan {planName}</strong>, visita nuestra plataforma web desde tu navegador:
                </p>
                <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  <p className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 select-all">
                    {APP_WEB_URL}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">
                  Una vez en la web puedes pagar con Hotmart (tarjeta internacional) o escribirnos por WhatsApp para otros métodos de pago.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(APP_WEB_URL).catch(() => {});
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>Copiar enlace de la web</span>
              </button>
            </div>
          ) : (
            <>
              {/* Selector de meses */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    ¿Cuántos meses deseas adquirir?
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    Total: ${totalUsd} USD
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { m: 1, label: '1 Mes' },
                    { m: 3, label: '3 Meses' },
                    { m: 6, label: '6 Meses' },
                    { m: 12, label: '1 Año (2 gratis)' },
                  ].map((opt) => (
                    <button
                      key={opt.m}
                      type="button"
                      onClick={() => setMonths(opt.m)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                        months === opt.m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-emerald-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opción 1: Hotmart - Pasarela Internacional */}
              <div className="rounded-2xl border-2 border-orange-500/70 bg-orange-50/40 dark:bg-orange-950/15 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-950 dark:text-white">
                          Pagar con Hotmart
                        </h3>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white">
                          Pasarela Internacional
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                        Tarjeta de crédito/débito internacional y pagos locales seguros
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/50 text-xs text-slate-700 dark:text-zinc-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-orange-700 dark:text-orange-400">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    Importante después de pagar en Hotmart:
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Una vez completes el pago en Hotmart, <strong>envía tu comprobante al WhatsApp ({WHATSAPP_DISPLAY})</strong> para activar tu Plan {planName} al instante.
                  </p>
                </div>

                {hotmartNotice && !hotmartUrl && (
                  <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-300">
                    Solicita tu enlace de pago Hotmart o realiza tu pago directo escribiendo a nuestro WhatsApp ({WHATSAPP_DISPLAY}).
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleOpenHotmart}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Ir a Pagar por Hotmart</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={buildWhatsAppUrl('receipt')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enviar Comprobante</span>
                  </a>
                </div>
              </div>

              {/* Opción 2: Pagar por WhatsApp (Otros métodos) */}
              <div className="rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/15 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <WhatsAppIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">
                      Pagar por WhatsApp (Otros Métodos)
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                      Transferencia bancaria, QR, depósito u otras opciones locales
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                  Si prefieres otro método de pago aparte de Hotmart, escríbenos por WhatsApp al{' '}
                  <strong>{WHATSAPP_DISPLAY}</strong> indicando que quieres el{' '}
                  <strong>Plan {planName}</strong> por{' '}
                  <strong>{isAnnual ? '12 meses' : `${months} ${months === 1 ? 'mes' : 'meses'}`}</strong>{' '}
                  y te enviaremos los datos para pagar y activar tu cuenta.
                </p>

                <a
                  href={buildWhatsAppUrl('other_methods')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Escribir al WhatsApp ({WHATSAPP_DISPLAY})</span>
                </a>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Activación rápida y soporte directo en tu cuenta</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
