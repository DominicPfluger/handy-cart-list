ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS unit_quantities jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.products
SET unit_quantities = jsonb_build_object(default_unit, default_quantity)
WHERE unit_quantities = '{}'::jsonb;