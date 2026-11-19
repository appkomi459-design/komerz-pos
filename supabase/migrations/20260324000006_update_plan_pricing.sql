-- ============================================================
-- Migration: Update plan pricing
--   Plan Profesional:  $25.00/month, $250.00/year
--   Plan Empresarial:  $75.00/month, $750.00/year
-- ============================================================

UPDATE public.plans
SET
  price_monthly = 25.00,
  price_yearly  = 250.00
WHERE code = 'pro';

UPDATE public.plans
SET
  price_monthly = 75.00,
  price_yearly  = 750.00
WHERE code = 'enterprise';
