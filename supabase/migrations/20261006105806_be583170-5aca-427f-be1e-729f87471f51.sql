DO $$
DECLARE dep uuid := 'bacf13ec-67ae-4bfe-a397-08ccdc012252';
 keep uuid; dup uuid; r record; ord text[] := ARRAY['Küchenzange','Grillzange','Schöpfkelle','Suppenkelle','Frittierkelle','Bratenthermometer','Küchentimer','Küchenreibe','Käsereibe','Mörser','Fleischklopfer','Nussknacker','Spiralschneider','Dosenöffner','Kartoffelpresse','Passiermühle','Salatschleuder','Spätzlehobel','Spicknadel'];
 i int; pid uuid;
BEGIN
 FOR r IN SELECT * FROM (VALUES ('Bratenthermometer','Fleischthermometer'),('Reibe grob','Reibe fein')) v(k,d) LOOP
  SELECT id INTO keep FROM products WHERE department_id=dep AND name=r.k;
  SELECT id INTO dup FROM products WHERE department_id=dep AND name=r.d;
  IF keep IS NULL OR dup IS NULL THEN CONTINUE; END IF;
  UPDATE list_items SET product_id=keep WHERE product_id=dup;
  UPDATE pantry_items SET product_id=keep WHERE product_id=dup;
  UPDATE import_candidates SET match_product_id=keep WHERE match_product_id=dup;
  UPDATE recipe_ingredients SET product_id=keep WHERE product_id=dup AND NOT EXISTS (SELECT 1 FROM recipe_ingredients x WHERE x.product_id=keep AND x.template_id=recipe_ingredients.template_id AND x.step_key=recipe_ingredients.step_key);
  DELETE FROM recipe_ingredients WHERE product_id=dup;
  UPDATE recipes SET product_ids=array_replace(product_ids,dup,keep) WHERE dup=ANY(product_ids);
  UPDATE product_headings SET before_product_id=keep WHERE before_product_id=dup;
  DELETE FROM product_aliases WHERE product_id=dup; DELETE FROM product_brands WHERE product_id=dup;
  DELETE FROM product_cuisines WHERE product_id=dup; DELETE FROM product_market_exclusions WHERE product_id=dup;
  DELETE FROM product_market_order WHERE product_id=dup; DELETE FROM product_reference_prices WHERE product_id=dup;
  DELETE FROM product_synonyms WHERE product_id=dup; DELETE FROM product_variant_images WHERE product_id=dup;
  DELETE FROM variant_synonyms WHERE product_id=dup; DELETE FROM variant_translations WHERE product_id=dup;
  DELETE FROM catalog_translations WHERE entity_id=dup;
  DELETE FROM products WHERE id=dup;
 END LOOP;
 UPDATE products SET name='Küchenreibe', variants=ARRAY['Grob','Fein'] WHERE department_id=dep AND name='Reibe grob';
 UPDATE products SET name='Küchentimer' WHERE department_id=dep AND name='Timer';
 DELETE FROM catalog_translations WHERE is_manual=false AND entity_id IN (SELECT id FROM products WHERE department_id=dep AND name IN ('Küchenreibe','Küchentimer'));
 INSERT INTO products (department_id,name,emoji,default_quantity,default_unit,sort_order)
  SELECT dep,n,'🥄',1,'stueck',999 FROM unnest(ARRAY['Kartoffelpresse','Salatschleuder','Passiermühle','Spiralschneider']) n
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE department_id=dep AND name=n);
 INSERT INTO product_synonyms (product_id,locale,term)
  SELECT p.id,'de-DE',s.t FROM (VALUES ('Bratenthermometer','Fleischthermometer'),('Bratenthermometer','Einstichthermometer'),('Bratenthermometer','Kerntemperaturmesser'),
   ('Küchenreibe','Universalreibe'),('Küchenreibe','Reibe'),('Küchentimer','Eieruhr'),('Küchentimer','Küchenwecker'),
   ('Kartoffelpresse','Spätzlepresse'),('Kartoffelpresse','Kartoffelstampfer'),('Passiermühle','Flotte Lotte'),('Passiermühle','Passiergerät'),
   ('Spiralschneider','Gemüsespiralschneider'),('Salatschleuder','Salattrockner')) s(n,t)
  JOIN products p ON p.department_id=dep AND p.name=s.n
  WHERE NOT EXISTS (SELECT 1 FROM product_synonyms x WHERE x.product_id=p.id AND x.term=s.t);
 i := 1;
 FOREACH pid IN ARRAY (SELECT array_agg(p.id ORDER BY array_position(ord,p.name) NULLS LAST, p.sort_order) FROM products p WHERE p.department_id=dep) LOOP
  UPDATE products SET sort_order=i WHERE id=pid; i:=i+1;
 END LOOP;
 DELETE FROM product_headings WHERE department_id=dep;
 INSERT INTO product_headings (department_id,before_product_id,name)
  SELECT dep,p.id,h.t FROM (VALUES ('Küchenzange','Zangen & Kellen'),('Bratenthermometer','Messen & Zeit'),('Küchenreibe','Reiben & Zerkleinern'),('Dosenöffner','Vorbereiten & Passieren')) h(n,t)
  JOIN products p ON p.department_id=dep AND p.name=h.n;
END $$;