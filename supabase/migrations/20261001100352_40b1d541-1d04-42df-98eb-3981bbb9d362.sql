ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS description text;

DROP FUNCTION public.recipe_feed(text, uuid[], integer);

CREATE OR REPLACE FUNCTION public.recipe_feed(_order text DEFAULT 'rating', _product_ids uuid[] DEFAULT NULL, _limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, description text, template_id text, items jsonb, product_ids uuid[], share_slug text, author_name text, created_at timestamp with time zone, avg_rating numeric, rating_count bigint, save_count bigint, match_count integer, image_path text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT r.id, r.title, r.description, r.template_id, r.items, r.product_ids, r.share_slug, r.author_name, r.created_at,
    COALESCE((SELECT round(avg(stars)::numeric, 1) FROM recipe_ratings x WHERE x.recipe_id = r.id), 0) AS avg_rating,
    (SELECT count(*) FROM recipe_ratings x WHERE x.recipe_id = r.id) AS rating_count,
    (SELECT count(*) FROM recipe_saves s WHERE s.recipe_id = r.id) AS save_count,
    CASE WHEN _product_ids IS NULL THEN 0 ELSE cardinality(ARRAY(SELECT unnest(r.product_ids) INTERSECT SELECT unnest(_product_ids))) END AS match_count,
    r.image_path
  FROM recipes r
  WHERE r.is_public AND (_product_ids IS NULL OR r.product_ids && _product_ids)
  ORDER BY
    CASE WHEN _order = 'favorites' THEN cardinality(ARRAY(SELECT unnest(r.product_ids) INTERSECT SELECT unnest(_product_ids))) END DESC NULLS LAST,
    CASE WHEN _order = 'saves' THEN (SELECT count(*) FROM recipe_saves s WHERE s.recipe_id = r.id) END DESC NULLS LAST,
    CASE WHEN _order IN ('rating','favorites') THEN COALESCE((SELECT avg(stars) FROM recipe_ratings x WHERE x.recipe_id = r.id), 0) END DESC NULLS LAST,
    CASE WHEN _order = 'rating' THEN (SELECT count(*) FROM recipe_ratings x WHERE x.recipe_id = r.id) END DESC NULLS LAST,
    r.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50)
$function$;