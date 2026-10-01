-- Push-Geräte-Registrierung
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  locale text NOT NULL DEFAULT 'de',
  favorite_product_ids uuid[] NOT NULL DEFAULT '{}',
  notify_new_favorites boolean NOT NULL DEFAULT true,
  notify_comments boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pg_net für HTTP-Aufrufe aus Triggern
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Rezept veröffentlicht
CREATE OR REPLACE FUNCTION public.notify_recipe_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_public AND (TG_OP = 'INSERT' OR NOT OLD.is_public) THEN
    PERFORM net.http_post(
      url := 'https://project--a78c85aa-6ce5-4c1c-9444-bbac3265d258-dev.lovable.app/api/public/webhooks/recipe-events',
      body := jsonb_build_object('type','recipe_published','recipe_id',NEW.id),
      headers := jsonb_build_object('Content-Type','application/json','X-Recipe-Events-Secret','f3d0f4f1d8d6148d1fe826630620d498df063b908fb297b7')
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER recipe_published_notify
  AFTER INSERT OR UPDATE OF is_public ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.notify_recipe_published();

-- Kommentar auf Rezept
CREATE OR REPLACE FUNCTION public.notify_comment_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://project--a78c85aa-6ce5-4c1c-9444-bbac3265d258-dev.lovable.app/api/public/webhooks/recipe-events',
    body := jsonb_build_object('type','comment_added','recipe_id',NEW.recipe_id,'comment_id',NEW.id),
    headers := jsonb_build_object('Content-Type','application/json','X-Recipe-Events-Secret','f3d0f4f1d8d6148d1fe826630620d498df063b908fb297b7')
  );
  RETURN NEW;
END $$;

CREATE TRIGGER recipe_comment_notify
  AFTER INSERT ON public.recipe_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_added();