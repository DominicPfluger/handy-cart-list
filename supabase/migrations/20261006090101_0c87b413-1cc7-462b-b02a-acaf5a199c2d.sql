DO $$
DECLARE d uuid := '3c1cf393-f5af-444b-bb6c-1d3bac37ed48'; r record; pid uuid; n int := 0; t text; cur text := '';
BEGIN
FOR r IN SELECT * FROM (VALUES
('Fonds & Brühen','Rinderfond','Rinderbrühe|Rinderbouillon|Beef Broth'),
('Fonds & Brühen','Kalbsfond','Kalbsbrühe|Veal Stock|Fond de veau'),
('Fonds & Brühen','Geflügelfond','Hühnerfond|Hühnerbrühe|Geflügelbrühe|Chicken Stock'),
('Fonds & Brühen','Gemüsefond','Gemüsebrühe|Gemüsebouillon|Vegetable Stock'),
('Fonds & Brühen','Fischfond','Fischbrühe|Fish Stock|Fond de poisson'),
('Fonds & Brühen','Wildfond','Wildbrühe|Hirschfond|Rehfond|Game Stock'),
('Fonds & Brühen','Lammfond','Lammbrühe|Lamb Stock'),
('Fonds & Brühen','Entenfond','Entenbrühe|Gänsefond|Duck Stock'),
('Fonds & Brühen','Hummerfond','Krustentierfond|Hummerbrühe|Lobster Stock'),
('Fonds & Brühen','Knochenbrühe','Bone Broth|Rinder-Knochenbrühe'),
('Jus & Bratensauce','Bratensauce','Bratensaft|Bratenjus|Dunkle Sauce|Gravy'),
('Jus & Bratensauce','Bratensauce gebunden','Braune Sauce|Gebundene Bratensauce'),
('Jus & Bratensauce','Kalbsjus','Jus de veau|Reduzierter Kalbsfond'),
('Jus & Bratensauce','Rinderjus','Jus de bœuf|Rinder-Bratensaft'),
('Jus & Bratensauce','Geflügeljus','Hühnerjus|Jus de volaille'),
('Jus & Bratensauce','Entenjus','Jus de canard'),
('Jus & Bratensauce','Lammjus','Jus d''agneau'),
('Jus & Bratensauce','Wildjus','Jus de gibier|Hirschjus|Rehjus'),
('Jus & Bratensauce','Demi-Glace','Kraftsauce|Glace de viande|Fleischglace'),
('Jus & Bratensauce','Sauce Espagnole','Spanische Sauce|Braune Grundsauce'),
('Helle Saucen','Béchamelsauce','Béchamel|Weisse Sauce|Helle Grundsauce'),
('Helle Saucen','Sauce Mornay','Käse-Béchamelsauce|Käsesauce'),
('Helle Saucen','Kalbsvelouté','Helle Kalbssauce|Velouté de veau'),
('Helle Saucen','Geflügelvelouté','Helle Geflügelsauce|Velouté de volaille'),
('Helle Saucen','Fischvelouté','Helle Fischsauce|Velouté de poisson|Sauce Vin Blanc'),
('Helle Saucen','Sauce Suprême','Geflügelrahmsauce fein'),
('Helle Saucen','Kapernsauce','Königsberger Sauce|Weisse Kapernsauce'),
('Helle Saucen','Dillsauce','Senf-Dill-Sauce|Weisse Dillsauce|Graved-Sauce'),
('Helle Saucen','Senfsauce','Helle Senfsauce|Senf-Eiersauce'),
('Helle Saucen','Meerrettichsauce','Krensauce|Weisse Meerrettichsauce'),
('Buttersaucen','Sauce Hollandaise','Holländische Sauce|Butter-Eigelb-Sauce'),
('Buttersaucen','Sauce Béarnaise','Bäresauce|Estragon-Buttersauce'),
('Buttersaucen','Beurre Blanc','Weisswein-Buttersauce|Schalottenbuttersauce'),
('Buttersaucen','Beurre Rouge','Rotwein-Buttersauce'),
('Buttersaucen','Sauce Choron','Tomatierte Béarnaise|Tomaten-Béarnaise'),
('Buttersaucen','Sauce Maltaise','Blutorangen-Hollandaise|Orangen-Hollandaise'),
('Buttersaucen','Sauce Foyot','Béarnaise mit Fleischglace'),
('Rahmsaucen','Pfeffer-Rahmsauce','Pfeffersauce|Pfefferrahmsauce|Grüne-Pfeffer-Sauce'),
('Rahmsaucen','Jägersauce','Sauce Chasseur|Pilzsauce|Waldpilzsauce'),
('Rahmsaucen','Champignon-Rahmsauce','Champignonsauce|Rahmchampignons'),
('Rahmsaucen','Morchel-Rahmsauce','Morchelsauce|Rahmmorcheln'),
('Rahmsaucen','Steinpilzsauce','Steinpilz-Rahmsauce|Porcini Sauce'),
('Rahmsaucen','Sauce Café de Paris','Café-de-Paris-Buttersauce'),
('Rahmsaucen','Zürcher-Geschnetzeltes-Sauce','Zürcher Rahmsauce'),
('Rahmsaucen','Whisky-Rahmsauce','Whiskysauce|Scotch Sauce'),
('Rahmsaucen','Senf-Rahmsauce','Dijon-Rahmsauce'),
('Rahmsaucen','Estragon-Rahmsauce','Estragonsauce'),
('Rahmsaucen','Knoblauch-Rahmsauce','Knoblauchsauce warm'),
('Rahmsaucen','Zwiebel-Rahmsauce','Zwiebelsauce'),
('Rahmsaucen','Kräuter-Rahmsauce','Kräutersauce|Gartenkräutersauce'),
('Rahmsaucen','Trüffelsauce','Trüffel-Rahmsauce|Tartufata-Sauce'),
('Rahmsaucen','Gorgonzolasauce','Blauschimmelkäsesauce|Käserahmsauce'),
('Rahmsaucen','Currysauce warm','Curryrahmsauce|Indische Currysauce'),
('Rahmsaucen','Paprikasauce ungarischer Art','Zigeunersauce|Puszta-Sauce'),
('Weinsaucen','Rotweinsauce','Rotweinreduktion|Red Wine Sauce'),
('Weinsaucen','Sauce Bordelaise','Bordeauxsauce|Schalotten-Rotweinsauce'),
('Weinsaucen','Sauce Périgueux','Trüffel-Madeira-Sauce|Périgord-Sauce'),
('Weinsaucen','Portweinsauce','Portweinreduktion|Rote Portweinsauce'),
('Weinsaucen','Madeirasauce','Sauce Madère|Madeira-Reduktion'),
('Weinsaucen','Cognacsauce','Weinbrand-Sauce|Flambierte Cognacsauce'),
('Weinsaucen','Marsalasauce','Sizilianische Weinsauce'),
('Weinsaucen','Balsamicosauce','Balsamico-Reduktion|Balsamico-Glaze'),
('Weinsaucen','Wildsauce','Sauce Grand Veneur|Jägersauce für Wild')
) AS v(h, name, syn) LOOP
  n := n + 1;
  INSERT INTO public.products (department_id, name, emoji, default_quantity, default_unit, sort_order)
  VALUES (d, r.name, CASE WHEN r.h = 'Fonds & Brühen' THEN '🍲' ELSE '🥣' END, 1, 'glas', n)
  RETURNING id INTO pid;
  FOREACH t IN ARRAY string_to_array(r.syn, '|') LOOP
    INSERT INTO public.product_synonyms (product_id, locale, term) VALUES (pid, 'de-DE', t);
  END LOOP;
  IF r.h <> cur THEN
    INSERT INTO public.product_headings (department_id, before_product_id, name) VALUES (d, pid, r.h);
    cur := r.h;
  END IF;
END LOOP;
END $$;