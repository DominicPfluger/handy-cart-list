alter table public.list_items add column organic boolean not null default false;
alter table public.pantry_items add column organic boolean not null default false;

create or replace function public.join_list_by_invite(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list uuid;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;
  select id into v_list from public.shopping_lists where invite_code = upper(trim(_code));
  if v_list is null then
    return null;
  end if;
  insert into public.list_members (list_id, user_id, role)
  values (v_list, v_user, 'editor')
  on conflict (list_id, user_id) do nothing;
  return v_list;
end;
$$;

revoke execute on function public.join_list_by_invite(text) from public, anon;
grant execute on function public.join_list_by_invite(text) to authenticated;