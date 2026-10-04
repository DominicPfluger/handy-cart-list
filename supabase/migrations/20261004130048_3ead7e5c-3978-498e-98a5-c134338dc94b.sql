CREATE TABLE public.units (
  id text PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.units TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Units readable by all" ON public.units FOR SELECT USING (true);
CREATE POLICY "Admins manage units" ON public.units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.units (id, sort_order, builtin)
SELECT u, ord::int, true FROM unnest(ARRAY['stueck','artikel','gramm','kilogramm','milligramm','pfund','unzen','milliliter','deziliter','liter','gallone','tasse','glas','flasche','dose','beutel','packung','schachtel','box','karton','kiste','kanister','buendel','portion','sack','eimer','becher','tube','netz','palette','tablett','rolle','blister','sixpack']) WITH ORDINALITY AS t(u, ord);

ALTER TABLE public.products ALTER COLUMN default_unit DROP DEFAULT;
ALTER TABLE public.products ALTER COLUMN default_unit TYPE text USING default_unit::text;
ALTER TABLE public.products ALTER COLUMN default_unit SET DEFAULT 'stueck';