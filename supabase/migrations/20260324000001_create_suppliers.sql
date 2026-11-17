-- Migración: Tabla de Proveedores (Suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    identification TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    category TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_policy" ON public.suppliers;
CREATE POLICY "suppliers_policy" ON public.suppliers
FOR ALL USING (
    public.check_is_super_admin(auth.uid())
    OR public.user_belongs_to_business(business_id, auth.uid())
);
