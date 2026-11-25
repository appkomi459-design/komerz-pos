CREATE TABLE IF NOT EXISTS public.trash_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  title text NOT NULL,
  subtitle text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trash_items_business_deleted
  ON public.trash_items (business_id, deleted_at DESC);

ALTER TABLE public.trash_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trash_items_policy ON public.trash_items;
CREATE POLICY trash_items_policy ON public.trash_items
  FOR ALL
  USING (
    check_is_super_admin(auth.uid())
    OR user_belongs_to_business(business_id, auth.uid())
  )
  WITH CHECK (
    check_is_super_admin(auth.uid())
    OR user_belongs_to_business(business_id, auth.uid())
  );
