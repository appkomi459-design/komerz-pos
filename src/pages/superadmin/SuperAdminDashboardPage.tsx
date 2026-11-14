import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  CreditCard,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Star,
  UserCheck,
  Sparkles,
  Store,
  ExternalLink,
  Eye,
  Crown,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  UsersIllustration,
  RocketTrialIllustration,
  CrownVipIllustration,
  MoneyCoinsIllustration,
} from '@/components/common/CardIllustrations';
import { BusinessDetailsModal } from '@/components/superadmin/BusinessDetailsModal';
import { AssignPlanModal, AssignPlanTenant } from '@/components/superadmin/AssignPlanModal';

interface TenantUser {
  profileId: string;
  fullName: string;
  email: string;
  isSuperAdmin: boolean;
  businessId: string | null;
  businessName: string;
  businessType: string;
  businessStatus: string;
  subscriptionId?: string | null;
  subscriptionStatus?: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  daysRemaining?: number;
  isExpired?: boolean;
  planCode: string;
  planName: string;
  planPrice: number;
  isPayingCustomer: boolean;
  createdAt: string;
}

export const SuperAdminDashboardPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'users' | 'clients'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTenantForPlan, setSelectedTenantForPlan] = useState<AssignPlanTenant | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);

      // 1. Obtener perfiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Obtener membresías con negocios y suscripciones
      const { data: members } = await supabase
        .from('business_members')
        .select(`
          user_id,
          business:businesses (
            id,
            name,
            business_type,
            status,
            subscription:subscriptions (
              id,
              status,
              current_period_start,
              current_period_end,
              plan:plans (
                id,
                name,
                code,
                price_monthly
              )
            )
          )
        `);

      const list: TenantUser[] = (profiles || []).map((p: any) => {
        const membership = (members || []).find((m: any) => m.user_id === p.id);
        const rawBiz = (membership as any)?.business;
        const biz = Array.isArray(rawBiz) ? rawBiz[0] : rawBiz;
        const rawSub = biz?.subscription;
        const sub = Array.isArray(rawSub) ? rawSub[0] : rawSub;
        const rawPlan = sub?.plan;
        const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;

        const isPaying = plan && plan.code !== 'free' && Number(plan.price_monthly) > 0;

        let daysRemaining = 0;
        let isExpired = false;
        if (sub?.current_period_end) {
          const endMs = new Date(sub.current_period_end).getTime();
          const nowMs = Date.now();
          daysRemaining = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining < 0;
        }

        return {
          profileId: p.id,
          fullName: p.full_name || 'Sin nombre',
          email: p.email || 'Sin correo',
          isSuperAdmin: Boolean(p.is_super_admin),
          businessId: biz?.id || null,
          businessName: biz?.name || 'Aún no configuró negocio',
          businessType: biz?.business_type || 'N/A',
          businessStatus: biz?.status || 'active',
          subscriptionId: sub?.id || null,
          subscriptionStatus: sub?.status || 'trialing',
          currentPeriodStart: sub?.current_period_start || null,
          currentPeriodEnd: sub?.current_period_end || null,
          daysRemaining,
          isExpired,
          planCode: plan?.code || 'free',
          planName: plan?.name || 'Gratis / Prueba',
          planPrice: Number(plan?.price_monthly || 0),
          isPayingCustomer: Boolean(isPaying),
          createdAt: p.created_at,
        };
      });

      setTenants(list);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Métricas
  const totalPeople = tenants.length;
  const trialUsers = tenants.filter((t) => !t.isPayingCustomer).length;
  const payingClients = tenants.filter((t) => t.isPayingCustomer).length;
  const totalRevenue = tenants.reduce((acc, t) => acc + (t.isPayingCustomer ? t.planPrice : 0), 0);

  // Alternar estado activo / suspendido del negocio
  const handleToggleStatus = async (businessId: string | null, currentStatus: string) => {
    if (!businessId) return;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setActionLoading(businessId);
      const { error } = await supabase
        .from('businesses')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;
      await fetchTenants();
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Convertir usuario en Cliente (asignar Plan Pro de pago) o devolverlo a Prueba
  const handleTogglePlan = async (businessId: string | null, currentPlanCode: string) => {
    if (!businessId) return;
    try {
      setActionLoading(businessId);
      const targetCode = currentPlanCode === 'free' ? 'pro' : 'free';

      const { data: targetPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('code', targetCode)
        .single();

      if (!targetPlan) throw new Error('Plan no encontrado');

      // Actualizar suscripción
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan_id: targetPlan.id, status: 'active', updated_at: new Date().toISOString() })
        .eq('business_id', businessId);

      if (error) throw error;
      await fetchTenants();
    } catch (err: any) {
      alert(`Error al cambiar plan: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrado
  const filtered = tenants
    .filter((t) => {
      if (filter === 'users') return !t.isPayingCustomer;
      if (filter === 'clients') return t.isPayingCustomer;
      return true;
    })
    .filter(
      (t) =>
        t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.businessName.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 4 Indicadores Vibrantes con Ilustraciones 3D Animadas (Compactos y Centrados) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Cuentas */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#203a43] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 group">
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
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">{totalPeople}</p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">Registradas</p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">Personas registradas</p>
          </div>
        </div>

        {/* 2. Usuarios en Prueba */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#f2994a] via-[#f39c12] to-[#d35400] text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1 group">
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <RocketTrialIllustration />
          </div>
          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              En Prueba
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">{trialUsers}</p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">Solo Prueban</p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">Sin plan pagado</p>
          </div>
        </div>

        {/* 3. Clientes con Plan */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#00b09b] via-[#0575e6] to-[#021b79] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 group">
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <CrownVipIllustration />
          </div>
          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <Star className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Clientes VIP
            </span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">{payingClients}</p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">Con Plan Activo</p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">Pro o Empresarial</p>
          </div>
        </div>

        {/* 4. Ingresos Mensuales */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-[#eb3349] via-[#f45c43] to-[#870000] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 group">
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
            <MoneyCoinsIllustration />
          </div>
          <div className="relative z-10 max-w-[62%]">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner mb-2.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 text-white px-2 py-0.5 rounded-full inline-block mb-1 backdrop-blur-xs">
              Recurrente
            </span>
            <p className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md truncate">
              {formatCurrency(totalRevenue, 'USD')}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1">Ingresos Mensuales</p>
            <p className="text-[11px] text-white/80 font-bold truncate mt-0.5">Por planes activos</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-[#181615] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-zinc-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Pestañas de Filtro Rápido */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              Todos ({totalPeople})
            </button>
            <button
              onClick={() => setFilter('users')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filter === 'users'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              👤 Usuarios en Prueba ({trialUsers})
            </button>
            <button
              onClick={() => setFilter('clients')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                filter === 'clients'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              ⭐ Clientes con Plan ({payingClients})
            </button>
          </div>

          {/* Buscador */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Buscar por usuario, correo o negocio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Tabla Clara y Destacada de Control con BORDES NEGROS VISIBLES */}
      <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden">
        {/* Cabecera del contenedor */}
        <div className="bg-slate-900 text-white px-6 py-4.5 border-b-2 border-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white flex items-center justify-center font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                Directorio de Cuentas y Negocios
              </h3>
              <p className="text-[11px] font-bold text-slate-300">
                Mostrando {filtered.length} cuentas registradas con información de su negocio
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
            Control Super Admin
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando información del sistema...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500 dark:text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-black text-slate-800 dark:text-zinc-200">No se encontraron registros con este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Encabezado negro / oscuro con líneas nítidas */}
              <thead className="bg-slate-950 text-white uppercase tracking-wider text-[11px] font-black border-b-2 border-slate-900">
                <tr>
                  <th className="px-6 py-4 border-r border-slate-800/80">Persona / Correo</th>
                  <th className="px-6 py-4 border-r border-slate-800/80">Negocio que Ocupa</th>
                  <th className="px-6 py-4 border-r border-slate-800/80">Tipo de Cuenta</th>
                  <th className="px-6 py-4 border-r border-slate-800/80">Plan Adquirido</th>
                  <th className="px-6 py-4 border-r border-slate-800/80">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              {/* Filas con líneas divisorias negras/oscuras bien marcadas */}
              <tbody className="divide-y-2 divide-slate-300 dark:divide-zinc-700 font-medium">
                {filtered.map((item) => (
                  <tr
                    key={item.profileId}
                    className={`transition-colors ${
                      item.isPayingCustomer
                        ? 'border-l-6 border-l-emerald-600'
                        : 'border-l-6 border-l-amber-500'
                    } even:bg-slate-100/70 dark:even:bg-zinc-900/60 odd:bg-white dark:odd:bg-[#181615] hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border-b-2 border-slate-300 dark:border-zinc-700`}
                  >
                    {/* Persona & Correo */}
                    <td className="px-6 py-4.5 border-r border-slate-200 dark:border-zinc-800">
                      <div className="font-black text-slate-950 dark:text-zinc-100 text-sm">
                        {item.fullName}
                      </div>
                      <div className="text-slate-600 dark:text-zinc-400 font-mono text-xs font-bold">
                        {item.email}
                      </div>
                      {item.isSuperAdmin && (
                        <span className="inline-block mt-1 text-[10px] font-black uppercase text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-300">
                          Super Admin
                        </span>
                      )}
                    </td>

                    {/* Negocio + BOTÓN VER NEGOCIO */}
                    <td className="px-6 py-4.5 border-r border-slate-200 dark:border-zinc-800">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-xs">
                          <Store className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-950 dark:text-zinc-100 text-sm leading-tight">
                            {item.businessName}
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 capitalize mt-0.5">
                            Rubro: {item.businessType}
                          </p>

                          {item.businessId ? (
                            <button
                              onClick={() => {
                                setSelectedBusinessId(item.businessId);
                                setModalOpen(true);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer group"
                              title="Ver información detallada de este negocio"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Negocio</span>
                              <ExternalLink className="w-3 h-3 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ) : (
                            <span className="inline-block mt-1 text-[11px] text-slate-400 italic font-bold">
                              Sin negocio vinculado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tipo: Usuario vs Cliente */}
                    <td className="px-6 py-4.5 border-r border-slate-200 dark:border-zinc-800">
                      {item.isPayingCustomer ? (
                        item.planCode === 'enterprise' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs">
                            <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                            CLIENTE EMPRESARIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs">
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            CLIENTE PRO
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          Usuario en Prueba
                        </span>
                      )}
                    </td>

                    {/* Plan Adquirido, Precio y Vigencia */}
                    <td className="px-6 py-4.5 border-r border-slate-200 dark:border-zinc-800">
                      <p className="font-black text-slate-950 dark:text-zinc-100 text-sm">
                        {item.planName}
                      </p>
                      <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mt-0.5">
                        {item.planPrice > 0 ? `${formatCurrency(item.planPrice, 'USD')} / mes` : 'Sin costo (Gratis)'}
                      </p>

                      {/* Fecha de Vencimiento y Días Restantes */}
                      {item.currentPeriodEnd ? (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Vence: {formatDate(item.currentPeriodEnd)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              item.isExpired
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                                : item.daysRemaining && item.daysRemaining <= 7
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                            }`}
                          >
                            {item.isExpired
                              ? `Vencido (${Math.abs(item.daysRemaining || 0)}d)`
                              : `${item.daysRemaining} días restantes`}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {item.isPayingCustomer ? 'Vigencia activa' : '14 días de prueba'}
                        </p>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4.5 border-r border-slate-200 dark:border-zinc-800">
                      <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                        item.businessStatus === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                      }`}>
                        {item.businessStatus === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4.5 text-right space-x-2">
                      {item.businessId ? (
                        <>
                          <button
                            disabled={actionLoading === item.businessId}
                            onClick={() => {
                              setSelectedTenantForPlan(item);
                              setAssignModalOpen(true);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                              item.isPayingCustomer
                                ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            }`}
                            title="Seleccionar plan y definir meses de servicio"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-300" />
                            <span>
                              {item.isPayingCustomer ? 'Gestionar / Extender Plan' : 'Asignar Plan (Meses)'}
                            </span>
                          </button>

                          <button
                            disabled={actionLoading === item.businessId}
                            onClick={() => handleToggleStatus(item.businessId, item.businessStatus)}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                              item.businessStatus === 'active'
                                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20'
                                : 'bg-slate-900 text-white hover:bg-black'
                            }`}
                          >
                            {item.businessStatus === 'active' ? 'Suspender' : 'Activar'}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold italic">
                          Esperando creación de negocio
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Ver Detalles Completos del Negocio */}
      <BusinessDetailsModal
        businessId={selectedBusinessId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onStatusChanged={fetchTenants}
      />

      {/* Modal para Asignar Plan y Meses a Usuarios/Negocios */}
      <AssignPlanModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedTenantForPlan(null);
        }}
        tenant={selectedTenantForPlan}
        onSuccess={fetchTenants}
      />
    </div>
  );
};
