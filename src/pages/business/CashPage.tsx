import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  PlayCircle,
  StopCircle,
  Plus,
  Minus,
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Printer,
  X,
  RefreshCw,
  History,
  Calculator,
  ShoppingCart,
  Check,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/formatters';
import type { CashSession, CashMovement, Sale } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export const CashPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [pastSessions, setPastSessions] = useState<CashSession[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);

  // Modal: Abrir Turno
  const [isOpenSessionModal, setIsOpenSessionModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [savingOpen, setSavingOpen] = useState(false);

  // Modal: Cerrar Turno
  const [isCloseSessionModal, setIsCloseSessionModal] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [savingClose, setSavingClose] = useState(false);

  // Modal: Movimiento Manual
  const [isMovementModal, setIsMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDesc, setMovementDesc] = useState('');
  const [savingMovement, setSavingMovement] = useState(false);

  const cashierName = profile?.full_name || profile?.email || 'Cajero';

  /* ─── Carga ─── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

      const [sessionsRes, salesRes] = await Promise.all([
        supabase.from('cash_sessions').select('*').eq('business_id', activeBusiness.id).order('opened_at', { ascending: false }).limit(10),
        supabase.from('sales').select('*').eq('business_id', activeBusiness.id).eq('status', 'completed')
          .gte('created_at', todayStart.toISOString()).lte('created_at', todayEnd.toISOString()).order('created_at', { ascending: false }),
      ]);

      const allSessions = (sessionsRes.data || []) as CashSession[];
      const openSession = allSessions.find((s) => s.status === 'open') || null;
      setActiveSession(openSession);
      setPastSessions(allSessions.filter((s) => s.status === 'closed'));
      setTodaySales((salesRes.data || []) as Sale[]);

      if (openSession) {
        const { data: movData } = await supabase.from('cash_movements').select('*').eq('session_id', openSession.id).order('created_at', { ascending: false });
        setMovements((movData || []) as CashMovement[]);
      } else {
        setMovements([]);
      }
    } catch (err) {
      console.error('Error cargando caja:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Métricas ─── */
  const metrics = useMemo(() => {
    const cashSales     = todaySales.filter((s) => s.payment_method === 'cash');
    const transferSales = todaySales.filter((s) => s.payment_method !== 'cash');
    const totalSales    = todaySales.reduce((a, s) => a + Number(s.total), 0);
    const totalCash     = cashSales.reduce((a, s) => a + Number(s.total), 0);
    const totalTransfer = transferSales.reduce((a, s) => a + Number(s.total), 0);
    const totalChange   = todaySales.reduce((a, s) => a + Number(s.change_given || 0), 0);
    const movIncome     = movements.filter((m) => m.type === 'income').reduce((a, m) => a + Number(m.amount), 0);
    const movExpense    = movements.filter((m) => m.type === 'expense').reduce((a, m) => a + Number(m.amount), 0);
    const openBal       = Number(activeSession?.opening_balance || 0);
    const expectedCash  = openBal + totalCash + movIncome - movExpense;
    return { totalSales, totalCash, totalTransfer, totalChange, movIncome, movExpense, expectedCash, salesCount: todaySales.length, cashSalesCount: cashSales.length, transferSalesCount: transferSales.length };
  }, [todaySales, movements, activeSession]);

  /* ─── Abrir turno ─── */
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;
    try {
      setSavingOpen(true);
      const { error } = await supabase.from('cash_sessions').insert({
        business_id: activeBusiness.id, opened_by: cashierName,
        opening_balance: parseFloat(openingBalance) || 0, status: 'open',
        total_sales: 0, total_cash_sales: 0, total_transfer_sales: 0,
        total_change_given: 0, total_expenses: 0, sales_count: 0,
        notes: openingNotes.trim() || null, opened_at: new Date().toISOString(),
      });
      if (error) throw error;
      setIsOpenSessionModal(false); setOpeningBalance(''); setOpeningNotes('');
      await fetchData();
    } catch (err: any) { alert(err.message); } finally { setSavingOpen(false); }
  };

  /* ─── Cerrar turno ─── */
  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !activeBusiness?.id) return;
    try {
      setSavingClose(true);
      const closing  = parseFloat(closingBalance) || 0;
      const expected = metrics.expectedCash;
      const { error } = await supabase.from('cash_sessions').update({
        status: 'closed', closed_by: cashierName, closing_balance: closing,
        expected_balance: expected, difference: closing - expected,
        total_sales: metrics.totalSales, total_cash_sales: metrics.totalCash,
        total_transfer_sales: metrics.totalTransfer, total_change_given: metrics.totalChange,
        total_expenses: metrics.movExpense, sales_count: metrics.salesCount,
        closed_at: new Date().toISOString(), notes: closingNotes.trim() || null,
      }).eq('id', activeSession.id);
      if (error) throw error;
      setIsCloseSessionModal(false); setClosingBalance(''); setClosingNotes('');
      await fetchData();
    } catch (err: any) { alert(err.message); } finally { setSavingClose(false); }
  };

  /* ─── Movimiento manual ─── */
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;
    const amount = parseFloat(movementAmount);
    if (!amount || amount <= 0) return;
    try {
      setSavingMovement(true);
      const { error } = await supabase.from('cash_movements').insert({
        business_id: activeBusiness.id, session_id: activeSession?.id || null,
        type: movementType, amount, description: movementDesc.trim() || null, created_by: cashierName,
      });
      if (error) throw error;
      setIsMovementModal(false); setMovementAmount(''); setMovementDesc('');
      await fetchData();
    } catch (err: any) { alert(err.message); } finally { setSavingMovement(false); }
  };

  /* ─── Imprimir Reporte Z ─── */
  const handlePrintReport = () => {
    const content = `<html><head><style>body{font-family:monospace;font-size:12px;padding:20px;max-width:320px}h2{text-align:center}div{display:flex;justify-content:space-between;margin:3px 0}.sep{border-top:1px dashed #000;margin:8px 0}.total{font-weight:bold;font-size:14px}.center{text-align:center}</style></head><body>
    <h2>${activeBusiness?.name || 'Mi Negocio'}</h2>
    <p class="center">REPORTE Z — ${new Date().toLocaleDateString('es-BO')} ${new Date().toLocaleTimeString('es-BO')}</p>
    <div class="sep"></div>
    <div><span>Cajero:</span><span>${cashierName}</span></div>
    <div><span>Fondo Inicial:</span><span>Bs ${Number(activeSession?.opening_balance||0).toFixed(2)}</span></div>
    <div class="sep"></div>
    <div><span>Total Ventas:</span><span>Bs ${metrics.totalSales.toFixed(2)}</span></div>
    <div><span>Efectivo:</span><span>Bs ${metrics.totalCash.toFixed(2)}</span></div>
    <div><span>Transferencia/QR:</span><span>Bs ${metrics.totalTransfer.toFixed(2)}</span></div>
    <div><span>N° de Ventas:</span><span>${metrics.salesCount}</span></div>
    <div><span>Cambio Dado:</span><span>Bs ${metrics.totalChange.toFixed(2)}</span></div>
    <div class="sep"></div>
    <div><span>Entradas Manuales:</span><span>+ Bs ${metrics.movIncome.toFixed(2)}</span></div>
    <div><span>Salidas / Gastos:</span><span>- Bs ${metrics.movExpense.toFixed(2)}</span></div>
    <div class="sep"></div>
    <div class="total"><span>EFECTIVO ESPERADO:</span><span>Bs ${metrics.expectedCash.toFixed(2)}</span></div>
    <div class="sep"></div>
    <p class="center">¡Gracias por usar Komerz POS!</p>
    </body></html>`;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) { win.document.write(content); win.document.close(); win.print(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-500">Cargando Caja...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-12">

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100">{t('cash.title', 'Control de Caja')}</h1>
            <p className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={fetchData} title="Actualizar" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" onClick={handlePrintReport} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Printer className="w-3.5 h-3.5" /><span>Reporte Z</span>
          </button>
          {activeSession ? (
            <>
              <button type="button" onClick={() => { setMovementType('income'); setIsMovementModal(true); }} className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-800">
                <Plus className="w-3.5 h-3.5" /><span>Entrada</span>
              </button>
              <button type="button" onClick={() => { setMovementType('expense'); setIsMovementModal(true); }} className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-800">
                <Minus className="w-3.5 h-3.5" /><span>Salida</span>
              </button>
              <button type="button" onClick={() => setIsCloseSessionModal(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs">
                <StopCircle className="w-3.5 h-3.5" /><span>{t('cash.close', 'Cerrar Turno')}</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsOpenSessionModal(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs">
              <PlayCircle className="w-3.5 h-3.5" /><span>{t('cash.open', 'Abrir Turno')}</span>
            </button>
          )}
        </div>
      </div>

      {/* BANNER ESTADO TURNO */}
      {activeSession ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">{t('cash.open_now', 'Turno Abierto')}</span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Abierto por <strong>{activeSession.opened_by}</strong> · Desde las {new Date(activeSession.opened_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Fondo Inicial</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              Bs {Number(activeSession.opening_balance).toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <span className="text-sm font-black text-amber-800 dark:text-amber-300">No hay turno abierto</span>
            <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70">Abre un turno para registrar el fondo inicial y controlar el efectivo del día.</p>
          </div>
        </div>
      )}

      {/* MÉTRICAS DEL DÍA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total del día */}
        <Card className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Vendido Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">Bs {metrics.totalSales.toFixed(2)}</div>
          <p className="text-[10px] text-slate-400 mt-1">{metrics.salesCount} {metrics.salesCount === 1 ? 'venta' : 'ventas'} completadas</p>
        </Card>

        {/* Efectivo */}
        <Card className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cobrado en Efectivo</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-600 flex items-center justify-center"><Banknote className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-zinc-100 font-mono">Bs {metrics.totalCash.toFixed(2)}</div>
          <p className="text-[10px] text-slate-400 mt-1">{metrics.cashSalesCount} ventas en efectivo</p>
        </Card>

        {/* Transferencia */}
        <Card className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transferencia / QR</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center"><Smartphone className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-zinc-100 font-mono">Bs {metrics.totalTransfer.toFixed(2)}</div>
          <p className="text-[10px] text-slate-400 mt-1">{metrics.transferSalesCount} ventas digitales</p>
        </Card>

        {/* Cambio dado */}
        <Card className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cambio / Vuelto Dado</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center"><Calculator className="w-4 h-4" /></div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">Bs {metrics.totalChange.toFixed(2)}</div>
          <p className="text-[10px] text-slate-400 mt-1">Vuelto entregado a clientes</p>
        </Card>
      </div>

      {/* ARQUEO + MOVIMIENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Arqueo */}
        <Card className="lg:col-span-1 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />Arqueo de Caja
          </h3>
          <div className="space-y-2 text-xs font-bold">
            {[
              { label: 'Fondo Inicial', value: `+ Bs ${Number(activeSession?.opening_balance||0).toFixed(2)}`, color: 'text-slate-600 dark:text-zinc-400' },
              { label: 'Ventas en Efectivo', value: `+ Bs ${metrics.totalCash.toFixed(2)}`, color: 'text-emerald-600' },
              { label: 'Entradas Manuales', value: `+ Bs ${metrics.movIncome.toFixed(2)}`, color: 'text-blue-600' },
              { label: 'Salidas / Gastos', value: `− Bs ${metrics.movExpense.toFixed(2)}`, color: 'text-rose-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">{label}</span>
                <span className={`font-mono ${color}`}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 mt-1">
              <span className="font-black text-emerald-800 dark:text-emerald-300">Efectivo Esperado</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">Bs {metrics.expectedCash.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Movimientos manuales */}
        <Card className="lg:col-span-2 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-blue-600" />Movimientos Manuales
            </h3>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => { setMovementType('income'); setIsMovementModal(true); }} className="px-2 py-1 text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 cursor-pointer flex items-center gap-1">
                <Plus className="w-3 h-3" />Entrada
              </button>
              <button type="button" onClick={() => { setMovementType('expense'); setIsMovementModal(true); }} className="px-2 py-1 text-[10px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 cursor-pointer flex items-center gap-1">
                <Minus className="w-3 h-3" />Salida
              </button>
            </div>
          </div>

          {movements.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl">
              <ArrowUpCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Sin movimientos en este turno</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Registra entradas (fondos extra) o salidas (gastos menores).</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {movements.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold ${m.type === 'income' ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/50' : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/50'}`}>
                  <div className="flex items-center gap-2">
                    {m.type === 'income' ? <ArrowUpCircle className="w-4 h-4 text-blue-600" /> : <ArrowDownCircle className="w-4 h-4 text-rose-500" />}
                    <div>
                      <p className={m.type === 'income' ? 'text-blue-800 dark:text-blue-300' : 'text-rose-800 dark:text-rose-300'}>{m.description || (m.type === 'income' ? 'Entrada de efectivo' : 'Salida de efectivo')}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(m.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}{m.created_by ? ` · ${m.created_by}` : ''}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-black ${m.type === 'income' ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.type === 'income' ? '+' : '−'} Bs {Number(m.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* HISTORIAL VENTAS DEL DÍA */}
      <Card className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />Ventas del Día ({todaySales.length})
          </h3>
          <span className="text-xs font-black text-emerald-600 font-mono">Bs {metrics.totalSales.toFixed(2)} total</span>
        </div>
        {todaySales.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">No hay ventas registradas hoy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/40 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Hora</th>
                  <th className="py-2.5 px-4">N° Factura</th>
                  <th className="py-2.5 px-4">Método</th>
                  <th className="py-2.5 px-4 text-right">Total Venta</th>
                  <th className="py-2.5 px-4 text-right">Recibido</th>
                  <th className="py-2.5 px-4 text-right">Vuelto/Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                {todaySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{new Date(sale.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-zinc-300 text-[11px]">{sale.invoice_number}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${sale.payment_method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'}`}>
                        {sale.payment_method === 'cash' ? <><Banknote className="w-2.5 h-2.5" />Efectivo</> : <><Smartphone className="w-2.5 h-2.5" />Transf./QR</>}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 dark:text-zinc-100">Bs {Number(sale.total).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">{sale.amount_received ? `Bs ${Number(sale.amount_received).toFixed(2)}` : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-black">{Number(sale.change_given||0) > 0 ? `Bs ${Number(sale.change_given).toFixed(2)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* HISTORIAL TURNOS CERRADOS */}
      {pastSessions.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />Historial de Turnos Cerrados
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {pastSessions.slice(0, 5).map((session) => {
              const diff = Number(session.difference || 0);
              return (
                <div key={session.id} className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800 dark:text-zinc-200">{new Date(session.opened_at).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {new Date(session.opened_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })} → {session.closed_at ? new Date(session.closed_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—'} · <strong>{session.opened_by}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Ventas</p>
                      <p className="font-mono font-black text-emerald-600">Bs {Number(session.total_sales).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Efectivo Contado</p>
                      <p className="font-mono font-black text-slate-800 dark:text-zinc-100">Bs {Number(session.closing_balance||0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Diferencia</p>
                      <p className={`font-mono font-black ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        {diff >= 0 ? '+' : ''}Bs {diff.toFixed(2)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${diff === 0 ? 'bg-emerald-100 text-emerald-800' : diff > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                      {diff === 0 ? '✓ Cuadrada' : diff > 0 ? '↑ Sobrante' : '↓ Faltante'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* MODAL: ABRIR TURNO */}
      {isOpenSessionModal && (
        <Modal isOpen={isOpenSessionModal} onClose={() => setIsOpenSessionModal(false)} className="max-w-sm p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PlayCircle className="w-5 h-5 text-emerald-200" />
              <div>
                <h3 className="text-sm font-black">Abrir Turno de Caja</h3>
                <p className="text-[10px] text-emerald-100/80">Ingresa el dinero físico disponible para iniciar</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpenSessionModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleOpenSession} className="p-5 space-y-3 bg-white dark:bg-zinc-900">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                Fondo Inicial (Bs) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min="0" step="0.01" required value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Ej. 200.00" autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm font-black rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Dinero en billetes y monedas para dar cambio a clientes.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Cajero</label>
              <input type="text" value={cashierName} readOnly className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Observación (Opcional)</label>
              <input type="text" value={openingNotes} onChange={(e) => setOpeningNotes(e.target.value)} placeholder="Ej. Turno de mañana, fondo correcto"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button type="button" onClick={() => setIsOpenSessionModal(false)} className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-zinc-700 rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" disabled={savingOpen} className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5" />{savingOpen ? 'Abriendo...' : 'Abrir Turno'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CERRAR TURNO */}
      {isCloseSessionModal && (
        <Modal isOpen={isCloseSessionModal} onClose={() => setIsCloseSessionModal(false)} className="max-w-sm p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StopCircle className="w-5 h-5 text-rose-200" />
              <div>
                <h3 className="text-sm font-black">Cerrar Turno — Arqueo Ciego</h3>
                <p className="text-[10px] text-rose-100/80">Cuenta el efectivo físico y compara con lo esperado</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsCloseSessionModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCloseSession} className="p-5 space-y-3 bg-white dark:bg-zinc-900">
            {/* Resumen rápido */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1.5 text-xs font-bold">
              {[
                ['Fondo Inicial', `Bs ${Number(activeSession?.opening_balance||0).toFixed(2)}`, 'text-slate-600'],
                ['Ventas Efectivo', `+ Bs ${metrics.totalCash.toFixed(2)}`, 'text-emerald-600'],
                ['Entradas Manuales', `+ Bs ${metrics.movIncome.toFixed(2)}`, 'text-blue-600'],
                ['Salidas / Gastos', `− Bs ${metrics.movExpense.toFixed(2)}`, 'text-rose-500'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>{label}</span><span className={`font-mono ${color}`}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-slate-800 dark:text-zinc-100 pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span>Efectivo Esperado</span>
                <span className="font-mono text-emerald-600">Bs {metrics.expectedCash.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                Efectivo Físico Contado (Bs) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min="0" step="0.01" required value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} placeholder="Cuenta los billetes y monedas..." autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm font-black rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-mono" />
              </div>
              {closingBalance && (() => {
                const counted = parseFloat(closingBalance);
                const diff = counted - metrics.expectedCash;
                const isExact = Math.abs(diff) < 0.01;
                return (
                  <div className={`mt-2 p-2 rounded-lg text-xs font-black flex items-center gap-2 ${isExact ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : diff > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {isExact ? <><Check className="w-3.5 h-3.5" />¡Caja cuadrada! Sin diferencias.</> : diff > 0 ? <><ArrowUpCircle className="w-3.5 h-3.5" />Sobrante de Bs {diff.toFixed(2)}</> : <><AlertTriangle className="w-3.5 h-3.5" />Faltante de Bs {Math.abs(diff).toFixed(2)}</>}
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Observación (Opcional)</label>
              <input type="text" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Ej. Todo correcto, sin novedades"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button type="button" onClick={() => setIsCloseSessionModal(false)} className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-zinc-700 rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" disabled={savingClose} className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-black rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                <StopCircle className="w-3.5 h-3.5" />{savingClose ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: MOVIMIENTO MANUAL */}
      {isMovementModal && (
        <Modal isOpen={isMovementModal} onClose={() => setIsMovementModal(false)} className="max-w-sm p-0 overflow-hidden shadow-2xl">
          <div className={`px-5 py-4 text-white flex items-center justify-between ${movementType === 'income' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-rose-600 to-rose-700'}`}>
            <div className="flex items-center gap-2.5">
              {movementType === 'income' ? <ArrowUpCircle className="w-5 h-5 text-blue-200" /> : <ArrowDownCircle className="w-5 h-5 text-rose-200" />}
              <div>
                <h3 className="text-sm font-black">{movementType === 'income' ? 'Registrar Entrada de Efectivo' : 'Registrar Salida de Efectivo'}</h3>
                <p className="text-[10px] text-white/70">{movementType === 'income' ? 'Fondos extra, préstamos o depósitos' : 'Gastos menores, retiros o pagos'}</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsMovementModal(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSaveMovement} className="p-5 space-y-3 bg-white dark:bg-zinc-900">
            <div className="flex gap-2">
              {(['income', 'expense'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setMovementType(t)}
                  className={`flex-1 py-2 text-xs font-black rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${movementType === t ? (t === 'income' ? 'bg-blue-600 text-white border-blue-600' : 'bg-rose-600 text-white border-rose-600') : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t === 'income' ? <><Plus className="w-3.5 h-3.5" />Entrada</> : <><Minus className="w-3.5 h-3.5" />Salida</>}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Monto (Bs) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min="0.01" step="0.01" required value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} placeholder="0.00" autoFocus
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm font-black rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">Concepto / Descripción</label>
              <input type="text" value={movementDesc} onChange={(e) => setMovementDesc(e.target.value)}
                placeholder={movementType === 'income' ? 'Ej. Fondo adicional del propietario' : 'Ej. Pago de delivery, bolsas'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button type="button" onClick={() => setIsMovementModal(false)} className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-zinc-700 rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" disabled={savingMovement} className={`px-4 py-1.5 text-white text-xs font-black rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${movementType === 'income' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                <Check className="w-3.5 h-3.5" />{savingMovement ? 'Guardando...' : (movementType === 'income' ? 'Registrar Entrada' : 'Registrar Salida')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
