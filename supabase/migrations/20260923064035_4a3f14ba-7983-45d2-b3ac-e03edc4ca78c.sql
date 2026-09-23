CREATE POLICY "Katalogbilder sind lesbar"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'catalog-images');