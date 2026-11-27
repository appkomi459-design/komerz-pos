import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  Cloud,
  ShieldCheck,
  UserCheck,
  Crown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { usePlatform } from '@/hooks/usePlatform';

const KOMERZ_WEB_URL = 'https://komerz-pos.vercel.app';

export const KomerzWebPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const { isTWA } = usePlatform();
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(KOMERZ_WEB_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const steps = [
    {
      num: '1',
      title: 'Abre Komerz Web en tu navegador',
      desc: 'Desde tu celular, tablet o computadora abre Google Chrome, Safari o Edge y entra a komerz-pos.vercel.app.',
      icon: Globe,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      num: '2',
      title: 'Ingresa con tu misma cuenta',
      desc: `Inicia sesión con el mismo correo${user?.email ? ` (${user.email})` : ''} o cuenta con la que te registraste aquí. Tu negocio${activeBusiness?.name ? ` "${activeBusiness.name}"` : ''}, productos y ventas ya están sincronizados.`,
      icon: UserCheck,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      num: '3',
      title: 'Adquiere o administra tu plan',
      desc: 'Dentro de la web entra al apartado Suscripción, elige el plan que mejor se adapte a tu negocio y actívalo al instante. Al volver a la app tu plan se actualizará automáticamente.',
      icon: Crown,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Cabecera Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-8 border-2 border-slate-800 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma Web Sincronizada
            </span>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Komerz Web: accede desde cualquier navegador con tu misma cuenta
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Tu cuenta de Komerz POS funciona tanto en la aplicación móvil como en nuestro sitio web oficial. Todo tu inventario, ventas, sucursales y vendedores están respaldados en la nube en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <Laptop className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Enlace oficial de Komerz Web */}
      <Card className="p-5 sm:p-6 border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Sitio Web Oficial
            </span>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white select-all break-all">
              {KOMERZ_WEB_URL}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
              Guarda este enlace o cópialo para abrirlo desde tu navegador web y gestionar tu suscripción.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Enlace Copiado' : 'Copiar Enlace Web'}</span>
            </button>

            {!isTWA && (
              <a
                href={KOMERZ_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black text-xs flex items-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir en Nueva Pestaña</span>
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Pasos para ingresar y adquirir un plan */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          ¿Cómo ingresar a Komerz Web y activar un plan?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.num}
                className="p-5 flex flex-col justify-between border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      Paso {step.num}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Beneficios de sincronización y acceso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-start gap-3.5 border border-slate-200 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Sincronización automática
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              No necesitas crear una cuenta nueva. Al entrar a la web con tu usuario actual verás tu mismo negocio, caja, inventario y reportes al instante.
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-start gap-3.5 border border-slate-200 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              7 días de prueba gratis incluidos
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Al finalizar tu prueba de 7 días, puedes activar el Plan Profesional ($25/mes) o Empresarial ($75/mes) desde Komerz Web para seguir operando sin límites.
            </p>
          </div>
        </Card>
      </div>

      {!isTWA && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/app/subscription')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Crown className="w-4 h-4" />
            <span>Ver Planes y Suscripción</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
