-- Migration: 20261126000001_rpc_get_business_members_admin.sql
-- RPC para que el SuperAdmin pueda leer miembros de cualquier negocio (bypasa RLS)

CREATE OR REPLACE FUNCTION public.get_business_members_admin(p_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID;
  v_is_admin BOOLEAN;
  v_members JSONB;
BEGIN
  v_caller := auth.uid();

  -- Solo super admins pueden usar esta función
  v_is_admin := public.check_is_super_admin(v_caller);

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado. Solo super administradores pueden usar esta función.';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', bm.id,
      'user_id', bm.user_id,
      'role', bm.role,
      'is_active', bm.is_active,
      'created_at', bm.created_at,
      'full_name', p.full_name,
      'email', p.email
    )
  )
  INTO v_members
  FROM public.business_members bm
  LEFT JOIN public.profiles p ON p.id = bm.user_id
  WHERE bm.business_id = p_business_id;

  RETURN COALESCE(v_members, '[]'::jsonb);
END;
$$;

-- Permitir que usuarios autenticados ejecuten la función (la función valida internamente)
GRANT EXECUTE ON FUNCTION public.get_business_members_admin(UUID) TO authenticated;
