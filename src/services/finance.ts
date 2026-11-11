import { supabase } from '../lib/supabaseClient';
import type {
  Account,
  Category,
  Transaction,
  Debt,
  DebtPayment,
  FinanceSummary,
} from '../types/finance';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../types/finance';
import {
  PALETTE,
  MONTH_NAMES,
  formatRupiah,
  formatRupiahShort,
  calculateCashFlowHistory,
  calculateCategoryBreakdown,
  calculateFinancialProjections,
  calculateCFPHealthAnalysis,
} from './finance/cfpEngine';

export { formatRupiah, formatRupiahShort, PALETTE, MONTH_NAMES };

const ACCOUNTS_KEY = 'ruanguang_accounts_all';
const CATEGORIES_KEY = 'ruanguang_categories_all';
const TRANSACTIONS_KEY = 'ruanguang_transactions_all';
const DEBTS_KEY = 'ruanguang_debts_all';
const PAYMENTS_KEY = 'ruanguang_payments_all';

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore storage full */
  }
}

// ======================== CATEGORIES ========================
export async function listCategories(categoryType?: 'income' | 'expense'): Promise<Category[]> {
  const local = getLocal<Category>(CATEGORIES_KEY);

  try {
    let query = supabase.from('categories').select('*').order('name');
    if (categoryType) {
      query = query.eq('category_type', categoryType);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      setLocal(CATEGORIES_KEY, data);
      return data as Category[];
    }
  } catch (err) {
    console.warn('Fetch categories remote error:', err);
  }

  // Jika belum ada di local juga, inisialisasi default
  if (local.length === 0) {
    const defaults: Category[] = [
      ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
        id: `cat-inc-${name.replace(/\s+/g, '-').toLowerCase()}`,
        user_id: 'default',
        name,
        category_type: 'income' as const,
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
      })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
        id: `cat-exp-${name.replace(/\s+/g, '-').toLowerCase()}`,
        user_id: 'default',
        name,
        category_type: 'expense' as const,
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
      })),
    ];
    setLocal(CATEGORIES_KEY, defaults);
    return categoryType ? defaults.filter((c) => c.category_type === categoryType) : defaults;
  }

  return categoryType ? local.filter((c) => c.category_type === categoryType) : local;
}

export async function createCategory(name: string, categoryType: 'income' | 'expense'): Promise<Category> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default';
  const newCat: Category = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}`,
    user_id: userId,
    name: name.trim(),
    category_type: categoryType,
    parent_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const local = getLocal<Category>(CATEGORIES_KEY);
  setLocal(CATEGORIES_KEY, [...local, newCat]);

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: newCat.name,
        category_type: categoryType,
      })
      .select()
      .single();
    if (!error && data) return data as Category;
  } catch (err) {
    console.warn('Create category remote error:', err);
  }

  return newCat;
}

// ======================== ACCOUNTS ========================
export async function listAccounts(): Promise<Account[]> {
  const localAccounts = getLocal<Account>(ACCOUNTS_KEY);
  const transactions = await listTransactions();

  let accounts = localAccounts;
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && Array.isArray(data)) {
      accounts = data as Account[];
      setLocal(ACCOUNTS_KEY, accounts);
    }
  } catch (err) {
    console.warn('Fetch accounts remote error:', err);
  }

  // Hitung saldo terkini per rekening (opening_balance + total masuk - total keluar)
  return accounts.map((acc) => {
    const opening = Number(acc.opening_balance) || 0;
    const relatedTx = transactions.filter((t) => t.account_id === acc.id);
    let mutasi = 0;
    for (const t of relatedTx) {
      const amt = Number(t.amount) || 0;
      if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') {
        mutasi += amt;
      } else if (
        t.transaction_type === 'expense' ||
        t.transaction_type === 'transfer_out' ||
        t.transaction_type === 'debt_payment'
      ) {
        mutasi -= amt;
      }
    }
    return {
      ...acc,
      current_balance: opening + mutasi,
    };
  });
}

export async function createAccount(input: {
  name: string;
  account_type: Account['account_type'];
  opening_balance: number;
  opening_date?: string;
  notes?: string;
}): Promise<Account> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default';
  const now = new Date().toISOString();

  const newAcc: Account = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}`,
    user_id: userId,
    name: input.name.trim(),
    account_type: input.account_type,
    opening_balance: Number(input.opening_balance) || 0,
    opening_date: input.opening_date || now.slice(0, 10),
    is_active: true,
    notes: input.notes?.trim() || null,
    created_at: now,
    updated_at: now,
    current_balance: Number(input.opening_balance) || 0,
  };

  const local = getLocal<Account>(ACCOUNTS_KEY);
  setLocal(ACCOUNTS_KEY, [...local, newAcc]);

  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name: newAcc.name,
        account_type: newAcc.account_type,
        opening_balance: newAcc.opening_balance,
        opening_date: newAcc.opening_date,
        notes: newAcc.notes,
      })
      .select()
      .single();
    if (!error && data) {
      const saved = data as Account;
      setLocal(
        ACCOUNTS_KEY,
        local.map((a) => (a.id === newAcc.id ? saved : a)),
      );
      return saved;
    }
  } catch (err) {
    console.warn('Create account remote error:', err);
  }

  return newAcc;
}

