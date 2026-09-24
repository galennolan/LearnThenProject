-- OutputLab 0006 — coretan berupa LINK papan tulis (mis. tldraw), bukan snapshot kanvas.
-- Cukup jalankan file ini (lewati 0005 bila belum dijalankan): membuat tabel
-- bila belum ada, menambah kolom url, dan menghapus kolom snapshot yang tak terpakai.

create table if not exists public.learning_sketches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_item_id uuid not null references public.learning_items(id) on delete cascade unique,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_sketches add column if not exists url text;
alter table public.learning_sketches drop column if exists snapshot;

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sketches_updated on public.learning_sketches;
create trigger trg_sketches_updated
  before update on public.learning_sketches
  for each row execute function public.handle_updated_at();

create index if not exists idx_sketches_item on public.learning_sketches(learning_item_id);
create index if not exists idx_sketches_user on public.learning_sketches(user_id);

alter table public.learning_sketches enable row level security;

drop policy if exists "learning_sketches_owner_all" on public.learning_sketches;
create policy "learning_sketches_owner_all" on public.learning_sketches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
