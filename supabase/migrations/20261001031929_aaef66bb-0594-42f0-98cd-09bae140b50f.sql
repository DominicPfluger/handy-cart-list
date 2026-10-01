CREATE TABLE public.product_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, department_id)
);
GRANT SELECT ON public.product_aliases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_aliases TO authenticated;
GRANT ALL ON public.product_aliases TO service_role;
ALTER TABLE public.product_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product aliases public read" ON public.product_aliases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage product aliases" ON public.product_aliases FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_product_aliases_updated_at BEFORE UPDATE ON public.product_aliases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();