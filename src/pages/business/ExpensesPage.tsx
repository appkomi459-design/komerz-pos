import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Wallet,
  Building,
  User,
  Zap,
  Home,
  Users,
  ShoppingBag,
  Sparkles,
  Truck,
  Receipt,
  Filter,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import type { Expense, CashSession } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

// Categorías predefinidas comunes para retail/minimarket/carnicería
const PRESET_CATEGORIES = [
  { id: 'Servicios Básicos', label: 'Servicios (Luz, Agua, Gas, Internet)', icon: Zap, color: 'amber' },
  { id: 'Alquiler / Renta', label: 'Alquiler del Local Comercial', icon: Home, color: 'blue' },
  { id: 'Sueldos / Adelantos', label: 'Sueldos, Jornales y Adelantos', icon: Users, color: 'emerald' },
  { id: 'Insumos y Empaques', label: 'Bolsas, Papel Film, Empaques', icon: ShoppingBag, color: 'purple' },
  { id: 'Limpieza y Mantenimiento', label: 'Limpieza y Reparaciones', icon: Sparkles, color: 'teal' },
  { id: 'Transporte y Fletes', label: 'Fletes, Gasolina y Taxi', icon: Truck, color: 'indigo' },
  { id: 'Impuestos y Trámites', label: 'Patentes, Impuestos y Contador', icon: Receipt, color: 'rose' },
  { id: 'Otros Gastos', label: 'Otros Gastos Menores', icon: Tag, color: 'gray' },
];

