CREATE TABLE public.product_headings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  before_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_headings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_headings TO authenticated;
GRANT ALL ON public.product_headings TO service_role;
ALTER TABLE public.product_headings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Headings public read" ON public.product_headings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage headings" ON public.product_headings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_product_headings_updated_at BEFORE UPDATE ON public.product_headings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();