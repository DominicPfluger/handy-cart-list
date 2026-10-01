CREATE TABLE public.cuisines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cuisines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuisines TO authenticated;
GRANT ALL ON public.cuisines TO service_role;
ALTER TABLE public.cuisines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cuisines public read" ON public.cuisines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage cuisines" ON public.cuisines FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER update_cuisines_updated_at BEFORE UPDATE ON public.cuisines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.product_cuisines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cuisine_id uuid NOT NULL REFERENCES public.cuisines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, cuisine_id)
);
CREATE INDEX product_cuisines_cuisine_idx ON public.product_cuisines(cuisine_id);
GRANT SELECT ON public.product_cuisines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_cuisines TO authenticated;
GRANT ALL ON public.product_cuisines TO service_role;
ALTER TABLE public.product_cuisines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product cuisines public read" ON public.product_cuisines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage product cuisines" ON public.product_cuisines FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.cuisines (name, emoji, sort_order) VALUES
('Italienisch','🇮🇹',0),('Französisch','🇫🇷',1),('Spanisch','🇪🇸',2),('Griechisch','🇬🇷',3),('Türkisch','🇹🇷',4),('Orientalisch','🧆',5),('Indisch','🇮🇳',6),('Thailändisch','🇹🇭',7),('Chinesisch','🇨🇳',8),('Japanisch','🇯🇵',9),('Koreanisch','🇰🇷',10),('Mexikanisch','🇲🇽',11),('Amerikanisch','🇺🇸',12),('Schweizerisch','🇨🇭',13),('Deutsch & Österreichisch','🇩🇪',14);