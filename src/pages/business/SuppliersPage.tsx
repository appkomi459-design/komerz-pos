import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
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
  Building2,
  User,
  Sparkles,
  AlertTriangle,
  X,
  FileText,
  Tag,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import type { Supplier } from '@/types';

export const SuppliersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'with_phone' | 'with_nit'>('all');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [identification, setIdentification] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Eliminar
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback copiar portapapeles
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cargar proveedores desde Supabase
  const fetchSuppliers = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSuppliers(data as Supplier[]);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [activeBusiness]);

  // Abrir modal creación
  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setIdentification('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCategory('');
    setNotes('');
    setIsModalOpen(true);
  };

  // Abrir modal edición
  const handleOpenEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name || '');
    setContactPerson(s.contact_person || '');
    setIdentification(s.identification || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setCategory(s.category || '');
    setNotes(s.notes || '');
    setIsModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !name.trim()) return;

    try {
      setSaving(true);
      const payload = {
        business_id: activeBusiness.id,
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        identification: identification.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        category: category.trim() || null,
        notes: notes.trim() || null,
        is_active: true,
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', editingSupplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchSuppliers();
    } catch (err: any) {
      alert(`Error al guardar proveedor: ${err.message || 'Inténtelo de nuevo'}`);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar proveedor
  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id);

      if (error) throw error;

      setSupplierToDelete(null);
      await fetchSuppliers();
    } catch (err: any) {
      alert(`No se pudo eliminar el proveedor: ${err.message || 'Inténtelo de nuevo'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.length === 8) {
      return `591${clean}`;
    }
    return clean;
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'PR';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getAvatarGradient = (str: string) => {
    const colors = [
      'from-blue-600 to-indigo-700',
      'from-cyan-600 to-blue-700',
      'from-teal-600 to-emerald-700',
      'from-slate-700 to-zinc-900',
      'from-indigo-600 to-purple-700',
      'from-amber-600 to-orange-700',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Estadísticas
  const stats = useMemo(() => {
    const total = suppliers.length;
    const withPhone = suppliers.filter((s) => Boolean(s.phone && s.phone.trim())).length;
    const withNit = suppliers.filter((s) => Boolean(s.identification && s.identification.trim())).length;
    return { total, withPhone, withNit };
  }, [suppliers]);

  // Filtrado
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(query)) ||
        (s.identification && s.identification.toLowerCase().includes(query)) ||
        (s.phone && s.phone.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterTab === 'with_phone') return Boolean(s.phone && s.phone.trim());
      if (filterTab === 'with_nit') return Boolean(s.identification && s.identification.trim());
      return true;
    });
  }, [suppliers, search, filterTab]);

  return (
    <div className="space-y-6">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Directorio de Proveedores
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 pl-10">
            Administra a tus abastecedores comerciales, contactos de preventa, NIT y pedidos directos por WhatsApp
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 font-black cursor-pointer"
          icon={<Plus className="w-4 h-4" />}
        >
          Nuevo Proveedor
        </Button>
      </div>

      {/* ── TARJETAS DE MÉTRICAS (KPIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Proveedores
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-0.5 font-mono">
              {stats.total}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              Empresas y distribuidoras
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Con WhatsApp / Pedidos
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
              Contacto de preventa listo
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Con NIT / Facturación
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
                {stats.withNit}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                {stats.total > 0 ? Math.round((stats.withNit / stats.total) * 100) : 0}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              Proveedores fiscales formales
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, contacto, NIT, rubro o teléfono..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

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
            onClick={() => setFilterTab('with_phone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'with_phone'
                ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Con WhatsApp</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {stats.withPhone}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('with_nit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'with_nit'
                ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <span>Con NIT</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-zinc-600 font-mono">
              {stats.withNit}
            </span>
          </button>
        </div>
      </div>

      {/* ── TABLA DE PROVEEDORES ── */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Cargando directorio de proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
              {search ? 'No se encontraron proveedores coincidentes' : 'No tienes proveedores registrados aún'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              {search
                ? `No hay resultados para "${search}". Intenta con otro término o limpia el buscador.`
                : 'Registra a tus proveedores, distribuidoras y preventistas para organizar pedidos y cotizaciones.'}
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
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-md shadow-blue-600/20"
                icon={<Plus className="w-4 h-4" />}
              >
                Registrar Primer Proveedor
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800 font-black text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Empresa / Proveedor</th>
                  <th className="px-5 py-3.5">Rubro / Categoría</th>
                  <th className="px-5 py-3.5">NIT / CI</th>
                  <th className="px-5 py-3.5">Contacto (WhatsApp / Celular)</th>
                  <th className="px-5 py-3.5">Dirección / Almacén</th>
                  <th className="px-5 py-3.5">Días / Notas</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredSuppliers.map((s) => {
                  const initials = getInitials(s.name);
                  const gradient = getAvatarGradient(s.name);
                  const isCopied = copiedId === s.id;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Empresa / Proveedor */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0 tracking-wider`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 dark:text-zinc-100 text-xs">
                              {s.name}
                            </div>
                            {s.contact_person && (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{s.contact_person}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rubro / Categoría */}
                      <td className="px-5 py-3.5">
                        {s.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-black border border-blue-200 dark:border-blue-800">
                            <Tag className="w-3 h-3" />
                            <span>{s.category}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">General</span>
                        )}
                      </td>

                      {/* NIT / Identificación */}
                      <td className="px-5 py-3.5">
                        {s.identification ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-zinc-700">
                            <span className="font-mono text-xs font-black text-slate-800 dark:text-zinc-200">
                              {s.identification}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(s.identification!, s.id)}
                              title="Copiar NIT"
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
                          <span className="text-slate-400 font-mono text-[11px] italic">Sin NIT</span>
                        )}
                      </td>

                      {/* Contacto: Teléfono + Botón WhatsApp */}
                      <td className="px-5 py-3.5">
                        {s.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${s.phone}`}
                              className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-blue-600 transition-colors"
                            >
                              {s.phone}
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhoneForWhatsApp(s.phone)}?text=${encodeURIComponent(
                                `Hola ${s.contact_person || s.name}, te escribo de ${activeBusiness?.name || 'mi negocio'} para consultar por un pedido.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Enviar pedido por WhatsApp"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-[10px] font-black hover:bg-emerald-200 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : s.email ? (
                          <a
                            href={`mailto:${s.email}`}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{s.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Dirección */}
                      <td className="px-5 py-3.5">
                        {s.address ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 max-w-[180px] truncate" title={s.address}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Notas / Días de Visita */}
                      <td className="px-5 py-3.5">
                        {s.notes ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-zinc-400 max-w-[170px] truncate" title={s.notes}>
                            <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="truncate font-medium">{s.notes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">-</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <Badge variant={s.is_active ? 'emerald' : 'gray'} size="sm">
                          {s.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(s)}
                            title="Editar datos del proveedor"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(s)}
                            title="Eliminar proveedor"
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
      {/* MODAL: REGISTRAR / EDITAR PROVEEDOR                     */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-lg p-0 overflow-hidden"
        >
          {/* Cabecera estilizada en azul zafiro / índigo */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-6 py-5 text-white relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <Truck className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {editingSupplier ? 'Editar Datos del Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
                <p className="text-[11px] text-blue-100 font-medium">
                  {editingSupplier
                    ? 'Modifica los contactos o condiciones comerciales del proveedor'
                    : 'Registra distribuidores, preventistas y contactos para reabastecer tu stock'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 bg-white dark:bg-zinc-900">
            {/* Empresa / Razón Social */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Empresa o Distribuidora <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Distribuidora San Jorge S.R.L. o Embutidos Don Raúl"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Persona de Contacto / Preventista */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Persona de Contacto / Vendedor (Preventista)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ej. Carlos Mendoza (Asesor Comercial)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Grid 2 columnas: NIT y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  NIT / Identificación Fiscal
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="Ej. 1020304050 o 8493021"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Celular / WhatsApp de Pedidos
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 70123456 o +591 7..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2 columnas: Rubro y Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Rubro / Categoría de Productos
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Carnes, Bebidas, Abarrotes, Harinas"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

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
                    placeholder="pedidos@proveedor.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Dirección / Almacén Central
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Parque Industrial Mz. 5, Almacén #12"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Notas Comerciales / Días de Visita */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Días de Visita / Condiciones Comerciales (Opcional)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Pasa los martes por la mañana. Plazo de pago a 15 días. Pedido mínimo 5 cajas."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-black">Abastecimiento ágil:</span> Podrás chatear directamente por WhatsApp con el preventista con 1 solo clic para enviar listas de pedidos y cotizaciones.
              </div>
            </div>

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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE PROVEEDOR               */}
      {/* ======================================================== */}
      {supplierToDelete && (
        <Modal
          isOpen={Boolean(supplierToDelete)}
          onClose={() => setSupplierToDelete(null)}
          className="max-w-md p-6"
        >
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                ¿Eliminar al proveedor {supplierToDelete.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Esta acción retirará a este proveedor del directorio. Tus compras históricas no se verán afectadas.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteSupplier}
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
