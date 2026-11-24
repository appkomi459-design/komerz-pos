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
      {/* 4 TARJETAS KPI PRINCIPALES (ESTILO SUCURSALES)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. VENTAS HOY (Rojo Carmesí) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-100">
              {t('panel.sales_today', 'Ventas Hoy')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {metrics.salesTodayCount}
            </div>
            <p className="text-[10px] text-rose-100 font-bold mt-0.5 truncate">
              {formatCurrency(metrics.salesToday, currency)} {t('panel.collected', 'recaudados')}
            </p>
          </div>
        </div>

        {/* 2. INGRESOS HOY (Verde Esmeralda) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              {t('panel.income_today', 'Ingresos Hoy')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono truncate">
              {formatCurrency(metrics.salesToday, currency)}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
              {t('panel.income_today_sub', 'Total del día')}
            </p>
          </div>
        </div>

        {/* 3. STOCK BAJO (Púrpura / Rosa Alerta) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-100">
              {t('panel.low_stock', 'Stock Bajo')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {metrics.lowStockCount}
            </div>
            <p className="text-[10px] text-purple-100 font-bold mt-0.5">
              {metrics.lowStockCount > 0 ? `${metrics.lowStockCount} con stock bajo` : t('panel.low_stock_ok', 'Inventario OK')}
            </p>
          </div>
        </div>

        {/* 4. EMPLEADOS (Azul Cobalto) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              {t('panel.employees', 'Empleados')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {metrics.employeesCount}
            </div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">
              {t('panel.employees_sub', 'Personal activo')}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN INFERIOR: INGRESOS 7 DÍAS + ACTIVIDAD RECIENTE    */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-6">
        {/* Gráfica de Línea: Ingresos — últimos 7 días */}
        <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 border-b-2 border-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/25">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {t('panel.week_billing', 'Facturación últimos 7 días')}
                </h3>
                <p className="text-xs font-bold text-slate-400">{t('panel.billing_chart', 'Rendimiento de facturación diaria')}</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-sm">
              {formatCurrency(metrics.weeklySalesTotal, currency)}
            </div>
          </div>

          {/* Gráfico de línea SVG */}
          <div className="px-6 pt-6 pb-2 flex-1">
            {/* LineChart rendered safely */}
            {(() => {
              const W = 600, H = 160, PAD = 20;
              const days = metrics.weeklyDays;
              if (!days || days.length < 2) return null;
              const vals = days.map(d => d.total);
              const maxVal = Math.max(...vals, 1);
              const n = days.length;
              const pts = vals.map((v, i) => ({
                x: PAD + (i / (n - 1)) * (W - PAD * 2),
                y: PAD + ((1 - v / maxVal) * (H - PAD * 2)),
                v,
                label: days[i].label,
              }));
              const pathD = pts.map((pt, i) => {
                if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
                const prev = pts[i - 1];
                const cpx = ((prev.x + pt.x) / 2).toFixed(1);
                return `C ${cpx} ${prev.y.toFixed(1)} ${cpx} ${pt.y.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
              }).join(' ');
              const areaD = `${pathD} L ${pts[n-1].x.toFixed(1)} ${H - PAD} L ${pts[0].x.toFixed(1)} ${H - PAD} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height: 220}} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.30"/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.02"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines horizontales */}
                  {[0.25, 0.5, 0.75].map(pct => (
                    <line key={pct}
                      x1={PAD} y1={PAD + pct * (H - PAD * 2)}
                      x2={W - PAD} y2={PAD + pct * (H - PAD * 2)}
                      stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"
                    />
                  ))}
                  {/* Área rellena */}
                  <path d={areaD} fill="url(#lineGrad)"/>
                  {/* Línea principal */}
                  <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Puntos y labels */}
                  {pts.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="white" stroke="#10b981" strokeWidth="2.5"/>
                      {pt.v > 0 && <circle cx={pt.x} cy={pt.y} r="2.5" fill="#10b981"/>}
                      <text x={pt.x} y={H - 3} textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8">
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>
              );
            })()}
          </div>

          {/* Detalle de los 7 días */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-7 gap-1.5">
              {metrics.weeklyDays.map((day, idx) => (
                <div key={idx} className={`text-center p-2 rounded-xl border ${
                  day.total > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700'
                }`}>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">{day.label}</p>
                  <p className={`text-[10px] font-black mt-0.5 leading-tight ${
                    day.total > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    {day.total > 0 ? formatCurrency(day.total, currency) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-zinc-900/60 border-t-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
              {t('panel.real_income', 'Ingresos reales procesados en POS')}
            </span>
            <Link
              to="/app/sales"
              className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1"
            >
              {t('panel.view_detail', 'Ver reporte detallado')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Tarjeta: Últimas Ventas — full width, horizontal grid */}
        <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 border-b-2 border-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/25">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {t('panel.recent_sales', 'Últimos tickets de venta')}
                </h3>
                <p className="text-xs font-bold text-slate-400">{t('panel.recent_sales_sub', 'Actividad reciente del negocio')}</p>
              </div>
            </div>
            <Link
              to="/app/sales"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-colors"
            >
              {t('panel.view_all', 'Ver todas')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Body */}
          <div className="p-5">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-3">
                <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-zinc-600 opacity-50" />
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  {t('panel.no_recent_sales', 'Sin ventas recientes')}
                </p>
                <Link
                  to="/app/pos"
                  className="text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
                >
                  {t('panel.open_pos', 'Hacer mi primera venta')} →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-200 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0">
                        #
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                          {sale.invoice_number}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 truncate">
                          {sale.customer?.name || t('sales.consumer', 'Consumidor Final')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                          {formatDate(sale.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">
                      {formatCurrency(sale.total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
