CREATE TABLE public.import_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  market text NOT NULL DEFAULT 'CH',
  interval text NOT NULL DEFAULT 'weekly',
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_sources TO authenticated;
GRANT ALL ON public.import_sources TO service_role;
ALTER TABLE public.import_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage import_sources" ON public.import_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_import_sources_updated_at BEFORE UPDATE ON public.import_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.import_sources(id) ON DELETE CASCADE,
  source_url text,
  market text NOT NULL DEFAULT 'CH',
  raw_name text NOT NULL,
  suggested_name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  emoji text,
  price numeric,
  currency text,
  pack_size numeric,
  pack_unit text,
  unit_price numeric,
  unit_basis text,
  match_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  match_type text NOT NULL DEFAULT 'new',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX import_candidates_status_idx ON public.import_candidates(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_candidates TO authenticated;
GRANT ALL ON public.import_candidates TO service_role;
ALTER TABLE public.import_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage import_candidates" ON public.import_candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.product_reference_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  market text NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL,
  pack_size numeric,
  pack_unit text,
  unit_price numeric,
  unit_basis text,
  source_id uuid REFERENCES public.import_sources(id) ON DELETE SET NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, market)
);
GRANT SELECT ON public.product_reference_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reference_prices TO authenticated;
GRANT ALL ON public.product_reference_prices TO service_role;
ALTER TABLE public.product_reference_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads prices" ON public.product_reference_prices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write prices" ON public.product_reference_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_product_reference_prices_updated_at BEFORE UPDATE ON public.product_reference_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();