-- ====================================================================
-- PLATAFORMA SAAS POS MULTIEMPRESA - ESQUEMA DE BASE DE DATOS Y RLS
-- ====================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Asegurar columnas si ya existía la tabla profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_super_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());
    END IF;
END $$;

-- 3. TABLA BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT,
    business_type TEXT NOT NULL DEFAULT 'general',
    logo_url TEXT,
    cover_url TEXT,
    country TEXT NOT NULL DEFAULT 'DO',
    city TEXT,
    address TEXT,
    phone TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    timezone TEXT NOT NULL DEFAULT 'America/Santo_Domingo',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. TABLA BUSINESS_MEMBERS (MEMBRESÍAS Y ROLES MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'cashier')) DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(business_id, user_id)
);

-- 5. TABLA BUSINESS_SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    receipt_footer TEXT DEFAULT '¡Gracias por su compra!',
    tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    tax_id_number TEXT,
    invoice_prefix TEXT DEFAULT 'FAC-',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. TABLA BRANCHES (SUCURSALES)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Sucursal Principal',
    address TEXT,
    phone TEXT,
    is_main BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. TABLA PLANS (PLANES SAAS)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_branches INT NOT NULL DEFAULT 1,
    max_users INT NOT NULL DEFAULT 2,
    max_products INT NOT NULL DEFAULT 500,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. TABLA SUBSCRIPTIONS (SUSCRIPCIONES)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')) DEFAULT 'trialing',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()) + INTERVAL '14 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. TABLA AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. TABLA CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. TABLA PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(12,2) NOT NULL DEFAULT 5.00,
    unit TEXT DEFAULT 'UND',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 12. TABLA CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    identification TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 13. TABLA SALES
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. TABLA SALE_ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- ====================================================================
-- SEMILLAS (PLANS BASE)
-- ====================================================================
INSERT INTO public.plans (name, code, description, price_monthly, price_yearly, max_branches, max_users, max_products, features, is_active)
VALUES
('Gratis / Prueba', 'free', 'Ideal para comenzar y probar todas las funcionalidades', 0.00, 0.00, 1, 2, 100, '["1 Sucursal", "Hasta 2 usuarios", "100 Productos", "Punto de Venta", "Reportes Básicos"]'::jsonb, true),
('Profesional', 'pro', 'Para negocios en crecimiento que requieren más capacidad y sucursales', 29.00, 290.00, 3, 5, 2000, '["3 Sucursales", "Hasta 5 usuarios", "2,000 Productos", "Inventario Avanzado", "Múltiples Cajas", "Soporte Prioritario"]'::jsonb, true),
('Empresarial', 'enterprise', 'Para cadenas y empresas con operaciones de gran volumen', 79.00, 790.00, 10, 25, 50000, '["10 Sucursales", "Hasta 25 usuarios", "Productos Ilimitados", "Auditoría Completa", "API de Integración", "Soporte 24/7"]'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- ====================================================================
-- FUNCIONES DE SEGURIDAD (SECURITY DEFINER)
-- ====================================================================

-- Función para verificar si un usuario es Super Admin
CREATE OR REPLACE FUNCTION public.check_is_super_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = uid), FALSE);
$$;

-- Función para verificar pertenencia a un negocio
CREATE OR REPLACE FUNCTION public.user_belongs_to_business(b_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_id = b_id
          AND user_id = uid
          AND is_active = TRUE
    );
$$;

-- Función para verificar rol en negocio
CREATE OR REPLACE FUNCTION public.user_has_business_role(b_id UUID, uid UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.business_members
        WHERE business_id = b_id
          AND user_id = uid
          AND is_active = TRUE
          AND role = ANY(allowed_roles)
    );
$$;

-- Función para obtener los negocios de un usuario
CREATE OR REPLACE FUNCTION public.get_user_business_ids(uid UUID)
RETURNS TABLE(business_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT business_id FROM public.business_members
    WHERE user_id = uid AND is_active = TRUE;
$$;

-- Disparador para crear el perfil automáticamente cuando un usuario se registra en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, is_super_admin, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        FALSE,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger de protección: NUNCA permitir que un usuario actualice su propio is_super_admin
CREATE OR REPLACE FUNCTION public.prevent_super_admin_self_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW.is_super_admin != OLD.is_super_admin) THEN
        -- Solo permitir si el ejecutor actual es super admin
        IF NOT public.check_is_super_admin(auth.uid()) THEN
            RAISE EXCEPTION 'No tienes permiso para modificar el privilegio de Super Administrador.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_super_admin_self_grant ON public.profiles;
CREATE TRIGGER tr_prevent_super_admin_self_grant
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_self_grant();

