-- OutputLab MVP — Supabase migration
-- Jalankan di Supabase Dashboard > SQL Editor (copy-paste seluruh file ini).
-- Membutuhkan ekstensi pgcrypto untuk gen_random_uuid().

create extension if not exists "pgcrypto";

-- ============ learning_items ============
create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_url text,
  source_type text not null default 'other'
    check (source_type in ('article','news','journal','youtube','documentation','book','google_doc','other')),
  description text,
  topic text,
  learning_goal text,
  status text not null default 'new'
    check (status in ('new','learning','learned')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============ learning_notes ============
create table if not exists public.learning_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_item_id uuid not null references public.learning_items(id) on delete cascade,
  understanding text not null check (char_length(understanding) >= 100),
  critical_comment text,
  questions text,
  ideas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ projects ============
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  project_type text not null default 'other'
    check (project_type in ('experiment','application','article','video','research','business','learning','other')),
  status text not null default 'planned'
    check (status in ('planned','active','completed','paused','archived')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high')),
  start_date date,
  due_date date,
  learning_item_id uuid references public.learning_items(id) on delete set null,
  parent_project_id uuid references public.projects(id) on delete set null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ project_tasks ============
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo','doing','done')),
  position integer not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ outputs ============
create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  output_type text not null default 'other'
    check (output_type in ('code','document','video','research','product','creative','presentation','other')),
  platform text not null default 'other'
    check (platform in ('github','gitlab','google_colab','google_docs','notion','youtube','tiktok','instagram','linkedin','journal','website','other')),
  url text not null,
  is_primary boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  description text,
  created_at timestamptz not null default now()
);

-- ============ project_reviews ============
create table if not exists public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade unique,
  what_worked text,
  what_failed text,
  key_insight text,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ updated_at trigger ============
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_learning_notes_updated on public.learning_notes;
create trigger trg_learning_notes_updated
  before update on public.learning_notes
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_tasks_updated on public.project_tasks;
create trigger trg_tasks_updated
  before update on public.project_tasks
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_reviews_updated on public.project_reviews;
create trigger trg_reviews_updated
  before update on public.project_reviews
  for each row execute function public.handle_updated_at();

-- ============ Satu primary output per project ============
-- Aplikasi juga menonaktifkan primary lama saat menyimpan yang baru (lihat services/projects.ts).
-- Unique index parsial ini menegakkan maksimal 1 primary=true per project di level DB.
drop index if exists public.outputs_one_primary_per_project;
create unique index outputs_one_primary_per_project
  on public.outputs (project_id)
  where is_primary = true;

-- ============ Indexes ============
create index if not exists idx_learning_items_user on public.learning_items(user_id, created_at desc);
create index if not exists idx_notes_item on public.learning_notes(learning_item_id);
create index if not exists idx_notes_user on public.learning_notes(user_id);
create index if not exists idx_projects_user on public.projects(user_id, created_at desc);
create index if not exists idx_tasks_project on public.project_tasks(project_id, position);
create index if not exists idx_outputs_project on public.outputs(project_id);
create index if not exists idx_reviews_project on public.project_reviews(project_id);

-- ============ RLS ============
alter table public.learning_items enable row level security;
alter table public.learning_notes enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.outputs enable row level security;
alter table public.project_reviews enable row level security;

-- learning_items: pemilik saja
drop policy if exists "learning_items_owner_all" on public.learning_items;
create policy "learning_items_owner_all" on public.learning_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- learning_notes: pemilik saja, dan learning_item harus miliknya juga (cegah tebakan id чужой item)
drop policy if exists "learning_notes_owner_all" on public.learning_notes;
create policy "learning_notes_owner_all" on public.learning_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- projects: pemilik saja
drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- project_tasks: hanya jika project induk milik user yang sama
drop policy if exists "tasks_via_project_owner" on public.project_tasks;
create policy "tasks_via_project_owner" on public.project_tasks
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.user_id = auth.uid())
  );

-- outputs: hanya jika project induk milik user yang sama
drop policy if exists "outputs_via_project_owner" on public.outputs;
create policy "outputs_via_project_owner" on public.outputs
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = outputs.project_id and p.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = outputs.project_id and p.user_id = auth.uid())
  );

-- project_reviews: hanya jika project induk milik user yang sama
drop policy if exists "reviews_via_project_owner" on public.project_reviews;
create policy "reviews_via_project_owner" on public.project_reviews
  for all using (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_reviews.project_id and p.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_reviews.project_id and p.user_id = auth.uid())
  );
