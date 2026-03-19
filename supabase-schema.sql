create extension if not exists pgcrypto;

create table if not exists public.app_users (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    approved boolean not null default false,
    blocked boolean not null default false,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.app_users(id) on delete cascade,
    name text not null,
    email text not null,
    rating integer not null check (rating between 1 and 5),
    category text not null default 'suggestion',
    message text not null,
    created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.app_feedback enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.app_users
        where id = auth.uid()
          and role = 'admin'
          and approved = true
          and blocked = false
    );
$$;

drop policy if exists "users_select_self_or_admin" on public.app_users;
create policy "users_select_self_or_admin"
on public.app_users
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "users_insert_self" on public.app_users;
create policy "users_insert_self"
on public.app_users
for insert
with check (id = auth.uid());

drop policy if exists "users_update_self_or_admin" on public.app_users;
create policy "users_update_self_or_admin"
on public.app_users
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "feedback_insert_self" on public.app_feedback;
create policy "feedback_insert_self"
on public.app_feedback
for insert
with check (user_id = auth.uid());

drop policy if exists "feedback_select_self_or_admin" on public.app_feedback;
create policy "feedback_select_self_or_admin"
on public.app_feedback
for select
using (user_id = auth.uid() or public.is_admin());
