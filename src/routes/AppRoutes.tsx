import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';

// Layouts
import { PublicLayout }     from '@/layouts/PublicLayout';
import { AuthLayout }       from '@/layouts/AuthLayout';
import { BusinessLayout }   from '@/layouts/BusinessLayout';
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout';

// Public & Auth Pages
import { LandingPage }        from '@/pages/public/LandingPage';
import { PublicCatalogPage }  from '@/pages/public/PublicCatalogPage';
import { LoginPage }          from '@/pages/auth/LoginPage';
import { RegisterPage }       from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage }  from '@/pages/auth/ResetPasswordPage';

// Onboarding
import { OnboardingWizardPage } from '@/pages/onboarding/OnboardingWizardPage';

// Business Modules
import { DashboardOverviewPage } from '@/pages/business/DashboardOverviewPage';
import { PosPage }               from '@/pages/business/PosPage';
import { ProductsPage }          from '@/pages/business/ProductsPage';
import { CategoriesPage }        from '@/pages/business/CategoriesPage';
import { InventoryPage }         from '@/pages/business/InventoryPage';
import { SalesPage }             from '@/pages/business/SalesPage';
import { CustomersPage }         from '@/pages/business/CustomersPage';
import { SuppliersPage }         from '@/pages/business/SuppliersPage';
import { PurchasesPage }         from '@/pages/business/PurchasesPage';
import { CashPage }              from '@/pages/business/CashPage';
import { ExpensesPage }          from '@/pages/business/ExpensesPage';
import { ReportsPage }           from '@/pages/business/ReportsPage';
import { EmployeesPage }         from '@/pages/business/EmployeesPage';
import { BranchesPage }          from '@/pages/business/BranchesPage';
import { SettingsPage }          from '@/pages/business/SettingsPage';
import { SubscriptionPage }      from '@/pages/business/SubscriptionPage';
import { SuggestionsPage }       from '@/pages/business/SuggestionsPage';

// Super Admin Pages
import { SuperAdminOverviewPage }      from '@/pages/superadmin/SuperAdminOverviewPage';
import { SuperAdminDashboardPage }     from '@/pages/superadmin/SuperAdminDashboardPage';
import { SuperAdminPlansPage }         from '@/pages/superadmin/SuperAdminPlansPage';
import { SuperAdminNotificationsPage } from '@/pages/superadmin/SuperAdminNotificationsPage';
import { SuperAdminSuggestionsPage }   from '@/pages/superadmin/SuperAdminSuggestionsPage';

// ─────────────────────────────────────────────
// Pantalla de carga global
// ─────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#101012] text-gray-900 dark:text-zinc-100">
    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center animate-pulse mb-3 shadow-lg shadow-emerald-500/20">
      <span className="text-xl font-black">K</span>
    </div>
    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
      Cargando Komerz POS…
    </p>
  </div>
);

// ─────────────────────────────────────────────
// Guard: rutas públicas de autenticación
// Si el usuario ya está logueado → redirigir a su panel
// ─────────────────────────────────────────────
const PublicAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isSuperAdmin, loading: authLoading, profile } = useAuth();
  const { businesses, loading: bizLoading } = useBusiness();

  // Esperar a que termine la carga de sesión
  if (authLoading) return <LoadingScreen />;

  if (user) {
    // Esperar el perfil antes de decidir a dónde redirigir
    if (!profile) return <LoadingScreen />;

    if (isSuperAdmin) return <Navigate to="/superadmin" replace />;

    // Esperar negocios
    if (bizLoading) return <LoadingScreen />;

    if (businesses.length === 0) return <Navigate to="/onboarding" replace />;

    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// ─────────────────────────────────────────────
// Guard: dashboard privado del negocio
// ─────────────────────────────────────────────
const BusinessRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { businesses, loading: bizLoading } = useBusiness();
  const location = useLocation();

  if (authLoading || (user && bizLoading)) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (businesses.length === 0) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

// ─────────────────────────────────────────────
// Guard: wizard de configuración inicial
// ─────────────────────────────────────────────
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// ─────────────────────────────────────────────
// Rutas principales
// ─────────────────────────────────────────────
export const AppRoutes: React.FC = () => (
  <Routes>
    {/* Catálogo público accesible por QR (sin autenticación requerida) */}
    <Route path="/c/:businessId" element={<PublicCatalogPage />} />

    {/* 1. Landing pública */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
    </Route>

    {/* 2. Autenticación (redirige si ya está logueado) */}
    <Route
      element={
        <PublicAuthRoute>
          <AuthLayout />
        </PublicAuthRoute>
      }
    >
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
    </Route>

    {/* 3. Wizard de configuración inicial */}
    <Route
      path="/onboarding"
      element={
        <OnboardingRoute>
          <OnboardingWizardPage />
        </OnboardingRoute>
      }
    />

    {/* 4. Dashboard privado del negocio */}
    <Route
      path="/app"
      element={
        <BusinessRoute>
          <BusinessLayout />
        </BusinessRoute>
      }
    >
      <Route index            element={<DashboardOverviewPage />} />
      <Route path="pos"          element={<PosPage />} />
      <Route path="products"     element={<ProductsPage />} />
      <Route path="categories"   element={<CategoriesPage />} />
      <Route path="inventory"    element={<Navigate to="/app/products" replace />} />
      <Route path="sales"        element={<SalesPage />} />
      <Route path="customers"    element={<CustomersPage />} />
      <Route path="suppliers"    element={<SuppliersPage />} />
      <Route path="purchases"    element={<PurchasesPage />} />
      <Route path="cash"         element={<CashPage />} />
      <Route path="expenses"     element={<ExpensesPage />} />
      <Route path="reports"      element={<ReportsPage />} />
      <Route path="employees"    element={<EmployeesPage />} />
      <Route path="branches"     element={<BranchesPage />} />
      <Route path="settings"     element={<SettingsPage />} />
      <Route path="subscription" element={<SubscriptionPage />} />
      <Route path="suggestions"  element={<SuggestionsPage />} />
    </Route>

    {/* 5. Panel Super Admin */}
    <Route path="/superadmin" element={<SuperAdminLayout />}>
      <Route index              element={<SuperAdminOverviewPage />} />
      <Route path="users"       element={<SuperAdminDashboardPage />} />
      <Route path="plans"       element={<SuperAdminPlansPage />} />
      <Route path="notifications" element={<SuperAdminNotificationsPage />} />
      <Route path="suggestions" element={<SuperAdminSuggestionsPage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
