CREATE TABLE public.store_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  supermarket_id uuid NOT NULL REFERENCES public.supermarkets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, supermarket_id)
);
GRANT SELECT, INSERT, DELETE ON public.store_admins TO authenticated;
GRANT ALL ON public.store_admins TO service_role;
ALTER TABLE public.store_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_admins read own or admin" ON public.store_admins FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "store_admins admin insert" ON public.store_admins FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "store_admins admin delete" ON public.store_admins FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_store_admin(_user_id uuid, _supermarket_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = _user_id AND supermarket_id = _supermarket_id)
$$;

CREATE TABLE public.store_department_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id uuid NOT NULL REFERENCES public.supermarkets(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text,
  sort_order integer,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supermarket_id, department_id)
);
GRANT SELECT ON public.store_department_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_department_overrides TO authenticated;
GRANT ALL ON public.store_department_overrides TO service_role;
ALTER TABLE public.store_department_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sdo read" ON public.store_department_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sdo write" ON public.store_department_overrides FOR ALL TO authenticated USING (public.is_store_admin(auth.uid(), supermarket_id)) WITH CHECK (public.is_store_admin(auth.uid(), supermarket_id));
CREATE TRIGGER sdo_updated BEFORE UPDATE ON public.store_department_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_product_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id uuid NOT NULL REFERENCES public.supermarkets(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text,
  emoji text,
  default_quantity numeric,
  default_unit text,
  sort_order integer,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supermarket_id, product_id)
);
GRANT SELECT ON public.store_product_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_product_overrides TO authenticated;
GRANT ALL ON public.store_product_overrides TO service_role;
ALTER TABLE public.store_product_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spo read" ON public.store_product_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "spo write" ON public.store_product_overrides FOR ALL TO authenticated USING (public.is_store_admin(auth.uid(), supermarket_id)) WITH CHECK (public.is_store_admin(auth.uid(), supermarket_id));
CREATE TRIGGER spo_updated BEFORE UPDATE ON public.store_product_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();