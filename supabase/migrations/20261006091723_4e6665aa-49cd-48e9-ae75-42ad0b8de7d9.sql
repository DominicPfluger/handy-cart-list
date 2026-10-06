DO $$
DECLARE dept uuid := '3dbfd4a0-d062-4073-9590-d429ad471ff6';
 groups text[][] := ARRAY[
 ['Wassereis','Calippo Cherry|Calippo Cola|Calippo Limone|Calippo Orange|Flutschfinger|Fritz Cola Eis|Schulkind|Split|Twister'],
 ['Milch-Eis am Stiel','Bounty Eis|Capri Eis|Häagen-Dazs Vanilla|Mars Eis|Nogger Black|Nogger Choc|Nogger Classic|Nogger Erdnuss|Nogger Kirsch|Snickers Eis|Solero'],
 ['Schoko-Stieleis','Magnum Classic|Magnum Double Caramel|Magnum Double Chocolate|Magnum Gold|Magnum Mandel|Magnum Salted Caramel|Magnum Weiss|Milka Choco Swirl'],
 ['Vegan','Magnum Vegan Classic|Magnum Vegan Mandel|Magnum Vegan Salted Caramel|Solero Vegan']];
 i int; nm text; pid uuid; s int := 0; first boolean;
BEGIN
 FOR i IN 1..array_length(groups,1) LOOP
  first := true;
  FOREACH nm IN ARRAY string_to_array(groups[i][2],'|') LOOP
   s := s+1;
   INSERT INTO products(department_id,name,emoji,default_quantity,default_unit,sort_order)
   VALUES (dept,nm,'🍦',1,'stueck',s) RETURNING id INTO pid;
   IF nm='Capri Eis' THEN INSERT INTO product_synonyms(product_id,locale,term) VALUES (pid,'de-DE','Milk & Cola'); END IF;
   IF first THEN INSERT INTO product_headings(department_id,before_product_id,name) VALUES (dept,pid,groups[i][1]); first:=false; END IF;
  END LOOP;
 END LOOP;
END $$;