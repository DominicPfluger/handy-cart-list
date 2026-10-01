CREATE TABLE public.recipe_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.recipe_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipe_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_groups TO authenticated;
GRANT ALL ON public.recipe_groups TO service_role;
ALTER TABLE public.recipe_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipe groups public read" ON public.recipe_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage recipe groups" ON public.recipe_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_recipe_groups_updated_at BEFORE UPDATE ON public.recipe_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.recipe_ingredients ADD COLUMN group_id uuid REFERENCES public.recipe_groups(id) ON DELETE SET NULL;
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint WHERE conrelid='public.catalog_translations'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%entity_type%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.catalog_translations DROP CONSTRAINT %I', c); END IF;
END $$;
ALTER TABLE public.catalog_translations ADD CONSTRAINT catalog_translations_entity_type_check CHECK (entity_type IN ('department','product','heading','cuisine','recipe_group'));