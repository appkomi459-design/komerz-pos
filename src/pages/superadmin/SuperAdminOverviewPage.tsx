import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  UserCheck,
  DollarSign,
  Crown,
  Zap,
  Star,
  ArrowUpRight,
  Calendar,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatFullDate } from '@/utils/formatters';
import {
  UsersIllustration,
  RocketTrialIllustration,
  CrownVipIllustration,
  MoneyCoinsIllustration,
} from '@/components/common/CardIllustrations';
import { RevenueLineChart } from '@/components/superadmin/RevenueLineChart';

interface OverviewMetrics {
  totalAccounts: number;
  trialUsers: number;
  payingClients: number;
  mrr: number;
  planDistribution: { name: string; code: string; count: number; color: string; price: number }[];
  recentAccounts: { name: string; email: string; plan: string; joinedAt: string; isPaying: boolean }[];
}

const PLAN_COLORS: Record<string, string> = {
  free: 'text-zinc-400',
  pro: 'text-emerald-500',
  enterprise: 'text-amber-500',
};
const PLAN_BG: Record<string, string> = {
  free: 'bg-zinc-100 dark:bg-zinc-800',
  pro: 'bg-emerald-50 dark:bg-emerald-950/50',
  enterprise: 'bg-amber-50 dark:bg-amber-950/50',
};
const PLAN_ICONS: Record<string, React.FC<any>> = {
  free: Zap,
  pro: Star,
  enterprise: Crown,
};

