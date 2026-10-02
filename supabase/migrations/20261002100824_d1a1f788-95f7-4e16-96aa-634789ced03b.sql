CREATE TABLE public.markets (
  code text PRIMARY KEY, name text NOT NULL, flag text NOT NULL DEFAULT '', currency text NOT NULL DEFAULT 'EUR',
  enabled boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.markets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.markets TO authenticated;
GRANT ALL ON public.markets TO service_role;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "markets read" ON public.markets FOR SELECT USING (true);
CREATE POLICY "markets admin write" ON public.markets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER markets_updated BEFORE UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.supermarkets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_code text NOT NULL REFERENCES public.markets(code) ON DELETE CASCADE ON UPDATE CASCADE,
  name text NOT NULL, emoji text, enabled boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.supermarkets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supermarkets TO authenticated;
GRANT ALL ON public.supermarkets TO service_role;
ALTER TABLE public.supermarkets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supermarkets read" ON public.supermarkets FOR SELECT USING (true);
CREATE POLICY "supermarkets admin write" ON public.supermarkets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER supermarkets_updated BEFORE UPDATE ON public.supermarkets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.markets (code,name,flag,currency,sort_order) VALUES
('CH','Schweiz','🇨🇭','CHF',1),('DE','Deutschland','🇩🇪','EUR',2),('AT','Österreich','🇦🇹','EUR',3),
('FR','Frankreich','🇫🇷','EUR',4),('IT','Italien','🇮🇹','EUR',5),('ES','Spanien','🇪🇸','EUR',6),
('PT','Portugal','🇵🇹','EUR',7),('NL','Niederlande','🇳🇱','EUR',8),('BE','Belgien','🇧🇪','EUR',9),
('GB','Grossbritannien','🇬🇧','GBP',10),('US','USA','🇺🇸','USD',11),('CA','Kanada','🇨🇦','CAD',12),
('MX','Mexiko','🇲🇽','MXN',13),('BR','Brasilien','🇧🇷','BRL',14);

INSERT INTO public.supermarkets (market_code,name,sort_order)
SELECT m, n, o FROM (VALUES
('CH',ARRAY['Migros','Coop','Denner','Aldi','Lidl','Volg','Manor','Spar']),
('DE',ARRAY['Edeka','Rewe','Aldi','Lidl','Kaufland','Penny','Netto','Globus']),
('AT',ARRAY['Billa','Spar','Hofer','Lidl','Penny','MPreis','Interspar']),
('FR',ARRAY['Carrefour','E.Leclerc','Auchan','Intermarché','Lidl','Monoprix','Casino']),
('IT',ARRAY['Esselunga','Coop','Conad','Carrefour','Lidl','Eurospin','Pam']),
('ES',ARRAY['Mercadona','Carrefour','Lidl','Dia','Alcampo','Eroski','El Corte Inglés']),
('PT',ARRAY['Continente','Pingo Doce','Lidl','Auchan','Intermarché','Minipreço']),
('NL',ARRAY['Albert Heijn','Jumbo','Lidl','Aldi','Plus','Dirk']),
('BE',ARRAY['Delhaize','Colruyt','Carrefour','Aldi','Lidl','Albert Heijn']),
('GB',ARRAY['Tesco','Sainsbury''s','Asda','Morrisons','Aldi','Lidl','Waitrose']),
('US',ARRAY['Walmart','Kroger','Costco','Target','Whole Foods','Trader Joe''s','Safeway']),
('CA',ARRAY['Loblaws','Sobeys','Metro','Walmart','Costco','No Frills']),
('MX',ARRAY['Walmart','Soriana','Chedraui','La Comer','Oxxo','Costco']),
('BR',ARRAY['Carrefour','Pão de Açúcar','Assaí','Atacadão','Extra','Dia'])
) v(m, arr), unnest(arr) WITH ORDINALITY AS u(n, o);