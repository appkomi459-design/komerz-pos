import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Printer,
  ShoppingBag,
  Award,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Tag,
  Package,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import type { Sale, Purchase, Expense, Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExtendedSaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export const ReportsPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'last_month' | 'all'>('month');

  // Datos cargados
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<ExtendedSaleItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  /* ─────────────────────────── Carga de datos ─────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      const [salesRes, itemsRes, purchasesRes, expensesRes, productsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('*, customer:customers(*)')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase
          .from('sale_items')
          .select('*, product:products(*)')
          .order('id', { ascending: false }),
        supabase
          .from('purchases')
          .select('*, items:purchase_items(*)')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('expense_date', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('business_id', activeBusiness.id),
      ]);

      if (salesRes.data) setSales(salesRes.data as Sale[]);
      if (itemsRes.data) setSaleItems(itemsRes.data as ExtendedSaleItem[]);
      if (purchasesRes.data) setPurchases(purchasesRes.data as Purchase[]);
      if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─────────────────── Filtrado por Período de Tiempo ─────────────────── */
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'all') {
      startDate = new Date(2020, 0, 1);
    }

    return { startDate, endDate };
  }, [period]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = new Date(s.created_at);
      return d >= dateRange.startDate && d <= dateRange.endDate;
    });
  }, [sales, dateRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const d = new Date(p.created_at);
      return d >= dateRange.startDate && d <= dateRange.endDate;
    });
  }, [purchases, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.expense_date);
      return d >= dateRange.startDate && d <= dateRange.endDate;
    });
  }, [expenses, dateRange]);

  // Ítems de venta correspondientes a las ventas filtradas
  const filteredSaleItems = useMemo(() => {
    const validSaleIds = new Set(filteredSales.map((s) => s.id));
    return saleItems.filter((item) => validSaleIds.has(item.sale_id));
  }, [filteredSales, saleItems]);

  /* ─────────────────── Métricas Financieras Consolidadas ──────────────── */
  const financialSummary = useMemo(() => {
    // 1. Total Ventas (Ingresos)
    const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(s.total), 0);

    // 2. Costo de Mercadería Vendida (COGS)
    // Para cada producto vendido, multiplicamos su cantidad por su costo unitario
    const productsMap = new Map(products.map((p) => [p.id, p]));
    const totalCostOfGoods = filteredSaleItems.reduce((acc, item) => {
      const prod = item.product || (item.product_id ? productsMap.get(item.product_id) : null);
      const unitCost = prod?.cost_price ? Number(prod.cost_price) : 0;
      return acc + item.quantity * unitCost;
    }, 0);

    // 3. Ganancia Bruta (Ventas - Costo de productos)
    const grossProfit = totalRevenue - totalCostOfGoods;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 4. Gastos Operativos (Luz, Alquiler, Bolsas, Sueldos)
    const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // 5. Ganancia Neta Limpia (Lo que queda en el bolsillo)
    const netProfit = grossProfit - totalOperatingExpenses;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 6. Inversión en Reposición de Stock (Compras a proveedores en este período)
    const totalPurchasesAmount = filteredPurchases.reduce((acc, p) => acc + Number(p.total), 0);

    return {
      totalRevenue,
      totalCostOfGoods,
      grossProfit,
      grossMarginPct,
      totalOperatingExpenses,
      netProfit,
      netMarginPct,
      totalPurchasesAmount,
      salesCount: filteredSales.length,
      averageTicket: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0,
    };
  }, [filteredSales, filteredSaleItems, filteredExpenses, filteredPurchases, products]);

  /* ─────────────────── Ranking: Top Productos Más Vendidos ───────────── */
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; cost: number; category?: string }> = {};

    filteredSaleItems.forEach((item) => {
      const prod = item.product || products.find((p) => p.id === item.product_id);
      const name = prod?.name || 'Producto';
      const key = item.product_id || name;

      if (!map[key]) {
        map[key] = {
          name,
          quantity: 0,
          revenue: 0,
          cost: prod?.cost_price ? Number(prod.cost_price) : 0,
        };
      }
      map[key].quantity += Number(item.quantity);
      map[key].revenue += Number(item.total_price);
    });

    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const maxRevenue = list[0]?.revenue || 1;

    return list.slice(0, 10).map((item, index) => {
      const profit = item.revenue - item.quantity * item.cost;
      const marginPct = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
      const sharePct = (item.revenue / maxRevenue) * 100;
      return {
        rank: index + 1,
        ...item,
        profit,
        marginPct,
        sharePct,
      };
    });
  }, [filteredSaleItems, products]);

  /* ─────────────────── Ventas por Método de Pago ──────────────────────── */
  const paymentMethodStats = useMemo(() => {
    const cashSales = filteredSales.filter((s) => s.payment_method === 'cash');
    const transferSales = filteredSales.filter((s) => s.payment_method !== 'cash');

    const cashTotal = cashSales.reduce((acc, s) => acc + Number(s.total), 0);
    const transferTotal = transferSales.reduce((acc, s) => acc + Number(s.total), 0);
    const total = cashTotal + transferTotal || 1;

    return {
      cash: {
        total: cashTotal,
        count: cashSales.length,
        pct: (cashTotal / total) * 100,
      },
      transfer: {
        total: transferTotal,
        count: transferSales.length,
        pct: (transferTotal / total) * 100,
      },
    };
  }, [filteredSales]);

  /* ─────────────────── Horarios Pico de Venta ─────────────────────────── */
  const peakHours = useMemo(() => {
    // Agrupación en 6 franjas horarias comunes
    const slots = [
      { id: 'morning_early', label: '08:00 - 10:00', period: 'Mañana Temprano', count: 0, total: 0 },
      { id: 'morning_mid', label: '10:00 - 12:00', period: 'Media Mañana', count: 0, total: 0 },
      { id: 'lunch', label: '12:00 - 14:00', period: 'Mediodía / Almuerzo', count: 0, total: 0 },
      { id: 'afternoon', label: '14:00 - 17:00', period: 'Tarde', count: 0, total: 0 },
      { id: 'evening', label: '17:00 - 20:00', period: 'Noche / Salida', count: 0, total: 0 },
      { id: 'night', label: '20:00 - 23:00', period: 'Cierre', count: 0, total: 0 },
    ];

    filteredSales.forEach((s) => {
      const hour = new Date(s.created_at).getHours();
      const amount = Number(s.total);

      if (hour >= 8 && hour < 10) {
        slots[0].count++; slots[0].total += amount;
      } else if (hour >= 10 && hour < 12) {
        slots[1].count++; slots[1].total += amount;
      } else if (hour >= 12 && hour < 14) {
        slots[2].count++; slots[2].total += amount;
      } else if (hour >= 14 && hour < 17) {
        slots[3].count++; slots[3].total += amount;
      } else if (hour >= 17 && hour < 20) {
        slots[4].count++; slots[4].total += amount;
      } else {
        slots[5].count++; slots[5].total += amount;
      }
    });

    const maxCount = Math.max(...slots.map((s) => s.count), 1);
    return slots.map((s) => ({
      ...s,
      pct: (s.count / maxCount) * 100,
    }));
  }, [filteredSales]);

  /* ─────────────────── Desglose de Gastos por Categoría ───────────────── */
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        pct: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  /* ─────────────────── Exportación a CSV ──────────────────────────────── */
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert('No hay ventas para exportar en este período.');
      return;
    }

    const headers = ['Nro Factura', 'Fecha y Hora', 'Cliente', 'Metodo de Pago', 'Subtotal (Bs)', 'Total (Bs)'];
    const rows = filteredSales.map((s) => [
      `"${s.invoice_number}"`,
      `"${formatDate(s.created_at)}"`,
      `"${s.customer?.name || 'Consumidor Final'}"`,
      `"${s.payment_method}"`,
      Number(s.subtotal).toFixed(2),
      Number(s.total).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ─────────────────── Impresión de Reporte Ejecutivo ─────────────────── */
  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Generando analíticas y estado financiero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14 print:p-0">
      {/* ======================================================== */}
      {/* CABECERA & SELECTOR DE PERÍODO                          */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('reports.title', 'Reportes')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t('reports.subtitle', 'Análisis de ventas, inventario y finanzas')}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            type="button"
            onClick={fetchData}
            title="Actualizar datos"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-xs font-bold rounded-xl px-3 py-2 flex items-center gap-1.5 cursor-pointer border-slate-200 dark:border-zinc-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('common.export', 'Exportar')} CSV</span>
          </Button>

          <Button
            onClick={handlePrintReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t('common.print', 'Imprimir Reporte')}</span>
          </Button>
        </div>
      </div>

      {/* Selector de Período */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex-wrap gap-2 print:hidden">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t('common.date', 'Período')}:</span>
        </span>

        <div className="flex items-center gap-1 flex-wrap">
          {[
            { id: 'today', label: t('reports.today', 'Hoy') },
            { id: 'week', label: t('reports.week', 'Esta Semana') },
            { id: 'month', label: t('reports.month', 'Este Mes') },
            { id: 'last_month', label: t('reports.month', 'Mes Anterior') },
            { id: 'all', label: t('reports.historical', 'Histórico') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 1: ESTADO DE RESULTADOS (GANANCIA LIMPIA)        */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Estado Financiero Consolidado ({period === 'month' ? 'Este Mes' : period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : 'Período'})</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            Basado en {financialSummary.salesCount} ventas y {filteredExpenses.length} gastos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. VENTAS TOTALES (Azul Cobalto) */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
                (+) Bruto
              </span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
                <polyline points="16,52 26,38 36,42 46,28 56,20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="56" cy="20" r="4" fill="white"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
              Bs {financialSummary.totalRevenue.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
              1. Ventas Totales
            </p>
            <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10 font-mono">
              Ticket prom: Bs {financialSummary.averageTicket.toFixed(2)}
            </p>
          </div>

          {/* 2. COSTO MERCADERÍA (Ámbar / Naranja) */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#f2994a] to-[#f2c94c] text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
                (−) Costo
              </span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
                <path d="M22 26h28l-4 26H26L22 26z" stroke="white" strokeWidth="3" fill="none"/>
                <path d="M30 26V20a6 6 0 0 1 12 0v6" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
              − Bs {financialSummary.totalCostOfGoods.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
              2. Costo Mercadería
            </p>
            <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
              Reposición de inventario
            </p>
          </div>

          {/* 3. GASTOS OPERATIVOS (Rojo Carmesí) */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#eb3349] to-[#f45c43] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
                (−) Egresos
              </span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
                <polyline points="16,24 26,38 36,34 46,48 56,56" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="56" cy="56" r="4" fill="white"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
              − Bs {financialSummary.totalOperatingExpenses.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
              3. Gastos Operativos
            </p>
            <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
              Luz, bolsas, sueldos
            </p>
          </div>

          {/* 4. GANANCIA LIMPIA REAL (Verde Esmeralda) */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
                {financialSummary.netMarginPct.toFixed(1)}% Margen
              </span>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
              <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
                <circle cx="36" cy="36" r="16" stroke="white" strokeWidth="3" fill="none"/>
                <path d="M36 28v16M30 32h10a2 2 0 0 1 0 4H32a2 2 0 0 0 0 4h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
              Bs {financialSummary.netProfit.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
              4. Ganancia Limpia Real
            </p>
            <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
              Utilidad neta disponible
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 2: TOP PRODUCTOS MÁS VENDIDOS                    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top 10 Productos Más Vendidos</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Por volumen e ingresos</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Sin ventas en este período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        p.rank === 1
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : p.rank === 2
                          ? 'bg-slate-300 text-slate-800'
                          : p.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}>
                        {p.rank}
                      </span>
                      <span className="font-black text-slate-900 dark:text-zinc-100">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({p.quantity} unds vendidas)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="font-black text-slate-900 dark:text-zinc-100">
                        Bs {p.revenue.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        +{p.marginPct.toFixed(0)}% ganancia
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso relativo */}
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(p.sharePct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ======================================================== */}
        {/* SECCIÓN 3: MÉTODOS DE PAGO & GASTOS                     */}
        {/* ======================================================== */}
        <div className="space-y-5">
          {/* Métodos de Pago */}
          <Card className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Ventas por Método de Pago</span>
            </h3>

            <div className="space-y-3">
              {/* Barra combinada */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-zinc-800">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${paymentMethodStats.cash.pct}%` }}
                  title={`Efectivo: ${paymentMethodStats.cash.pct.toFixed(0)}%`}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${paymentMethodStats.transfer.pct}%` }}
                  title={`Transferencia/QR: ${paymentMethodStats.transfer.pct.toFixed(0)}%`}
                />
              </div>

              {/* Leyenda Efectivo */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-black text-emerald-900 dark:text-emerald-200">Efectivo</span>
                    <p className="text-[10px] text-slate-400">{paymentMethodStats.cash.count} pagos</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                    Bs {paymentMethodStats.cash.total.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-emerald-600 font-bold">
                    {paymentMethodStats.cash.pct.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Leyenda Transferencia */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-black text-blue-900 dark:text-blue-200">Transferencia / QR</span>
                    <p className="text-[10px] text-slate-400">{paymentMethodStats.transfer.count} pagos</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-blue-700 dark:text-blue-300">
                    Bs {paymentMethodStats.transfer.total.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-blue-600 font-bold">
                    {paymentMethodStats.transfer.pct.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Desglose de Gastos */}
          <Card className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-500" />
              <span>Gastos por Categoría</span>
            </h3>

            {expensesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Sin gastos en este período.</p>
            ) : (
              <div className="space-y-2">
                {expensesByCategory.slice(0, 4).map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-700 dark:text-zinc-300">{c.category}</span>
                      <span className="font-mono text-rose-600 font-black">
                        Bs {c.amount.toFixed(2)} ({c.pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 4: HORARIOS PICO DE VENTA                       */}
      {/* ======================================================== */}
      <Card className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Horarios Pico de Atención y Ventas</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Identifica a qué horas ingresan más clientes para reforzar la atención en caja
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {peakHours.map((slot) => (
            <div
              key={slot.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 text-center space-y-1.5"
            >
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 block">
                {slot.label}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block truncate" title={slot.period}>
                {slot.period}
              </span>

              {/* Barra de actividad vertical o indicador */}
              <div className="w-full bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(slot.pct, 5)}%` }}
                />
              </div>

              <div className="pt-1">
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block font-mono">
                  {slot.count}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  Bs {slot.total.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
