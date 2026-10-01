CREATE TABLE public.speech_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL,
  key text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(locale, key)
);
GRANT SELECT ON public.speech_texts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speech_texts TO authenticated;
GRANT ALL ON public.speech_texts TO service_role;
ALTER TABLE public.speech_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Speech texts public read" ON public.speech_texts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage speech texts" ON public.speech_texts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_speech_texts_updated_at BEFORE UPDATE ON public.speech_texts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();