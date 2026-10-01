CREATE TABLE public.variant_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant text NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  is_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant, locale)
);
GRANT SELECT ON public.variant_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variant_translations TO authenticated;
GRANT ALL ON public.variant_translations TO service_role;
ALTER TABLE public.variant_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read variant translations" ON public.variant_translations FOR SELECT USING (true);
CREATE POLICY "Admins manage variant translations" ON public.variant_translations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_market_product_admin(product_id, auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_market_product_admin(product_id, auth.uid()));
CREATE TRIGGER update_variant_translations_updated_at BEFORE UPDATE ON public.variant_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();