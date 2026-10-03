CREATE TABLE public.recipe_cuisines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  cuisine_id uuid NOT NULL REFERENCES public.cuisines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, cuisine_id)
);
GRANT SELECT ON public.recipe_cuisines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_cuisines TO authenticated;
GRANT ALL ON public.recipe_cuisines TO service_role;
ALTER TABLE public.recipe_cuisines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable recipe cuisines" ON public.recipe_cuisines FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Owners add recipe cuisines" ON public.recipe_cuisines FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.owner_id = auth.uid()));
CREATE POLICY "Owners update recipe cuisines" ON public.recipe_cuisines FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.owner_id = auth.uid()));
CREATE POLICY "Owners delete recipe cuisines" ON public.recipe_cuisines FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.owner_id = auth.uid()));
CREATE INDEX recipe_cuisines_cuisine_idx ON public.recipe_cuisines(cuisine_id);
CREATE TRIGGER update_recipe_cuisines_updated_at BEFORE UPDATE ON public.recipe_cuisines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();