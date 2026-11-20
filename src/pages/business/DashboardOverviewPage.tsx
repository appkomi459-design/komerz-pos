import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  ShoppingCart,
  Boxes,
  Users,
  UserCheck,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatFullDate } from '@/utils/formatters';
import { SellerDashboardPage } from './SellerDashboardPage';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardMetrics {
  salesToday: number;
  salesTodayCount: number;
  salesMonth: number;
  transactionsMonth: number;
  totalSalesCount: number;
  productsCount: number;
  lowStockCount: number;
  customersCount: number;
  employeesCount: number;
  weeklySalesTotal: number;
  weeklyDays: { label: string; total: number; heightPct: number }[];
}

export const DashboardOverviewPage: React.FC = () => {
  const { activeBusiness, mainBranch, currentRole } = useBusiness();
  const { t } = useLanguage();

  // Si el usuario es Vendedor / Cajero, mostrar su panel personalizado
  if (currentRole === 'cashier') {
    return <SellerDashboardPage />;
  }

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    salesToday: 0,
    salesTodayCount: 0,
    salesMonth: 0,
    transactionsMonth: 0,
    totalSalesCount: 0,
    productsCount: 0,
    lowStockCount: 0,
    customersCount: 0,
    employeesCount: 0,
    weeklySalesTotal: 0,
    weeklyDays: [],
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Ventas de hoy
        const { data: todaySalesData } = await supabase
          .from('sales')
          .select('total')
          .eq('business_id', activeBusiness.id)
          .gte('created_at', startOfDay);

        const todayTotal = (todaySalesData || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        const todayCount = (todaySalesData || []).length;

        // 2. Ventas del mes y conteo de tickets
        const { data: monthSalesData, count: txCount } = await supabase
          .from('sales')
          .select('total', { count: 'exact' })
          .eq('business_id', activeBusiness.id)
          .gte('created_at', startOfMonth);

        const monthTotal = (monthSalesData || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);

        // 3. Ventas totales históricas
        const { count: allTimeSalesCount } = await supabase
          .from('sales')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id);

        // 4. Ventas de los últimos 7 días
        const { data: weekSalesData } = await supabase
          .from('sales')
          .select('total, created_at')
          .eq('business_id', activeBusiness.id)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true });

        const weekTotal = (weekSalesData || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0);

        // Construir los 7 días de la semana
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const daysMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split('T')[0];
          daysMap[key] = 0;
        }

        (weekSalesData || []).forEach((s: any) => {
          const dayKey = s.created_at?.split('T')[0];
          if (daysMap[dayKey] !== undefined) {
            daysMap[dayKey] += Number(s.total || 0);
          }
        });

        const maxDayVal = Math.max(...Object.values(daysMap), 1);
        const weeklyDays = Object.entries(daysMap).map(([key, val]) => {
          const d = new Date(`${key}T12:00:00`);
          return {
            label: dayNames[d.getDay()],
            total: val,
            heightPct: Math.round((val / maxDayVal) * 100),
          };
        });

        // 5. Productos activos
        const { count: prodCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true);

        // 6. Stock bajo (stock <= min_stock)
        const { count: lowStock } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .filter('stock', 'lte', 'min_stock');

        // 7. Clientes registrados
        const { count: custCount } = await supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id);

        // 8. Empleados / miembros
        const { count: empCount } = await supabase
          .from('business_members')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true);

        // 9. Últimas ventas
        const { data: salesList } = await supabase
          .from('sales')
          .select('id, invoice_number, total, payment_method, status, created_at, customer:customers(name)')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false })
          .limit(6);

        setMetrics({
          salesToday: todayTotal,
          salesTodayCount: todayCount,
          salesMonth: monthTotal,
          transactionsMonth: txCount || 0,
          totalSalesCount: allTimeSalesCount || 0,
          productsCount: prodCount || 0,
          lowStockCount: lowStock || 0,
          customersCount: custCount || 0,
          employeesCount: empCount || 1,
          weeklySalesTotal: weekTotal,
          weeklyDays,
        });

        setRecentSales(salesList || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [activeBusiness]);

  const currency = activeBusiness?.currency || 'USD';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb superior y Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/20">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px]">
              {t('nav.operations', 'OPERACIONES')}
            </span>
            <span>›</span>
            <span className="text-gray-900 dark:text-zinc-100 font-extrabold">{t('nav.panel', 'Panel')}</span>
          </div>
        </div>
        <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          <span>{formatFullDate()}</span>
        </div>
      </div>

      {/* Título de Sección y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
            {t('panel.title', 'Panel General')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {activeBusiness?.name} • {t('common.branch', 'Sucursal')} {mainBranch?.name || t('common.main_branch', 'Sucursal Principal')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/pos">
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/30"
              icon={<ShoppingCart className="w-4 h-4" />}
            >
              {t('panel.open_pos', 'Abrir Punto de Venta')}
            </Button>
          </Link>
          <Link to="/app/products">
            <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>
              {t('panel.new_product', 'Nuevo Producto')}
            </Button>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 TARJETAS KPI PRINCIPALES                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        {/* 1. VENTAS HOY (Rojo Carmesí) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#eb3349] to-[#f45c43] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">{t('panel.today', 'Hoy')}</span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none" className="animate-card-float">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <path d="M18 22h4l5 22h18l4-14H25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="30" cy="48" r="3" fill="white"/>
              <circle cx="44" cy="48" r="3" fill="white"/>
              <path d="M32 30h10M32 35h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.salesTodayCount}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">{t('panel.sales_today', 'Ventas Hoy')}</p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {formatCurrency(metrics.salesToday, currency)} {t('panel.collected', 'recaudados')}
          </p>
        </div>

        {/* 2. INGRESOS HOY (Verde Esmeralda) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">{t('panel.day', 'Día')}</span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none" className="animate-card-float-delayed">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <polyline points="16,52 26,38 36,42 46,28 56,20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="56" cy="20" r="4" fill="white"/>
              <path d="M50 20 L56 14 L62 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10">
            {formatCurrency(metrics.salesToday, currency)}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">{t('panel.income_today', 'Ingresos Hoy')}</p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">{t('panel.income_today_sub', 'Total del día')}</p>
        </div>

        {/* 3. STOCK BAJO (Azul-Verde Alerta) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#0575e6] via-[#00a86b] to-[#008f5d] text-white shadow-xl shadow-teal-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">{t('panel.alert', 'Alerta')}</span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none" className="animate-card-float">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <rect x="18" y="30" width="36" height="26" rx="4" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M26 30V24a10 10 0 0 1 20 0v6" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="36" y1="39" x2="36" y2="46" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="36" cy="50" r="1.5" fill="white"/>
            </svg>
          </div>
          <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.lowStockCount}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">{t('panel.low_stock', 'Stock Bajo')}</p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {metrics.lowStockCount > 0 ? `${metrics.lowStockCount} ${t('panel.low_stock_items', 'productos con stock bajo')}` : t('panel.low_stock_ok', 'Inventario OK')}
          </p>
        </div>

        {/* 4. EMPLEADOS (Azul Cobalto) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">{t('panel.team', 'Equipo')}</span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none" className="animate-card-float-alt">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <circle cx="36" cy="26" r="8" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M20 54c0-9 7-14 16-14s16 5 16 14" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="54" cy="29" r="5" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M60 50c0-6 4-10 0-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="18" cy="29" r="5" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M12 50c0-6-4-10 0-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.employeesCount}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">{t('panel.employees', 'Empleados')}</p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">{t('panel.employees_sub', 'Personal activo')}</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN INFERIOR: INGRESOS 7 DÍAS + ACTIVIDAD RECIENTE    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de Barras: Ingresos — últimos 7 días */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div className="bg-slate-900 text-white px-6 py-4 border-b-2 border-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/25">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {t('panel.week_billing', 'Facturación últimos 7 días')}
                </h3>
                <p className="text-xs font-bold text-slate-300">{t('panel.billing_chart', 'Rendimiento de facturación diaria')}</p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-sm">
              {formatCurrency(metrics.weeklySalesTotal, currency)}
            </div>
          </div>

          <div className="p-6">
            {/* Visualización de barras semanales */}
            <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
              {metrics.weeklyDays.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex items-end justify-center h-32">
                    {/* Tooltip con monto */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none z-10 border border-slate-700">
                      {formatCurrency(day.total, currency)}
                    </div>
                    {/* Barra */}
                    <div
                      style={{ height: `${Math.max(day.heightPct, 8)}%` }}
                      className={`w-full max-w-[36px] rounded-2xl transition-all duration-300 ${
                        day.total > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-black text-slate-600 dark:text-zinc-400">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-900/60 border-t-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
              Ingresos reales procesados en POS
            </span>
            <Link
              to="/app/sales"
              className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1"
            >
              Ver reporte detallado <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tarjeta: Actividad Reciente */}
        <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-900 text-white px-6 py-4 border-b-2 border-slate-950 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/25">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {t('panel.recent_sales', 'Últimos tickets de venta')}
                </h3>
                <p className="text-xs font-bold text-slate-300">{t('panel.recent_sales', 'Actividad reciente')}</p>
              </div>
            </div>

            <div className="p-5 space-y-2.5">
              {recentSales.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                    {t('panel.no_recent_sales', 'Sin ventas recientes')}
                  </p>
                  <Link
                    to="/app/pos"
                    className="inline-block mt-3 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    {t('panel.open_pos', 'Hacer mi primera venta')} →
                  </Link>
                </div>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-200 dark:border-zinc-700 hover:border-slate-900 dark:hover:border-zinc-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-xs font-black text-rose-600 dark:text-rose-400 shadow-xs">
                        #
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-zinc-100">
                          {sale.invoice_number}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 truncate">
                          {sale.customer?.name || t('sales.consumer', 'Consumidor Final')} • {formatDate(sale.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sale.total, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60">
            <Link
              to="/app/sales"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors shadow-md"
            >
              {t('panel.view_all', 'Ver todas las ventas')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
