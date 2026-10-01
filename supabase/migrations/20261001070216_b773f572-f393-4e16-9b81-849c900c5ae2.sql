ALTER TABLE public.products ADD COLUMN markets text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.market_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  market text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market)
);
GRANT SELECT, INSERT, DELETE ON public.market_admins TO authenticated;
GRANT ALL ON public.market_admins TO service_role;
ALTER TABLE public.market_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market admins: own or main admin read" ON public.market_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Market admins: main admin insert" ON public.market_admins FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Market admins: main admin delete" ON public.market_admins FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.is_market_admin(_user_id uuid, _market text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.market_admins WHERE user_id = _user_id AND market = _market)
$$;

CREATE OR REPLACE FUNCTION public.is_market_product_admin(_product_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.market_admins m ON m.user_id = _user_id AND p.markets = ARRAY[m.market]
    WHERE p.id = _product_id
  )
$$;

CREATE POLICY "Market admins insert own market products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (cardinality(markets) = 1 AND public.is_market_admin(auth.uid(), markets[1]));
CREATE POLICY "Market admins update own market products" ON public.products FOR UPDATE TO authenticated
  USING (cardinality(markets) = 1 AND public.is_market_admin(auth.uid(), markets[1]))
  WITH CHECK (cardinality(markets) = 1 AND public.is_market_admin(auth.uid(), markets[1]));
CREATE POLICY "Market admins delete own market products" ON public.products FOR DELETE TO authenticated
  USING (cardinality(markets) = 1 AND public.is_market_admin(auth.uid(), markets[1]));

CREATE POLICY "Market admins manage translations of own products" ON public.catalog_translations FOR ALL TO authenticated
  USING (entity_type = 'product' AND public.is_market_product_admin(entity_id, auth.uid()))
  WITH CHECK (entity_type = 'product' AND public.is_market_product_admin(entity_id, auth.uid()));

CREATE TABLE public.product_market_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  market text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, market)
);
GRANT SELECT ON public.product_market_exclusions TO anon;
GRANT SELECT, INSERT, DELETE ON public.product_market_exclusions TO authenticated;
GRANT ALL ON public.product_market_exclusions TO service_role;
ALTER TABLE public.product_market_exclusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exclusions public read" ON public.product_market_exclusions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Exclusions manage" ON public.product_market_exclusions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_market_admin(auth.uid(), market))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_market_admin(auth.uid(), market));

CREATE TABLE public.product_market_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  market text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, market)
);
GRANT SELECT ON public.product_market_order TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_market_order TO authenticated;
GRANT ALL ON public.product_market_order TO service_role;
ALTER TABLE public.product_market_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market order public read" ON public.product_market_order FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Market order manage" ON public.product_market_order FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_market_admin(auth.uid(), market))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_market_admin(auth.uid(), market));
CREATE TRIGGER update_product_market_order_updated_at BEFORE UPDATE ON public.product_market_order
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();