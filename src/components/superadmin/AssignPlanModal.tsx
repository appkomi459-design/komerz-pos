import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Star,
  Crown,
  Zap,
  Check,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  DollarSign,
  Building2,
  User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';

export interface AssignPlanTenant {
  profileId: string;
  fullName: string;
  email: string;
  businessId: string | null;
  businessName: string;
  planCode: string;
  planName: string;
  planPrice: number;
  isPayingCustomer: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  subscriptionStatus?: string;
}

interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: AssignPlanTenant | null;
  onSuccess: () => void;
}

interface AvailablePlan {
  id: string;
  name: string;
  code: string;
  price_monthly: number;
  description: string;
  features: string[];
  max_branches: number;
  max_users: number;
}

export const AssignPlanModal: React.FC<AssignPlanModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<'pro' | 'enterprise' | 'free'>('pro');
  const [months, setMonths] = useState<number>(1);
  const [extendFromCurrent, setExtendFromCurrent] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar lista de planes de la base de datos
  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price_monthly', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (err: any) {
        console.error('Error al cargar planes:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [isOpen]);

  // Inicializar estado según el tenant actual
  useEffect(() => {
    if (!tenant || !isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (tenant.planCode === 'enterprise') {
      setSelectedPlanCode('enterprise');
    } else if (tenant.planCode === 'pro') {
      setSelectedPlanCode('pro');
    } else {
      setSelectedPlanCode('pro'); // Por defecto sugerir Plan Pro para convertir usuario en cliente
    }

    setMonths(1);
    setExtendFromCurrent(true);
  }, [tenant, isOpen]);

  // Determinar plan seleccionado
  const activePlanObj = useMemo(() => {
    return plans.find((p) => p.code === selectedPlanCode);
  }, [plans, selectedPlanCode]);

  // Verificar si la fecha de vencimiento actual es futura
  const isCurrentEndFuture = useMemo(() => {
    if (!tenant?.currentPeriodEnd) return false;
    return new Date(tenant.currentPeriodEnd).getTime() > Date.now();
  }, [tenant]);

  // Calcular fechas de inicio y vencimiento según la selección
  const { startDate, endDate, totalDays, totalCost } = useMemo(() => {
    const now = new Date();

    if (selectedPlanCode === 'free') {
      // Plan gratuito: 14 días de prueba
      const end = new Date(now);
      end.setDate(end.getDate() + 14);
      return {
        startDate: now,
        endDate: end,
        totalDays: 14,
        totalCost: 0,
      };
    }

    let start = now;
    if (extendFromCurrent && isCurrentEndFuture && tenant?.currentPeriodEnd) {
      start = new Date(tenant.currentPeriodEnd);
    }

    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    const diffMs = end.getTime() - now.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const pricePerMonth = activePlanObj ? Number(activePlanObj.price_monthly) : 29;
    const cost = pricePerMonth * months;

    return {
      startDate: extendFromCurrent && isCurrentEndFuture ? now : start,
      endDate: end,
      totalDays: days,
      totalCost: cost,
    };
  }, [selectedPlanCode, months, extendFromCurrent, isCurrentEndFuture, tenant, activePlanObj]);

  if (!isOpen || !tenant) return null;

  const handleSave = async () => {
    if (!tenant.businessId) {
      setErrorMsg('Este usuario aún no tiene un negocio configurado.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // 1. Obtener ID del plan seleccionado
      const targetPlan = plans.find((p) => p.code === selectedPlanCode);
      if (!targetPlan) {
        throw new Error('No se encontró la configuración del plan seleccionado.');
      }

      const newStatus = selectedPlanCode === 'free' ? 'trialing' : 'active';
      const periodStartISO = (extendFromCurrent && isCurrentEndFuture && tenant.currentPeriodStart)
        ? tenant.currentPeriodStart
        : new Date().toISOString();
      const periodEndISO = endDate.toISOString();

      // 2. Verificar si ya existe suscripción para este negocio
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('business_id', tenant.businessId)
        .maybeSingle();

      if (existingSub) {
        // Actualizar suscripción existente
        const { error: updateErr } = await supabase
          .from('subscriptions')
          .update({
            plan_id: targetPlan.id,
            status: newStatus,
            current_period_start: periodStartISO,
            current_period_end: periodEndISO,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', tenant.businessId);

        if (updateErr) throw updateErr;
      } else {
        // Insertar nueva suscripción
        const { error: insertErr } = await supabase
          .from('subscriptions')
          .insert({
            business_id: tenant.businessId,
            plan_id: targetPlan.id,
            status: newStatus,
            current_period_start: periodStartISO,
            current_period_end: periodEndISO,
          });

        if (insertErr) throw insertErr;
      }

      // 3. Registrar en bitácora de auditoría
      try {
        await supabase.from('audit_logs').insert({
          business_id: tenant.businessId,
          action: 'SUPERADMIN_ASSIGN_PLAN',
          entity: 'subscriptions',
          details: {
            assigned_by: 'superadmin',
            plan_code: selectedPlanCode,
            plan_name: targetPlan.name,
            months_duration: selectedPlanCode === 'free' ? 0 : months,
            current_period_end: periodEndISO,
            total_cost_usd: totalCost,
          },
        });
      } catch (logErr) {
        // No bloquear la operación si falla el log
        console.warn('Audit log error:', logErr);
      }

      setSuccessMsg(`¡Plan ${targetPlan.name} asignado con éxito por ${months} mes(es)!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error al guardar plan:', err);
      setErrorMsg(err.message || 'Error al guardar el plan de suscripción.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Encabezado */}
        <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Asignar y Configurar Plan de Suscripción
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Control Super Admin • Selección de Plan y Meses de Vigencia
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta de Resumen del Negocio / Titular */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-emerald-400 font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-white text-sm">{tenant.businessName}</p>
                <p className="text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> {tenant.fullName} ({tenant.email})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Estado actual:</span>
              {tenant.isPayingCustomer ? (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                  {tenant.planName}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Prueba Gratuita
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Mensajes de Alerta */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PASO 1: Elegir el Plan */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                Escoge el Plan de Servicio
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                2 planes de pago disponibles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Opción 1: Plan Profesional */}
              <button
                type="button"
                onClick={() => setSelectedPlanCode('pro')}
                className={`relative p-4 rounded-2xl text-left transition-all cursor-pointer border-2 flex flex-col justify-between ${
                  selectedPlanCode === 'pro'
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                      ⭐ Más Popular
                    </span>
                    {selectedPlanCode === 'pro' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                    Plan Profesional
                  </h4>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    $29.00 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">USD / mes</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                    Ideal para negocios en crecimiento y sucursales.
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] font-bold text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    Hasta 3 Sucursales & 5 Usuarios
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    2,000 Productos & Cajas Ilimitadas
                  </p>
                </div>
              </button>

              {/* Opción 2: Plan Empresarial */}
              <button
                type="button"
                onClick={() => setSelectedPlanCode('enterprise')}
                className={`relative p-4 rounded-2xl text-left transition-all cursor-pointer border-2 flex flex-col justify-between ${
                  selectedPlanCode === 'enterprise'
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30 ring-2 ring-amber-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950">
                      👑 VIP / Cadenas
                    </span>
                    {selectedPlanCode === 'enterprise' && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                    Plan Empresarial
                  </h4>
                  <p className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">
                    $79.00 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">USD / mes</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                    Para cadenas comerciales con múltiples sedes y alto volumen.
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] font-bold text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    Hasta 10 Sucursales & 25 Usuarios
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    Productos Ilimitados & Auditoría 24/7
                  </p>
                </div>
              </button>
            </div>

            {/* Alternativa: Volver a Plan Prueba / Gratis */}
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedPlanCode('free')}
                className={`text-xs font-bold underline transition-colors cursor-pointer ${
                  selectedPlanCode === 'free'
                    ? 'text-amber-600 dark:text-amber-400 font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {selectedPlanCode === 'free'
                  ? '✓ Seleccionado: Devolver a Plan Gratuito de Prueba (14 días)'
                  : '¿Deseas devolver este usuario a Prueba Gratuita (Sin costo)?'}
              </button>
            </div>
          </div>

          {/* PASO 2: Elegir Duración en Meses */}
          {selectedPlanCode !== 'free' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  ¿Cuántos meses estará activo este plan?
                </label>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {months} {months === 1 ? 'Mes' : 'Meses'} seleccionado(s)
                </span>
              </div>

              {/* Botones de Selección Rápida de Meses */}
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { value: 1, label: '1 Mes', desc: 'Mensual' },
                  { value: 3, label: '3 Meses', desc: 'Trimestral' },
                  { value: 6, label: '6 Meses', desc: 'Semestral' },
                  { value: 12, label: '12 Meses', desc: '1 Año' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMonths(item.value)}
                    className={`p-3 rounded-2xl text-center border-2 transition-all cursor-pointer ${
                      months === item.value
                        ? 'border-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:border-slate-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="text-[10px] opacity-75 font-semibold mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Selector de Meses Personalizados con +/- */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  O define una cantidad personalizada de meses:
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonths((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-300 transition-colors cursor-pointer font-black"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={months}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 60) {
                        setMonths(val);
                      }
                    }}
                    className="w-16 text-center font-black text-sm py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-white focus:outline-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() => setMonths((prev) => Math.min(60, prev + 1))}
                    className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-300 transition-colors cursor-pointer font-black"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-500">mes(es)</span>
                </div>
              </div>

              {/* Opción de Extender si ya tiene fecha futura */}
              {isCurrentEndFuture && (
                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                    <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>
                      Este negocio tiene plan activo hasta el{' '}
                      <strong>{formatDate(tenant.currentPeriodEnd || '')}</strong>.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={extendFromCurrent}
                      onChange={(e) => setExtendFromCurrent(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Sumar al vencimiento</span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-black flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Modo Prueba Gratuita
              </p>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Al activar este modo, el usuario dispondrá de 14 días para explorar el sistema con límites de prueba sin cobro alguno.
              </p>
            </div>
          )}

          {/* PASO 3: Resumen de Vigencia y Fechas Calculadas */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Resumen de la Nueva Suscripción
              </span>
              <span className="text-xs font-black text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                {totalDays} días de servicio
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Plan a Asignar</p>
                <p className="font-black text-white text-sm mt-0.5">
                  {selectedPlanCode === 'pro'
                    ? 'Profesional'
                    : selectedPlanCode === 'enterprise'
                    ? 'Empresarial'
                    : 'Gratis / Prueba'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Duración</p>
                <p className="font-black text-white text-sm mt-0.5">
                  {selectedPlanCode === 'free' ? '14 Días' : `${months} Mes(es)`}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Inicia</p>
                <p className="font-black text-white text-sm mt-0.5">
                  {formatDate(startDate.toISOString())}
                </p>
              </div>

              <div>
                <p className="text-emerald-400 font-bold">Fecha de Vencimiento</p>
                <p className="font-black text-emerald-400 text-sm mt-0.5">
                  {formatDate(endDate.toISOString())}
                </p>
              </div>
            </div>

            {selectedPlanCode !== 'free' && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Total de cobro estimado ({months} mes(es)):</span>
                <span className="text-sm font-black text-white">
                  {formatCurrency(totalCost, 'USD')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Guardando Plan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Guardar y Activar Plan ({selectedPlanCode === 'free' ? 'Prueba' : `${months} Meses`})
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
