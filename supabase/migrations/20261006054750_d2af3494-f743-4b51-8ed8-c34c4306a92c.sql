UPDATE public.units SET hidden_markets = ARRAY(SELECT code FROM public.markets WHERE code <> 'US') WHERE id = 'gallone';
UPDATE public.units SET hidden_markets = ARRAY(SELECT code FROM public.markets WHERE code NOT IN ('US','GB','CA')) WHERE id IN ('unzen','pfund');
UPDATE public.units SET hidden_markets = ARRAY(SELECT code FROM public.markets WHERE code NOT IN ('US','CA')) WHERE id = 'tasse';