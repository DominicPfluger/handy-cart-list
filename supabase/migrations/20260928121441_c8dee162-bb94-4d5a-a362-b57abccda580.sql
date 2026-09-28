UPDATE public.departments SET parent_id = NULL, sort_order = 2, image_path = 'departments/milchprodukte.png', updated_at = now() WHERE id = 'a8785ff5-dcd3-4f83-b2dc-d208e9e8c09f';
UPDATE public.departments SET sort_order = 3, updated_at = now() WHERE id = '5a7050a7-f226-4e4e-88d9-9873179eb05f'; -- Backwaren & Frühstück
UPDATE public.departments SET sort_order = 4, updated_at = now() WHERE id = '214ffebd-871a-41f4-848c-076b5cb0e9c9'; -- Vorratsschrank
UPDATE public.departments SET sort_order = 5, updated_at = now() WHERE id = 'c66bc597-b31e-4eaf-9809-51d2e72e316f'; -- Getränke
UPDATE public.departments SET sort_order = 6, updated_at = now() WHERE id = '00bd522a-e59d-49b5-b159-884aa5f5a127'; -- Haushalt
UPDATE public.departments SET sort_order = 7, updated_at = now() WHERE id = 'f6b5a2b7-d686-4ea6-a2d5-f4e482702d8e'; -- Körperpflege
UPDATE public.departments SET sort_order = 8, updated_at = now() WHERE id = '42cb847d-a961-4b26-9233-9f55766d658c'; -- Tierbedarf