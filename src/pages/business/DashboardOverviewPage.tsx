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
  const { activeBusiness, mainBranch } = useBusiness();

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
              Operaciones
            </span>
            <span>›</span>
            <span className="text-gray-900 dark:text-zinc-100 font-extrabold">Panel</span>
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
            Panel General
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {activeBusiness?.name} • Sucursal {mainBranch?.name || 'Principal'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/pos">
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/30"
              icon={<ShoppingCart className="w-4 h-4" />}
            >
              Abrir Punto de Venta
            </Button>
          </Link>
          <Link to="/app/products">
            <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8 TARJETAS KPI VIBRANTES CON ILUSTRACIONES ANIMADAS      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">

        {/* 1. VENTAS HOY (Rojo Carmesí) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#eb3349] to-[#f45c43] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Hoy</span>
          </div>
          {/* Ilustración: carrito animado */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <path d="M18 22h4l5 22h18l4-14H25" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="30" cy="48" r="3" fill="white"/>
              <circle cx="44" cy="48" r="3" fill="white"/>
              <path d="M32 30h10M32 35h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.salesTodayCount}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Ventas Hoy</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">
            {formatCurrency(metrics.salesToday, currency)} recaudados
          </p>
        </div>

        {/* 2. INGRESOS HOY (Verde Esmeralda) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Día</span>
          </div>
          {/* Ilustración: gráfica de tendencia */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float-delayed">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <polyline points="16,52 26,38 36,42 46,28 56,20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="56" cy="20" r="4" fill="white"/>
              <path d="M50 20 L56 14 L62 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs truncate relative z-10">
            {formatCurrency(metrics.salesToday, currency)}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Ingresos Hoy</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">Total del día</p>
        </div>

        {/* 3. STOCK BAJO (Azul-Verde Alerta) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#0575e6] via-[#00a86b] to-[#008f5d] text-white shadow-xl shadow-teal-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Alerta</span>
          </div>
          {/* Ilustración: caja con exclamación */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <rect x="18" y="30" width="36" height="26" rx="4" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M26 30V24a10 10 0 0 1 20 0v6" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="36" y1="39" x2="36" y2="46" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="36" cy="50" r="1.5" fill="white"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.lowStockCount}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Stock Bajo</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">
            {metrics.lowStockCount > 0 ? 'Requieren reabastecer' : 'Inventario OK'}
          </p>
        </div>

        {/* 4. EMPLEADOS (Azul Cobalto) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Equipo</span>
          </div>
          {/* Ilustración: equipo de personas */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float-alt">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <circle cx="36" cy="26" r="8" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M20 54c0-9 7-14 16-14s16 5 16 14" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="54" cy="29" r="5" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M60 50c0-6 4-10 0-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="18" cy="29" r="5" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M12 50c0-6-4-10 0-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.employeesCount}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Empleados</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">Personal activo</p>
        </div>

        {/* 5. CLIENTES (Ámbar Dorado) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#f2994a] to-[#f2c94c] text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Cartera</span>
          </div>
          {/* Ilustración: persona con estrella */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <circle cx="34" cy="27" r="8" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M18 54c0-9 7-14 16-14s16 5 16 14" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M52 18l1.5 4h4l-3.5 2.5 1.5 4-3.5-2.5-3.5 2.5 1.5-4L47 22h4z" fill="white"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.customersCount}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Clientes</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">Registrados</p>
        </div>

        {/* 6. VENTAS DEL MES (Púrpura Violeta) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#8e2de2] to-[#4a00e0] text-white shadow-xl shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Mes</span>
          </div>
          {/* Ilustración: billete con monedas */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float-alt">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <rect x="14" y="28" width="38" height="22" rx="5" stroke="white" strokeWidth="3" fill="none"/>
              <circle cx="33" cy="39" r="6" stroke="white" strokeWidth="2.5" fill="none"/>
              <path d="M33 35v2M33 42v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="52" cy="24" r="7" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2"/>
              <path d="M52 21v2M52 26v1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs truncate relative z-10">
            {formatCurrency(metrics.salesMonth, currency)}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Ventas del Mes</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">
            {metrics.transactionsMonth} tickets este mes
          </p>
        </div>

        {/* 7. PRODUCTOS (Cian Océano) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#00c6ff] to-[#0072ff] text-white shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/30">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Stock</span>
          </div>
          {/* Ilustración: caja de producto */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <path d="M36 20L52 29v18L36 56 20 47V29z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="none"/>
              <path d="M36 20v36M20 29l16 9 16-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M28 25l16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.productsCount}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Productos</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">En inventario</p>
        </div>

        {/* 8. TOTAL HISTORIAL (Vino Borgoña) */}
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#870000] to-[#190a05] text-white shadow-xl shadow-rose-950/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/40">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">Historial</span>
          </div>
          {/* Ilustración: recibo/ticket */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-card-float-alt">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <rect x="22" y="16" width="28" height="40" rx="4" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M28 26h16M28 32h16M28 38h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 50l4-4 4 4 4-4 4 4 4-4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs relative z-10">
            {metrics.totalSalesCount}
          </p>
          <p className="text-xs font-black uppercase tracking-wider text-white/95 mt-1.5 relative z-10">Total Ventas</p>
          <p className="text-[11px] text-white/75 font-medium truncate mt-0.5 relative z-10">Historial acumulado</p>
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
                  Ingresos — últimos 7 días
                </h3>
                <p className="text-xs font-bold text-slate-300">Rendimiento de facturación diaria</p>
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
                  Actividad reciente
                </h3>
                <p className="text-xs font-bold text-slate-300">Últimos tickets de venta</p>
              </div>
            </div>

            <div className="p-5 space-y-2.5">
              {recentSales.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                    Aún no hay ventas registradas
                  </p>
                  <Link
                    to="/app/pos"
                    className="inline-block mt-3 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Hacer mi primera venta →
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
                          {sale.customer?.name || 'Cliente Ocasional'} • {formatDate(sale.created_at)}
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
              Ver todas las ventas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
