CREATE TABLE public.product_variant_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant text NOT NULL,
  image_path text,
  icon_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant)
);
GRANT SELECT ON public.product_variant_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variant_images TO authenticated;
GRANT ALL ON public.product_variant_images TO service_role;
ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variant images readable by all" ON public.product_variant_images FOR SELECT USING (true);
CREATE POLICY "Admins manage variant images" ON public.product_variant_images FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_product_variant_images_updated_at BEFORE UPDATE ON public.product_variant_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();