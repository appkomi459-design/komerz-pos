-- Migration: 20260324000003_create_cash_management.sql
-- Cash Sessions, Cash Movements & Sales Change Tracking

CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    opened_by TEXT,
    closed_by TEXT,
    opening_balance NUMERIC NOT NULL DEFAULT 0.00,
    closing_balance NUMERIC,
    expected_balance NUMERIC,
    difference NUMERIC,
    total_sales NUMERIC NOT NULL DEFAULT 0.00,
    total_cash_sales NUMERIC NOT NULL DEFAULT 0.00,
    total_transfer_sales NUMERIC NOT NULL DEFAULT 0.00,
    total_change_given NUMERIC NOT NULL DEFAULT 0.00,
    total_expenses NUMERIC NOT NULL DEFAULT 0.00,
    sales_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_sessions' AND policyname = 'cash_sessions_policy') THEN
    CREATE POLICY "cash_sessions_policy" ON public.cash_sessions FOR ALL USING (
      public.check_is_super_admin(auth.uid()) OR public.user_belongs_to_business(business_id, auth.uid())
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0.00,
    description TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_movements' AND policyname = 'cash_movements_policy') THEN
    CREATE POLICY "cash_movements_policy" ON public.cash_movements FOR ALL USING (
      public.check_is_super_admin(auth.uid()) OR public.user_belongs_to_business(business_id, auth.uid())
    );
  END IF;
END $$;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_received NUMERIC DEFAULT 0.00;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS change_given NUMERIC DEFAULT 0.00;
