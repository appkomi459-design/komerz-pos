import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, AlertCircle, ShieldCheck, Gift, Zap, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import type { Plan } from '@/types';

export const SubscriptionPage: React.FC = () => {
  const { activeBusiness, subscription, refreshBusinesses } = useBusiness();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true });

        // Precios oficiales actualizados:
        // Profesional: $25 USD/mes o $250 USD/año (2 meses gratis)
        // Empresarial: $75 USD/mes o $750 USD/año (2 meses gratis)
        const normalized = (data || []).map((p: any) => {
          if (p.code === 'pro') {
            return { ...p, price_monthly: 25, price_yearly: 250 };
          }
          if (p.code === 'enterprise') {
            return { ...p, price_monthly: 75, price_yearly: 750 };
          }
          return p;
        });

        setPlans(normalized as Plan[]);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleChangePlan = async (plan: Plan) => {
    if (!activeBusiness) return;
    const isYearly = billingCycle === 'yearly';
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const cycleLabel = isYearly ? 'Anual (2 meses gratis)' : 'Mensual';

    const confirmed = window.confirm(
      `¿Deseas activar el plan ${plan.name} en modalidad ${cycleLabel} por ${formatCurrency(price, 'USD')}?`
    );
    if (!confirmed) return;

    try {
      setUpdating(plan.id);

      const newPeriodEnd = new Date();
      if (isYearly) {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1); // 12 meses completos
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1); // 1 mes
      }

      if (subscription) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
      } else {
        await supabase.from('subscriptions').insert({
          business_id: activeBusiness.id,
          plan_id: plan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: newPeriodEnd.toISOString(),
        });
      }
      await refreshBusinesses();
      alert(`¡Plan ${plan.name} (${cycleLabel}) activado con éxito!`);
    } catch (err: any) {
      alert(`Error al actualizar suscripción: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const currentPlanCode = subscription?.plan?.code || 'free';

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
          Suscripción y Planes
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Administra la membresía de tu negocio y obtén acceso a sucursales, usuarios y ventas ilimitadas
        </p>
      </div>

      {/* Tarjeta de Estado del Plan Actual */}
      <Card className="p-6 bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent border-emerald-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Plan Actual
              </span>
              <Badge variant="emerald" size="sm">
                {subscription?.status === 'trialing' ? 'Periodo de Prueba' : 'Activo'}
              </Badge>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100">
              {subscription?.plan?.name || 'Gratis / Prueba'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Vigente hasta el{' '}
              <strong className="text-gray-700 dark:text-zinc-300">
                {formatDateShort(subscription?.current_period_end)}
              </strong>
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-gray-200 dark:sm:border-zinc-800 sm:pl-6">
            <span className="text-xs text-gray-400">Precio del ciclo</span>
            <p className="text-xl font-extrabold text-gray-900 dark:text-zinc-100">
              {subscription?.plan?.code === 'pro'
                ? '$25.00 USD / mes'
                : subscription?.plan?.code === 'enterprise'
                ? '$75.00 USD / mes'
                : `${formatCurrency(subscription?.plan?.price_monthly ?? 0, 'USD')} / mes`}
            </p>
          </div>
        </div>
      </Card>

      {/* Switcher de Facturación: Mensual vs Anual (2 meses gratis) */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Facturación Mensual
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/50'
                : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <span>Facturación Anual</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
              <Gift className="w-3 h-3" />
              2 Meses Gratis
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-medium">
          {billingCycle === 'yearly'
            ? '🎁 ¡Con el plan anual pagas solo 10 meses y disfrutas de 12 meses de servicio completo!'
            : '💡 Puedes cambiarte a facturación anual en cualquier momento para ahorrar 2 meses gratis.'}
        </p>
      </div>

      {/* Grilla de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = p.code === currentPlanCode;
          const isYearly = billingCycle === 'yearly';
          const price = isYearly ? p.price_yearly : p.price_monthly;
          const isPro = p.code === 'pro';
          const isEnterprise = p.code === 'enterprise';

          // Filtrar características para evitar duplicados visuales
          const baseFeatures = [
            `Hasta ${p.max_branches} ${p.max_branches === 1 ? 'sucursal' : 'sucursales'}`,
            `Hasta ${p.max_users} usuarios`,
            `Hasta ${p.max_products.toLocaleString()} productos`,
          ];
          const rawFeatures = Array.isArray(p.features) ? p.features : [];
          const additionalFeatures = rawFeatures.filter((f: string) => {
            const lower = f.toLowerCase();
            return !lower.includes('sucursal') && !lower.includes('usuario') && !lower.includes('producto');
          });
          const allFeatures = [...baseFeatures, ...additionalFeatures];

          return (
            <Card
              key={p.id}
              className={`p-6 flex flex-col justify-between relative transition-all duration-300 ${
                isCurrent
                  ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10'
                  : isPro
                  ? 'border-2 border-slate-300 dark:border-zinc-700 shadow-md hover:border-emerald-500/60'
                  : 'border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    Tu Plan Actual
                  </span>
                </div>
              )}

              {!isCurrent && isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Más Recomendado
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    {isEnterprise && <Crown className="w-5 h-5 text-amber-500" />}
                    {isPro && <Zap className="w-5 h-5 text-emerald-500" />}
                    {p.name}
                  </h3>
                </div>

                <p className="text-xs text-gray-500 dark:text-zinc-400 min-h-[34px] leading-relaxed">
                  {p.description}
                </p>

                {/* Precio */}
                <div className="my-5 pb-5 border-b border-gray-100 dark:border-zinc-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-gray-900 dark:text-zinc-100 font-mono tracking-tight">
                      {formatCurrency(price, 'USD')}
                    </span>
                    <span className="text-xs font-black text-gray-500 uppercase">
                      / {isYearly ? 'año' : 'mes'}
                    </span>
                  </div>

                  {/* Resumen de ahorro anual con 2 meses gratis */}
                  {isYearly && isPro && (
                    <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                      🎁 Pagas $250 en vez de $300 (Ahorras $50 USD — ¡2 meses gratis!)
                    </div>
                  )}

                  {isYearly && isEnterprise && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-black text-amber-800 dark:text-amber-300">
                      🎁 Pagas $750 en vez de $900 (Ahorras $150 USD — ¡2 meses gratis!)
                    </div>
                  )}

                  {!isYearly && (isPro || isEnterprise) && (
                    <p className="text-[11px] text-slate-400 mt-1 font-bold">
                      Facturado mensualmente ($ {isPro ? '25' : '75'} USD / mes)
                    </p>
                  )}
                </div>

                {/* Lista de Características */}
                <ul className="space-y-2.5 mb-6">
                  {allFeatures.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-zinc-300 font-medium">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Selección */}
              <Button
                variant={isCurrent ? 'outline' : isPro ? 'primary' : 'primary'}
                disabled={isCurrent || updating === p.id}
                loading={updating === p.id}
                onClick={() => handleChangePlan(p)}
                size="md"
                className={`w-full font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    : isEnterprise
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                }`}
              >
                {isCurrent ? 'Plan Seleccionado' : `Elegir ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Garantía y Seguridad */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Sin contratos forzosos. Puedes cambiar o cancelar tu suscripción en cualquier momento.</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>Soporte y actualizaciones continuas incluidas.</span>
        </div>
      </div>
    </div>
  );
};
