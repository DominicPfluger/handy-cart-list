-- Baby & Kind eine Position nach hinten
UPDATE public.departments SET sort_order = 6 WHERE id = 'c98ff0c7-ad3e-407b-81bd-18d618e24b01';

-- Kategorie Hand & Fusspflege unter Körperpflege, vor Baby & Kind
INSERT INTO public.departments (id, parent_id, name, emoji, sort_order)
VALUES ('a1b2c3d4-2100-4000-8000-000000000001', 'f6b5a2b7-d686-4ea6-a2d5-f4e482702d8e', 'Hand & Fusspflege', '💅', 5);

-- 13 Artikel
INSERT INTO public.products (id, department_id, name, emoji, default_quantity, default_unit, organic_available, variants, excluded_diets) VALUES
('a1b2c3d4-2101-4000-8000-000000000001', 'a1b2c3d4-2100-4000-8000-000000000001', 'Handcreme', '🧴', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2102-4000-8000-000000000002', 'a1b2c3d4-2100-4000-8000-000000000001', 'Handdesinfektionsmittel', '🧼', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2103-4000-8000-000000000003', 'a1b2c3d4-2100-4000-8000-000000000001', 'Fusscreme', '🦶', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2104-4000-8000-000000000004', 'a1b2c3d4-2100-4000-8000-000000000001', 'Fusspeeling', '🦶', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2105-4000-8000-000000000005', 'a1b2c3d4-2100-4000-8000-000000000001', 'Fussbad', '🛁', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2106-4000-8000-000000000006', 'a1b2c3d4-2100-4000-8000-000000000001', 'Bimsstein', '🪨', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2107-4000-8000-000000000007', 'a1b2c3d4-2100-4000-8000-000000000001', 'Hornhautentferner', '🦶', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2108-4000-8000-000000000008', 'a1b2c3d4-2100-4000-8000-000000000001', 'Hornhautraspel', '🦶', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2109-4000-8000-000000000009', 'a1b2c3d4-2100-4000-8000-000000000001', 'Nagelfeile', '💅', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2110-4000-8000-000000000010', 'a1b2c3d4-2100-4000-8000-000000000001', 'Nagelknipser', '💅', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2111-4000-8000-000000000011', 'a1b2c3d4-2100-4000-8000-000000000001', 'Nagelhautentferner', '💅', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2112-4000-8000-000000000012', 'a1b2c3d4-2100-4000-8000-000000000001', 'Nagelöl', '💅', 1, 'stueck', false, '{}', '{}'),
('a1b2c3d4-2113-4000-8000-000000000013', 'a1b2c3d4-2100-4000-8000-000000000001', 'Nagelhärter', '💅', 1, 'stueck', false, '{}', '{}');

-- Kategorie-Übersetzungen
INSERT INTO public.catalog_translations (entity_type, entity_id, locale, name)
SELECT 'department', 'a1b2c3d4-2100-4000-8000-000000000001', t.locale, t.name
FROM (VALUES
 ('en-US','Hand & Foot Care'), ('en-GB','Hand & Foot Care'), ('en-CA','Hand & Foot Care'),
 ('de-AT','Hand & Fußpflege'), ('de-CH','Hand & Fusspflege'),
 ('es-ES','Cuidado de manos y pies'), ('es-MX','Cuidado de manos y pies'),
 ('fr-FR','Soins des mains et des pieds'), ('fr-CA','Soins des mains et des pieds'),
 ('it-IT','Cura di mani e piedi'), ('it-CH','Cura di mani e piedi'),
 ('pt-PT','Cuidado das mãos e dos pés'), ('pt-BR','Cuidado das mãos e dos pés'),
 ('nl-NL','Hand- en voetverzorging'), ('nl-BE','Hand- en voetverzorging')
) AS t(locale, name);

-- Produkt-Übersetzungen
INSERT INTO public.catalog_translations (entity_type, entity_id, locale, name)
SELECT 'product', p.id, t.locale, t.name
FROM public.products p
JOIN (VALUES
 ('Handcreme','en-US','Hand cream'), ('Handcreme','en-GB','Hand cream'), ('Handcreme','en-CA','Hand cream'),
 ('Handcreme','de-AT','Handcreme'), ('Handcreme','de-CH','Handcreme'),
 ('Handcreme','es-ES','Crema de manos'), ('Handcreme','es-MX','Crema de manos'),
 ('Handcreme','fr-FR','Crème pour les mains'), ('Handcreme','fr-CA','Crème pour les mains'),
 ('Handcreme','it-IT','Crema mani'), ('Handcreme','it-CH','Crema mani'),
 ('Handcreme','pt-PT','Creme para as mãos'), ('Handcreme','pt-BR','Creme para as mãos'),
 ('Handcreme','nl-NL','Handcrème'), ('Handcreme','nl-BE','Handcrème'),
 ('Handdesinfektionsmittel','en-US','Hand sanitizer'), ('Handdesinfektionsmittel','en-GB','Hand sanitiser'), ('Handdesinfektionsmittel','en-CA','Hand sanitiser'),
 ('Handdesinfektionsmittel','de-AT','Handdesinfektionsmittel'), ('Handdesinfektionsmittel','de-CH','Handdesinfektionsmittel'),
 ('Handdesinfektionsmittel','es-ES','Desinfectante de manos'), ('Handdesinfektionsmittel','es-MX','Desinfectante para manos'),
 ('Handdesinfektionsmittel','fr-FR','Gel hydroalcoolique'), ('Handdesinfektionsmittel','fr-CA','Désinfectant pour les mains'),
 ('Handdesinfektionsmittel','it-IT','Disinfettante per le mani'), ('Handdesinfektionsmittel','it-CH','Disinfettante per le mani'),
 ('Handdesinfektionsmittel','pt-PT','Desinfetante para as mãos'), ('Handdesinfektionsmittel','pt-BR','Álcool em gel para as mãos'),
 ('Handdesinfektionsmittel','nl-NL','Handdesinfectiemiddel'), ('Handdesinfektionsmittel','nl-BE','Handdesinfectiemiddel'),
 ('Fusscreme','en-US','Foot cream'), ('Fusscreme','en-GB','Foot cream'), ('Fusscreme','en-CA','Foot cream'),
 ('Fusscreme','de-AT','Fußcreme'), ('Fusscreme','de-CH','Fusscreme'),
 ('Fusscreme','es-ES','Crema de pies'), ('Fusscreme','es-MX','Crema para pies'),
 ('Fusscreme','fr-FR','Crème pour les pieds'), ('Fusscreme','fr-CA','Crème pour les pieds'),
 ('Fusscreme','it-IT','Crema piedi'), ('Fusscreme','it-CH','Crema piedi'),
 ('Fusscreme','pt-PT','Creme para os pés'), ('Fusscreme','pt-BR','Creme para os pés'),
 ('Fusscreme','nl-NL','Voetencrème'), ('Fusscreme','nl-BE','Voetencrème'),
 ('Fusspeeling','en-US','Foot scrub'), ('Fusspeeling','en-GB','Foot scrub'), ('Fusspeeling','en-CA','Foot scrub'),
 ('Fusspeeling','de-AT','Fußpeeling'), ('Fusspeeling','de-CH','Fusspeeling'),
 ('Fusspeeling','es-ES','Exfoliante de pies'), ('Fusspeeling','es-MX','Exfoliante para pies'),
 ('Fusspeeling','fr-FR','Gommage pour les pieds'), ('Fusspeeling','fr-CA','Gommage pour les pieds'),
 ('Fusspeeling','it-IT','Scrub piedi'), ('Fusspeeling','it-CH','Scrub piedi'),
 ('Fusspeeling','pt-PT','Esfoliante para os pés'), ('Fusspeeling','pt-BR','Esfoliante para os pés'),
 ('Fusspeeling','nl-NL','Voetenpeeling'), ('Fusspeeling','nl-BE','Voetenpeeling'),
 ('Fussbad','en-US','Foot soak'), ('Fussbad','en-GB','Foot soak'), ('Fussbad','en-CA','Foot soak'),
 ('Fussbad','de-AT','Fußbad'), ('Fussbad','de-CH','Fussbad'),
 ('Fussbad','es-ES','Baño de pies'), ('Fussbad','es-MX','Baño de pies'),
 ('Fussbad','fr-FR','Bain de pieds'), ('Fussbad','fr-CA','Bain de pieds'),
 ('Fussbad','it-IT','Pediluvio'), ('Fussbad','it-CH','Pediluvio'),
 ('Fussbad','pt-PT','Banho de pés'), ('Fussbad','pt-BR','Banho de pés'),
 ('Fussbad','nl-NL','Voetenbad'), ('Fussbad','nl-BE','Voetenbad'),
 ('Bimsstein','en-US','Pumice stone'), ('Bimsstein','en-GB','Pumice stone'), ('Bimsstein','en-CA','Pumice stone'),
 ('Bimsstein','de-AT','Bimsstein'), ('Bimsstein','de-CH','Bimsstein'),
 ('Bimsstein','es-ES','Piedra pómez'), ('Bimsstein','es-MX','Piedra pómez'),
 ('Bimsstein','fr-FR','Pierre ponce'), ('Bimsstein','fr-CA','Pierre ponce'),
 ('Bimsstein','it-IT','Pietra pomice'), ('Bimsstein','it-CH','Pietra pomice'),
 ('Bimsstein','pt-PT','Pedra-pomes'), ('Bimsstein','pt-BR','Pedra-pomes'),
 ('Bimsstein','nl-NL','Puimsteen'), ('Bimsstein','nl-BE','Puimsteen'),
 ('Hornhautentferner','en-US','Callus remover'), ('Hornhautentferner','en-GB','Callus remover'), ('Hornhautentferner','en-CA','Callus remover'),
 ('Hornhautentferner','de-AT','Hornhautentferner'), ('Hornhautentferner','de-CH','Hornhautentferner'),
 ('Hornhautentferner','es-ES','Removedor de callosidades'), ('Hornhautentferner','es-MX','Removedor de callosidades'),
 ('Hornhautentferner','fr-FR','Dissolvant de durillons'), ('Hornhautentferner','fr-CA','Dissolvant de durillons'),
 ('Hornhautentferner','it-IT','Rimuovi callosità'), ('Hornhautentferner','it-CH','Rimuovi callosità'),
 ('Hornhautentferner','pt-PT','Removedor de calosidades'), ('Hornhautentferner','pt-BR','Removedor de calosidades'),
 ('Hornhautentferner','nl-NL','Eeltverwijderaar'), ('Hornhautentferner','nl-BE','Eeltverwijderaar'),
 ('Hornhautraspel','en-US','Foot file'), ('Hornhautraspel','en-GB','Callus file'), ('Hornhautraspel','en-CA','Callus file'),
 ('Hornhautraspel','de-AT','Hornhautraspel'), ('Hornhautraspel','de-CH','Hornhautraspel'),
 ('Hornhautraspel','es-ES','Lima para callosidades'), ('Hornhautraspel','es-MX','Lima para callosidades'),
 ('Hornhautraspel','fr-FR','Râpe à durillons'), ('Hornhautraspel','fr-CA','Râpe à durillons'),
 ('Hornhautraspel','it-IT','Lima per callosità'), ('Hornhautraspel','it-CH','Lima per callosità'),
 ('Hornhautraspel','pt-PT','Lima para calosidades'), ('Hornhautraspel','pt-BR','Lima para calosidades'),
 ('Hornhautraspel','nl-NL','Eeltvijl'), ('Hornhautraspel','nl-BE','Eeltvijl'),
 ('Nagelfeile','en-US','Nail file'), ('Nagelfeile','en-GB','Nail file'), ('Nagelfeile','en-CA','Nail file'),
 ('Nagelfeile','de-AT','Nagelfeile'), ('Nagelfeile','de-CH','Nagelfeile'),
 ('Nagelfeile','es-ES','Lima de uñas'), ('Nagelfeile','es-MX','Lima para uñas'),
 ('Nagelfeile','fr-FR','Lime à ongles'), ('Nagelfeile','fr-CA','Lime à ongles'),
 ('Nagelfeile','it-IT','Lima per unghie'), ('Nagelfeile','it-CH','Lima per unghie'),
 ('Nagelfeile','pt-PT','Lima de unhas'), ('Nagelfeile','pt-BR','Lixa de unhas'),
 ('Nagelfeile','nl-NL','Nagelvijl'), ('Nagelfeile','nl-BE','Nagelvijl'),
 ('Nagelknipser','en-US','Nail clippers'), ('Nagelknipser','en-GB','Nail clippers'), ('Nagelknipser','en-CA','Nail clippers'),
 ('Nagelknipser','de-AT','Nagelknipser'), ('Nagelknipser','de-CH','Nagelknipser'),
 ('Nagelknipser','es-ES','Cortaúñas'), ('Nagelknipser','es-MX','Cortaúñas'),
 ('Nagelknipser','fr-FR','Coupe-ongles'), ('Nagelknipser','fr-CA','Coupe-ongles'),
 ('Nagelknipser','it-IT','Tagliaunghie'), ('Nagelknipser','it-CH','Tagliaunghie'),
 ('Nagelknipser','pt-PT','Corta-unhas'), ('Nagelknipser','pt-BR','Cortador de unhas'),
 ('Nagelknipser','nl-NL','Nagelknipper'), ('Nagelknipser','nl-BE','Nagelknipper'),
 ('Nagelhautentferner','en-US','Cuticle remover'), ('Nagelhautentferner','en-GB','Cuticle remover'), ('Nagelhautentferner','en-CA','Cuticle remover'),
 ('Nagelhautentferner','de-AT','Nagelhautentferner'), ('Nagelhautentferner','de-CH','Nagelhautentferner'),
 ('Nagelhautentferner','es-ES','Removedor de cutículas'), ('Nagelhautentferner','es-MX','Removedor de cutículas'),
 ('Nagelhautentferner','fr-FR','Enlève-cuticules'), ('Nagelhautentferner','fr-CA','Dissolvant de cuticules'),
 ('Nagelhautentferner','it-IT','Rimuovi cuticole'), ('Nagelhautentferner','it-CH','Rimuovi cuticole'),
 ('Nagelhautentferner','pt-PT','Removedor de cutículas'), ('Nagelhautentferner','pt-BR','Removedor de cutículas'),
 ('Nagelhautentferner','nl-NL','Nagelriemverwijderaar'), ('Nagelhautentferner','nl-BE','Nagelriemverwijderaar'),
 ('Nagelöl','en-US','Nail oil'), ('Nagelöl','en-GB','Nail oil'), ('Nagelöl','en-CA','Nail oil'),
 ('Nagelöl','de-AT','Nagelöl'), ('Nagelöl','de-CH','Nagelöl'),
 ('Nagelöl','es-ES','Aceite para uñas'), ('Nagelöl','es-MX','Aceite para uñas'),
 ('Nagelöl','fr-FR','Huile pour ongles'), ('Nagelöl','fr-CA','Huile pour ongles'),
 ('Nagelöl','it-IT','Olio per unghie'), ('Nagelöl','it-CH','Olio per unghie'),
 ('Nagelöl','pt-PT','Óleo para unhas'), ('Nagelöl','pt-BR','Óleo para unhas'),
 ('Nagelöl','nl-NL','Nagelolie'), ('Nagelöl','nl-BE','Nagelolie'),
 ('Nagelhärter','en-US','Nail hardener'), ('Nagelhärter','en-GB','Nail hardener'), ('Nagelhärter','en-CA','Nail hardener'),
 ('Nagelhärter','de-AT','Nagelhärter'), ('Nagelhärter','de-CH','Nagelhärter'),
 ('Nagelhärter','es-ES','Endurecedor de uñas'), ('Nagelhärter','es-MX','Endurecedor de uñas'),
 ('Nagelhärter','fr-FR','Durcisseur d''ongles'), ('Nagelhärter','fr-CA','Durcisseur d''ongles'),
 ('Nagelhärter','it-IT','Indurente per unghie'), ('Nagelhärter','it-CH','Indurente per unghie'),
 ('Nagelhärter','pt-PT','Endurecedor de unhas'), ('Nagelhärter','pt-BR','Endurecedor de unhas'),
 ('Nagelhärter','nl-NL','Nagelverharder'), ('Nagelhärter','nl-BE','Nagelverharder')
) AS t(base, locale, name) ON t.base = p.name
WHERE p.department_id = 'a1b2c3d4-2100-4000-8000-000000000001';