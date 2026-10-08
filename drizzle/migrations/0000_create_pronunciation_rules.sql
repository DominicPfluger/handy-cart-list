CREATE TABLE public.pronunciation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL CHECK (char_length(locale) BETWEEN 2 AND 20),
  written TEXT NOT NULL CHECK (char_length(written) BETWEEN 1 AND 120),
  spoken TEXT NOT NULL CHECK (char_length(spoken) BETWEEN 1 AND 160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (locale, written)
);
GRANT SELECT ON public.pronunciation_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pronunciation_rules TO authenticated;
GRANT ALL ON public.pronunciation_rules TO service_role;
ALTER TABLE public.pronunciation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads pronunciation rules" ON public.pronunciation_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage pronunciation rules" ON public.pronunciation_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX pronunciation_rules_locale_idx ON public.pronunciation_rules (locale);