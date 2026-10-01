CREATE TABLE public.recipe_ingredients (
  id uuid not null default gen_random_uuid() primary key,
  template_id text not null,
  step_key text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  unique (template_id, step_key, product_id)
);
GRANT SELECT ON public.recipe_ingredients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_ingredients TO authenticated;
GRANT ALL ON public.recipe_ingredients TO service_role;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipe ingredients public read" ON public.recipe_ingredients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage recipe ingredients" ON public.recipe_ingredients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Erstbefüllung aus den bisher im Code hinterlegten Zutatenlisten
WITH seed(template_id, step_key, pname, ord) AS (
  VALUES
  -- muesli
  ('muesli','base','Haferflocken',1),('muesli','base','Dinkelflocken',2),('muesli','base','Cornflakes',3),('muesli','base','Granola',4),
  ('muesli','liquid','Milch',1),('muesli','liquid','Joghurt',2),('muesli','liquid','Hafermilch',3),('muesli','liquid','Mandelmilch',4),
  ('muesli','fruit','Bananen',1),('muesli','fruit','Äpfel',2),('muesli','fruit','Heidelbeeren',3),('muesli','fruit','Himbeeren',4),('muesli','fruit','Erdbeeren',5),('muesli','fruit','Mango',6),
  ('muesli','topping','Rosinen',1),('muesli','topping','Gojibeeren',2),('muesli','topping','Honig',3),('muesli','topping','Walnüsse',4),('muesli','topping','Mandeln',5),
  -- smoothie
  ('smoothie','liquid','Milch',1),('smoothie','liquid','Hafermilch',2),('smoothie','liquid','Mandelmilch',3),('smoothie','liquid','Orangensaft',4),('smoothie','liquid','Joghurt',5),
  ('smoothie','fruit','Bananen',1),('smoothie','fruit','Mango',2),('smoothie','fruit','Ananas',3),('smoothie','fruit','Erdbeeren',4),('smoothie','fruit','Heidelbeeren',5),('smoothie','fruit','Himbeeren',6),('smoothie','fruit','Kiwis',7),
  ('smoothie','green','Babyspinat',1),('smoothie','green','Spinat',2),('smoothie','green','Minze',3),('smoothie','green','Avocado',4),
  ('smoothie','extra','Honig',1),('smoothie','extra','Datteln',2),('smoothie','extra','Haferflocken',3),
  -- salat
  ('salat','base','Babyspinat',1),('salat','base','Portulak',2),('salat','base','Rucola',3),('salat','base','Kopfsalat',4),('salat','base','Eisbergsalat',5),
  ('salat','veg','Tomaten',1),('salat','veg','Cherrytomaten',2),('salat','veg','Salatgurke',3),('salat','veg','Paprika',4),('salat','veg','Avocado',5),('salat','veg','Zuckermais',6),
  ('salat','protein','Eier',1),('salat','protein','Feta',2),('salat','protein','Mozzarella',3),('salat','protein','Thunfisch',4),('salat','protein','Hähnchenbrust',5),
  ('salat','herb','Petersilie',1),('salat','herb','Basilikum',2),('salat','herb','Schnittlauch',3),('salat','herb','Dill',4),
  ('salat','dressing','Olivenöl',1),('salat','dressing','Balsamico',2),('salat','dressing','Zitronen',3),('salat','dressing','Senf',4),
  -- pizza
  ('pizza','dough','Pizzateig',1),('pizza','dough','Mehl',2),('pizza','dough','Hefe',3),
  ('pizza','sauce','Tomaten',1),('pizza','sauce','Passierte Tomaten',2),('pizza','sauce','Crème fraîche',3),
  ('pizza','cheese','Mozzarella',1),('pizza','cheese','Parmigiano Reggiano',2),('pizza','cheese','Grana Padano',3),('pizza','cheese','Provolone',4),
  ('pizza','topping','Salami',1),('pizza','topping','Schinken',2),('pizza','topping','Paprika',3),('pizza','topping','Champignons',4),('pizza','topping','Schwarze Oliven',5),('pizza','topping','Zucchini',6),('pizza','topping','Ananas',7),
  ('pizza','finish','Basilikum',1),('pizza','finish','Oregano',2),('pizza','finish','Olivenöl',3),
  -- pfanne
  ('pfanne','base','Reis',1),('pfanne','base','Nudeln',2),('pfanne','base','Kartoffeln',3),('pfanne','base','Kochbanane',4),
  ('pfanne','protein','Hähnchenbrust',1),('pfanne','protein','Tofu',2),('pfanne','protein','Eier',3),('pfanne','protein','Rinderhackfleisch',4),
  ('pfanne','veg','Paprika',1),('pfanne','veg','Zucchini',2),('pfanne','veg','Pak Choi',3),('pfanne','veg','Zuckererbsen',4),('pfanne','veg','Babymais',5),('pfanne','veg','Auberginen',6),('pfanne','veg','Grüne Bohnen',7),
  ('pfanne','aroma','Knoblauch',1),('pfanne','aroma','Zwiebeln',2),('pfanne','aroma','Ingwer',3),('pfanne','aroma','Chilischoten',4),('pfanne','aroma','Sojasauce',5),
  -- menu
  ('menu','protein','Hähnchenbrust',1),('menu','protein','Lachs',2),('menu','protein','Rinderhackfleisch',3),('menu','protein','Tofu',4),('menu','protein','Eier',5),
  ('menu','starch','Nudeln',1),('menu','starch','Reis',2),('menu','starch','Kartoffeln',3),
  ('menu','veg','Grüne Bohnen',1),('menu','veg','Zucchini',2),('menu','veg','Babyspinat',3),('menu','veg','Karotten',4),
  ('menu','sauce','Passierte Tomaten',1),('menu','sauce','Crème fraîche',2),('menu','sauce','Sojasauce',3),
  -- dessert
  ('dessert','base','Mascarpone',1),('dessert','base','Ricotta',2),('dessert','base','Joghurt',3),('dessert','base','Milchreis',4),('dessert','base','Griesscreme',5),
  ('dessert','fruit','Erdbeeren',1),('dessert','fruit','Himbeeren',2),('dessert','fruit','Mango',3),('dessert','fruit','Maracuja / Passionsfrucht',4),('dessert','fruit','Feigen',5),
  ('dessert','sweet','Honig',1),('dessert','sweet','Zucker',2),('dessert','sweet','Vanillezucker',3),('dessert','sweet','Schokolade',4),
  ('dessert','crunch','Kekse',1),('dessert','crunch','Mandeln',2),('dessert','crunch','Granola',3)
)
INSERT INTO public.recipe_ingredients (template_id, step_key, product_id, sort_order)
SELECT s.template_id, s.step_key, p.id, s.ord
FROM seed s
JOIN public.products p ON p.name = s.pname
ON CONFLICT (template_id, step_key, product_id) DO NOTHING;