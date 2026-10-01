-- Bestehende Belag-Zuordnungen auf die neuen Schritte verteilen
UPDATE recipe_ingredients SET step_key = 'meat'
WHERE template_id = 'pizza' AND step_key = 'topping'
  AND product_id IN (SELECT id FROM products WHERE name IN ('Salami', 'Schinken'));

UPDATE recipe_ingredients SET step_key = 'vegtop'
WHERE template_id = 'pizza' AND step_key = 'topping'
  AND product_id IN (SELECT id FROM products WHERE name IN ('Paprika', 'Schwarze Oliven', 'Zucchini', 'Ananas'));

-- Falls dennoch Reste unter 'topping' hängen bleiben: nach vegtop verschieben
UPDATE recipe_ingredients SET step_key = 'vegtop'
WHERE template_id = 'pizza' AND step_key = 'topping';

-- Neue Zutaten (idempotent)
INSERT INTO recipe_ingredients (template_id, step_key, product_id, sort_order)
SELECT 'pizza', s.step_key, p.id, s.sort_order
FROM (VALUES
  ('meat', 'Schweinsspeck frisch', 3),
  ('meat', 'Rindshackfleisch', 4),
  ('seafood', 'Thunfisch', 1),
  ('seafood', 'Scampi', 2),
  ('seafood', 'Sardellen', 3),
  ('seafood', 'Meeresfrüchte-Mischung', 4),
  ('seafood', 'Tintenfischringe', 5),
  ('vegtop', 'Braune Champignons', 4),
  ('vegtop', 'Rote Zwiebeln', 5),
  ('vegtop', 'Cherrytomaten', 6),
  ('vegtop', 'Artischockenherzen', 7)
) AS s(step_key, product_name, sort_order)
JOIN products p ON p.name = s.product_name
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_ingredients ri
  WHERE ri.template_id = 'pizza' AND ri.step_key = s.step_key AND ri.product_id = p.id
);