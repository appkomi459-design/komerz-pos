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
  Edit2,
  Trash2,
  Store,
  DollarSign,
  BarChart3,
  Calendar,
  ArrowUpRight,
  PieChart,
  Building2,
  Percent,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';
import type { BusinessMember, Profile, Sale } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SellerWithStats {
  memberId: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: 'owner' | 'admin' | 'manager' | 'cashier';
  isActive: boolean;
  createdAt: string;
  branchId?: string | null;
  branchName?: string | null;
  salesCount: number;
  totalSold: number;
}

export const EmployeesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { t } = useLanguage();

  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sucursales disponibles
  const [branches, setBranches] = useState<{ id: string; name: string; is_main: boolean }[]>([]);

  // Modal: Registrar Nuevo Vendedor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mapa de Contraseñas de Vendedores guardadas (persistencia permanente)
  const [passwordsMap, setPasswordsMap] = useState<Record<string, string>>({});

  // IDs de contraseñas reveladas en la tabla
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  // Estado para feedback de copiado individual
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal Ver / Compartir Credenciales
  const [viewingCredentials, setViewingCredentials] = useState<{
    name: string;
    email: string;
    pass: string;
    branchName?: string;
  } | null>(null);

  // Modal Éxito con Credenciales Creadas
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    pass: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Estado para activación/desactivación
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Modal: Editar Vendedor
  const [editingSeller, setEditingSeller] = useState<SellerWithStats | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal: Confirmar Borrado de Vendedor
  const [deletingSeller, setDeletingSeller] = useState<SellerWithStats | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ────────────────────────── Helpers de Contraseñas ────────────────────────── */
  const getSellerPassword = useCallback((sellerEmail: string, sellerUserId?: string): string => {
    const e = sellerEmail.toLowerCase().trim();
    if (passwordsMap[e]) return passwordsMap[e];
    if (sellerUserId && passwordsMap[sellerUserId]) return passwordsMap[sellerUserId];
    return '';
  }, [passwordsMap]);

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopySingle = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFullWhatsAppText = (sellerName: string, sellerEmail: string, pass: string, bName?: string) => {
    const text = `👋 Hola ${sellerName}, aquí tienes tus datos de acceso a ${activeBusiness?.name || 'Komerz POS'}:\n\n🌐 Enlace: https://komerz-pos.vercel.app/login\n✉️ Usuario / Correo: ${sellerEmail}\n🔑 Contraseña: ${pass || 'Consulta al administrador'}\n${bName ? `🏢 Sucursal: ${bName}\n` : ''}\n¡Ingresa directamente para comenzar tus ventas!`;
    navigator.clipboard.writeText(text);
    setCopiedKey(`all_${sellerEmail}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  /* ────────────────────────── Carga de datos ────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      // 1. Obtener sucursales, miembros y ventas en paralelo
      const [branchesRes, membersRes, salesRes, credLogsRes] = await Promise.all([
        supabase
          .from('branches')
          .select('id, name, is_main')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('is_main', { ascending: false }),
        supabase
          .from('business_members')
          .select('id, user_id, role, is_active, created_at, branch_id')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sales')
          .select('id, user_id, branch_id, total, status, created_at')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase
          .from('audit_logs')
          .select('details')
          .eq('business_id', activeBusiness.id)
          .eq('action', 'SELLER_CREDENTIALS')
          .order('created_at', { ascending: true }),
      ]);

      const branchesData = branchesRes.data || [];
      setBranches(branchesData);

      // Setear sucursal principal por defecto en el selector
      const mainBranch = branchesData.find((b) => b.is_main) || branchesData[0];
      if (mainBranch && !selectedBranchId) setSelectedBranchId(mainBranch.id);

      const membersData = membersRes.data || [];
      const rawSales = salesRes.data || [];

      // 2. Cargar contraseñas guardadas en local y en audit_logs
      let localMap: Record<string, string> = {};
      try {
        localMap = JSON.parse(localStorage.getItem(`komerz_seller_passwords_${activeBusiness.id}`) || '{}');
      } catch {}

      const dbMap: Record<string, string> = {};
      if (credLogsRes.data) {
        credLogsRes.data.forEach((log: any) => {
          if (log.details?.email && log.details?.password) {
            dbMap[log.details.email.toLowerCase().trim()] = log.details.password;
          }
          if (log.details?.user_id && log.details?.password) {
            dbMap[log.details.user_id] = log.details.password;
          }
        });
      }

      const mergedPasswords = { ...localMap, ...dbMap };
      setPasswordsMap(mergedPasswords);
      try {
        localStorage.setItem(`komerz_seller_passwords_${activeBusiness.id}`, JSON.stringify(mergedPasswords));
      } catch {}

      // 3. Buscar perfiles de los miembros por sus user_id
      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);
      let profilesById: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        (profilesData || []).forEach((p: any) => {
          profilesById[p.id] = { full_name: p.full_name, email: p.email };
        });
      }

      // 4. Mapa de sucursales por id
      const branchById: Record<string, string> = {};
      branchesData.forEach((b) => { branchById[b.id] = b.name; });

      // 5. Acumuladores de ventas por usuario
      const salesByUser: Record<string, { count: number; total: number }> = {};
      rawSales.forEach((s: any) => {
        if (!s.user_id) return;
        if (!salesByUser[s.user_id]) salesByUser[s.user_id] = { count: 0, total: 0 };
        salesByUser[s.user_id].count += 1;
        salesByUser[s.user_id].total += Number(s.total || 0);
      });

      // 6. Construir lista final
      const list: SellerWithStats[] = membersData.map((m: any) => {
        const prof = profilesById[m.user_id];
        const stats = salesByUser[m.user_id] || { count: 0, total: 0 };
        return {
          memberId: m.id,
          userId: m.user_id,
          fullName: prof?.full_name || t('employees.unnamed_seller', 'Vendedor sin nombre'),
          email: prof?.email || t('employees.no_email', 'Sin correo'),
          phone: null,
          role: m.role,
          isActive: m.is_active,
          createdAt: m.created_at,
          branchId: m.branch_id,
          branchName: m.branch_id ? branchById[m.branch_id] || null : null,
          salesCount: stats.count,
          totalSold: stats.total,
        };
      });

      setSellers(list);
    } catch (err) {
      console.error('Error al cargar vendedores:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ────────────────────────── Registrar Nuevo Vendedor ────────────────────────── */
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const normEmail = email.trim().toLowerCase();

      let newUserId: string | null = null;

      // 1. Si hay service role key → crear usuario ya confirmado (sin email de verificación)
      if (serviceKey) {
        const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            email: normEmail,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName.trim(),
              phone: phone.trim() || null,
            },
          }),
        });

        const adminData = await adminRes.json();

        if (!adminRes.ok) {
          const msg = adminData?.msg || adminData?.message || '';
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
            throw new Error('Este correo ya tiene una cuenta registrada. Usa otro correo.');
          }
          throw new Error(msg || 'Error al crear la cuenta del vendedor.');
        }

        newUserId = adminData?.id ?? null;
      } else {
        // Fallback: signUp normal (requiere confirmación de email en el panel de Supabase)
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            storageKey: `komerz-seller-temp-${Date.now()}`,
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
          email: normEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim() || null,
            },
          },
        });

        if (signUpError) {
          if (
            signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already been registered') ||
            signUpError.message.toLowerCase().includes('user already exists')
          ) {
            throw new Error('Este correo ya tiene una cuenta registrada. Usa otro correo.');
          }
          throw signUpError;
        }

        newUserId = signUpData?.user?.id ?? null;
      }

      if (!newUserId) throw new Error('No se pudo crear la cuenta. Intenta de nuevo.');

      // 2. Asegurar perfil
      try {
        await supabase.from('profiles').upsert(
          {
            id: newUserId,
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            is_super_admin: false,
          },
          { onConflict: 'id' }
        );
      } catch (profileErr) {
        console.warn('Aviso al actualizar perfil:', profileErr);
      }

      // 3. Agregar como miembro al negocio
      const { error: memberError } = await supabase.from('business_members').insert({
        business_id: activeBusiness.id,
        user_id: newUserId,
        role: 'cashier',
        is_active: true,
        branch_id: selectedBranchId || null,
      });

      if (memberError) {
        if (memberError.code === '23505') {
          await supabase
            .from('business_members')
            .update({ is_active: true, role: 'cashier', branch_id: selectedBranchId || null })
            .eq('business_id', activeBusiness.id)
            .eq('user_id', newUserId);
        } else {
          throw memberError;
        }
      }

      // 4. GUARDAR CREDENCIALES PERMANENTEMENTE EN AUDIT_LOGS Y LOCALSTORAGE
      try {
        await supabase.from('audit_logs').insert({
          business_id: activeBusiness.id,
          action: 'SELLER_CREDENTIALS',
          entity: 'seller',
          details: {
            user_id: newUserId,
            email: normEmail,
            password: password,
            name: fullName.trim(),
            created_at: new Date().toISOString(),
          },
        });
      } catch (logErr) {
        console.warn('Advertencia al registrar credenciales:', logErr);
      }

      // Actualizar estado de contraseñas
      const updatedMap = { ...passwordsMap, [normEmail]: password, [newUserId]: password };
      setPasswordsMap(updatedMap);
      try {
        localStorage.setItem(`komerz_seller_passwords_${activeBusiness.id}`, JSON.stringify(updatedMap));
      } catch {}

      // Mostrar modal de éxito
      setCreatedCredentials({
        name: fullName.trim(),
        email: normEmail,
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

  /* ────────────────────────── Alternar Activo/Inactivo ────────────────────────── */
  const handleToggleStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      setUpdatingMemberId(memberId);
      const newStatus = !currentStatus;

      const { error: rpcErr } = await supabase
        .from('business_members')
        .update({ is_active: newStatus })
        .eq('id', memberId);

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

  /* ────────────────────────── Abrir Modal de Edición ────────────────────────── */
  const handleOpenEdit = (seller: SellerWithStats) => {
    setEditingSeller(seller);
    setEditFullName(seller.fullName);
    setEditPhone(seller.phone || '');
    setEditBranchId(seller.branchId || '');
    setEditNewPassword('');
    setShowEditPassword(false);
    setEditError(null);
  };

  /* ────────────────────────── Guardar Cambios de Vendedor ────────────────────────── */
  const handleUpdateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeller || !activeBusiness?.id) return;
    if (!editFullName.trim()) {
      setEditError('El nombre es obligatorio.');
      return;
    }
    if (editNewPassword.trim() && editNewPassword.trim().length < 6) {
      setEditError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setEditSaving(true);
      setEditError(null);

      // 1. Actualizar nombre en profiles
      await supabase
        .from('profiles')
        .update({ full_name: editFullName.trim() })
        .eq('id', editingSeller.userId);

      // 2. Actualizar sucursal en business_members
      const { error: memberErr } = await supabase
        .from('business_members')
        .update({ branch_id: editBranchId || null })
        .eq('id', editingSeller.memberId);

      if (memberErr) throw memberErr;

      // 3. Si se ingresó una nueva contraseña, actualizarla
      if (editNewPassword.trim()) {
        const normEmail = editingSeller.email.toLowerCase().trim();
        const newPass = editNewPassword.trim();

        // Intentar actualizar vía RPC de vendedor
        try {
          await supabase.rpc('create_business_seller', {
            p_business_id: activeBusiness.id,
            p_email: normEmail,
            p_password: newPass,
            p_full_name: editFullName.trim(),
            p_phone: editPhone || null,
            p_role: editingSeller.role,
          });
        } catch (rpcErr) {
          console.warn('RPC create_business_seller aviso:', rpcErr);
        }

        // Registrar nueva contraseña en audit_logs y en localStorage
        try {
          await supabase.from('audit_logs').insert({
            business_id: activeBusiness.id,
            action: 'SELLER_CREDENTIALS',
            entity: 'seller',
            details: {
              user_id: editingSeller.userId,
              email: normEmail,
              password: newPass,
              name: editFullName.trim(),
              updated_at: new Date().toISOString(),
            },
          });
        } catch (logErr) {
          console.warn('Error guardando en audit_logs:', logErr);
        }

        const updatedMap = {
          ...passwordsMap,
          [normEmail]: newPass,
          [editingSeller.userId]: newPass,
        };
        setPasswordsMap(updatedMap);
        try {
          localStorage.setItem(`komerz_seller_passwords_${activeBusiness.id}`, JSON.stringify(updatedMap));
        } catch {}
      }

      setEditingSeller(null);
      await fetchData();
    } catch (err: any) {
      console.error('Error al actualizar vendedor:', err);
      setEditError(err.message || 'Error al actualizar vendedor.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ────────────────────────── Eliminar Vendedor del Negocio ────────────────────────── */
  const handleDeleteSeller = async () => {
    if (!deletingSeller || !activeBusiness?.id) return;
    try {
      setDeleting(true);
      const { error: delErr } = await supabase
        .from('business_members')
        .delete()
        .eq('id', deletingSeller.memberId);

      if (delErr) throw delErr;

      setDeletingSeller(null);
      await fetchData();
    } catch (err: any) {
      console.error('Error al eliminar vendedor:', err);
      alert(err.message || 'Error al eliminar el vendedor.');
    } finally {
      setDeleting(false);
    }
  };

  /* ────────────────────────── Copiar Credenciales al Portapapeles ────────────────────────── */
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `👋 Hola ${createdCredentials.name}, tu acceso al sistema ${activeBusiness?.name || 'Komerz POS'} está listo:\n\n🌐 Enlace: https://komerz-pos.vercel.app/login\n✉️ Usuario: ${createdCredentials.email}\n🔑 Contraseña: ${createdCredentials.pass}\n\n¡Ingresa directamente para comenzar tus ventas!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* ────────────────────────── Métricas Generales ────────────────────────── */
  const metrics = useMemo(() => {
    const totalSellers = sellers.length;
    const activeCount = sellers.filter((s) => s.isActive).length;
    const totalSalesByTeam = sellers.reduce((acc, s) => acc + s.totalSold, 0);

    const sorted = [...sellers].sort((a, b) => b.totalSold - a.totalSold);
    const starSeller = sorted[0]?.totalSold > 0 ? sorted[0] : null;

    return {
      totalSellers,
      activeCount,
      totalSalesByTeam,
      starSeller,
    };
  }, [sellers]);

  /* ────────────────────────── Filtrado ────────────────────────── */
  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const q = search.toLowerCase();
      return s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [sellers, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span>{t('employees.title', 'Vendedores y Equipo')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold">
              {sellers.length} {sellers.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
            {t('employees.subtitle', 'Crea accesos de cajero, visualiza sus logins, contraseñas y copia sus datos')}
          </p>
        </div>

        <Button
          onClick={() => {
            setFullName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setError(null);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 rounded-xl px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('employees.new', 'Registrar Nuevo Vendedor')}</span>
        </Button>
      </div>

      {/* ── TARJETAS DE MÉTRICAS / KPIS (VIBRANTES CON GRADIENTES) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. TOTAL VENDEDORES (Azul Cobalto) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Equipo
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <circle cx="36" cy="28" r="10" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M18 56c0-10 8-16 18-16s18 6 18 16" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs relative z-10 font-mono">
            {metrics.totalSellers}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('employees.total', 'TOTAL VENDEDORES')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {t('employees.users_registered', 'Usuarios registrados')}
          </p>
        </div>

        {/* 2. VENDEDORES ACTIVOS (Verde Esmeralda) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              {metrics.totalSellers > 0 ? Math.round((metrics.activeCount / metrics.totalSellers) * 100) : 0}% Habilitados
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <path d="M36 18L52 26V38C52 48 44 54 36 58C28 54 20 48 20 38V26L36 18Z" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M28 36L34 42L44 30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs relative z-10 font-mono">
            {metrics.activeCount}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('employees.active', 'VENDEDORES ACTIVOS')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {t('employees.access_enabled', 'Con acceso habilitado al POS')}
          </p>
        </div>

        {/* 3. VENDIDO POR EL EQUIPO (Púrpura / Índigo) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#8e2de2] to-[#4a00e0] text-white shadow-xl shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Recaudación
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
            {formatCurrency(metrics.totalSalesByTeam, activeBusiness?.currency || 'BOB')}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('employees.sold_by_team', 'Vendido por el Equipo')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {t('panel.total_sales_sub', 'Total acumulado en caja')}
          </p>
        </div>

        {/* 4. VENDEDOR ESTRELLA (Ámbar / Naranja) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#f2994a] to-[#f2c94c] text-white shadow-xl shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Top #1
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <polygon points="36,18 41,29 53,30 44,38 46,50 36,44 26,50 28,38 19,30 31,29" stroke="white" strokeWidth="2.5" fill="none"/>
            </svg>
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs truncate relative z-10" title={metrics.starSeller?.fullName || 'Sin ventas aún'}>
            {metrics.starSeller ? metrics.starSeller.fullName : 'Sin ventas aún'}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('employees.star_seller', 'Vendedor Estrella')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10 font-mono">
            {metrics.starSeller ? `${formatCurrency(metrics.starSeller.totalSold, activeBusiness?.currency || 'BOB')} (${metrics.starSeller.salesCount} ventas)` : 'Esperando ventas'}
          </p>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA ── */}
      <Card className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('employees.search', 'Buscar vendedor por nombre o correo de acceso...')}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </Card>

      {/* ── TABLA PRINCIPAL DE VENDEDORES (CON LOGIN Y CONTRASEÑA VISIBLES) ── */}
      <Card className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {t('employees.loading', 'Cargando equipo de vendedores...')}
            </p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
              {t('employees.not_found', 'No se encontraron vendedores')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
              {search
                ? t('employees.search_no_results', 'Ningún vendedor coincide con tu búsqueda.')
                : t('employees.empty_hint', 'Registra a tus cajeros para que puedan iniciar sesión con su propio correo y contraseña.')}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left table-fixed text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800 font-black text-[9px] sm:text-[10px]">
                <tr>
                  <th className="py-2.5 px-2 sm:px-3 w-[24%]">Vendedor</th>
                  <th className="py-2.5 px-2 sm:px-3 w-[29%]">Credenciales (Login & Clave)</th>
                  <th className="py-2.5 px-2 sm:px-3 w-[15%]">Sucursal</th>
                  <th className="py-2.5 px-2 sm:px-3 text-right w-[11%]">Vendido</th>
                  <th className="py-2.5 px-2 sm:px-3 text-center w-[10%]">Acceso</th>
                  <th className="py-2.5 px-2 sm:px-3 text-right w-[11%]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredSellers.map((seller) => {
                  const sellerPassword = getSellerPassword(seller.email, seller.userId);
                  const isRevealed = revealedPasswords.has(seller.userId);

                  return (
                    <tr
                      key={seller.memberId}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Vendedor (Avatar, Nombre y Rol) */}
                      <td className="py-2.5 px-2 sm:px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-[11px] sm:text-xs shadow-xs shrink-0 tracking-wider">
                            {seller.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-slate-900 dark:text-zinc-100 font-black text-xs truncate" title={seller.fullName}>
                              {seller.fullName}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black shrink-0 ${
                                seller.role === 'owner'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                                  : seller.role === 'admin'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
                                  : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60'
                              }`}>
                                {seller.role === 'owner'
                                  ? `👑 ${t('role.owner', 'Dueño')}`
                                  : seller.role === 'admin'
                                  ? `🛡️ ${t('role.admin', 'Admin')}`
                                  : `🛒 ${t('role.cashier', 'Cajero')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Credenciales de Acceso: Login (Correo) y Contraseña con botones para copiar */}
                      <td className="py-2.5 px-2 sm:px-3">
                        <div className="bg-slate-50 dark:bg-zinc-800/80 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 space-y-1 w-full min-w-0">
                          {/* Login / Correo */}
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                              <span
                                className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate select-all"
                                title={seller.email}
                              >
                                {seller.email}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopySingle(seller.email, `mail_${seller.userId}`)}
                              title="Copiar correo / usuario"
                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                            >
                              {copiedKey === `mail_${seller.userId}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Contraseña */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60 min-w-0">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                              {sellerPassword ? (
                                <span className="font-mono text-[10px] sm:text-[11px] font-black text-emerald-700 dark:text-emerald-400 truncate select-all">
                                  {isRevealed ? sellerPassword : '••••••••'}
                                </span>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 italic font-semibold truncate">
                                  Sin clave
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              {sellerPassword ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleRevealPassword(seller.userId)}
                                    title={isRevealed ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="w-3 h-3" />
                                    ) : (
                                      <Eye className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopySingle(sellerPassword, `pass_${seller.userId}`)}
                                    title="Copiar contraseña"
                                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  >
                                    {copiedKey === `pass_${seller.userId}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(seller)}
                                  className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  title="Asignar contraseña"
                                >
                                  + Asignar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sucursal */}
                      <td className="py-2.5 px-2 sm:px-3">
                        {seller.branchName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 truncate max-w-full" title={seller.branchName}>
                            <Store className="w-3 h-3 shrink-0" />
                            <span className="truncate">{seller.branchName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">
                            — {t('employees.unassigned', 'Sin asignar')}
                          </span>
                        )}
                      </td>

                      {/* Ventas y Total */}
                      <td className="py-2.5 px-2 sm:px-3 text-right">
                        <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs truncate">
                          {formatCurrency(seller.totalSold, activeBusiness?.currency || 'BOB')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {seller.salesCount} {t('employees.tickets', 'ventas')}
                        </div>
                      </td>

                      {/* Estado de Acceso con interruptor */}
                      <td className="py-2.5 px-2 sm:px-3 text-center">
                        {seller.role !== 'owner' ? (
                          <button
                            type="button"
                            disabled={updatingMemberId === seller.memberId}
                            onClick={() => handleToggleStatus(seller.memberId, seller.isActive)}
                            className="inline-flex flex-col items-center gap-0.5 group cursor-pointer focus:outline-none"
                            title={seller.isActive ? t('employees.deactivate', 'Desactivar Acceso') : t('employees.activate', 'Activar Acceso')}
                          >
                            <div
                              className={`relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                seller.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                  seller.isActive ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </div>
                            <span
                              className={`text-[9px] font-black ${
                                seller.isActive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {seller.isActive ? t('employees.can_enter', 'Activo') : t('employees.no_access', 'Inactivo')}
                            </span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {t('employees.always_active', 'Activo')}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-2 sm:px-3 text-right">
                        {seller.role !== 'owner' ? (
                          <div className="flex items-center justify-end gap-1">
                            {/* Ver y Copiar Credenciales */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewingCredentials({
                                  name: seller.fullName,
                                  email: seller.email,
                                  pass: sellerPassword || '',
                                  branchName: seller.branchName || undefined,
                                });
                              }}
                              className="p-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Ver y Copiar Credenciales Completas"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(seller)}
                              className="p-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                              title={t('employees.edit', 'Editar Vendedor y Contraseña')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={() => setDeletingSeller(seller)}
                              className="p-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title={t('employees.delete', 'Eliminar Vendedor')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            {t('employees.main_account', 'Cuenta Principal')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── MODAL: REGISTRAR NUEVO VENDEDOR ── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-lg p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3.5 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black leading-tight">
                  {t('employees.create_title', 'Registrar Nuevo Vendedor / Cajero')}
                </h3>
                <p className="text-[10px] text-blue-100 font-medium">
                  {t('employees.create_sub', 'Genera acceso de inicio de sesión para tu personal')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateSeller} className="p-5 space-y-3.5 bg-white dark:bg-zinc-900 text-xs">
            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                {t('employees.full_name', 'Nombre Completo')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  {t('employees.email', 'Correo Electrónico (Login)')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@mitienda.com"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  {t('employees.password', 'Contraseña de Acceso')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Sucursal Asignada <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Selecciona una sucursal...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.is_main ? ' (Principal)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Celular / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 70123456"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
              <span className="font-bold">✓ Acceso directo:</span> Este vendedor podrá entrar con su correo y contraseña al Punto de Venta (POS) y cobrar inmediatamente.
            </div>

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
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creando vendedor...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Vendedor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: VER / COMPARTIR CREDENCIALES DEL VENDEDOR ── */}
      {viewingCredentials && (
        <Modal
          isOpen={!!viewingCredentials}
          onClose={() => setViewingCredentials(null)}
          className="max-w-md p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-200" />
              <div>
                <h3 className="text-sm font-black">Credenciales de Acceso</h3>
                <p className="text-[10px] text-blue-100">{viewingCredentials.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewingCredentials(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-zinc-900 text-xs">
            <p className="text-slate-600 dark:text-zinc-400">
              Datos de inicio de sesión para <strong>{viewingCredentials.name}</strong>:
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 font-mono space-y-2.5 text-xs">
              {/* Enlace */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px]">ENLACE DE ACCESO:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold truncate block">
                    https://komerz-pos.vercel.app/login
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySingle('https://komerz-pos.vercel.app/login', 'link')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 cursor-pointer shrink-0"
                  title="Copiar enlace"
                >
                  {copiedKey === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Usuario */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px]">USUARIO / CORREO:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold truncate block select-all">
                    {viewingCredentials.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySingle(viewingCredentials.email, 'view_mail')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 cursor-pointer shrink-0"
                  title="Copiar correo"
                >
                  {copiedKey === 'view_mail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Contraseña */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px]">CONTRASEÑA:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm select-all">
                    {viewingCredentials.pass || 'Sin contraseña registrada'}
                  </span>
                </div>
                {viewingCredentials.pass && (
                  <button
                    type="button"
                    onClick={() => handleCopySingle(viewingCredentials.pass, 'view_pass')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 cursor-pointer shrink-0"
                    title="Copiar contraseña"
                  >
                    {copiedKey === 'view_pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Botón Copiar Todo para WhatsApp */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyFullWhatsAppText(
                  viewingCredentials.name,
                  viewingCredentials.email,
                  viewingCredentials.pass,
                  viewingCredentials.branchName
                )}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba59] hover:to-[#0f7a6e] text-white text-xs font-black shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>
                  {copiedKey === `all_${viewingCredentials.email}`
                    ? '¡Copiado para WhatsApp!'
                    : 'Copiar Mensaje para WhatsApp'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewingCredentials(null)}
                className="w-full py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: EDITAR VENDEDOR Y RESTABLECER CONTRASEÑA ── */}
      {editingSeller && (
        <Modal
          isOpen={!!editingSeller}
          onClose={() => setEditingSeller(null)}
          className="max-w-md p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-200" />
              <div>
                <h3 className="text-sm font-black">Editar Vendedor</h3>
                <p className="text-[10px] text-blue-100">{editingSeller.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingSeller(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUpdateSeller} className="p-5 space-y-3.5 bg-white dark:bg-zinc-900 text-xs">
            {editError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            {/* Credenciales de Acceso Actuales */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Datos de Acceso
                </span>
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                  Komerz POS
                </span>
              </div>

              {/* Login */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200 truncate select-all">
                    {editingSeller.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySingle(editingSeller.email, 'edit_mail')}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 cursor-pointer shrink-0"
                  title="Copiar correo"
                >
                  {copiedKey === 'edit_mail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Contraseña Actual */}
              <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 truncate select-all">
                    {getSellerPassword(editingSeller.email, editingSeller.userId) || 'Sin clave guardada'}
                  </span>
                </div>
                {getSellerPassword(editingSeller.email, editingSeller.userId) && (
                  <button
                    type="button"
                    onClick={() => handleCopySingle(getSellerPassword(editingSeller.email, editingSeller.userId), 'edit_pass')}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 cursor-pointer shrink-0"
                    title="Copiar contraseña actual"
                  >
                    {copiedKey === 'edit_pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Nombre del vendedor"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sucursal Asignada */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Sucursal Asignada
              </label>
              <select
                value={editBranchId}
                onChange={(e) => setEditBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">— Sin sucursal asignada —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.is_main ? ' (Principal)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cambiar o Asignar Nueva Contraseña */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Cambiar / Nueva Contraseña (Opcional)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  minLength={6}
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Dejar en blanco para conservar la actual"
                  className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Si escribes una nueva contraseña (mínimo 6 caracteres), se actualizará el acceso del vendedor de inmediato.
              </p>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingSeller(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50"
              >
                {editSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN DE VENDEDOR ── */}
      {deletingSeller && (
        <Modal
          isOpen={!!deletingSeller}
          onClose={() => setDeletingSeller(null)}
          className="max-w-sm p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-rose-600 px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-200" />
              <h3 className="text-sm font-black">Eliminar Vendedor</h3>
            </div>
            <button
              type="button"
              onClick={() => setDeletingSeller(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-3.5 bg-white dark:bg-zinc-900 text-xs">
            <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong>{deletingSeller.fullName}</strong> ({deletingSeller.email})?
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              ⚠️ Perderá el acceso de inicio de sesión a este negocio de inmediato.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeletingSeller(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteSeller}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: CREDENCIALES CREADAS (LISTAS PARA COMPARTIR) ── */}
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

            <div className="p-3.5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 font-mono space-y-2 text-xs">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">ENLACE DE INICIO DE SESIÓN:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold truncate block">
                    https://komerz-pos.vercel.app/login
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySingle('https://komerz-pos.vercel.app/login', 'c_link')}
                  className="p-1 rounded text-slate-400 hover:text-blue-600"
                >
                  {copiedKey === 'c_link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">USUARIO / CORREO:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold truncate block select-all">
                    {createdCredentials.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySingle(createdCredentials.email, 'c_mail')}
                  className="p-1 rounded text-slate-400 hover:text-blue-600"
                >
                  {copiedKey === 'c_mail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">CONTRASEÑA:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm select-all">
                    {createdCredentials.pass}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySingle(createdCredentials.pass, 'c_pass')}
                  className="p-1 rounded text-slate-400 hover:text-emerald-600"
                >
                  {copiedKey === 'c_pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba59] hover:to-[#0f7a6e] text-white text-xs font-black shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>{copied ? '¡Copiado para WhatsApp!' : 'Copiar Credenciales para WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
