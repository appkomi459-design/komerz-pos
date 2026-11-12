import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  Receipt,
  Users,
  Truck,
  ShoppingBag,
  Wallet,
  TrendingDown,
  BarChart3,
  UserCheck,
  Building2,
  Settings,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  Store,
  PlusCircle,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { NotificationsBell } from '@/components/common/NotificationsBell';

export const BusinessLayout: React.FC = () => {
  const { user, profile, isSuperAdmin, signOut } = useAuth();
  const {
    activeBusiness,
    businesses,
    currentRole,
    mainBranch,
    subscription,
    setActiveBusinessId,
  } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navSections = [
    {
      title: 'OPERACIONES',
      items: [
        { name: 'Panel', path: '/app', icon: LayoutDashboard, exact: true, activeGradient: 'bg-gradient-to-r from-[#eb3349] to-[#f45c43] shadow-rose-600/30 text-white' },
        { name: 'Venta (Caja)', path: '/app/pos', icon: ShoppingCart, activeGradient: 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] shadow-emerald-600/30 text-white' },
        { name: 'Productos / Stock', path: '/app/products', icon: Package, activeGradient: 'bg-gradient-to-r from-[#00c6ff] to-[#0072ff] shadow-cyan-600/30 text-white' },
        { name: 'Categorías', path: '/app/categories', icon: Tags, activeGradient: 'bg-gradient-to-r from-[#8e2de2] to-[#4a00e0] shadow-purple-600/30 text-white' },
      ],
    },
    {
      title: 'GESTIÓN & CONTROL',
      items: [
        { name: 'Todas las ventas', path: '/app/sales', icon: Receipt, activeGradient: 'bg-gradient-to-r from-[#eb3349] to-[#f45c43] shadow-rose-600/30 text-white' },
        { name: 'Clientes', path: '/app/customers', icon: Users, activeGradient: 'bg-gradient-to-r from-[#f2994a] to-[#f2c94c] shadow-amber-600/30 text-white' },
        { name: 'Proveedores', path: '/app/suppliers', icon: Truck, activeGradient: 'bg-gradient-to-r from-[#2980b9] to-[#2c3e50] shadow-blue-600/30 text-white' },
        { name: 'Compras', path: '/app/purchases', icon: ShoppingBag, activeGradient: 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] shadow-emerald-600/30 text-white' },
        { name: 'Caja', path: '/app/cash', icon: Wallet, activeGradient: 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] shadow-emerald-600/30 text-white' },
        { name: 'Gastos', path: '/app/expenses', icon: TrendingDown, activeGradient: 'bg-gradient-to-r from-[#870000] to-[#190a05] shadow-rose-950/30 text-white' },
        { name: 'Reportes', path: '/app/reports', icon: BarChart3, activeGradient: 'bg-gradient-to-r from-[#2980b9] to-[#2c3e50] shadow-blue-600/30 text-white' },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { name: 'Empleados', path: '/app/employees', icon: UserCheck, activeGradient: 'bg-gradient-to-r from-[#2980b9] to-[#2c3e50] shadow-blue-600/30 text-white' },
        { name: 'Sucursales', path: '/app/branches', icon: Building2, activeGradient: 'bg-gradient-to-r from-[#8e2de2] to-[#4a00e0] shadow-purple-600/30 text-white' },
        { name: 'Configuración', path: '/app/settings', icon: Settings, activeGradient: 'bg-gradient-to-r from-[#4b6cb7] to-[#182848] shadow-slate-600/30 text-white' },
        { name: 'Suscripción', path: '/app/subscription', icon: CreditCard, activeGradient: 'bg-gradient-to-r from-[#f2994a] to-[#f2c94c] shadow-amber-600/30 text-white' },
        { name: 'Sugerencias', path: '/app/suggestions', icon: MessageSquare, activeGradient: 'bg-gradient-to-r from-[#00b09b] to-[#96c93d] shadow-emerald-600/30 text-white' },
      ],
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'emerald';
      case 'admin':
        return 'blue';
      case 'manager':
        return 'amber';
      default:
        return 'gray';
    }
  };

  const getRoleName = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'cashier':
        return 'Cajero';
      default:
        return 'Miembro';
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f5f0e6] dark:bg-[#121110] text-slate-950 dark:text-zinc-100 transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient Aurora Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-rose-400/15 dark:bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#181514] border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 ease-in-out lg:static ${
          collapsed ? 'w-20' : 'w-68'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header & Business Switcher */}
        <div className="h-18 px-3.5 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 relative gap-2">
          <div className="flex-1 min-w-0 relative">
            <button
              onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left w-full group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold overflow-hidden">
                {activeBusiness?.logo_url ? (
                  <img
                    src={activeBusiness.logo_url}
                    alt={activeBusiness.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-4 h-4" />
                )}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {activeBusiness?.name || 'Mi Negocio'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 capitalize truncate">
                      {activeBusiness?.business_type || 'Comercio'}
                    </p>
                  </div>
                </div>
              )}

              {!collapsed && (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-transform flex-shrink-0" />
              )}
            </button>

            {/* Business Switcher Dropdown */}
            {businessMenuOpen && (
              <div
                className="absolute top-14 left-0 w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-3 py-2">
                  Mis Negocios ({businesses.length})
                </p>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => {
                        setActiveBusinessId(biz.id);
                        setBusinessMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                        biz.id === activeBusiness?.id
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {biz.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="truncate text-xs font-semibold">{biz.name}</p>
                        <p className="text-[10px] text-gray-400">{biz.currency} • {biz.country}</p>
                      </div>
                      {biz.id === activeBusiness?.id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setBusinessMenuOpen(false);
                      navigate('/onboarding');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Crear nuevo negocio</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Close mobile button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex-shrink-0 transition-colors"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items (Agrupados por Sección con Cápsulas de Color) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 dark:text-zinc-500 px-3 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  {sec.title}
                </p>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all group ${
                      isActive
                        ? `${item.activeGradient} shadow-md`
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/70 hover:text-gray-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-inner'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Collapse Toggle */}
        <div className="p-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          {!collapsed && (
            <div className="px-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
                Plan {subscription?.plan?.name || 'Gratis'}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ml-auto cursor-pointer"
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-18 bg-white/80 dark:bg-[#141416]/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Branch Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 border border-gray-200/50 dark:border-zinc-700/50">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>{mainBranch?.name || 'Sucursal Principal'}</span>
            </div>
          </div>

          {/* Right Header: Theme Toggle, Super Admin link, User Profile */}
          <div className="flex items-center gap-3">
            {/* Super Admin Quick Link */}
            {isSuperAdmin && (
              <Link
                to="/superadmin"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                <span>Super Admin</span>
              </Link>
            )}

            {/* Notifications Bell */}
            <NotificationsBell />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Cambiar modo claro/oscuro"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 leading-tight">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {getRoleName(currentRole)}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-zinc-300 hidden md:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl p-2 z-50 animate-scale-in"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                      {profile?.full_name || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                    <div className="mt-2">
                      <Badge variant={getRoleBadgeVariant(currentRole)} size="sm">
                        {getRoleName(currentRole)}
                      </Badge>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/app/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Configuración del negocio</span>
                    </Link>

                    {isSuperAdmin && (
                      <Link
                        to="/superadmin"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span>Panel Super Admin</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