export const ExpensesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<'month' | 'today' | 'all'>('month');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modal Registrar Gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario de Gasto
  const [category, setCategory] = useState(PRESET_CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentSource, setPaymentSource] = useState<'cash_register' | 'bank_account' | 'owner_funds'>('cash_register');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal Confirmar Eliminar
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ─────────────────────────── Carga de datos ─────────────────────────── */
  const fetchExpenses = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setExpenses((data || []) as Expense[]);
    } catch (err) {
      console.error('Error al cargar gastos:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  /* ─────────────────── Guardar Gasto y Sincronizar con Caja ───────────── */
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Ingresa un monto válido mayor a 0.');
      return;
    }
    if (!description.trim()) {
      setError('Escribe una breve descripción del gasto.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1. Insertar el gasto
      const { data: newExpense, error: expError } = await supabase
        .from('expenses')
        .insert({
          business_id: activeBusiness.id,
          user_id: profile?.id || null,
          category,
          description: description.trim(),
          amount: numAmount,
          payment_source: paymentSource,
          receipt_number: receiptNumber.trim() || null,
          paid_to: paidTo.trim() || null,
          expense_date: expenseDate,
        })
        .select()
        .single();

      if (expError) throw expError;

      // 2. Si se pagó con la caja del día, sincronizar con un movimiento de caja
      if (paymentSource === 'cash_register') {
        // Buscar si hay turno de caja abierto
        const { data: activeSession } = await supabase
          .from('cash_sessions')
          .select('id')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'open')
          .maybeSingle();

        if (activeSession) {
          await supabase.from('cash_movements').insert({
            business_id: activeBusiness.id,
            session_id: activeSession.id,
            type: 'expense',
            amount: numAmount,
            description: `Gasto: ${description.trim()} (${category})`,
            created_by: profile?.full_name || profile?.email || 'Sistema',
          });
        }
      }

      setIsModalOpen(false);
      resetForm();
      await fetchExpenses();
    } catch (err: any) {
      console.error('Error al guardar gasto:', err);
      setError(err?.message || 'Error al guardar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────── Eliminar Gasto ─────────────────────────────────── */
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setDeleting(true);
      const { error: delErr } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete.id);

      if (delErr) throw delErr;
      setExpenseToDelete(null);
      await fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el gasto.');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setCategory(PRESET_CATEGORIES[0].id);
    setDescription('');
    setAmount('');
    setPaymentSource('cash_register');
    setReceiptNumber('');
    setPaidTo('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setError(null);
  };

  /* ─────────────────── Métricas Calculadas ────────────────────────────── */
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    const thisMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const todayExpenses = expenses.filter((e) => e.expense_date === todayStr);

    const totalMonth = thisMonthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const totalToday = todayExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

    const cashExpenses = thisMonthExpenses
      .filter((e) => e.payment_source === 'cash_register')
      .reduce((acc, e) => acc + Number(e.amount), 0);

    // Mayor rubro
    const catTotals: Record<string, number> = {};
    thisMonthExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
    });

    let topCatName = 'Sin gastos';
    let topCatAmount = 0;
    Object.entries(catTotals).forEach(([cat, val]) => {
      if (val > topCatAmount) {
        topCatAmount = val;
        topCatName = cat;
      }
    });

    return {
      totalMonth,
      totalToday,
      cashExpenses,
      topCatName,
      topCatAmount,
      countMonth: thisMonthExpenses.length,
    };
  }, [expenses]);

  /* ─────────────────── Filtrado de Gastos ─────────────────────────────── */
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((e) => {
      const matchesSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.receipt_number && e.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
        (e.paid_to && e.paid_to.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesSource = sourceFilter === 'all' || e.payment_source === sourceFilter;

      let matchesPeriod = true;
      if (periodFilter === 'month') {
        const d = new Date(e.expense_date);
        matchesPeriod = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } else if (periodFilter === 'today') {
        matchesPeriod = e.expense_date === todayStr;
      }

      return matchesSearch && matchesCat && matchesSource && matchesPeriod;
    });
  }, [expenses, search, categoryFilter, sourceFilter, periodFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* CABECERA PRINCIPAL CON ESTILO CORPORATIVO                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('expenses.title', 'Gastos')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t('expenses.subtitle', 'Control de egresos y gastos operativos')}
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-800 text-white shadow-md shadow-rose-600/20 rounded-xl px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('expenses.new', 'Nuevo Gasto')}</span>
        </Button>
      </div>

      {/* ======================================================== */}
      {/* TARJETAS DE MÉTRICAS / KPIS                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total del Mes */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {t('expenses.month', 'Gastos del Mes')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              Bs {metrics.totalMonth.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {metrics.countMonth} {t('expenses.title', 'gastos')}
            </p>
          </div>
        </Card>

        {/* Gastos de Hoy */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {t('expenses.today', 'Gastos de Hoy')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
              Bs {metrics.totalToday.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Salidas de la jornada
            </p>
          </div>
        </Card>

        {/* Pagados desde Caja */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Salidas de Caja Chica
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
              Bs {metrics.cashExpenses.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              Descontado en arqueo
            </p>
          </div>
        </Card>

        {/* Mayor Rubro */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Mayor Rubro de Gasto
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 truncate" title={metrics.topCatName}>
              {metrics.topCatName}
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5 font-mono">
              {metrics.topCatAmount > 0 ? `Bs ${metrics.topCatAmount.toFixed(2)}` : 'Sin registros'}
            </p>
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE BÚSQUEDA Y FILTROS                              */}
      {/* ======================================================== */}
      <Card className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar gasto por descripción, proveedor o N° de recibo..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por Categoría */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-rose-500 transition-all cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {PRESET_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>

            {/* Filtro por Origen del Dinero */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-rose-500 transition-all cursor-pointer"
            >
              <option value="all">Todos los Orígenes</option>
              <option value="cash_register">💵 Caja Chica (Efectivo)</option>
              <option value="bank_account">🏦 Banco / Transferencia</option>
              <option value="owner_funds">👤 Fondos del Propietario</option>
            </select>

            {/* Pestañas de Período */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPeriodFilter('month')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  periodFilter === 'month'
                    ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('today')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  periodFilter === 'today'
                    ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  periodFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                Todos
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* TABLA PRINCIPAL DE GASTOS                                */}
      {/* ======================================================== */}
      <Card className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Cargando gastos operativos...
            </p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5">
              <TrendingDown className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
              {search || categoryFilter !== 'all' || sourceFilter !== 'all'
                ? 'No se encontraron gastos con los filtros seleccionados'
                : 'No tienes gastos registrados en este período'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
              Registra los pagos de luz, bolsas, alquiler y compras menores para mantener tu caja cuadrada y calcular tu ganancia real.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl px-4 py-2 cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Gasto</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/40 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Pagado A / Recibo</th>
                  <th className="py-3 px-4">Origen del Dinero</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Fecha */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-zinc-200 font-mono text-[11px]">
                        {exp.expense_date}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {formatDate(exp.created_at)}
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        <Tag className="w-3 h-3 text-rose-500" />
                        {exp.category}
                      </span>
                    </td>

                    {/* Descripción */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 dark:text-zinc-100 font-black">
                        {exp.description}
                      </div>
                    </td>

                    {/* Pagado A y Recibo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-zinc-300">
                        {exp.paid_to || '—'}
                      </div>
                      {exp.receipt_number && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Receipt className="w-2.5 h-2.5" />
                          <span>{exp.receipt_number}</span>
                        </div>
                      )}
                    </td>

                    {/* Origen del Dinero */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          exp.payment_source === 'cash_register'
                            ? 'emerald'
                            : exp.payment_source === 'bank_account'
                            ? 'blue'
                            : 'gray'
                        }
                        size="sm"
                      >
                        {exp.payment_source === 'cash_register'
                          ? '💵 Caja Chica'
                          : exp.payment_source === 'bank_account'
                          ? '🏦 Banco / QR'
                          : '👤 Fondos Propios'}
                      </Badge>
                    </td>

                    {/* Monto */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                      − Bs {Number(exp.amount).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Acción Eliminar */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVO GASTO (COMPACTO Y CENTRADO)       */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-lg p-0 overflow-hidden shadow-2xl"
        >
          {/* Cabecera estilizada compacta en Rose */}
          <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 px-5 py-3.5 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <TrendingDown className="w-4 h-4 text-rose-200" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight leading-none">
                  Registrar Gasto del Negocio
                </h3>
                <p className="text-[10px] text-rose-100/90 mt-0.5">
                  Registra salidas de dinero por servicios, alquiler, insumos o caja chica
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveExpense} className="p-4 sm:p-5 space-y-3 bg-white dark:bg-zinc-900 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Fila 1: Monto y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Monto del Gasto (Bs) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej. 150.00"
                    autoFocus
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm font-black rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Fecha del Gasto <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Categoría */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Categoría del Gasto <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 transition-all cursor-pointer"
                >
                  {PRESET_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 3: Descripción del Gasto */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Descripción / Concepto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Pago de luz del mes CRE, 5 paquetes de bolsas plásticas, etc."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>

            {/* Fila 4: Origen del Dinero (Caja vs Banco vs Propios) */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                ¿De dónde salió el dinero? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentSource('cash_register')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    paymentSource === 'cash_register'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-black'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <Wallet className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  <span className="block text-[10px] leading-tight">Caja Chica (Efectivo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentSource('bank_account')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    paymentSource === 'bank_account'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-black'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <Building className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="block text-[10px] leading-tight">Banco / Transferencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentSource('owner_funds')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    paymentSource === 'owner_funds'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-black'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <span className="block text-[10px] leading-tight">Fondos del Dueño</span>
                </button>
              </div>

              {paymentSource === 'cash_register' && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Se restará automáticamente del arqueo de caja para que el cuadre de billetes coincida.</span>
                </p>
              )}
            </div>

            {/* Fila 5: Beneficiario y N° Factura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Pagado A / Beneficiario (Opcional)
                </label>
                <input
                  type="text"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="Ej. CRE, Don Juan, Propietario"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  N° Recibo / Factura (Opcional)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Ej. FAC-8921 o Recibo #04"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 font-mono transition-all"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Registrar Gasto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN                             */}
      {/* ======================================================== */}
      {expenseToDelete && (
        <Modal
          isOpen={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          className="max-w-sm p-0 overflow-hidden shadow-2xl"
        >
          <div className="p-5 text-center bg-white dark:bg-zinc-900 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                ¿Eliminar este gasto?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Se eliminará el gasto de <strong>Bs {Number(expenseToDelete.amount).toFixed(2)}</strong> ({expenseToDelete.description}).
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteExpense}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
