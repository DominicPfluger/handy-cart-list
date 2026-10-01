ALTER TABLE public.recipe_folders ADD COLUMN IF NOT EXISTS parent_id uuid NULL REFERENCES public.recipe_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS recipe_folders_parent_idx ON public.recipe_folders(parent_id);
CREATE OR REPLACE FUNCTION public.recipe_folders_no_cycle()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cur uuid := NEW.parent_id; depth int := 0;
BEGIN
  WHILE cur IS NOT NULL LOOP
    IF cur = NEW.id THEN RAISE EXCEPTION 'folder cycle'; END IF;
    depth := depth + 1;
    IF depth > 50 THEN RAISE EXCEPTION 'folder too deep'; END IF;
    SELECT parent_id INTO cur FROM public.recipe_folders WHERE id = cur;
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS recipe_folders_no_cycle ON public.recipe_folders;
CREATE TRIGGER recipe_folders_no_cycle BEFORE INSERT OR UPDATE OF parent_id ON public.recipe_folders
FOR EACH ROW EXECUTE FUNCTION public.recipe_folders_no_cycle();