export async function updateAccount(
  id: string,
  input: Partial<Pick<Account, 'name' | 'account_type' | 'opening_balance' | 'notes' | 'is_active'>>,
): Promise<Account> {
  const local = getLocal<Account>(ACCOUNTS_KEY);
  const updated = local.map((a) => (a.id === id ? { ...a, ...input, updated_at: new Date().toISOString() } : a));
  setLocal(ACCOUNTS_KEY, updated);

  try {
    await supabase.from('accounts').update(input).eq('id', id);
  } catch (err) {
    console.warn('Update account remote error:', err);
  }

  const found = updated.find((a) => a.id === id);
  if (!found) throw new Error('Rekening tidak ditemukan');
  return found;
}

export async function deleteAccount(id: string): Promise<void> {
  const local = getLocal<Account>(ACCOUNTS_KEY);
  setLocal(
    ACCOUNTS_KEY,
    local.filter((a) => a.id !== id),
  );

  try {
    await supabase.from('accounts').delete().eq('id', id);
  } catch (err) {
    console.warn('Delete account remote error:', err);
  }
}

// ======================== TRANSACTIONS ========================
export async function listTransactions(limit = 100): Promise<Transaction[]> {
  const local = getLocal<Transaction>(TRANSACTIONS_KEY);
  const accounts = getLocal<Account>(ACCOUNTS_KEY);
  const categories = getLocal<Category>(CATEGORIES_KEY);

  let txList = local;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && Array.isArray(data)) {
      txList = data as Transaction[];
      setLocal(TRANSACTIONS_KEY, txList);
    }
  } catch (err) {
    console.warn('Fetch transactions remote error:', err);
  }

  const accMap = new Map(accounts.map((a) => [a.id, a.name]));
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return txList.map((t) => ({
    ...t,
    account_name: accMap.get(t.account_id) || 'Rekening',
    category_name: t.category_id ? catMap.get(t.category_id) || 'Umum' : 'Umum',
  }));
}

export async function createTransaction(input: {
  account_id: string;
  category_id?: string | null;
  transaction_type: Transaction['transaction_type'];
  transaction_date: string;
  amount: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
}): Promise<Transaction> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default';
  const now = new Date().toISOString();

  const newTx: Transaction = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
    user_id: userId,
    account_id: input.account_id,
    category_id: input.category_id || null,
    transaction_type: input.transaction_type,
    transaction_date: input.transaction_date,
    amount: Math.abs(Number(input.amount) || 0),
    description: input.description?.trim() || null,
    reference_type: input.reference_type || null,
    reference_id: input.reference_id || null,
    created_at: now,
  };

  const local = getLocal<Transaction>(TRANSACTIONS_KEY);
  setLocal(TRANSACTIONS_KEY, [newTx, ...local]);

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: newTx.account_id,
        category_id: newTx.category_id,
        transaction_type: newTx.transaction_type,
        transaction_date: newTx.transaction_date,
        amount: newTx.amount,
        description: newTx.description,
        reference_type: newTx.reference_type,
        reference_id: newTx.reference_id,
      })
      .select()
      .single();
    if (!error && data) {
      const saved = data as Transaction;
      setLocal(
        TRANSACTIONS_KEY,
        local.map((t) => (t.id === newTx.id ? saved : t)),
      );
      return saved;
    }
  } catch (err) {
    console.warn('Create transaction remote error:', err);
  }

  return newTx;
}

export async function deleteTransaction(id: string): Promise<void> {
  const local = getLocal<Transaction>(TRANSACTIONS_KEY);
  setLocal(
    TRANSACTIONS_KEY,
    local.filter((t) => t.id !== id),
  );

  try {
    await supabase.from('transactions').delete().eq('id', id);
  } catch (err) {
    console.warn('Delete transaction remote error:', err);
  }
}

