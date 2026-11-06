-- OutputLab 0007 — Diary Storyworthy (Homework for Life)
-- Tabel catatan momen harian pendek khas Storyworthy karya Matthew Dicks.
-- Setiap penulisan tercatat dengan tanggal, momen cerita singkat, dan terhubung ke jejak aktivitas.

create table if not exists public.diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pastikan fungsi handle_updated_at ada
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_diaries_updated on public.diaries;
create trigger trg_diaries_updated
  before update on public.diaries
  for each row execute function public.handle_updated_at();

create index if not exists idx_diaries_user_date on public.diaries(user_id, entry_date desc);

alter table public.diaries enable row level security;

drop policy if exists "diaries_owner_all" on public.diaries;
create policy "diaries_owner_all" on public.diaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

