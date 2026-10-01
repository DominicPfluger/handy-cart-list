REVOKE EXECUTE ON FUNCTION public.notify_recipe_published() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_comment_added() FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.notify_recipe_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
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

CREATE OR REPLACE FUNCTION public.notify_comment_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://project--a78c85aa-6ce5-4c1c-9444-bbac3265d258-dev.lovable.app/api/public/webhooks/recipe-events',
    body := jsonb_build_object('type','comment_added','recipe_id',NEW.recipe_id,'comment_id',NEW.id),
    headers := jsonb_build_object('Content-Type','application/json','X-Recipe-Events-Secret','f3d0f4f1d8d6148d1fe826630620d498df063b908fb297b7')
  );
  RETURN NEW;
END $$;