-- ====================================================================
-- HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- POLÍTICAS: PROFILES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR public.check_is_super_admin(auth.uid())
    OR id IN (
        SELECT bm.user_id FROM public.business_members bm
        WHERE bm.business_id IN (SELECT get_user_business_ids(auth.uid()))
    )
);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.check_is_super_admin(auth.uid()));

-- --------------------------------------------------------------------
-- POLÍTICAS: BUSINESSES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "businesses_select" ON public.businesses;
CREATE POLICY "businesses_select" ON public.businesses
FOR SELECT USING (
    public.check_is_super_admin(auth.uid())
    OR id IN (SELECT get_user_business_ids(auth.uid()))
);

DROP POLICY IF EXISTS "businesses_insert" ON public.businesses;
CREATE POLICY "businesses_insert" ON public.businesses
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "businesses_update" ON public.businesses;
CREATE POLICY "businesses_update" ON public.businesses
FOR UPDATE USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(id, auth.uid(), ARRAY['owner', 'admin'])
);

DROP POLICY IF EXISTS "businesses_delete" ON public.businesses;
CREATE POLICY "businesses_delete" ON public.businesses
FOR DELETE USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(id, auth.uid(), ARRAY['owner'])
);

-- --------------------------------------------------------------------
-- POLÍTICAS: BUSINESS_MEMBERS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "members_select" ON public.business_members;
CREATE POLICY "members_select" ON public.business_members
FOR SELECT USING (
    public.check_is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR business_id IN (SELECT get_user_business_ids(auth.uid()))
);

DROP POLICY IF EXISTS "members_insert" ON public.business_members;
CREATE POLICY "members_insert" ON public.business_members
FOR INSERT WITH CHECK (
    public.check_is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner', 'admin'])
);

DROP POLICY IF EXISTS "members_update" ON public.business_members;
CREATE POLICY "members_update" ON public.business_members
FOR UPDATE USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner', 'admin'])
);

DROP POLICY IF EXISTS "members_delete" ON public.business_members;
CREATE POLICY "members_delete" ON public.business_members
FOR DELETE USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner'])
);

-- --------------------------------------------------------------------
-- POLÍTICAS: BUSINESS_SETTINGS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_select" ON public.business_settings;
CREATE POLICY "settings_select" ON public.business_settings
FOR SELECT USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "settings_all" ON public.business_settings;
CREATE POLICY "settings_all" ON public.business_settings
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner', 'admin'])
);

-- --------------------------------------------------------------------
-- POLÍTICAS: BRANCHES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches
FOR SELECT USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "branches_write" ON public.branches;
CREATE POLICY "branches_write" ON public.branches
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner', 'admin'])
);

-- --------------------------------------------------------------------
-- POLÍTICAS: PLANS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all" ON public.plans
FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "plans_write_super_admin" ON public.plans;
CREATE POLICY "plans_write_super_admin" ON public.plans
FOR ALL USING (public.check_is_super_admin(auth.uid()));

-- --------------------------------------------------------------------
-- POLÍTICAS: SUBSCRIPTIONS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions
FOR SELECT USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "subscriptions_write" ON public.subscriptions;
CREATE POLICY "subscriptions_write" ON public.subscriptions
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner', 'admin'])
);

-- --------------------------------------------------------------------
-- POLÍTICAS: AUDIT_LOGS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_has_business_role(business_id, auth.uid(), ARRAY['owner', 'admin', 'manager'])
);

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT WITH CHECK (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

-- --------------------------------------------------------------------
-- POLÍTICAS: CATEGORIES, PRODUCTS, CUSTOMERS, SALES, SALE_ITEMS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_policy" ON public.categories;
CREATE POLICY "categories_policy" ON public.categories
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "products_policy" ON public.products;
CREATE POLICY "products_policy" ON public.products
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "customers_policy" ON public.customers;
CREATE POLICY "customers_policy" ON public.customers
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "sales_policy" ON public.sales;
CREATE POLICY "sales_policy" ON public.sales
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);

DROP POLICY IF EXISTS "sale_items_policy" ON public.sale_items;
CREATE POLICY "sale_items_policy" ON public.sale_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.sales s
        WHERE s.id = sale_items.sale_id
          AND (
              public.check_is_super_admin(auth.uid())
              OR public.user_belongs_to_business(s.business_id, auth.uid())
          )
    )
);

-- --------------------------------------------------------------------
-- CREACIÓN Y POLÍTICA DE STORAGE BUCKET 'business-assets'
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated uploads to business-assets" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to business-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Allow authenticated updates to business-assets" ON storage.objects;
CREATE POLICY "Allow authenticated updates to business-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Allow public read access to business-assets" ON storage.objects;
CREATE POLICY "Allow public read access to business-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-assets');
