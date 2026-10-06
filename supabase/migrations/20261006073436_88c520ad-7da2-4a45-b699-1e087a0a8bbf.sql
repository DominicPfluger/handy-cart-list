CREATE TABLE public.variant_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant text NOT NULL,
  locale text NOT NULL,
  term text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant, locale, term)
);
GRANT SELECT ON public.variant_synonyms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variant_synonyms TO authenticated;
GRANT ALL ON public.variant_synonyms TO service_role;
ALTER TABLE public.variant_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads variant synonyms" ON public.variant_synonyms FOR SELECT USING (true);
CREATE POLICY "Admins manage variant synonyms" ON public.variant_synonyms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));