CREATE TABLE public.recipe_templates (id text NOT NULL PRIMARY KEY, emoji text, color text, sort_order integer NOT NULL DEFAULT 0, enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.recipe_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_templates TO authenticated;
GRANT ALL ON public.recipe_templates TO service_role;
ALTER TABLE public.recipe_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_templates_read" ON public.recipe_templates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "recipe_templates_admin_write" ON public.recipe_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_recipe_templates_updated_at BEFORE UPDATE ON public.recipe_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipe_steps (id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, template_id text NOT NULL REFERENCES public.recipe_templates(id) ON DELETE CASCADE, key text NOT NULL, name text NOT NULL, emoji text, min integer NOT NULL DEFAULT 0, max integer NOT NULL DEFAULT 1, required boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (template_id, key));
GRANT SELECT ON public.recipe_steps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_steps TO authenticated;
GRANT ALL ON public.recipe_steps TO service_role;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_steps_read" ON public.recipe_steps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "recipe_steps_admin_write" ON public.recipe_steps FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_recipe_steps_updated_at BEFORE UPDATE ON public.recipe_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipe_popular (id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, template_id text NOT NULL REFERENCES public.recipe_templates(id) ON DELETE CASCADE, picks jsonb NOT NULL DEFAULT '{}'::jsonb, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.recipe_popular TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_popular TO authenticated;
GRANT ALL ON public.recipe_popular TO service_role;
ALTER TABLE public.recipe_popular ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_popular_read" ON public.recipe_popular FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "recipe_popular_admin_write" ON public.recipe_popular FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_recipe_popular_updated_at BEFORE UPDATE ON public.recipe_popular FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();