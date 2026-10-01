CREATE TABLE public.app_locales (
  id text PRIMARY KEY CHECK (id ~ '^[a-z]{2}-[A-Z]{2}$'),
  label text NOT NULL,
  flag text NOT NULL DEFAULT '🏳️',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_locales TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_locales TO authenticated;
GRANT ALL ON public.app_locales TO service_role;
ALTER TABLE public.app_locales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads locales" ON public.app_locales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage locales" ON public.app_locales FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER app_locales_updated BEFORE UPDATE ON public.app_locales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ui_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL REFERENCES public.app_locales(id) ON DELETE CASCADE,
  key text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, key)
);
GRANT SELECT ON public.ui_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ui_translations TO authenticated;
GRANT ALL ON public.ui_translations TO service_role;
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads ui translations" ON public.ui_translations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage ui translations" ON public.ui_translations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER ui_translations_updated BEFORE UPDATE ON public.ui_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();