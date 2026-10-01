DELETE FROM recipe_ingredients ri
WHERE ri.template_id = 'pizza' AND ri.step_key = 'seafood'
  AND ri.product_id IN (SELECT id FROM products WHERE name = 'Scampi')
  AND ri.ctid <> (
    SELECT min(ctid) FROM recipe_ingredients
    WHERE template_id = 'pizza' AND step_key = 'seafood'
      AND product_id IN (SELECT id FROM products WHERE name = 'Scampi')
  );