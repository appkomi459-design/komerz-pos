import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Plus,
  Phone,
  Mail,
  MapPin,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  CreditCard,
  MessageCircle,
  User,
  Sparkles,
  AlertTriangle,
  X,
  ShoppingBag,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Customer, Sale } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export const CustomersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { t } = useLanguage();
  const currency = activeBusiness?.currency || 'BOB';
  const navigate = useNavigate();

  // ── ESTADO DE CLIENTES ──
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilterTab, setCustomerFilterTab] = useState<'all' | 'with_nit' | 'with_phone'>('all');

  // Modal Crear / Editar Cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Modal Eliminar Cliente
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  // Mapa de compras por cliente
  const [customerSpendingMap, setCustomerSpendingMap] = useState<
    Map<string, { totalSpent: number; salesCount: number }>
  >(new Map());

  // Feedback copiar portapapeles
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cargar clientes y cálculo rápido de compras
  const fetchCustomers = async () => {
    if (!activeBusiness) return;
    try {
      setLoadingCustomers(true);

      const [custRes, salesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('sales')
          .select('id, customer_id, total')
          .eq('business_id', activeBusiness.id)
      ]);

      if (custRes.data) {
        setCustomers(custRes.data as Customer[]);
      }

      if (salesRes.data && custRes.data) {
        const spending = new Map<string, { totalSpent: number; salesCount: number }>();
        salesRes.data.forEach((s: any) => {
          if (s.customer_id) {
            const prev = spending.get(s.customer_id) || { totalSpent: 0, salesCount: 0 };
            spending.set(s.customer_id, {
              totalSpent: prev.totalSpent + (s.total || 0),
              salesCount: prev.salesCount + 1,
            });
          }
        });
        setCustomerSpendingMap(spending);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeBusiness]);

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setIdentification('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsCustomerModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name || '');
    setIdentification(c.identification || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setIsCustomerModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !name.trim()) return;

    try {
      setSavingCustomer(true);
      const payload = {
        business_id: activeBusiness.id,
        name: name.trim(),
        identification: identification.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        is_active: true,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(payload);
        if (error) throw error;
      }

      setIsCustomerModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      alert(`Error al guardar cliente: ${err.message || 'Inténtelo de nuevo'}`);
    } finally {
      setSavingCustomer(false);
    }
  };

  // Eliminar cliente
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setDeletingCustomer(true);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      setCustomerToDelete(null);
      await fetchCustomers();
    } catch (err: any) {
      alert(`No se pudo eliminar el cliente: ${err.message || 'Inténtelo de nuevo'}`);
    } finally {
      setDeletingCustomer(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'CL';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getAvatarGradient = (str: string) => {
    const colors = [
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.length === 8) {
      return `591${clean}`;
    }
    return clean;
  };

  const customerStats = useMemo(() => {
    const total = customers.length;
    const withNit = customers.filter((c) => Boolean(c.identification && c.identification.trim())).length;
    const withPhone = customers.filter((c) => Boolean(c.phone && c.phone.trim())).length;
    return { total, withNit, withPhone };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const query = customerSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        (c.identification && c.identification.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (customerFilterTab === 'with_nit') return Boolean(c.identification && c.identification.trim());
      if (customerFilterTab === 'with_phone') return Boolean(c.phone && c.phone.trim());
      return true;
    });
  }, [customers, customerSearch, customerFilterTab]);

  return (
    <div className="space-y-6">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('customers.title', 'Clientes')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 pl-10">
            {t('customers.subtitle', 'Registro y gestión de clientes')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Acceso Rápido al módulo Registro Ventas Clientes */}
          <button
            type="button"
            onClick={() => navigate('/app/customer-sales')}
            className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>{t('customer_sales.title', 'Ventas a Clientes')}</span>
          </button>

          {/* Botón Nuevo Cliente */}
          <Button
            onClick={handleOpenCreateModal}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-600/20 font-black cursor-pointer"
            icon={<UserPlus className="w-4 h-4" />}
          >
            {t('customers.new', 'Nuevo Cliente')}
          </Button>
        </div>
      </div>

      {/* ── TARJETAS DE MÉTRICAS DE CLIENTES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {t('customers.total', 'Total Clientes')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-0.5 font-mono">
              {customerStats.total}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              {t('panel.customers_registered', 'Registrados')}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {t('customers.tax_id', 'NIT / CI')}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
                {customerStats.withNit}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                {customerStats.total > 0 ? Math.round((customerStats.withNit / customerStats.total) * 100) : 0}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              {t('settings.billing_title', 'Facturación')}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {t('customers.phone', 'Teléfono')} / WhatsApp
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
                {customerStats.withPhone}
              </span>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md">
                {customerStats.total > 0 ? Math.round((customerStats.withPhone / customerStats.total) * 100) : 0}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              {t('common.active', 'Contacto')}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* ── BUSCADOR Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Buscar por nombre, NIT / CI, celular o correo..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {customerSearch && (
            <button
              onClick={() => setCustomerSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setCustomerFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              customerFilterTab === 'all'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {customerStats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerFilterTab('with_nit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              customerFilterTab === 'with_nit'
                ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Con NIT/CI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {customerStats.withNit}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerFilterTab('with_phone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              customerFilterTab === 'with_phone'
                ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Con Celular</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {customerStats.withPhone}
            </span>
          </button>
        </div>
      </div>

      {/* ── TABLA DE CLIENTES ── */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
        {loadingCustomers ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Cargando directorio de clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
              {customerSearch ? 'No se encontraron clientes coincidentes' : 'No tienes clientes registrados aún'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              {customerSearch
                ? `No hay resultados para "${customerSearch}". Intenta con otro término o limpia el buscador.`
                : 'Registra a tus clientes habituales para asociarlos rápidamente a sus compras y notas de venta fiscales.'}
            </p>
            {customerSearch ? (
              <button
                onClick={() => setCustomerSearch('')}
                className="mt-4 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Limpiar Búsqueda
              </button>
            ) : (
              <Button
                onClick={handleOpenCreateModal}
                size="sm"
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white font-black cursor-pointer shadow-md shadow-amber-500/20"
                icon={<Plus className="w-4 h-4" />}
              >
                Registrar Primer Cliente
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800 font-black text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Cliente / Razón Social</th>
                  <th className="px-5 py-3.5">NIT / CI</th>
                  <th className="px-5 py-3.5">Contacto (WhatsApp / Celular)</th>
                  <th className="px-5 py-3.5">Compras Acumuladas</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredCustomers.map((c) => {
                  const initials = getInitials(c.name);
                  const gradient = getAvatarGradient(c.name);
                  const isCopied = copiedId === c.id;
                  const spending = customerSpendingMap.get(c.id);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Cliente */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0 tracking-wider`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 dark:text-zinc-100 text-xs">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                              Registrado el {formatDate(c.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* NIT / CI */}
                      <td className="px-5 py-3.5">
                        {c.identification ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-zinc-700">
                            <span className="font-mono text-xs font-black text-slate-800 dark:text-zinc-200">
                              {c.identification}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.identification!, c.id)}
                              title="Copiar NIT/CI"
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px] italic">Sin NIT/CI</span>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="px-5 py-3.5">
                        {c.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${c.phone}`}
                              className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-emerald-600 transition-colors"
                            >
                              {c.phone}
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhoneForWhatsApp(c.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chatear por WhatsApp"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-[10px] font-black hover:bg-emerald-200 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : c.email ? (
                          <span className="text-xs text-slate-600 dark:text-zinc-400 truncate max-w-[150px] inline-block">
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Compras Acumuladas */}
                      <td className="px-5 py-3.5">
                        {spending && spending.salesCount > 0 ? (
                          <div className="space-y-0.5">
                            <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                              {formatCurrency(spending.totalSpent, currency)}
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate(`/app/customer-sales?customer=${c.id}`)}
                              className="text-[10px] text-slate-500 hover:text-emerald-600 font-bold underline flex items-center gap-1 cursor-pointer"
                              title="Ver compras de este cliente en el módulo Ventas a Clientes"
                            >
                              <span>{spending.salesCount} {spending.salesCount === 1 ? 'venta' : 'ventas'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Sin compras aún</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <Badge variant={c.is_active ? 'emerald' : 'gray'} size="sm">
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {spending && spending.salesCount > 0 && (
                            <button
                              type="button"
                              onClick={() => navigate(`/app/customer-sales?customer=${c.id}`)}
                              title="Ver registro de ventas de este cliente"
                              className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 mr-1"
                            >
                              <ShoppingBag className="w-3 h-3 text-emerald-600" />
                              <span>Ventas</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            title="Editar datos del cliente"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(c)}
                            title="Eliminar cliente"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR / EDITAR CLIENTE (COMPACTO Y CENTRADO)   */}
      {/* ======================================================== */}
      {isCustomerModalOpen && (
        <Modal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          className="max-w-lg p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 px-5 py-3.5 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                {editingCustomer ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight leading-none">
                  {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
                <p className="text-[10px] text-amber-100/90 mt-0.5">
                  {editingCustomer
                    ? 'Modifica la información de contacto o facturación'
                    : 'Los datos se sincronizan al instante con el Punto de Venta (POS)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveCustomer} className="p-4 sm:p-5 space-y-3 bg-white dark:bg-zinc-900 max-h-[78vh] overflow-y-auto">
            {/* Nombre Completo */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Nombre Completo o Razón Social <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Distribuidora Gómez S.R.L. o María López"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* NIT y Teléfono en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  NIT / CI / Cédula
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="Ej. 1023456023 o 8493021"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Celular / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 70123456 o +591 7..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Correo y Dirección en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Dirección / Ubicación
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Principal #120"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Tip discreto */}
            <div className="px-3 py-2 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-[10px] leading-tight">
                Sincronización en tiempo real: Disponible de inmediato en el POS para facturación rápida.
              </p>
            </div>

            {/* Botones de acción compactos */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingCustomer}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingCustomer ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE CLIENTE                  */}
      {/* ======================================================== */}
      {customerToDelete && (
        <Modal
          isOpen={Boolean(customerToDelete)}
          onClose={() => setCustomerToDelete(null)}
          className="max-w-md p-6"
        >
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                ¿Eliminar al cliente {customerToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Esta acción retirará a este cliente del directorio. Las facturas o ventas históricas ya realizadas a su nombre no se verán afectadas.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deletingCustomer}
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingCustomer ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
