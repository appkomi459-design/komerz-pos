import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Store,
  Users,
  TrendingUp,
  Receipt,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  X,
  Copy,
  Check,
  Star,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { recordTrashItem } from '@/utils/trash';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Branch } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface BranchWithStats extends Branch {
  sellersCount: number;
  sellers: { id: string; name: string; role: string; email: string; phone?: string | null }[];
  totalSales: number;
  salesCount: number;
}

export const BranchesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { t } = useLanguage();

  const [branches, setBranches] = useState<BranchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingBranch, setViewingBranch] = useState<BranchWithStats | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchWithStats | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<BranchWithStats | null>(null);

  // Form states: Create
  const [createName, setCreateName] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createIsMain, setCreateIsMain] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states: Edit
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsMain, setEditIsMain] = useState(false);
  const [editing, setEditing] = useState(false);

  // Deleting
  const [deleting, setDeleting] = useState(false);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currency = activeBusiness?.currency || 'BOB';

  /* ───────────────────────────────────────────────────────────── */
  /* CARGA COMPLETA: SUCURSALES + MIEMBROS + VENTAS POR SUCURSAL    */
  /* ───────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      const [branchesRes, membersRes, salesRes] = await Promise.all([
        supabase
          .from('branches')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('is_main', { ascending: false })
          .order('name', { ascending: true }),
        supabase
          .from('business_members')
          .select('id, user_id, branch_id, role, is_active, profiles:profiles(full_name, email, phone)')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true),
        supabase
          .from('sales')
          .select('id, branch_id, total, status')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed'),
      ]);

      const rawBranches = (branchesRes.data || []) as Branch[];
      const rawMembers = membersRes.data || [];
      const rawSales = salesRes.data || [];

      // Mapear estadísticas por sucursal
      const branchesEnriched: BranchWithStats[] = rawBranches.map((b) => {
        // Vendedores asignados a esta sucursal (o sin asignar si es la principal)
        const branchMembers = rawMembers.filter((m: any) => {
          if (m.branch_id === b.id) return true;
          // Si no tiene sucursal asignada y esta es la principal, se asume asignado
          if (!m.branch_id && b.is_main) return true;
          return false;
        });

        const sellersList = branchMembers.map((m: any) => ({
          id: m.id,
          name: m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'Vendedor',
          role: m.role || 'cashier',
          email: m.profiles?.email || '',
          phone: m.profiles?.phone || null,
        }));

        // Ventas de esta sucursal
        const branchSales = rawSales.filter((s: any) => {
          if (s.branch_id === b.id) return true;
          if (!s.branch_id && b.is_main) return true;
          return false;
        });

        const totalSalesSum = branchSales.reduce((acc: number, s: any) => acc + Number(s.total || 0), 0);

        return {
          ...b,
          sellersCount: sellersList.length,
          sellers: sellersList,
          totalSales: totalSalesSum,
          salesCount: branchSales.length,
        };
      });

      setBranches(branchesEnriched);
    } catch (err) {
      console.error('Error fetching branches data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───────────────────────────────────────────────────────────── */
  /* MÉTRICAS GLOBALES DE SUCURSALES                               */
  /* ───────────────────────────────────────────────────────────── */
  const globalMetrics = useMemo(() => {
    const totalBranches = branches.length;
    const activeCount = branches.filter((b) => b.is_active).length;
    const totalRevenue = branches.reduce((acc, b) => acc + b.totalSales, 0);
    const totalSellers = branches.reduce((acc, b) => acc + b.sellersCount, 0);

    return {
      totalBranches,
      activeCount,
      totalRevenue,
      totalSellers,
    };
  }, [branches]);

  /* ───────────────────────────────────────────────────────────── */
  /* FILTRO DE BÚSQUEDA                                            */
  /* ───────────────────────────────────────────────────────────── */
  const filteredBranches = useMemo(() => {
    if (!search.trim()) return branches;
    const q = search.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.phone && b.phone.toLowerCase().includes(q))
    );
  }, [branches, search]);

  /* ───────────────────────────────────────────────────────────── */
  /* CREAR SUCURSAL                                                */
  /* ───────────────────────────────────────────────────────────── */
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id || !createName.trim()) return;

    try {
      setCreating(true);

      // Si se marca como principal, desmarcar las demás
      if (createIsMain) {
        await supabase
          .from('branches')
          .update({ is_main: false })
          .eq('business_id', activeBusiness.id);
      }

      const { error } = await supabase.from('branches').insert({
        business_id: activeBusiness.id,
        name: createName.trim(),
        address: createAddress.trim() || null,
        phone: createPhone.trim() || null,
        is_main: createIsMain,
        is_active: true,
      });

      if (error) throw error;

      setCreateName('');
      setCreateAddress('');
      setCreatePhone('');
      setCreateIsMain(false);
      setIsCreateModalOpen(false);

      await fetchData();
    } catch (err: any) {
      alert(`Error al crear sucursal: ${err.message || 'Error desconocido'}`);
    } finally {
      setCreating(false);
    }
  };

  /* ───────────────────────────────────────────────────────────── */
  /* EDITAR SUCURSAL                                               */
  /* ───────────────────────────────────────────────────────────── */
  const openEditModal = (b: BranchWithStats) => {
    setEditingBranch(b);
    setEditName(b.name);
    setEditAddress(b.address || '');
    setEditPhone(b.phone || '');
    setEditIsActive(b.is_active);
    setEditIsMain(b.is_main);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editName.trim() || !activeBusiness?.id) return;

    try {
      setEditing(true);

      // Si se cambió a principal, desmarcar las demás
      if (editIsMain && !editingBranch.is_main) {
        await supabase
          .from('branches')
          .update({ is_main: false })
          .eq('business_id', activeBusiness.id);
      }

      const { error } = await supabase
        .from('branches')
        .update({
          name: editName.trim(),
          address: editAddress.trim() || null,
          phone: editPhone.trim() || null,
          is_active: editIsActive,
          is_main: editIsMain,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBranch.id);

      if (error) throw error;

      setEditingBranch(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error al actualizar sucursal: ${err.message || 'Error desconocido'}`);
    } finally {
      setEditing(false);
    }
  };

  /* ───────────────────────────────────────────────────────────── */
  /* ELIMINAR SUCURSAL                                             */
  /* ───────────────────────────────────────────────────────────── */
  const handleDeleteBranch = async () => {
    if (!deletingBranch || !activeBusiness?.id) return;

    if (deletingBranch.is_main) {
      alert('No puedes eliminar la Sucursal Principal. Primero asigna otra sucursal como Principal.');
      setDeletingBranch(null);
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', deletingBranch.id);

      if (error) throw error;

      if (activeBusiness) {
        await recordTrashItem({
          businessId: activeBusiness.id,
          itemType: 'branch',
          itemId: deletingBranch.id,
          title: deletingBranch.name,
          subtitle: deletingBranch.address || deletingBranch.phone || 'Sucursal',
          payload: deletingBranch as unknown as Record<string, any>,
        });
      }

      setDeletingBranch(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error al eliminar sucursal: ${err.message || 'Error desconocido'}`);
    } finally {
      setDeleting(false);
    }
  };

  /* ───────────────────────────────────────────────────────────── */
  /* COPIAR AL PORTAPAPELES                                        */
  /* ───────────────────────────────────────────────────────────── */
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* 1. CABECERA PRINCIPAL & BOTÓN NUEVA SUCURSAL             */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('branches.title', 'Sucursales')}
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">
            {t('branches.subtitle', 'Gestión integral de puntos de venta, almacenes y ubicaciones comerciales')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('branches.new', 'Nueva Sucursal')}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. TARJETAS KPI DE RENDIMIENTO (ESTILO PROFESIONAL)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Sucursales */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Total Sucursales
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {globalMetrics.totalBranches}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
              Puntos comerciales
            </p>
          </div>
        </div>

        {/* Sucursales Activas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              Operativas
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {globalMetrics.activeCount} <span className="text-xs font-medium text-blue-200">/ {globalMetrics.totalBranches}</span>
            </div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">
              Listas para vender
            </p>
          </div>
        </div>

        {/* Vendedores Asignados */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-100">
              Personal Asignado
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {globalMetrics.totalSellers}
            </div>
            <p className="text-[10px] text-purple-100 font-bold mt-0.5">
              Cajeros & vendedores
            </p>
          </div>
        </div>

        {/* Facturación Total de Sucursales */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
              Ventas Registradas
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono">
              {formatCurrency(globalMetrics.totalRevenue, currency)}
            </div>
            <p className="text-[10px] text-amber-100 font-bold mt-0.5">
              Facturación global acumulada
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. BARRA DE BÚSQUEDA Y CONTROL                           */}
      {/* ======================================================== */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar sucursal por nombre, dirección o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#181615] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-sm font-bold pl-11 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. LISTADO DE SUCURSALES (GRID MEJORADO)                  */}
      {/* ======================================================== */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Cargando sucursales...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#181615] rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800 p-8">
          <Store className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
            {search ? 'No se encontraron sucursales con esa búsqueda' : 'Aún no tienes sucursales registradas'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Prueba con otro término o limpia el buscador' : 'Crea tu primera sucursal para organizar tus ventas y empleados por tienda.'}
          </p>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md transition-all cursor-pointer"
            >
              + Crear Sucursal Ahora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((b) => (
            <Card
              key={b.id}
              className={`p-5 rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                b.is_main
                  ? 'border-emerald-500/80 dark:border-emerald-500/60 bg-gradient-to-b from-white via-white to-emerald-50/20 dark:from-[#181615] dark:to-emerald-950/20'
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#181615]'
              }`}
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-xs ${
                        b.is_main
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 truncate" title={b.name}>
                        {b.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {b.is_main && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.2 rounded-full flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Principal
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full border ${
                            b.is_active
                              ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          {b.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métricas rápidas de la sucursal */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-850/80 border border-slate-200/80 dark:border-zinc-750 text-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Personal</span>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200 font-mono">
                      {b.sellersCount}
                    </span>
                  </div>
                  <div className="border-x border-slate-200 dark:border-zinc-700">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Ventas</span>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200 font-mono">
                      {b.salesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Facturado</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(b.totalSales, currency)}
                    </span>
                  </div>
                </div>

                {/* Dirección y Teléfono */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{b.address || 'Sin dirección registrada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{b.phone || 'Sin teléfono'}</span>
                  </div>
                </div>
              </div>

              {/* Botonera de Acciones (Ver, Editar, Borrar) */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                {/* Botón Ver Detalle */}
                <button
                  type="button"
                  onClick={() => setViewingBranch(b)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Ver resumen y personal asignado"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                  <span>Ver</span>
                </button>

                {/* Botón Editar */}
                <button
                  type="button"
                  onClick={() => openEditModal(b)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Editar nombre, dirección y teléfono"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {/* Botón Borrar */}
                <button
                  type="button"
                  onClick={() => setDeletingBranch(b)}
                  disabled={b.is_main}
                  className={`py-1.5 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-colors ${
                    b.is_main
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 cursor-pointer'
                  }`}
                  title={b.is_main ? 'La sucursal principal no se puede eliminar' : 'Eliminar esta sucursal'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Borrar</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL CREAR NUEVA SUCURSAL                            */}
      {/* ======================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="🏢 Registrar Nueva Sucursal"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 p-5 text-slate-800 dark:text-zinc-100">
          <Input
            label="Nombre de la Sucursal *"
            placeholder="Ej. Sucursal Centro, Almacén Norte, Mall Plaza"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
          />

          <Input
            label="Dirección / Ubicación"
            placeholder="Ej. Av. Principal #123, Zona Central"
            value={createAddress}
            onChange={(e) => setCreateAddress(e.target.value)}
          />

          <Input
            label="Teléfono / Celular de Contacto"
            placeholder="Ej. +591 70000000"
            value={createPhone}
            onChange={(e) => setCreatePhone(e.target.value)}
          />

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-zinc-100 block">
                ¿Establecer como Sucursal Principal?
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Será la sucursal predeterminada para ventas y personal sin asignar.
              </span>
            </div>
            <input
              type="checkbox"
              checked={createIsMain}
              onChange={(e) => setCreateIsMain(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating} className="bg-emerald-600 hover:bg-emerald-500 font-black">
              Crear Sucursal
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 6. MODAL VER DETALLE DE SUCURSAL                         */}
      {/* ======================================================== */}
      {viewingBranch && (
        <Modal
          isOpen={Boolean(viewingBranch)}
          onClose={() => setViewingBranch(null)}
          title={`🏬 Detalle: ${viewingBranch.name}`}
        >
          <div className="p-5 space-y-4 text-slate-800 dark:text-zinc-100">
            {/* Cabecera resumen */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-850 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400">
                  {viewingBranch.is_main ? '⭐ Sucursal Principal' : 'Sucursal Secundaria'}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    viewingBranch.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {viewingBranch.is_active ? 'OPERATIVA' : 'INACTIVA'}
                </span>
              </div>
              <h2 className="text-xl font-black">{viewingBranch.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {viewingBranch.address || 'Sin dirección'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {viewingBranch.phone || 'Sin teléfono'}
                </span>
              </div>
            </div>

            {/* Estadísticas de la Sucursal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Total Facturado
                </span>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {formatCurrency(viewingBranch.totalSales, currency)}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {viewingBranch.salesCount} tickets emitidos
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Personal Asignado
                </span>
                <div className="text-lg font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                  {viewingBranch.sellersCount} miembros
                </div>
                <span className="text-[10px] text-blue-600 font-medium">
                  En esta tienda
                </span>
              </div>
            </div>

            {/* Lista de Personal Asignado a esta sucursal */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Vendedores y Cajeros en esta Sucursal ({viewingBranch.sellers.length}):
              </h4>

              {viewingBranch.sellers.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 text-center text-xs text-slate-400">
                  No hay personal asignado específicamente a esta sucursal.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {viewingBranch.sellers.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {s.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-100 leading-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                        {s.role === 'owner' ? 'Propietario' : s.role === 'admin' ? 'Admin' : 'Vendedor'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones del Modal */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleCopy(viewingBranch.id, 'branch_id')}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'branch_id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'branch_id' ? 'ID Copiado' : `ID: ${viewingBranch.id.slice(0, 8)}...`}</span>
              </button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const b = viewingBranch;
                    setViewingBranch(null);
                    openEditModal(b);
                  }}
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Editar Datos
                </Button>
                <Button size="sm" onClick={() => setViewingBranch(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL EDITAR SUCURSAL                                 */}
      {/* ======================================================== */}
      {editingBranch && (
        <Modal
          isOpen={Boolean(editingBranch)}
          onClose={() => setEditingBranch(null)}
          title={`✏️ Editar: ${editingBranch.name}`}
        >
          <form onSubmit={handleUpdateBranch} className="space-y-4 p-5 text-slate-800 dark:text-zinc-100">
            <Input
              label="Nombre de la Sucursal *"
              placeholder="Ej. Sucursal Principal"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <Input
              label="Dirección"
              placeholder="Avenida, Local, Sector"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />

            <Input
              label="Teléfono"
              placeholder="+591 70000000"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />

            {/* Activa / Inactiva */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-zinc-100 block">
                  Estado de la Sucursal
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {editIsActive ? 'La sucursal está operativa para ventas' : 'La sucursal no aparecerá en el punto de venta'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditIsActive((prev) => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  editIsActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-zinc-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Principal */}
            {!editingBranch.is_main && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 block">
                    ¿Convertir en Sucursal Principal?
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Reemplazará a la actual sucursal principal.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsMain}
                  onChange={(e) => setEditIsMain(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setEditingBranch(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={editing} className="bg-emerald-600 hover:bg-emerald-500 font-black">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL CONFIRMAR ELIMINACIÓN                           */}
      {/* ======================================================== */}
      {deletingBranch && (
        <Modal
          isOpen={Boolean(deletingBranch)}
          onClose={() => setDeletingBranch(null)}
          title="⚠️ Eliminar Sucursal"
        >
          <div className="p-5 space-y-4 text-slate-800 dark:text-zinc-100">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300">
                <p className="font-black text-sm text-rose-900 dark:text-rose-200">
                  ¿Estás seguro de eliminar "{deletingBranch.name}"?
                </p>
                <p className="mt-1">
                  Esta acción eliminará la sucursal de tus puntos de venta activos. Los tickets y ventas históricas que ya se realizaron se conservarán intactos.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" onClick={() => setDeletingBranch(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={deleting}
                onClick={handleDeleteBranch}
                className="bg-rose-600 hover:bg-rose-500 font-black"
                icon={<Trash2 className="w-4 h-4" />}
              >
                Eliminar Sucursal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
