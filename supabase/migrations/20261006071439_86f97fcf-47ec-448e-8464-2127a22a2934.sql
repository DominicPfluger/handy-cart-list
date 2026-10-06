INSERT INTO products (id, department_id, name, emoji, default_quantity, default_unit, organic_available, sort_order, variants, excluded_diets, markets, icon_custom) VALUES
  ('a1b2c3d4-2a10-4000-8000-000000002a10', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'Pai Mu Tan', '🍵', 1, 'packung', false, 5, '{}', '{}', '{}', false),
  ('a1b2c3d4-2a11-4000-8000-000000002a11', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'Silver Needle', '🍵', 1, 'packung', false, 6, '{}', '{}', '{}', false),
  ('a1b2c3d4-2a12-4000-8000-000000002a12', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'White Peony', '🍵', 1, 'packung', false, 7, '{}', '{}', '{}', false),
  ('a1b2c3d4-2a13-4000-8000-000000002a13', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'Jasmin-Weißtee', '🍵', 1, 'packung', false, 8, '{}', '{}', '{}', false)
ON CONFLICT (id) DO NOTHING;