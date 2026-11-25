CREATE OR REPLACE FUNCTION public.get_public_catalog(p_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business jsonb;
  v_business_id uuid;
  v_categories jsonb;
  v_products jsonb;
  v_is_uuid boolean;
BEGIN
  IF p_identifier IS NULL OR btrim(p_identifier) = '' THEN
    RETURN NULL;
  END IF;

  v_is_uuid := p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  SELECT
    b.id,
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'business_type', b.business_type,
      'logo_url', b.logo_url,
      'cover_url', b.cover_url,
      'country', b.country,
      'city', b.city,
      'address', b.address,
      'phone', b.phone,
      'currency', b.currency
    )
  INTO v_business_id, v_business
  FROM public.businesses b
  WHERE (v_is_uuid AND b.id = p_identifier::uuid)
     OR (NOT v_is_uuid AND b.slug = p_identifier)
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name
      )
      ORDER BY c.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_categories
  FROM public.categories c
  WHERE c.business_id = v_business_id
    AND c.is_active = true;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'sku', p.sku,
        'sale_price', p.sale_price,
        'stock', p.stock,
        'unit', p.unit,
        'image_url', p.image_url,
        'category_id', p.category_id,
        'is_active', p.is_active,
        'category', CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('name', c.name) ELSE NULL END
      )
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_products
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.business_id = v_business_id
    AND p.is_active = true;

  RETURN jsonb_build_object(
    'business', v_business,
    'categories', v_categories,
    'products', v_products
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_catalog(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_catalog(text) TO anon, authenticated;
