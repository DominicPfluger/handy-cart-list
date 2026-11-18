DROP POLICY IF EXISTS "sdo read" ON public.store_department_overrides;
CREATE POLICY "sdo read" ON public.store_department_overrides FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.supermarkets s WHERE s.id = supermarket_id AND s.enabled) OR public.is_store_admin(auth.uid(), supermarket_id));
DROP POLICY IF EXISTS "spo read" ON public.store_product_overrides;
CREATE POLICY "spo read" ON public.store_product_overrides FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.supermarkets s WHERE s.id = supermarket_id AND s.enabled) OR public.is_store_admin(auth.uid(), supermarket_id));