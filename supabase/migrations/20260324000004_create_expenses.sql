-- Migration: 20260324000004_create_expenses.sql
-- Table: expenses for Operating Expenses & Cash Register Sync

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0.00,
    payment_source TEXT NOT NULL DEFAULT 'cash_register',
    receipt_number TEXT,
    paid_to TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'expenses_policy') THEN
    CREATE POLICY "expenses_policy" ON public.expenses FOR ALL USING (
      public.check_is_super_admin(auth.uid()) OR public.user_belongs_to_business(business_id, auth.uid())
    );
  END IF;
END $$;
