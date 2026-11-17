import React, { useState, useEffect, useMemo } from 'react';
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
  FileText,
  User,
  Sparkles,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import type { Customer } from '@/types';

export const CustomersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'with_nit' | 'with_phone'>('all');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Eliminar
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback copiar portapapeles
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cargar clientes desde Supabase
  const fetchCustomers = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCustomers(data as Customer[]);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
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
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name || '');
    setIdentification(c.identification || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setIsModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !name.trim()) return;

    try {
      setSaving(true);
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
        // Actualizar
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        // Insertar nuevo
        const { error } = await supabase
          .from('customers')
          .insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      alert(`Error al guardar cliente: ${err.message || 'Inténtelo de nuevo'}`);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar cliente
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setDeleting(true);
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
      setDeleting(false);
    }
  };

  // Copiar NIT/CI al portapapeles
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generar iniciales para avatar
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'CL';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Color de avatar según el nombre
  const getAvatarGradient = (name: string) => {
    const colors = [
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Limpiar número para link de WhatsApp
  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.length === 8) {
      // Formato Bolivia (8 dígitos) -> agregar prefijo 591
      return `591${clean}`;
    }
    return clean;
  };

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = customers.length;
    const withNit = customers.filter((c) => Boolean(c.identification && c.identification.trim())).length;
    const withPhone = customers.filter((c) => Boolean(c.phone && c.phone.trim())).length;
    return { total, withNit, withPhone };
  }, [customers]);

  // Filtrado de clientes
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Filtro de búsqueda
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        (c.identification && c.identification.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Filtro por pestaña
      if (filterTab === 'with_nit') return Boolean(c.identification && c.identification.trim());
      if (filterTab === 'with_phone') return Boolean(c.phone && c.phone.trim());
      return true;
    });
  }, [customers, search, filterTab]);

  return (
    <div className="space-y-6">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Directorio de Clientes
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 pl-10">
            Gestiona tu cartera de clientes, datos para facturación (NIT / CI) y contacto directo
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          size="sm"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 font-black cursor-pointer"
          icon={<UserPlus className="w-4 h-4" />}
        >
          Nuevo Cliente
        </Button>
      </div>

      {/* ── TARJETAS DE MÉTRICAS (KPIs) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Clientes */}
        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Clientes
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-0.5 font-mono">
              {stats.total}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              Registrados en tu negocio
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        {/* Con NIT / CI (Facturación) */}
        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Para Facturación (NIT / CI)
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
                {stats.withNit}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                {stats.total > 0 ? Math.round((stats.withNit / stats.total) * 100) : 0}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              Listos para facturas fiscales
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </Card>

        {/* Con Teléfono / WhatsApp */}
        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Con WhatsApp / Celular
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
                {stats.withPhone}
              </span>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md">
                {stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              Contacto directo habilitado
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, NIT / CI, celular o correo..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('with_nit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'with_nit'
                ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Con NIT/CI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {stats.withNit}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('with_phone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'with_phone'
                ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Con Celular</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {stats.withPhone}
            </span>
          </button>
        </div>
      </div>

      {/* ── TABLA DE CLIENTES ── */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Cargando directorio de clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
              {search ? 'No se encontraron clientes coincidentes' : 'No tienes clientes registrados aún'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              {search
                ? `No hay resultados para "${search}". Intenta con otro término o limpia el buscador.`
                : 'Registra a tus clientes habituales para asociarlos rápidamente a sus compras y notas de venta fiscales.'}
            </p>
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="mt-4 px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Limpiar Búsqueda
              </button>
            ) : (
              <Button
                onClick={handleOpenCreateModal}
                size="sm"
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer shadow-md shadow-emerald-600/20"
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
                  <th className="px-5 py-3.5">Correo Electrónico</th>
                  <th className="px-5 py-3.5">Dirección</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredCustomers.map((c) => {
                  const initials = getInitials(c.name);
                  const gradient = getAvatarGradient(c.name);
                  const isCopied = copiedId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Cliente (Avatar + Nombre + Fecha) */}
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

                      {/* NIT / CI con Copiado Rápido */}
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

                      {/* Contacto: Teléfono + Botón WhatsApp */}
                      <td className="px-5 py-3.5">
                        {c.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${c.phone}`}
                              className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              {c.phone}
                            </a>

                            {/* Botón WhatsApp Directo */}
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
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Correo Electrónico */}
                      <td className="px-5 py-3.5">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-blue-600 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[160px]">{c.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Dirección */}
                      <td className="px-5 py-3.5">
                        {c.address ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 max-w-[180px] truncate" title={c.address}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
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
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            title="Editar datos del cliente"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
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
      {/* MODAL: REGISTRAR / EDITAR CLIENTE (DISEÑO MEJORADO)      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-lg p-0 overflow-hidden"
        >
          {/* Cabecera estilizada con degradado Esmeralda */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 px-6 py-5 text-white relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-emerald-200 border border-white/20">
                {editingCustomer ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
                <p className="text-[11px] text-emerald-100/90 font-medium">
                  {editingCustomer
                    ? 'Modifica la información de contacto o facturación'
                    : 'Los datos se sincronizan al instante con el Punto de Venta (POS)'}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 bg-white dark:bg-zinc-900">
            {/* Nombre Completo / Razón Social */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Nombre Completo o Razón Social <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez o Comercial San Martín S.R.L."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Grid 2 columnas: NIT/CI y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* NIT / CI */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  NIT / CI / Cédula
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="Ej. 8493021 o 1023456023"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Para emisión de facturas y notas.</p>
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Celular / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 70123456 o +591 7..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Para enviar tickets y recordatorios.</p>
              </div>
            </div>

            {/* Grid 2 columnas: Correo Electrónico y Dirección */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Dirección / Ubicación
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Principal #120, Zona Central"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Banner de Sincronización con POS */}
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-black">Integración automática en Caja:</span> Al vender en el Punto de Venta (POS), podrás seleccionar este cliente para cargar automáticamente su NIT/CI en el comprobante fiscal.
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
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
                disabled={deleting}
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleting ? (
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
