import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  Smartphone,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { Sale, Product } from '@/types';

export const SellerDashboardPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockSearch, setStockSearch] = useState('');

  const sellerName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Vendedor');

  /* ─────────────────────────── Carga de datos ─────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Cargar solo las ventas de este vendedor de hoy
      const [salesRes, prodsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('*, customer:customers(*)')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed')
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, sku, sale_price, stock, unit, is_active, image_url')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      const allTodaySales = (salesRes.data || []) as Sale[];
      // Filtrar por el user_id actual si está registrado, o todas las de hoy si es único
      const mySales = user?.id
        ? allTodaySales.filter((s) => s.user_id === user.id)
        : allTodaySales;

      setSales(mySales);
      setProducts((prodsRes.data || []) as Product[]);
    } catch (err) {
      console.error('Error cargando panel de vendedor:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─────────────────── Métricas del Vendedor Hoy ──────────────────────── */
  const metrics = useMemo(() => {
    const totalSold = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const cashSales = sales.filter((s) => s.payment_method === 'cash');
    const transferSales = sales.filter((s) => s.payment_method !== 'cash');

    const totalCash = cashSales.reduce((acc, s) => acc + Number(s.total), 0);
    const totalTransfer = transferSales.reduce((acc, s) => acc + Number(s.total), 0);

    return {
      totalSold,
      ticketCount: sales.length,
      totalCash,
      totalTransfer,
      cashCount: cashSales.length,
      transferCount: transferSales.length,
    };
  }, [sales]);

  /* ─────────────────── Productos Filtrados por Buscador ───────────────── */
  const filteredProducts = useMemo(() => {
    if (!stockSearch.trim()) return products.slice(0, 8);
    const q = stockSearch.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [products, stockSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Cargando tu panel de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* CABECERA: SALUDO AL VENDEDOR & BOTÓN IR AL POS          */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold text-emerald-100 border border-white/20 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Modo Vendedor / Cajero</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            ¡Hola, {sellerName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            Turno de venta activo en {activeBusiness?.name || 'la tienda'}. ¿Listo para cobrar?
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/pos')}
          className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-black shadow-lg shadow-black/10 flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:scale-102"
        >
          <ShoppingCart className="w-5 h-5 text-emerald-600" />
          <span>Ir a Cobrar (Punto de Venta)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* MÉTRICAS PERSONALES DEL DÍA                              */}
      {/* ======================================================== */}
      {/* 2. TARJETAS KPI DEL VENDEDOR (ESTILO SUCURSALES)         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Mis Ventas de Hoy */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Mis Ventas de Hoy
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              Bs {metrics.totalSold.toFixed(2)}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
              {metrics.ticketCount} tickets emitidos
            </p>
          </div>
        </div>

        {/* Cobrado en Efectivo */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              Cobrado en Efectivo
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Banknote className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              Bs {metrics.totalCash.toFixed(2)}
            </div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">
              {metrics.cashCount} cobros en mano
            </p>
          </div>
        </div>

        {/* Transferencia / QR */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-100">
              Transferencia / QR
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              Bs {metrics.totalTransfer.toFixed(2)}
            </div>
            <p className="text-[10px] text-purple-100 font-bold mt-0.5">
              {metrics.transferCount} pagos digitales
            </p>
          </div>
        </div>

        {/* Productos en Tienda */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
              Productos en Tienda
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {products.length}
            </div>
            <p className="text-[10px] text-amber-100 font-bold mt-0.5">
              Disponibles para vender
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONSULTA RÁPIDA DE STOCK (BUSCADOR PARA CLIENTES)        */}
      {/* ======================================================== */}
      <Card className="p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <span>Consulta Rápida de Stock y Precios</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Busca productos al instante cuando un cliente pregunte precios o disponibilidad
            </p>
          </div>
        </div>

        {/* Input Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={stockSearch}
            onChange={(e) => setStockSearch(e.target.value)}
            placeholder="Escribe el nombre de un producto (ej. carne, aceite, arroz, gaseosa)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Grilla de Productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredProducts.map((p) => {
            const stockNum = Number(p.stock);
            const isOutOfStock = stockNum <= 0;
            const isLowStock = stockNum > 0 && stockNum <= 5;

            return (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60 flex flex-col justify-between space-y-2 hover:border-emerald-300 transition-all"
              >
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-zinc-200 line-clamp-2 leading-tight">
                    {p.name}
                  </span>
                  {p.sku && (
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                      {p.sku}
                    </span>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-200 dark:border-zinc-700/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Stock:</span>
                    <span
                      className={`font-mono font-black ${
                        isOutOfStock
                          ? 'text-rose-500'
                          : isLowStock
                          ? 'text-amber-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {p.stock} {p.unit || 'und'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Precio:</span>
                    <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400">
                      Bs {Number(p.sale_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ======================================================== */}
      {/* MIS VENTAS DE HOY                                        */}
      {/* ======================================================== */}
      <Card className="overflow-hidden rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Mis Ventas Cobradas Hoy ({sales.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprobantes emitidos durante tu jornada
            </p>
          </div>

          <Button
            onClick={() => navigate('/app/pos')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl px-4 py-2 cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Nueva Venta</span>
          </Button>
        </div>

        {sales.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Aún no has registrado ventas hoy</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Abre el Punto de Venta para comenzar a cobrar a los clientes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/40 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4">N° Factura</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Método de Pago</th>
                  <th className="py-2.5 px-4 text-right">Total Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(s.created_at).toLocaleTimeString('es-BO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-zinc-200">
                      {s.invoice_number}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-zinc-300">
                      {s.customer?.name || 'Cliente de paso'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                          s.payment_method === 'cash'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {s.payment_method === 'cash' ? (
                          <>
                            <Banknote className="w-2.5 h-2.5" /> Efectivo
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-2.5 h-2.5" /> Transf./QR
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      Bs {Number(s.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
