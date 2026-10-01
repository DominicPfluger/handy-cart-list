REVOKE EXECUTE ON FUNCTION public.is_market_admin(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_market_product_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_market_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_market_product_admin(uuid, uuid) TO authenticated;