-- ========= Gemeinsame Listen & Vorrat =========

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null default 'Neue Liste',
  is_template boolean not null default false,
  sort_order integer not null default 0,
  invite_code text unique,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid,
  name text not null,
  quantity text not null default '1',
  unit text,
  emoji text,
  image_url text,
  group_label text,
  group_emoji text,
  note text,
  checked boolean not null default false,
  checked_by_name text,
  added_by uuid,
  added_by_name text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'editor',
  display_name text,
  joined_at timestamp with time zone not null default now(),
  unique (list_id, user_id)
);

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid,
  name text not null,
  quantity text not null default '1',
  unit text,
  emoji text,
  image_url text,
  added_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index list_items_list_idx on public.list_items (list_id, sort_order);
create index list_members_user_idx on public.list_members (user_id);
create index pantry_items_user_idx on public.pantry_items (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.list_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.list_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pantry_items TO authenticated;
GRANT ALL ON public.shopping_lists TO service_role;
GRANT ALL ON public.list_items TO service_role;
GRANT ALL ON public.list_members TO service_role;
GRANT ALL ON public.pantry_items TO service_role;

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

-- Sicherheits-Hilfsfunktionen (verhindern rekursive Regel-Zyklen)
create or replace function public.is_list_member(_list_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.list_members
    where list_id = _list_id and user_id = _user_id
  )
$$;

create or replace function public.is_list_owner(_list_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shopping_lists
    where id = _list_id and owner_id = _user_id
  )
$$;

create or replace function public.can_access_list(_list_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shopping_lists sl
    left join public.list_members lm on lm.list_id = sl.id and lm.user_id = _user_id
    where sl.id = _list_id and (sl.owner_id = _user_id or lm.id is not null)
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_list_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_list_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_list(uuid, uuid) TO authenticated;

-- RLS shopping_lists
create policy "Listen: Besitzer sieht eigene"
  on public.shopping_lists for select to authenticated
  using (owner_id = auth.uid());
create policy "Listen: Mitglieder sehen geteilte"
  on public.shopping_lists for select to authenticated
  using (public.is_list_member(id, auth.uid()));
create policy "Listen: Anlegen durch Besitzer"
  on public.shopping_lists for insert to authenticated
  with check (owner_id = auth.uid());
create policy "Listen: Aendern nur durch Besitzer"
  on public.shopping_lists for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Listen: Loeschen nur durch Besitzer"
  on public.shopping_lists for delete to authenticated
  using (owner_id = auth.uid());

-- RLS list_items
create policy "Eintraege: Zugriff fuer Besitzer und Mitglieder"
  on public.list_items for all to authenticated
  using (public.can_access_list(list_id, auth.uid()))
  with check (public.can_access_list(list_id, auth.uid()));

-- RLS list_members
create policy "Mitglieder: eigene Mitgliedschaften sehen"
  on public.list_members for select to authenticated
  using (user_id = auth.uid() or public.is_list_owner(list_id, auth.uid()));
create policy "Mitglieder: sich selbst beitreten"
  on public.list_members for insert to authenticated
  with check (user_id = auth.uid() or public.is_list_owner(list_id, auth.uid()));
create policy "Mitglieder: sich selbst entfernen"
  on public.list_members for delete to authenticated
  using (user_id = auth.uid() or public.is_list_owner(list_id, auth.uid()));

-- RLS pantry_items
create policy "Vorrat: eigener Vorrat"
  on public.pantry_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Zeitstempel-Trigger
create trigger update_shopping_lists_updated_at before update on public.shopping_lists
  for each row execute function update_updated_at_column();
create trigger update_list_items_updated_at before update on public.list_items
  for each row execute function update_updated_at_column();
create trigger update_pantry_items_updated_at before update on public.pantry_items
  for each row execute function update_updated_at_column();

-- Live-Synchronisation aktivieren
alter publication supabase_realtime add table public.shopping_lists;
alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.list_members;
alter publication supabase_realtime add table public.pantry_items;