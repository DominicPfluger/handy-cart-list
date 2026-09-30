UPDATE public.products SET sort_order = sort_order + 1, updated_at = now() WHERE department_id = 'c1e0d003-0000-4000-8000-0000000000c3' AND sort_order >= 17;

INSERT INTO public.products (id, department_id, name, emoji, default_quantity, default_unit, organic_available, sort_order)
VALUES ('e1a2b3c4-0000-4000-8000-0000000000b1', 'c1e0d003-0000-4000-8000-0000000000c3', 'Boxershorts', '🩲', 1, 'stueck', false, 17);

INSERT INTO public.catalog_translations (entity_type, entity_id, locale, name, is_manual) VALUES
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'de-DE', 'Boxershorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'de-AT', 'Boxershorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'de-CH', 'Boxershorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'en-US', 'Boxer shorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'en-GB', 'Boxer shorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'en-CA', 'Boxer shorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'es-ES', 'Bóxers', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'es-MX', 'Bóxers', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'fr-FR', 'Boxers', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'fr-CA', 'Bobettes boxer', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'it-IT', 'Boxer', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'it-CH', 'Boxer', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'nl-NL', 'Boxershorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'nl-BE', 'Boxershorts', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'pt-PT', 'Cuecas boxer', false),
('product', 'e1a2b3c4-0000-4000-8000-0000000000b1', 'pt-BR', 'Cuecas boxer', false);