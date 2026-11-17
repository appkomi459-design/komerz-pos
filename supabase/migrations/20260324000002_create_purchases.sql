-- Migration: 20260324000002_create_purchases.sql
-- Table: purchases and purchase_items for Stock Replenishment & Supplier Invoicing

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    purchase_number TEXT NOT NULL,
    invoice_number TEXT,
    subtotal NUMERIC NOT NULL DEFAULT 0.00,
    tax NUMERIC NOT NULL DEFAULT 0.00,
    total NUMERIC NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_status TEXT NOT NULL DEFAULT 'paid',
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'purchases_policy') THEN
        CREATE POLICY "purchases_policy" ON public.purchases FOR ALL USING (
            public.check_is_super_admin(auth.uid()) OR public.user_belongs_to_business(business_id, auth.uid())
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1.00,
    unit_cost NUMERIC NOT NULL DEFAULT 0.00,
    total_cost NUMERIC NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_items' AND policyname = 'purchase_items_policy') THEN
        CREATE POLICY "purchase_items_policy" ON public.purchase_items FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.purchases p 
                WHERE p.id = purchase_items.purchase_id 
                AND (public.check_is_super_admin(auth.uid()) OR public.user_belongs_to_business(p.business_id, auth.uid()))
            )
        );
    END IF;
END $$;
