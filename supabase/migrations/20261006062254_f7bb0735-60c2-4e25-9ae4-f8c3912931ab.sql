WITH ord(name, pos) AS (VALUES
('Forelle',1),('Regenbogenforelle',2),('Saibling',3),('Eglifilet',4),('Barsch',5),('Felchen',6),('Zander',7),('Hecht',8),('Karpfen',9),
('Kabeljau',10),('Seelachsfilet',11),('Rotbarsch',12),('Doradenfilet',13),('Wolfsbarsch',14),('Pangasiusfilet',15),('Tilapia',16),
('Seeteufel',17),('Seezunge',18),('Steinbutt',19),('Heilbutt',20),
('Lachsfilet',21),('Thunfisch',22),('Schwertfisch',23),('Makrelen',24),('Sardinen',25),
('Räucherlachs',26),('Graved Lachs',27),('Räucherforelle',28),('Räuchermakrele',29),('Aal',30),
('Hering',31),('Matjes',32),('Rollmops',33),('Sardellen',34),('Anchovis in Öl',35))
UPDATE public.products p SET sort_order = ord.pos FROM ord
WHERE p.department_id = 'd62d10b0-0046-46e2-bf0b-0c1c5e3d079c' AND p.name = ord.name;

DELETE FROM public.product_headings WHERE department_id = 'd62d10b0-0046-46e2-bf0b-0c1c5e3d079c';

WITH h(first, name, en, fr, it, es, nl, pt) AS (VALUES
('Forelle','Süsswasserfische','Freshwater fish','Poissons d''eau douce','Pesci d''acqua dolce','Pescados de agua dulce','Zoetwatervis','Peixes de água doce'),
('Kabeljau','Meeresfische – Weissfische','Sea fish – white fish','Poissons de mer – poissons blancs','Pesci di mare – pesce bianco','Pescados de mar – pescado blanco','Zeevis – witvis','Peixes do mar – peixe branco'),
('Seeteufel','Edelfische & Plattfische','Premium & flat fish','Poissons nobles & poissons plats','Pesci pregiati & pesci piatti','Pescados nobles y planos','Edelvis & platvis','Peixes nobres & peixes chatos'),
('Lachsfilet','Feste Fische & Steaks','Firm fish & steaks','Poissons fermes & pavés','Pesci sodi & tranci','Pescados firmes y filetes','Stevige vis & moten','Peixes firmes & postas'),
('Räucherlachs','Räucherfisch','Smoked fish','Poissons fumés','Pesce affumicato','Pescado ahumado','Gerookte vis','Peixe fumado'),
('Hering','Eingelegter Fisch & Feinkost','Pickled fish & deli','Poissons marinés & traiteur','Pesce marinato & gastronomia','Pescado en escabeche y delicatessen','Ingelegde vis & delicatessen','Peixe em conserva & charcutaria')),
ins AS (
  INSERT INTO public.product_headings (department_id, before_product_id, name)
  SELECT 'd62d10b0-0046-46e2-bf0b-0c1c5e3d079c', p.id, h.name FROM h
  JOIN public.products p ON p.name = h.first AND p.department_id = 'd62d10b0-0046-46e2-bf0b-0c1c5e3d079c'
  RETURNING id, name)
INSERT INTO public.catalog_translations (entity_type, entity_id, locale, name, is_manual)
SELECT 'heading', ins.id, l.loc,
  CASE split_part(l.loc,'-',1) WHEN 'en' THEN h.en WHEN 'fr' THEN h.fr WHEN 'it' THEN h.it WHEN 'es' THEN h.es WHEN 'nl' THEN h.nl WHEN 'pt' THEN h.pt ELSE h.name END,
  false
FROM ins JOIN h ON h.name = ins.name
CROSS JOIN unnest(ARRAY['de-DE','de-AT','de-CH','en-US','en-GB','en-CA','fr-FR','fr-CA','it-IT','it-CH','es-ES','es-MX','nl-NL','nl-BE','pt-PT','pt-BR']) AS l(loc);