-- OutputLab 0008 — RuangUang (Personal & Family Finance Tracker Phase 1 MVP)
-- Tabel rekening, kategori, transaksi keuangan, utang, dan pembayaran cicilan.

-- ============ accounts ============
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  account_type varchar(30) not null default 'bank'
    check (account_type in ('cash','bank','ewallet','savings','other')),
  opening_balance numeric(15,2) not null default 0,
  opening_date date not null default current_date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ categories ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  category_type varchar(20) not null check (category_type in ('income','expense')),
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ transactions ============
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  transaction_type varchar(20) not null check (transaction_type in ('income','expense','transfer_in','transfer_out','debt_payment')),
  transaction_date date not null default current_date,
  amount numeric(15,2) not null check (amount > 0),
  description text,
  reference_type varchar(30),
  reference_id uuid,
  created_at timestamptz not null default now()
);

-- ============ debts ============
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creditor_name varchar(150) not null,
  debt_type varchar(50) not null default 'bank'
    check (debt_type in ('bank_loan','bpr','credit_card','kta','personal','installment','other')),
  principal_amount numeric(15,2) not null check (principal_amount >= 0),
  outstanding_principal numeric(15,2) not null check (outstanding_principal >= 0),
  interest_rate numeric(8,4) default 0,
  interest_type varchar(30) default 'flat',
  start_date date not null default current_date,
  original_tenor integer default 12,
  remaining_tenor integer default 12,
  monthly_installment numeric(15,2) not null default 0,
  due_day integer not null default 1 check (due_day between 1 and 31),
  early_settlement_fee numeric(15,2) default 0,
  status varchar(20) not null default 'active'
    check (status in ('active','paid_off','paused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ debt_payments ============
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  payment_date date not null default current_date,
  principal_paid numeric(15,2) not null default 0 check (principal_paid >= 0),
  interest_paid numeric(15,2) not null default 0 check (interest_paid >= 0),
  fee_paid numeric(15,2) not null default 0 check (fee_paid >= 0),
  total_paid numeric(15,2) not null check (total_paid > 0),
  notes text,
  created_at timestamptz not null default now()
);

-- Triggers for updated_at
drop trigger if exists trg_accounts_updated on public.accounts;
create trigger trg_accounts_updated
  before update on public.accounts
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_debts_updated on public.debts;
create trigger trg_debts_updated
  before update on public.debts
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

create policy "accounts_owner_all" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_owner_all" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_owner_all" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debts_owner_all" on public.debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "debt_payments_owner_all" on public.debt_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
create index if not exists idx_accounts_user on public.accounts(user_id);
create index if not exists idx_categories_user on public.categories(user_id, category_type);
create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index if not exists idx_debts_user on public.debts(user_id, status);
create index if not exists idx_debt_payments_debt on public.debt_payments(debt_id, payment_date desc);

