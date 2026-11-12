import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Store,
  MapPin,
  Phone,
  Calendar,
  Users,
  Package,
  ShoppingCart,
  Crown,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface BusinessDetailsModalProps {
  businessId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export const BusinessDetailsModal: React.FC<BusinessDetailsModalProps> = ({
  businessId,
  isOpen,
  onClose,
  onStatusChanged,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [salesStats, setSalesStats] = useState<{ count: number; total: number }>({ count: 0, total: 0 });

  useEffect(() => {
    if (!isOpen || !businessId) return;

    const fetchAllDetails = async () => {
      try {
        setLoading(true);

        // 1. Datos del negocio
        const { data: bData } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        setBusiness(bData);

        // 2. Sucursales
        const { data: brData } = await supabase
          .from('branches')
          .select('*')
          .eq('business_id', businessId)
          .order('is_main', { ascending: false });

        setBranches(brData || []);

        // 3. Miembros y usuarios del negocio
        const { data: mData } = await supabase
          .from('business_members')
          .select(`
            id,
            role,
            is_active,
            created_at,
            profile:profiles ( id, full_name, email )
          `)
          .eq('business_id', businessId);

        setMembers(mData || []);

        // 4. Suscripción y Plan
        const { data: subData } = await supabase
          .from('subscriptions')
          .select(`
            id,
            status,
            current_period_start,
            current_period_end,
            plan:plans ( id, name, code, price_monthly )
          `)
          .eq('business_id', businessId)
          .maybeSingle();

        setSubscription(subData);

        // 5. Total de Productos
        const { count: pCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);

        setProductCount(pCount || 0);

        // 6. Total de Ventas
        const { data: sData, count: sCount } = await supabase
          .from('sales')
          .select('total', { count: 'exact' })
          .eq('business_id', businessId);

        const totalSold = (sData || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        setSalesStats({
          count: sCount || 0,
          total: totalSold,
        });
      } catch (err) {
        console.error('Error fetching business full details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleEnterBusiness = () => {
    if (!businessId) return;
    localStorage.setItem('active_business_id', businessId);
    navigate('/app');
  };

  const plan = Array.isArray(subscription?.plan) ? subscription.plan[0] : subscription?.plan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900 dark:border-zinc-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal con Alto Contraste */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 border-b-2 border-slate-900 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-lg border border-white/20 overflow-hidden">
              {business?.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {business?.name || 'Detalles del Negocio'}
                </h2>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    business?.status === 'active'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {business?.status === 'active' ? 'ACTIVO' : 'SUSPENDIDO'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-300 capitalize mt-0.5 flex items-center gap-2">
                <span>Rubro: {business?.business_type || 'Comercio'}</span>
                <span>•</span>
                <span>Moneda: {business?.currency || 'USD'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-sm font-bold text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando información completa del negocio...
            </div>
          ) : (
            <>
              {/* 4 Mini KPIs Operativos con Bordes Negros Nítidos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Productos */}
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border-2 border-slate-900/70 dark:border-zinc-700 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 mb-1">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Productos</span>
                  </div>
                  <p className="text-xl font-black text-slate-950 dark:text-white">{productCount}</p>
                  <p className="text-[10px] font-bold text-slate-500">En catálogo</p>
                </div>

                {/* 2. Ventas */}
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border-2 border-slate-900/70 dark:border-zinc-700 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 mb-1">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Ventas</span>
                  </div>
                  <p className="text-xl font-black text-slate-950 dark:text-white">{salesStats.count}</p>
                  <p className="text-[10px] font-bold text-slate-500">Tickets cobrados</p>
                </div>

                {/* 3. Facturación */}
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border-2 border-slate-900/70 dark:border-zinc-700 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Facturado</span>
                  </div>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                    {formatCurrency(salesStats.total, business?.currency || 'USD')}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">Total histórico</p>
                </div>

                {/* 4. Sucursales */}
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border-2 border-slate-900/70 dark:border-zinc-700 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 mb-1">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Sucursales</span>
                  </div>
                  <p className="text-xl font-black text-slate-950 dark:text-white">{branches.length}</p>
                  <p className="text-[10px] font-bold text-slate-500">Establecimientos</p>
                </div>
              </div>

              {/* Tarjeta de Suscripción y Plan Activo */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-2 border-emerald-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00b09b] to-[#96c93d] text-white flex items-center justify-center font-bold shadow-md">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Plan Actual
                    </span>
                    <h4 className="text-base font-black text-slate-950 dark:text-white">
                      {plan?.name || 'Gratis / Prueba'}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                      {Number(plan?.price_monthly || 0) > 0
                        ? `${formatCurrency(Number(plan.price_monthly), 'USD')} mensual`
                        : 'Plan Gratuito sin costo'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="font-bold text-slate-500">Estado de cuenta:</span>
                  <p className="font-black text-slate-950 dark:text-white uppercase tracking-wider mt-0.5">
                    {subscription?.status === 'active' ? '✅ Suscripción Activa' : '🟡 En Período de Prueba'}
                  </p>
                </div>
              </div>

              {/* Sucursales Registradas */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                  Sucursales ({branches.length})
                </h3>
                <div className="border-2 border-slate-900/60 dark:border-zinc-700 rounded-2xl overflow-hidden divide-y-2 divide-slate-200 dark:divide-zinc-800">
                  {branches.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No hay sucursales registradas</div>
                  ) : (
                    branches.map((b) => (
                      <div key={b.id} className="p-3.5 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-950 dark:text-zinc-100">{b.name}</span>
                            {b.is_main && (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300">
                                Principal
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {b.address || 'Sin dirección especificada'}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                          {b.phone ? `📞 ${b.phone}` : 'Sin teléfono'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Personal y Usuarios Vinculados */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                  Usuarios y Miembros del Negocio ({members.length})
                </h3>
                <div className="border-2 border-slate-900/60 dark:border-zinc-700 rounded-2xl overflow-hidden divide-y-2 divide-slate-200 dark:divide-zinc-800">
                  {members.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No hay miembros registrados</div>
                  ) : (
                    members.map((m) => (
                      <div key={m.id} className="p-3.5 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-black text-slate-950 dark:text-zinc-100">{m.profile?.full_name || 'Sin nombre'}</p>
                          <p className="text-slate-500 font-mono text-[11px]">{m.profile?.email || 'Sin correo'}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-2.5 py-1 rounded-xl border border-slate-300 dark:border-zinc-700">
                          {m.role || 'Miembro'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fechas de Registro */}
              <div className="p-3 bg-slate-100 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                <span>Registrado en el sistema:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-200">
                  {formatDate(business?.created_at)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-zinc-900/90 border-t-2 border-slate-900/70 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 text-center sm:text-left">
            ID: <span className="font-mono text-[11px]">{business?.id || 'N/A'}</span>
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>

            {business?.id && (
              <button
                onClick={handleEnterBusiness}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Negocio en Vivo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
