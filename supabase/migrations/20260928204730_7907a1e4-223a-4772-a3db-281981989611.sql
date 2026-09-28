INSERT INTO public.departments (parent_id, name, emoji, sort_order)
VALUES ('8b038231-138f-4766-a50f-1893bff66a08', 'Frozen Yoghurt', '🍦', 2)
RETURNING id;

-- Translations inserted via CTE using the new id
WITH new_dept AS (
  INSERT INTO public.departments (parent_id, name, emoji, sort_order)
  VALUES ('8b038231-138f-4766-a50f-1893bff66a08', 'Frozen Yoghurt', '🍦', 2)
  RETURNING id
)
INSERT INTO public.catalog_translations (entity_type, entity_id, locale, name)
SELECT 'department', nd.id, v.locale, v.name
FROM new_dept nd
CROSS JOIN (VALUES
  ('de-AT','Frozen Joghurt'),
  ('de-CH','Frozen Joghurt'),
  ('en-US','Frozen Yogurt'),
  ('en-GB','Frozen Yogurt'),
  ('en-CA','Frozen Yogurt'),
  ('es-ES','Yogur helado'),
  ('es-MX','Yogur helado'),
  ('fr-FR','Yaourt glacé'),
  ('fr-CA','Yogourt glacé'),
  ('it-IT','Gelato allo yogurt'),
  ('it-CH','Gelato allo yogurt'),
  ('nl-NL','Yoghurt-ijs'),
  ('nl-BE','Yoghurt-ijs'),
  ('pt-PT','Gelado de iogurte'),
  ('pt-BR','Sorvete de iogurte')
) AS v(locale, name);