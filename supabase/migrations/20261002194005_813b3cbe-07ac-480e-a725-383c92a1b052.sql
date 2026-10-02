CREATE TABLE public.product_synonyms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  locale text NOT NULL DEFAULT 'de-DE',
  term text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX product_synonyms_uniq ON public.product_synonyms (product_id, locale, lower(term));
GRANT SELECT ON public.product_synonyms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_synonyms TO authenticated;
GRANT ALL ON public.product_synonyms TO service_role;
ALTER TABLE public.product_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read synonyms" ON public.product_synonyms FOR SELECT USING (true);
CREATE POLICY "Admins manage synonyms" ON public.product_synonyms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_market_product_admin(product_id, auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_market_product_admin(product_id, auth.uid()));