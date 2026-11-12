import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/integrations/supabase/client';

export const SuperAdminLayout: React.FC = () => {
  const { user, profile, isSuperAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Obtener conteo de sugerencias pendientes en tiempo real
  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from('suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendiente');
      setPendingCount(count || 0);
    };
    fetchPending();

    // Suscribirse a cambios en suggestions
    const channel = supabase
      .channel('admin_suggestions_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, () => {
        fetchPending();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSuperAdmin]);

  // Si no es super admin, bloquear acceso
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-rose-200 dark:border-rose-950 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Acceso Restringido</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
            Esta área es exclusiva para el Administrador de la plataforma.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/app"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              Ir a mi Negocio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Menú completo del Super Admin con colores vivos estilo cápsula:
  const navItems = [
    {
      name: 'Dashboard General',
      path: '/superadmin',
      icon: LayoutDashboard,
      exact: true,
      activeGradient: 'bg-gradient-to-r from-[#eb3349] to-[#f45c43] shadow-rose-600/30 text-white',
      desc: 'Métricas de ingresos, MRR y estado de la plataforma',
    },
    {
      name: 'Usuarios y Clientes',
      path: '/superadmin/users',
      icon: Users,
      activeGradient: 'bg-gradient-to-r from-[#2980b9] to-[#2c3e50] shadow-blue-600/30 text-white',
      desc: 'Qué usuarios y clientes ocupan la app y sus planes',
    },
    {
      name: 'Planes y Precios',
      path: '/superadmin/plans',
      icon: CreditCard,
      activeGradient: 'bg-gradient-to-r from-[#f2994a] to-[#f2c94c] shadow-amber-600/30 text-white',
      desc: 'Distribución y precios de planes de suscripción',
    },
    {
      name: 'Notificaciones',
      path: '/superadmin/notifications',
      icon: Bell,
      activeGradient: 'bg-gradient-to-r from-[#00c6ff] to-[#0072ff] shadow-cyan-600/30 text-white',
      desc: 'Enviar avisos masivos a usuarios y clientes',
    },
    {
      name: 'Chat de Sugerencias',
      path: '/superadmin/suggestions',
      icon: MessageSquare,
      badge: pendingCount > 0 ? `${pendingCount}` : undefined,
      activeGradient: 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] shadow-emerald-600/30 text-white',
      desc: 'Mensajes y dudas de usuarios y clientes',
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f5f0e6] dark:bg-[#121110] text-slate-950 dark:text-zinc-100 transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient Aurora Mesh Gradients (Elimina el fondo blanco plano) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-rose-400/20 dark:bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Administrador */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#181514] text-zinc-100 border-r border-zinc-800 transition-all duration-300 w-64 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-18 px-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-white">Panel Administrador</p>
              <Badge variant="emerald" size="sm" className="mt-0.5">
                Super Admin
              </Badge>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menú con Cápsulas de Color Vivas */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-2">
          <p className="text-[10px] uppercase font-black tracking-wider text-zinc-500 px-2 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            Gestión Central
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group ${
                    isActive
                      ? `${item.activeGradient} shadow-md`
                      : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-400 text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Perfil del admin y cerrar sesión */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
          <div className="mb-3 px-1">
            <p className="text-xs font-bold text-zinc-200">{profile?.full_name || 'Super Admin'}</p>
            <p className="text-[11px] text-zinc-400 truncate font-mono">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal del Panel Administrador */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-18 bg-white/90 dark:bg-[#181514]/90 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-zinc-100 tracking-tight">
                Panel de Administración General
              </h1>
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 hidden sm:block">
                Monitoreo de usuarios, clientes, planes y buzón de sugerencias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-xs"
              title="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
