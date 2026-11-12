import React, { useState, useEffect } from 'react';
import {
  Zap,
  Star,
  Crown,
  Check,
  Users,
  Building,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import {
  BuildingStoreIllustration,
  MoneyCoinsIllustration,
  LayersPlanesIllustration,
} from '@/components/common/CardIllustrations';
import type { Plan } from '@/types';

interface PlanWithStats extends Plan {
  businessCount: number;
  monthlyRevenue: number;
}

const PLAN_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string; badge: string }> = {
  free: {
    icon: Zap,
    color: 'text-zinc-500',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
  },
  pro: {
    icon: Star,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  },
  enterprise: {
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  },
};

export const SuperAdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMRR, setTotalMRR] = useState(0);

  useEffect(() => {
    const fetchPlansWithStats = async () => {
      try {
        setLoading(true);

        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .order('price_monthly');

        const { data: subs } = await supabase
          .from('subscriptions')
          .select('plan_id, status');

        const planStats: PlanWithStats[] = (plansData || []).map((p: any) => {
          const activeSubs = (subs || []).filter(
            (s: any) => s.plan_id === p.id && s.status === 'active'
          ).length;
          return {
            ...p,
            businessCount: activeSubs,
            monthlyRevenue: activeSubs * Number(p.price_monthly),
          };
        });

        const mrr = planStats.reduce((acc, p) => acc + p.monthlyRevenue, 0);
        setTotalMRR(mrr);
        setPlans(planStats);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlansWithStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalBusinesses = plans.reduce((a, p) => a + p.businessCount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
          Planes de Suscripción
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Configuración de tiers, límites y negocios activos en cada plan
        </p>
      </div>

      {/* Resumen global con Colores Vivos e Ilustraciones 3D Animadas (Compactos y Centrados) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Negocios activos */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#203a43] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D Tienda / Negocio centrada */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <BuildingStoreIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <Building className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Empresas
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              {totalBusinesses}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              Negocios con Plan
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Suscripciones activas
            </p>
          </div>
        </div>

        {/* MRR Total */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#00b09b] via-[#0575e6] to-[#021b79] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D Monedas de Oro y Billetes centrada */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <MoneyCoinsIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Recurrente
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              {formatCurrency(totalMRR, 'USD')}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              MRR Total
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Ingreso mensual proyectado
            </p>
          </div>
        </div>

        {/* Planes Disponibles */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#f2994a] via-[#f39c12] to-[#d35400] text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D Capas de Tiers centrada */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <LayersPlanesIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Opciones
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              {plans.length}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              Planes Disponibles
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Tiers configurados
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de planes con Vidrio, Cabeceras Tintadas y Contraste Alto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const cfg = PLAN_CONFIG[p.code] || PLAN_CONFIG['free'];
          const PlanIcon = cfg.icon;
          const features: string[] = Array.isArray(p.features) ? p.features : [];
          const isFree = Number(p.price_monthly) === 0;
          const isPro = p.code === 'pro';
          const isEnterprise = p.code === 'enterprise';

          return (
            <div
              key={p.id}
              className={`flex flex-col justify-between rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                isPro
                  ? 'border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 bg-white/95 dark:bg-[#181615]/95'
                  : isEnterprise
                  ? 'border-2 border-amber-500 shadow-2xl shadow-amber-500/20 bg-white/95 dark:bg-[#181615]/95'
                  : 'border border-slate-300 dark:border-zinc-800 shadow-xl bg-white/95 dark:bg-[#181615]/95'
              }`}
            >
              <div>
                {/* Header de la tarjeta */}
                <div
                  className={`px-6 py-5 flex items-center justify-between border-b ${
                    isPro
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600'
                      : isEnterprise
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500'
                      : 'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-zinc-800 dark:to-zinc-900 border-slate-300 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold shadow-inner">
                      <PlanIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-base font-black tracking-tight ${isFree ? 'text-slate-950 dark:text-zinc-100' : 'text-white'}`}>
                        {p.name}
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isFree ? 'bg-slate-300 text-slate-800' : 'bg-black/20 text-white'
                      }`}>
                        {p.code.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {isPro && (
                    <span className="bg-amber-300 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                      MÁS POPULAR
                    </span>
                  )}
                  {isEnterprise && (
                    <span className="bg-white text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                      TODO INCLUIDO
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {/* Precio Destacado */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                        {isFree ? 'Gratis' : `$${Number(p.price_monthly).toFixed(0)}`}
                      </span>
                      {!isFree && (
                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">/ mes</span>
                      )}
                    </div>
                    {!isFree && (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(Number(p.price_monthly) * 12, 'USD')} facturado al año
                      </p>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mb-5 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Límites */}
                  <div className="space-y-2.5 text-xs border-t border-slate-200 dark:border-zinc-800 pt-4 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">Sucursales Permitidas</span>
                      <strong className="font-black text-slate-950 dark:text-white text-sm">{p.max_branches}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">Usuarios por Empresa</span>
                      <strong className="font-black text-slate-950 dark:text-white text-sm">{p.max_users}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">Límite de Productos</span>
                      <strong className="font-black text-slate-950 dark:text-white text-sm">{p.max_products.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="space-y-2 text-xs border-t border-slate-200 dark:border-zinc-800 pt-4">
                      {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-bold">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isPro ? 'bg-emerald-600 text-white' : isEnterprise ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats de adopción en el pie */}
              <div className="p-6 pt-0">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-zinc-100">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>{p.businessCount} negocios</span>
                  </div>
                  {!isFree && p.businessCount > 0 ? (
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
                      {formatCurrency(p.monthlyRevenue, 'USD')}/mes
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">
                      {isFree ? 'Prueba' : '$0.00'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
        💡 Para modificar los precios o límites de los planes, edítalos directamente en la base de datos de Supabase.
      </p>
    </div>
  );
};
