CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  template_id text NOT NULL,
  picks jsonb NOT NULL DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  share_slug text UNIQUE,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public recipes readable" ON public.recipes FOR SELECT TO anon, authenticated USING (is_public OR owner_id = auth.uid());
CREATE POLICY "Owner inserts recipes" ON public.recipes FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates recipes" ON public.recipes FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes recipes" ON public.recipes FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX recipes_product_ids_idx ON public.recipes USING gin (product_ids);
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_ratings TO authenticated;
GRANT ALL ON public.recipe_ratings TO service_role;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own ratings" ON public.recipe_ratings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER update_recipe_ratings_updated_at BEFORE UPDATE ON public.recipe_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipe_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recipe_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.recipe_comments TO authenticated;
GRANT ALL ON public.recipe_comments TO service_role;
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments readable on public recipes" ON public.recipe_comments FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.owner_id = auth.uid())));
CREATE POLICY "Own comments insert" ON public.recipe_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND (r.is_public OR r.owner_id = auth.uid())));
CREATE POLICY "Own or admin comments delete" ON public.recipe_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.recipe_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_folders TO authenticated;
GRANT ALL ON public.recipe_folders TO service_role;
ALTER TABLE public.recipe_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own folders" ON public.recipe_folders FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER update_recipe_folders_updated_at BEFORE UPDATE ON public.recipe_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipe_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.recipe_folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_saves TO authenticated;
GRANT ALL ON public.recipe_saves TO service_role;
ALTER TABLE public.recipe_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saves" ON public.recipe_saves FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Öffentliche Ranglisten (nur öffentliche Rezepte, nur Aggregate)
CREATE OR REPLACE FUNCTION public.recipe_feed(_order text DEFAULT 'rating', _product_ids uuid[] DEFAULT NULL, _limit int DEFAULT 10)
RETURNS TABLE (id uuid, title text, template_id text, items jsonb, product_ids uuid[], share_slug text, author_name text, created_at timestamptz, avg_rating numeric, rating_count bigint, save_count bigint, match_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.title, r.template_id, r.items, r.product_ids, r.share_slug, r.author_name, r.created_at,
    COALESCE((SELECT round(avg(stars)::numeric, 1) FROM recipe_ratings x WHERE x.recipe_id = r.id), 0) AS avg_rating,
    (SELECT count(*) FROM recipe_ratings x WHERE x.recipe_id = r.id) AS rating_count,
    (SELECT count(*) FROM recipe_saves s WHERE s.recipe_id = r.id) AS save_count,
    CASE WHEN _product_ids IS NULL THEN 0 ELSE cardinality(ARRAY(SELECT unnest(r.product_ids) INTERSECT SELECT unnest(_product_ids))) END AS match_count
  FROM recipes r
  WHERE r.is_public AND (_product_ids IS NULL OR r.product_ids && _product_ids)
  ORDER BY
    CASE WHEN _order = 'favorites' THEN cardinality(ARRAY(SELECT unnest(r.product_ids) INTERSECT SELECT unnest(_product_ids))) END DESC NULLS LAST,
    CASE WHEN _order = 'saves' THEN (SELECT count(*) FROM recipe_saves s WHERE s.recipe_id = r.id) END DESC NULLS LAST,
    CASE WHEN _order IN ('rating','favorites') THEN COALESCE((SELECT avg(stars) FROM recipe_ratings x WHERE x.recipe_id = r.id), 0) END DESC NULLS LAST,
    CASE WHEN _order = 'rating' THEN (SELECT count(*) FROM recipe_ratings x WHERE x.recipe_id = r.id) END DESC NULLS LAST,
    r.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50)
$$;
GRANT EXECUTE ON FUNCTION public.recipe_feed(text, uuid[], int) TO anon, authenticated;