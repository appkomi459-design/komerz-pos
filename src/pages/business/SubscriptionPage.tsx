import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
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

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true });
        if (data) setPlans(data as Plan[]);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleChangePlan = async (planId: string) => {
    if (!activeBusiness) return;
    try {
      setUpdating(planId);
      if (subscription) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
      } else {
        await supabase.from('subscriptions').insert({
          business_id: activeBusiness.id,
          plan_id: planId,
          status: 'active',
        });
      }
      await refreshBusinesses();
      alert('Plan actualizado con éxito.');
    } catch (err: any) {
      alert(`Error al actualizar suscripción: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const currentPlanCode = subscription?.plan?.code || 'free';

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
          Suscripción y Planes
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Administra la membresía SaaS de tu empresa y amplía los límites de tu negocio
        </p>
      </div>

      {/* Current plan status card */}
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
              {formatCurrency(subscription?.plan?.price_monthly ?? 0, 'USD')} / mes
            </p>
          </div>
        </div>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = p.code === currentPlanCode;
          const featuresList: string[] = Array.isArray(p.features) ? p.features : [];

          return (
            <Card
              key={p.id}
              className={`p-6 flex flex-col justify-between relative ${
                isCurrent
                  ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : ''
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                    Tu Plan Actual
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{p.name}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 min-h-[32px]">
                  {p.description}
                </p>

                <div className="my-5 pb-5 border-b border-gray-100 dark:border-zinc-800 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100">
                    {formatCurrency(p.price_monthly, 'USD')}
                  </span>
                  <span className="text-xs text-gray-500">/ mes</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Hasta {p.max_branches} sucursales</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Hasta {p.max_users} usuarios</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Hasta {p.max_products.toLocaleString()} productos</span>
                  </li>
                  {featuresList.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={isCurrent ? 'outline' : 'primary'}
                disabled={isCurrent || updating === p.id}
                loading={updating === p.id}
                onClick={() => handleChangePlan(p.id)}
                size="sm"
                className="w-full"
              >
                {isCurrent ? 'Plan Seleccionado' : 'Cambiar a este Plan'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
