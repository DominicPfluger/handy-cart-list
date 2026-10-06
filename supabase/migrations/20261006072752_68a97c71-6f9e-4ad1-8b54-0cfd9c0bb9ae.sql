CREATE TABLE public.standard_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.standard_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.standard_variants TO authenticated;
GRANT ALL ON public.standard_variants TO service_role;
ALTER TABLE public.standard_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads standard variants" ON public.standard_variants FOR SELECT USING (true);
CREATE POLICY "Admins manage standard variants" ON public.standard_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_standard_variants_updated_at BEFORE UPDATE ON public.standard_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.standard_variants (name, sort_order) VALUES
('Bio',0),('Vollkorn',1),('vegan',2),('laktosefrei',3),('glutenfrei',4),('zuckerfrei',5),('light',6),('groß',7),('klein',8),('mild',9),('scharf',10);