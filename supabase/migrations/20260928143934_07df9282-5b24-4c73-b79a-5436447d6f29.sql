CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.catalog_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('department','product')),
  entity_id uuid NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  is_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, locale)
);
CREATE INDEX catalog_translations_locale_idx ON public.catalog_translations(locale);
GRANT SELECT ON public.catalog_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_translations TO authenticated;
GRANT ALL ON public.catalog_translations TO service_role;
ALTER TABLE public.catalog_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Translations public read" ON public.catalog_translations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage translations" ON public.catalog_translations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_catalog_translations_updated_at BEFORE UPDATE ON public.catalog_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));