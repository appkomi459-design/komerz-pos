-- Migration: agregar branch_id a business_members para asignar vendedores a sucursales
ALTER TABLE public.business_members
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Indice para busquedas por sucursal
CREATE INDEX IF NOT EXISTS idx_business_members_branch_id ON public.business_members(branch_id);
