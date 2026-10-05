CREATE TABLE public.diets (
  id text PRIMARY KEY,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  builtin boolean NOT NULL DEFAULT false,
  labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diets TO authenticated;
GRANT ALL ON public.diets TO service_role;
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Diets readable by everyone" ON public.diets FOR SELECT USING (true);
CREATE POLICY "Admins manage diets" ON public.diets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER diets_updated BEFORE UPDATE ON public.diets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.diets (id, emoji, sort_order, builtin) VALUES
('halal','☪️',1,true),('kosher','✡️',2,true),('vegetarian','🥕',3,true),('vegan','🌱',4,true),
('gluten_free','🌾',5,true),('lactose_free','🥛',6,true),('fructose_free','🍎',7,true),('sugar_free','🍬',8,true),
('keto','🥑',9,true),('paleo','🍖',10,true),('low_carb','🍚',11,true),('low_fat','🥒',12,true),
('high_protein','🥩',13,true),('low_calorie','⚖️',14,true),('clean_eating','🥗',15,true);