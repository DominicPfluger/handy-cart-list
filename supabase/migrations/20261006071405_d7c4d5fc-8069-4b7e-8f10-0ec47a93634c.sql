DO $$
DECLARE
  v_oolong uuid := 'a1b2c3d4-2a04-4000-8000-000000002a04';
  v_kraeuter uuid := 'a1b2c3d4-2a05-4000-8000-000000002a05';
  v_mischungen uuid := 'a1b2c3d4-2a09-4000-8000-000000002a09';
  v_rooibos uuid := 'a1b2c3d4-2a07-4000-8000-000000002a07';
  v_gewuerz uuid := 'a1b2c3d4-2a08-4000-8000-000000002a08';
BEGIN
  -- 1. Teemischungen -> Kräutertees
  UPDATE products SET department_id = v_kraeuter, sort_order = sort_order + 100 WHERE department_id = v_mischungen;
  DELETE FROM catalog_translations WHERE entity_type = 'department' AND entity_id = v_mischungen;
  DELETE FROM departments WHERE id = v_mischungen;

  -- 2. Rooibos & Honeybush -> Gewürz- & Spezialtees (umbenannt)
  UPDATE products SET department_id = v_gewuerz, sort_order = sort_order + 100 WHERE department_id = v_rooibos;
  DELETE FROM catalog_translations WHERE entity_type = 'department' AND entity_id = v_rooibos;
  DELETE FROM departments WHERE id = v_rooibos;
  UPDATE departments SET name = 'Rooibos, Gewürz- & Spezialtees', sort_order = 6, updated_at = now() WHERE id = v_gewuerz;

  -- 3. Oolong-Tee -> Weisser & Oolong-Tee
  UPDATE departments SET name = 'Weisser & Oolong-Tee', sort_order = 3, updated_at = now() WHERE id = v_oolong;

  -- 4. Reihenfolge der übrigen Kategorien
  UPDATE departments SET sort_order = 4, updated_at = now() WHERE id = v_kraeuter;
  UPDATE departments SET sort_order = 5, updated_at = now() WHERE id = 'a1b2c3d4-2a06-4000-8000-000000002a06';

  -- 5. Fehlende Weisser-Tee-Produkte ergänzen
  INSERT INTO products (id, department_id, name, emoji, default_quantity, default_unit, organic_available, sort_order, variants, excluded_diets, markets, icon_custom) VALUES
    ('a1b2c3d4-2a10-4000-8000-000000002a10', v_oolong, 'Pai Mu Tan', '🍵', 1, 'packung', false, 1, '{}', '{}', '{}', false),
    ('a1b2c3d4-2a11-4000-8000-000000002a11', v_oolong, 'Silver Needle', '🍵', 1, 'packung', false, 2, '{}', '{}', '{}', false),
    ('a1b2c3d4-2a12-4000-8000-000000002a12', v_oolong, 'White Peony', '🍵', 1, 'packung', false, 3, '{}', '{}', '{}', false),
    ('a1b2c3d4-2a13-4000-8000-000000002a13', v_oolong, 'Jasmin-Weißtee', '🍵', 1, 'packung', false, 4, '{}', '{}', '{}', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Übersetzungen: umbenannte Kategorien
INSERT INTO catalog_translations (entity_type, entity_id, locale, name, is_manual) VALUES
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'en-US', 'White & Oolong Tea', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'en-GB', 'White & Oolong Tea', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'en-CA', 'White & Oolong Tea', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'es-ES', 'Té blanco y oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'es-MX', 'Té blanco y oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'fr-FR', 'Thé blanc et oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'fr-CA', 'Thé blanc et oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'it-IT', 'Tè bianco e oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'it-CH', 'Tè bianco e oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'nl-NL', 'Witte & oolongthee', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'nl-BE', 'Witte & oolongthee', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'pt-PT', 'Chá branco e oolong', true),
  ('department', 'a1b2c3d4-2a04-4000-8000-000000002a04', 'pt-BR', 'Chá branco e oolong', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'en-US', 'Rooibos, Spice & Specialty Teas', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'en-GB', 'Rooibos, Spice & Specialty Teas', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'en-CA', 'Rooibos, Spice & Specialty Teas', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'es-ES', 'Rooibos, tés especiados y especiales', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'es-MX', 'Rooibos, tés especiados y especiales', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'fr-FR', 'Rooibos, thés épicés et spéciaux', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'fr-CA', 'Rooibos, thés épicés et spéciaux', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'it-IT', 'Rooibos, tè speziati e speciali', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'it-CH', 'Rooibos, tè speziati e speciali', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'nl-NL', 'Rooibos, kruiden- & speciale theeën', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'nl-BE', 'Rooibos, kruiden- & speciale theeën', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'pt-PT', 'Rooibos, chás especiados e especiais', true),
  ('department', 'a1b2c3d4-2a08-4000-8000-000000002a08', 'pt-BR', 'Rooibos, chás especiados e especiais', true)
ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

-- Übersetzungen: neue Weisser-Tee-Produkte
INSERT INTO catalog_translations (entity_type, entity_id, locale, name, is_manual) VALUES
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'en-US', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'en-GB', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'en-CA', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'es-ES', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'es-MX', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'fr-FR', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'fr-CA', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'it-IT', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'it-CH', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'nl-NL', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'nl-BE', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'pt-PT', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a10-4000-8000-000000002a10', 'pt-BR', 'Pai Mu Tan', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'en-US', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'en-GB', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'en-CA', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'es-ES', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'es-MX', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'fr-FR', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'fr-CA', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'it-IT', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'it-CH', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'nl-NL', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'nl-BE', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'pt-PT', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a11-4000-8000-000000002a11', 'pt-BR', 'Silver Needle', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'en-US', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'en-GB', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'en-CA', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'es-ES', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'es-MX', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'fr-FR', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'fr-CA', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'it-IT', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'it-CH', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'nl-NL', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'nl-BE', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'pt-PT', 'White Peony', true),
  ('product', 'a1b2c3d4-2a12-4000-8000-000000002a12', 'pt-BR', 'White Peony', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'en-US', 'Jasmine White Tea', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'en-GB', 'Jasmine White Tea', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'en-CA', 'Jasmine White Tea', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'es-ES', 'Té blanco de jazmín', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'es-MX', 'Té blanco de jazmín', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'fr-FR', 'Thé blanc au jasmin', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'fr-CA', 'Thé blanc au jasmin', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'it-IT', 'Tè bianco al gelsomino', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'it-CH', 'Tè bianco al gelsomino', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'nl-NL', 'Witte jasmijnthee', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'nl-BE', 'Witte jasmijnthee', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'pt-PT', 'Chá branco de jasmim', true),
  ('product', 'a1b2c3d4-2a13-4000-8000-000000002a13', 'pt-BR', 'Chá branco de jasmim', true)
ON CONFLICT (entity_type, entity_id, locale) DO UPDATE SET name = EXCLUDED.name, updated_at = now();