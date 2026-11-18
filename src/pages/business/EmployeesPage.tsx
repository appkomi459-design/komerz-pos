import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Check,
  X,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  ShoppingBag,
  TrendingUp,
  Award,
  KeyRound,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { BusinessMember, Profile, Sale } from '@/types';

interface SellerWithStats {
  memberId: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  salesCount: number;
  totalSold: number;
}

export const EmployeesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal: Registrar Nuevo Vendedor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Éxito con Credenciales Creadas
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    pass: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Estado para activación/desactivación
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  /* ─────────────────────────── Carga de datos ─────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      // 1. Obtener miembros del negocio y sus perfiles
      const [membersRes, salesRes] = await Promise.all([
        supabase
          .from('business_members')
          .select('id, user_id, role, is_active, created_at, profile:profiles(id, full_name, email)')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sales')
          .select('id, user_id, total, status')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed'),
      ]);

      const membersData = membersRes.data || [];
      const salesData = (salesRes.data || []) as Sale[];

      // Agrupar ventas por user_id
      const salesByUser: Record<string, { count: number; total: number }> = {};
      salesData.forEach((s) => {
        if (!s.user_id) return;
        if (!salesByUser[s.user_id]) {
          salesByUser[s.user_id] = { count: 0, total: 0 };
        }
        salesByUser[s.user_id].count++;
        salesByUser[s.user_id].total += Number(s.total);
      });

      // Mapear vendedores
      const mapped: SellerWithStats[] = membersData.map((m: any) => {
        const prof = m.profile || {};
        const stats = salesByUser[m.user_id] || { count: 0, total: 0 };
        return {
          memberId: m.id,
          userId: m.user_id,
          fullName: prof.full_name || 'Vendedor',
          email: prof.email || '—',
          role: m.role,
          isActive: m.is_active,
          createdAt: m.created_at,
          salesCount: stats.count,
          totalSold: stats.total,
        };
      });

      setSellers(mapped);
    } catch (err) {
      console.error('Error cargando vendedores:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─────────────────── Registrar Nuevo Vendedor ───────────────────────── */
  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;

    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('create_business_seller', {
        p_business_id: activeBusiness.id,
        p_email: email.trim().toLowerCase(),
        p_password: password,
        p_full_name: fullName.trim(),
        p_phone: phone.trim() || null,
        p_role: 'cashier',
      });

      if (rpcError) throw rpcError;

      // Guardar credenciales para mostrar en modal de éxito
      setCreatedCredentials({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        pass: password,
      });

      // Resetear formulario
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setIsModalOpen(false);

      await fetchData();
    } catch (err: any) {
      console.error('Error al registrar vendedor:', err);
      setError(err?.message || 'Error al crear la cuenta del vendedor.');
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────── Alternar Activo/Inactivo ───────────────────────── */
  const handleToggleStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      setUpdatingMemberId(memberId);
      const newStatus = !currentStatus;

      const { error: rpcErr } = await supabase.rpc('toggle_business_member_status', {
        p_member_id: memberId,
        p_is_active: newStatus,
      });

      if (rpcErr) throw rpcErr;

      setSellers((prev) =>
        prev.map((s) => (s.memberId === memberId ? { ...s, isActive: newStatus } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  /* ─────────────────── Copiar Credenciales al Portapapeles ────────────── */
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `👋 Hola ${createdCredentials.name}, tu acceso al sistema Komerz POS está listo:\n\n🌐 Enlace: https://komerz-pos.vercel.app/login\n✉️ Usuario: ${createdCredentials.email}\n🔑 Contraseña: ${createdCredentials.pass}\n\n¡Ingresa directamente para comenzar tus ventas!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* ─────────────────── Métricas Generales ─────────────────────────────── */
  const metrics = useMemo(() => {
    const totalSellers = sellers.length;
    const activeCount = sellers.filter((s) => s.isActive).length;
    const totalSalesByTeam = sellers.reduce((acc, s) => acc + s.totalSold, 0);

    // Vendedor estrella (quien más ha vendido)
    const sorted = [...sellers].sort((a, b) => b.totalSold - a.totalSold);
    const starSeller = sorted[0]?.totalSold > 0 ? sorted[0] : null;

    return {
      totalSellers,
      activeCount,
      totalSalesByTeam,
      starSeller,
    };
  }, [sellers]);

  /* ─────────────────── Filtrado ───────────────────────────────────────── */
  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const q = search.toLowerCase();
      return s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [sellers, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* CABECERA PRINCIPAL CON ESTILO CORPORATIVO                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Vendedores y Equipo
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Crea usuarios con acceso directo a venta en caja y consulta de stock
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 rounded-xl px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Vendedor</span>
        </Button>
      </div>

      {/* ======================================================== */}
      {/* TARJETAS DE MÉTRICAS / KPIS                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Vendedores */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Vendedores
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
              {metrics.totalSellers}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Usuarios registrados
            </p>
          </div>
        </Card>

        {/* Vendedores Activos */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Vendedores Activos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.activeCount}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Con acceso habilitado al POS
            </p>
          </div>
        </Card>

        {/* Ventas Generadas */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Vendido por el Equipo
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-mono">
              Bs {metrics.totalSalesByTeam.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Total acumulado en caja
            </p>
          </div>
        </Card>

        {/* Vendedor Estrella */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Vendedor Estrella
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 truncate">
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100 truncate" title={metrics.starSeller?.fullName || 'Sin ventas aún'}>
              {metrics.starSeller ? metrics.starSeller.fullName : 'Sin ventas aún'}
            </div>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5 font-mono">
              {metrics.starSeller ? `Bs ${metrics.starSeller.totalSold.toFixed(2)} (${metrics.starSeller.salesCount} ventas)` : 'Esperando ventas'}
            </p>
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE BÚSQUEDA                                        */}
      {/* ======================================================== */}
      <Card className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar vendedor por nombre o correo de acceso..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </Card>

      {/* ======================================================== */}
      {/* TABLA PRINCIPAL DE VENDEDORES                            */}
      {/* ======================================================== */}
      <Card className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Cargando equipo de vendedores...</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-3.5">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
              {search ? 'No se encontraron vendedores con ese nombre' : 'No tienes vendedores registrados aún'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Crea usuarios para tus cajeros y vendedores para que puedan cobrar desde cualquier computadora o celular sin ver tus datos confidenciales.
            </p>
            <Button
              onClick={() => {
                setError(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl px-4 py-2 cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Vendedor</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/40 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Correo de Acceso</th>
                  <th className="py-3 px-4">Rol / Permiso</th>
                  <th className="py-3 px-4 text-center">Ventas Realizadas</th>
                  <th className="py-3 px-4 text-right">Total Vendido</th>
                  <th className="py-3 px-4 text-center">Estado de Acceso</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                {filteredSellers.map((seller) => (
                  <tr
                    key={seller.memberId}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Vendedor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                          {seller.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-slate-900 dark:text-zinc-100 font-black">
                            {seller.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Registrado el {formatDate(seller.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-zinc-300">
                      {seller.email}
                    </td>

                    {/* Rol */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={seller.role === 'owner' ? 'emerald' : seller.role === 'admin' ? 'blue' : 'gray'}
                        size="sm"
                      >
                        {seller.role === 'owner' ? '👑 Propietario' : seller.role === 'admin' ? '🛡️ Administrador' : '🛒 Vendedor / Cajero'}
                      </Badge>
                    </td>

                    {/* Ventas */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className="font-mono text-slate-800 dark:text-zinc-200">
                        {seller.salesCount} tickets
                      </span>
                    </td>

                    {/* Total Vendido */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      Bs {seller.totalSold.toFixed(2)}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          seller.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${seller.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {seller.isActive ? 'Activo (Puede entrar)' : 'Desactivado'}
                      </span>
                    </td>

                    {/* Acción Activar/Desactivar */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      {seller.role !== 'owner' ? (
                        <button
                          type="button"
                          disabled={updatingMemberId === seller.memberId}
                          onClick={() => handleToggleStatus(seller.memberId, seller.isActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            seller.isActive
                              ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-rose-950/40'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40'
                          }`}
                        >
                          {updatingMemberId === seller.memberId
                            ? 'Actualizando...'
                            : seller.isActive
                            ? 'Desactivar Acceso'
                            : 'Habilitar Acceso'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Cuenta Principal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVO VENDEDOR (COMPACTO Y CENTRADO)    */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-lg p-0 overflow-hidden shadow-2xl"
        >
          {/* Cabecera Azul / Índigo */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3.5 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <Users className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight leading-none">
                  Registrar Nuevo Vendedor
                </h3>
                <p className="text-[10px] text-blue-100/90 mt-0.5">
                  Crea su usuario y contraseña para que pueda iniciar sesión y cobrar
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

          <form onSubmit={handleCreateSeller} className="p-4 sm:p-5 space-y-3 bg-white dark:bg-zinc-900 max-h-[82vh] overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Nombre Completo */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Nombre Completo del Vendedor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Correo y Celular en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Correo Electrónico (Login) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@mitienda.com"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Celular / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 70123456"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Contraseña de Acceso */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Contraseña de Inicio de Sesión <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres (ej. Ventas2026*)"
                  className="w-full pl-8 pr-10 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Mensaje de Seguridad y Permisos */}
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/80 text-blue-900 dark:text-blue-200 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Permisos Protegidos:</span>
              </div>
              <p className="text-[10px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
                El vendedor podrá entrar por <strong>komerz-pos.vercel.app/login</strong> con este correo y contraseña. Tendrá acceso únicamente al Punto de Venta, consulta de stock y sus ventas del día. <strong>Tus costos de proveedores, reportes y ganancias quedan 100% ocultos.</strong>
              </p>
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
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creando Cuenta...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Crear Usuario Vendedor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREDENCIALES CREADAS (LISTAS PARA COMPARTIR)      */}
      {/* ======================================================== */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          className="max-w-md p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <div>
                <h3 className="text-sm font-black">¡Vendedor Registrado con Éxito!</h3>
                <p className="text-[10px] text-emerald-100">Ya puede iniciar sesión de inmediato</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-zinc-900 text-xs">
            <p className="text-slate-600 dark:text-zinc-400">
              Comparte estos datos con <strong>{createdCredentials.name}</strong> para que empiece a vender:
            </p>

            <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 font-mono space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ENLACE DE INICIO DE SESIÓN:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">https://komerz-pos.vercel.app/login</span>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-slate-400 block text-[10px]">USUARIO / CORREO:</span>
                <span className="text-slate-900 dark:text-zinc-100 font-bold">{createdCredentials.email}</span>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-zinc-700">
                <span className="text-slate-400 block text-[10px]">CONTRASEÑA:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{createdCredentials.pass}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                onClick={handleCopyCredentials}
                variant="outline"
                className="flex-1 text-xs font-bold rounded-xl py-2 flex items-center justify-center gap-1.5 cursor-pointer border-slate-300 dark:border-zinc-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar Credenciales</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => setCreatedCredentials(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl px-5 py-2 cursor-pointer"
              >
                Listo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