// ======================== DEBTS & INSTALLMENTS ========================
export async function listDebts(): Promise<Debt[]> {
  const local = getLocal<Debt>(DEBTS_KEY);

  try {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('status', { ascending: true })
      .order('due_day', { ascending: true });
    if (!error && Array.isArray(data)) {
      setLocal(DEBTS_KEY, data);
      return data as Debt[];
    }
  } catch (err) {
    console.warn('Fetch debts remote error:', err);
  }

  return local;
}

export async function createDebt(input: {
  creditor_name: string;
  debt_type: Debt['debt_type'];
  principal_amount: number;
  outstanding_principal?: number;
  interest_rate?: number;
  monthly_installment: number;
  due_day: number;
  remaining_tenor?: number;
  original_tenor?: number;
  notes?: string;
}): Promise<Debt> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default';
  const now = new Date().toISOString();

  const newDebt: Debt = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `debt-${Date.now()}`,
    user_id: userId,
    creditor_name: input.creditor_name.trim(),
    debt_type: input.debt_type,
    principal_amount: Number(input.principal_amount) || 0,
    outstanding_principal:
      input.outstanding_principal !== undefined
        ? Number(input.outstanding_principal)
        : Number(input.principal_amount) || 0,
    interest_rate: Number(input.interest_rate) || 0,
    interest_type: 'flat',
    start_date: now.slice(0, 10),
    original_tenor: Number(input.original_tenor) || 12,
    remaining_tenor: Number(input.remaining_tenor) || Number(input.original_tenor) || 12,
    monthly_installment: Number(input.monthly_installment) || 0,
    due_day: Math.max(1, Math.min(31, Number(input.due_day) || 1)),
    early_settlement_fee: 0,
    status: 'active',
    notes: input.notes?.trim() || null,
    created_at: now,
    updated_at: now,
  };

  const local = getLocal<Debt>(DEBTS_KEY);
  setLocal(DEBTS_KEY, [...local, newDebt]);

  try {
    const { data, error } = await supabase
      .from('debts')
      .insert({
        user_id: userId,
        creditor_name: newDebt.creditor_name,
        debt_type: newDebt.debt_type,
        principal_amount: newDebt.principal_amount,
        outstanding_principal: newDebt.outstanding_principal,
        interest_rate: newDebt.interest_rate,
        monthly_installment: newDebt.monthly_installment,
        due_day: newDebt.due_day,
        original_tenor: newDebt.original_tenor,
        remaining_tenor: newDebt.remaining_tenor,
        notes: newDebt.notes,
      })
      .select()
      .single();
    if (!error && data) {
      const saved = data as Debt;
      setLocal(
        DEBTS_KEY,
        local.map((d) => (d.id === newDebt.id ? saved : d)),
      );
      return saved;
    }
  } catch (err) {
    console.warn('Create debt remote error:', err);
  }

  return newDebt;
}

