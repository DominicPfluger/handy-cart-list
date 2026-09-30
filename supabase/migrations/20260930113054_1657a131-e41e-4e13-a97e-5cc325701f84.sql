INSERT INTO public.departments (id, parent_id, name, sort_order)
VALUES ('c1e0d006-0000-4000-8000-0000000000c6', 'c1e0d001-0000-4000-8000-0000000000c1', 'Schuhe', 4);

INSERT INTO public.catalog_translations (entity_type, entity_id, locale, name) VALUES
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'de-DE', 'Schuhe'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'de-AT', 'Schuhe'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'de-CH', 'Schuhe'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'en-CA', 'Shoes'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'en-GB', 'Shoes'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'en-US', 'Shoes'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'es-ES', 'Zapatos'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'es-MX', 'Zapatos'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'fr-CA', 'Chaussures'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'fr-FR', 'Chaussures'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'it-CH', 'Scarpe'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'it-IT', 'Scarpe'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'nl-BE', 'Schoenen'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'nl-NL', 'Schoenen'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'pt-BR', 'Sapatos'),
('department', 'c1e0d006-0000-4000-8000-0000000000c6', 'pt-PT', 'Sapatos');