export const SuperAdminOverviewPage: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Perfiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, is_super_admin, created_at')
          .order('created_at', { ascending: false });

        // Membresías + negocios + suscripciones + planes
        const { data: members } = await supabase
          .from('business_members')
          .select(`
            user_id,
            business:businesses (
              id,
              name,
              created_at,
              subscription:subscriptions (
                plan:plans ( id, name, code, price_monthly )
              )
            )
          `);

        // Planes disponibles
        const { data: allPlans } = await supabase
          .from('plans')
          .select('*')
          .order('price_monthly');

        const resolvedProfiles = (profiles || []).filter((p: any) => !p.is_super_admin);

        // Mapear usuario → plan
        const userPlanMap: Record<string, { planCode: string; planName: string; planPrice: number; bizName: string; joinedAt: string }> = {};
        (members || []).forEach((m: any) => {
          const rawBiz = Array.isArray(m.business) ? m.business[0] : m.business;
          const rawSub = Array.isArray(rawBiz?.subscription) ? rawBiz.subscription[0] : rawBiz?.subscription;
          const rawPlan = Array.isArray(rawSub?.plan) ? rawSub.plan[0] : rawSub?.plan;
          if (!userPlanMap[m.user_id]) {
            userPlanMap[m.user_id] = {
              planCode: rawPlan?.code || 'free',
              planName: rawPlan?.name || 'Gratis',
              planPrice: Number(rawPlan?.price_monthly || 0),
              bizName: rawBiz?.name || 'Sin negocio',
              joinedAt: rawBiz?.created_at || '',
            };
          }
        });

        // Métricas
        let mrr = 0;
        let paying = 0;
        const recentAccounts: OverviewMetrics['recentAccounts'] = [];

        resolvedProfiles.forEach((p: any) => {
          const info = userPlanMap[p.id];
          const isPaying = info && info.planPrice > 0 && info.planCode !== 'free';
          if (isPaying) {
            mrr += info.planPrice;
            paying++;
          }
          recentAccounts.push({
            name: p.full_name || 'Sin nombre',
            email: p.email || '',
            plan: info?.planName || 'Gratis',
            joinedAt: p.created_at,
            isPaying: Boolean(isPaying),
          });
        });

        // Distribución por plan
        const planDistribution = (allPlans || []).map((pl: any) => {
          const count = resolvedProfiles.filter((p: any) => {
            const info = userPlanMap[p.id];
            return (info?.planCode || 'free') === pl.code;
          }).length;
          return {
            name: pl.name,
            code: pl.code,
            count,
            color: pl.code,
            price: Number(pl.price_monthly),
          };
        });

        setMetrics({
          totalAccounts: resolvedProfiles.length,
          trialUsers: resolvedProfiles.length - paying,
          payingClients: paying,
          mrr,
          planDistribution,
          recentAccounts: recentAccounts.slice(0, 8),
        });
      } catch (err) {
        console.error('Error loading overview:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = metrics!;
  const clientPct = m.totalAccounts > 0 ? Math.round((m.payingClients / m.totalAccounts) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb superior y Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px]">
              Administración
            </span>
            <span>›</span>
            <span className="text-gray-900 dark:text-zinc-100 font-extrabold">Dashboard General</span>
          </div>
        </div>
        <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          <span>{formatFullDate()}</span>
        </div>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
          Dashboard General
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Visión global de la plataforma — ingresos, clientes activos y planes
        </p>
      </div>

      {/* 4 TARJETAS KPI VIBRANTES CON ILUSTRACIONES 3D ANIMADAS (COMPACTAS Y BIEN CENTRADAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Cuentas (Azul Cobalto + Ilustración Red de Usuarios) */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#203a43] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D centrada verticalmente a la derecha */}
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <UsersIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Total Cuentas
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              {m.totalAccounts}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              Registradas
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Personas activas
            </p>
          </div>
        </div>

        {/* 2. Usuarios en Prueba (Ámbar Dorado + Cohete Despegando) */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#f2994a] via-[#f39c12] to-[#d35400] text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D Cohete espacial */}
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <RocketTrialIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              En Prueba
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              {m.trialUsers}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              Plan Gratuito
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Probando la app
            </p>
          </div>
        </div>

        {/* 3. Clientes con Plan Pago (Verde Esmeralda + Corona VIP y Diamante) */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#00b09b] via-[#0575e6] to-[#021b79] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D Corona y Diamante */}
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <CrownVipIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Clientes VIP ({clientPct}%)
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              {m.payingClients}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              Con Plan Activo
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Pro o Empresarial
            </p>
          </div>
        </div>

        {/* 4. Ingreso Mensual Recurrente (Rojo Carmesí + Monedas de Oro 3D) */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#eb3349] via-[#f45c43] to-[#870000] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 group">
          {/* Ilustración 3D Monedas de Oro y Billetes */}
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <MoneyCoinsIllustration />
          </div>

          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Ingresos ~ MRR
            </span>
            <p className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md truncate">
              {formatCurrency(m.mrr, 'USD')}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">
              Recurrente Mensual
            </p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">
              Flujo proyectado
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE LÍNEA: Ganancias y Suscripciones (Dólares y Bolivianos) */}
      <RevenueLineChart />

      {/* Distribución por plan + Cuentas recientes con Vidrio y Cabeceras Tintadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por plan */}
        <div className="bg-white/90 dark:bg-[#181615]/90 backdrop-blur-md rounded-3xl border border-amber-200/60 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent px-6 py-4.5 border-b border-amber-200/60 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f2994a] to-[#f2c94c] text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-zinc-100 tracking-tight">
                  Distribución por Plan
                </h3>
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">Porcentaje de cuentas por nivel</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {m.planDistribution.map((plan) => {
                const PlanIcon = PLAN_ICONS[plan.code] || Zap;
                const pct = m.totalAccounts > 0 ? Math.round((plan.count / m.totalAccounts) * 100) : 0;
                return (
                  <div key={plan.code} className="bg-slate-50/80 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${PLAN_BG[plan.code]} shadow-xs`}>
                          <PlanIcon className={`w-4 h-4 ${PLAN_COLORS[plan.code]}`} />
                        </div>
                        <span className="text-sm font-black text-slate-950 dark:text-zinc-100">
                          {plan.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-black text-slate-950 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-700 shadow-xs">
                          {plan.count} cuentas
                        </span>
                        <span className="font-black text-amber-600 dark:text-amber-400">{pct}%</span>
                      </div>
                    </div>
                    {/* Barra de progreso con gradiente vivo */}
                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          plan.code === 'free'
                            ? 'bg-slate-400'
                            : plan.code === 'pro'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 mt-1.5">
                      {plan.price > 0
                        ? `${formatCurrency(plan.price, 'USD')}/mes × ${plan.count} = ${formatCurrency(plan.price * plan.count, 'USD')}`
                        : 'Plan de acceso gratuito'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total MRR resumen */}
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200/60 dark:border-rose-900/40 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-300">
              Ingreso mensual proyectado
            </span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(m.mrr, 'USD')} / mes
            </span>
          </div>
        </div>

        {/* Cuentas Recientes */}
        <div className="bg-white/90 dark:bg-[#181615]/90 backdrop-blur-md rounded-3xl border border-blue-200/60 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent px-6 py-4.5 border-b border-blue-200/60 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-zinc-100 tracking-tight">
                  Cuentas Recientes
                </h3>
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">Últimos usuarios registrados en el sistema</p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {m.recentAccounts.length === 0 ? (
                <p className="text-xs font-bold text-slate-500 text-center py-6">Sin cuentas registradas</p>
              ) : (
                m.recentAccounts.map((acc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-slate-950 dark:text-zinc-100 truncate">
                          {acc.name}
                        </p>
                        <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 truncate">{acc.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs ${
                        acc.isPaying
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-zinc-100'
                      }`}>
                        {acc.plan}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">{formatDate(acc.joinedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {m.recentAccounts.length > 0 && (
            <div className="p-6 pt-0">
              <Link
                to="/superadmin/users"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#2980b9] to-[#2c3e50] text-white hover:opacity-95 text-xs font-black transition-all shadow-md shadow-blue-500/20"
              >
                <span>Ver todas las cuentas en Usuarios y Clientes</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