export async function recordDebtPayment(input: {
  debt_id: string;
  account_id: string;
  payment_date: string;
  principal_paid: number;
  interest_paid?: number;
  fee_paid?: number;
  notes?: string;
}): Promise<DebtPayment> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id || 'default';
  const now = new Date().toISOString();

  const principal = Number(input.principal_paid) || 0;
  const interest = Number(input.interest_paid) || 0;
  const fee = Number(input.fee_paid) || 0;
  const total = principal + interest + fee;

  if (total <= 0) {
    throw new Error('Total pembayaran harus lebih besar dari 0.');
  }

  const payment: DebtPayment = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
    user_id: userId,
    debt_id: input.debt_id,
    account_id: input.account_id,
    payment_date: input.payment_date,
    principal_paid: principal,
    interest_paid: interest,
    fee_paid: fee,
    total_paid: total,
    notes: input.notes?.trim() || null,
    created_at: now,
  };

  // 1. Simpan debt_payment
  const payments = getLocal<DebtPayment>(PAYMENTS_KEY);
  setLocal(PAYMENTS_KEY, [payment, ...payments]);

  // 2. Potong utang
  const debts = getLocal<Debt>(DEBTS_KEY);
  const targetDebt = debts.find((d) => d.id === input.debt_id);
  if (targetDebt) {
    const newOutstanding = Math.max(0, targetDebt.outstanding_principal - principal);
    const newRemainingTenor = Math.max(0, targetDebt.remaining_tenor - 1);
    const updatedDebt: Debt = {
      ...targetDebt,
      outstanding_principal: newOutstanding,
      remaining_tenor: newRemainingTenor,
      status: newOutstanding === 0 ? 'paid_off' : targetDebt.status,
      updated_at: now,
    };
    setLocal(
      DEBTS_KEY,
      debts.map((d) => (d.id === targetDebt.id ? updatedDebt : d)),
    );

    try {
      await supabase
        .from('debts')
        .update({
          outstanding_principal: newOutstanding,
          remaining_tenor: newRemainingTenor,
          status: updatedDebt.status,
        })
        .eq('id', targetDebt.id);
    } catch {}
  }

  // 3. Catat transaksi pengeluaran (agar saldo rekening berkurang otomatis)
  await createTransaction({
    account_id: input.account_id,
    category_id: null,
    transaction_type: 'debt_payment',
    transaction_date: input.payment_date,
    amount: total,
    description: `Pembayaran cicilan utang: ${targetDebt?.creditor_name || 'Utang'}`,
    reference_type: 'debt_payment',
    reference_id: payment.id,
  });

  try {
    await supabase.from('debt_payments').insert({
      user_id: userId,
      debt_id: payment.debt_id,
      account_id: payment.account_id,
      payment_date: payment.payment_date,
      principal_paid: payment.principal_paid,
      interest_paid: payment.interest_paid,
      fee_paid: payment.fee_paid,
      total_paid: payment.total_paid,
      notes: payment.notes,
    });
  } catch (err) {
    console.warn('Record debt payment remote error:', err);
  }

  return payment;
}

export async function deleteDebt(id: string): Promise<void> {
  const local = getLocal<Debt>(DEBTS_KEY);
  setLocal(
    DEBTS_KEY,
    local.filter((d) => d.id !== id),
  );

  try {
    await supabase.from('debts').delete().eq('id', id);
  } catch (err) {
    console.warn('Delete debt remote error:', err);
  }
}

// ======================== DASHBOARD SUMMARY ========================
export async function getFinanceSummary(): Promise<FinanceSummary> {
  const accounts = await listAccounts();
  const transactions = await listTransactions(300);
  const debts = await listDebts();

  const totalBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);

  // Periode bulan berjalan format YYYY-MM
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  for (const t of transactions) {
    if (t.transaction_date && t.transaction_date.startsWith(currentMonthPrefix)) {
      const amt = Number(t.amount) || 0;
      if (t.transaction_type === 'income') {
        monthlyIncome += amt;
      } else if (t.transaction_type === 'expense' || t.transaction_type === 'debt_payment') {
        monthlyExpense += amt;
      }
    }
  }

  const activeDebts = debts.filter((d) => d.status === 'active');
  const monthlyDebtObligation = activeDebts.reduce((sum, d) => sum + (Number(d.monthly_installment) || 0), 0);
  const totalOutstandingDebt = activeDebts.reduce((sum, d) => sum + (Number(d.outstanding_principal) || 0), 0);
  const remainingSafeMoney = totalBalance - monthlyDebtObligation;

  // 1. Histori Arus Kas (6 Bulan Terakhir)
  const cashFlowHistory = calculateCashFlowHistory(transactions, now);

  // 2. Komposisi Pengeluaran Bulan Berjalan per Kategori
  const categoryBreakdown = calculateCategoryBreakdown(transactions, currentMonthPrefix);

  // 3. Proyeksi Keuangan Masa Depan (12 Bulan ke Depan)
  const currentMonthDebtTx = transactions
    .filter((t) => t.transaction_type === 'debt_payment' && t.transaction_date.startsWith(currentMonthPrefix))
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const projections = calculateFinancialProjections(
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    activeDebts,
    currentMonthDebtTx,
    now
  );

  // 4. Analisis Kesehatan Finansial & Kesiapan Investasi CFP
  const healthAnalysis = calculateCFPHealthAnalysis(
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyDebtObligation,
    totalOutstandingDebt,
    activeDebts.length
  );

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyDebtObligation,
    remainingSafeMoney,
    totalOutstandingDebt,
    accounts,
    recentTransactions: transactions.slice(0, 10),
    upcomingDebts: activeDebts.sort((a, b) => a.due_day - b.due_day),
    cashFlowHistory,
    categoryBreakdown,
    projections,
    healthAnalysis,
  };
}
