-- Kategorienbild für Milch setzen
UPDATE public.departments
SET image_path = 'departments/milch.png', updated_at = now()
WHERE id = '6a440558-2cc8-4233-bc60-8b2242e46830';

-- Vollmilch auf Platz 2 der gewünschten Reihenfolge
UPDATE public.products
SET sort_order = 2, updated_at = now()
WHERE id = '8f40f3c3-d948-42c9-ae77-0684034535cd';

-- Bisherige Produkte Halbrahm / Hafermilch hinter die neue Liste schieben
UPDATE public.products SET sort_order = 9, updated_at = now() WHERE id = 'f6b51a69-6696-41f0-bfc0-90a5893c0462';
UPDATE public.products SET sort_order = 10, updated_at = now() WHERE id = 'eead7809-e421-4a55-bb54-5e2b62c455ec';

-- Neue Milchprodukte in gewünschter Reihenfolge
INSERT INTO public.products (department_id, name, default_quantity, default_unit, organic_available, sort_order)
VALUES
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'Frischmilch', 1, 'liter', true, 1),
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'Milch teilentrahmt', 1, 'liter', true, 3),
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'Magermilch', 1, 'liter', true, 4),
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'Rohmilch', 1, 'liter', true, 5),
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'H-Vollmilch', 1, 'liter', true, 6),
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'H-Milch teilentrahmt', 1, 'liter', true, 7),
  ('6a440558-2cc8-4233-bc60-8b2242e46830', 'H-Magermilch', 1, 'liter', true, 8);