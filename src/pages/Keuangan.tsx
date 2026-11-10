import { useEffect, useState, useMemo } from 'react';
import {
  getFinanceSummary,
  listAccounts,
  createAccount,
  deleteAccount,
  listCategories,
  createCategory,
  listTransactions,
  createTransaction,
  deleteTransaction,
  listDebts,
  createDebt,
  recordDebtPayment,
  deleteDebt,
  formatRupiah,
} from '../services/finance';
import type {
  Account,
  Category,
  Transaction,
  Debt,
  FinanceSummary,
  AccountType,
  DebtType,
} from '../types/finance';
import {
  ACCOUNT_TYPE_LABELS,
  DEBT_TYPE_LABELS,
} from '../types/finance';
import { todayJakartaISO, formatJakarta } from '../lib/time';
import { useToast } from '../hooks/useToast';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  SecondaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from '../components/ui';

type Tab = 'dashboard' | 'transactions' | 'accounts' | 'debts';

export default function KeuanganPage() {
  const { push } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data state
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Forms & Modals state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayJakartaISO());
  const [txDesc, setTxDesc] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Category new modal
  const [newCatName, setNewCatName] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);

  // Account Form
  const [showAccModal, setShowAccModal] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accOpening, setAccOpening] = useState('');
  const [accNotes, setAccNotes] = useState('');
  const [accSubmitting, setAccSubmitting] = useState(false);

  // Debt Form
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('bank_loan');
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [debtOutstanding, setDebtOutstanding] = useState('');
  const [debtMonthly, setDebtMonthly] = useState('');
  const [debtDueDay, setDebtDueDay] = useState('1');
  const [debtTenor, setDebtTenor] = useState('12');
  const [debtNotes, setDebtNotes] = useState('');
  const [debtSubmitting, setDebtSubmitting] = useState(false);

  // Debt Payment Form
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [payAccountId, setPayAccountId] = useState('');
  const [payDate, setPayDate] = useState(todayJakartaISO());
  const [payPrincipal, setPayPrincipal] = useState('');
  const [payInterest, setPayInterest] = useState('0');
  const [payFee, setPayFee] = useState('0');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Deletion confirm
  const [deletingItem, setDeletingItem] = useState<{
    type: 'transaction' | 'account' | 'debt';
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter Transactions
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumData, accData, catData, txData, debtData] = await Promise.all([
        getFinanceSummary(),
        listAccounts(),
        listCategories(),
        listTransactions(200),
        listDebts(),
      ]);
      setSummary(sumData);
      setAccounts(accData);
      setCategories(catData);
      setTransactions(txData);
      setDebts(debtData);

      if (accData.length > 0 && !txAccountId) {
        setTxAccountId(accData[0].id);
        setPayAccountId(accData[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter categories by selected txType
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.category_type === txType);
  }, [categories, txType]);

  // Set default category when txType or categories change
  useEffect(() => {
    if (filteredCategories.length > 0) {
      setTxCategoryId(filteredCategories[0].id);
    } else {
      setTxCategoryId('');
    }
  }, [txType, categories]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAccountId) {
      push('Pilih rekening sumber atau tujuan terlebih dahulu.', 'error');
      return;
    }
    const amt = Number(txAmount);
    if (!amt || amt <= 0) {
      push('Nominal transaksi harus lebih dari 0.', 'error');
      return;
    }

    setTxSubmitting(true);
    try {
      await createTransaction({
        account_id: txAccountId,
        category_id: txCategoryId || null,
        transaction_type: txType,
        transaction_date: txDate,
        amount: amt,
        description: txDesc,
      });
      push(`${txType === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat!`);
      setShowTxModal(false);
      setTxAmount('');
      setTxDesc('');
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat transaksi', 'error');
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await createCategory(newCatName.trim(), txType);
      setCategories((prev) => [...prev, created]);
      setTxCategoryId(created.id);
      setNewCatName('');
      setShowCatInput(false);
      push('Kategori baru ditambahkan!');
    } catch (err) {
      push('Gagal membuat kategori', 'error');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) {
      push('Nama rekening wajib diisi.', 'error');
      return;
    }

    setAccSubmitting(true);
    try {
      await createAccount({
        name: accName.trim(),
        account_type: accType,
        opening_balance: Number(accOpening) || 0,
        notes: accNotes,
      });
      push('Rekening baru berhasil dibuat!');
      setShowAccModal(false);
      setAccName('');
      setAccOpening('');
      setAccNotes('');
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal membuat rekening', 'error');
    } finally {
      setAccSubmitting(false);
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtCreditor.trim()) {
      push('Nama kreditur / instansi utang wajib diisi.', 'error');
      return;
    }
    const princ = Number(debtPrincipal);
    if (!princ || princ <= 0) {
      push('Jumlah pinjaman awal harus lebih dari 0.', 'error');
      return;
    }

    setDebtSubmitting(true);
    try {
      await createDebt({
        creditor_name: debtCreditor.trim(),
        debt_type: debtType,
        principal_amount: princ,
        outstanding_principal: debtOutstanding ? Number(debtOutstanding) : princ,
        monthly_installment: Number(debtMonthly) || 0,
        due_day: Number(debtDueDay) || 1,
        remaining_tenor: Number(debtTenor) || 12,
        original_tenor: Number(debtTenor) || 12,
        notes: debtNotes,
      });
      push('Data utang berhasil dicatat!');
      setShowDebtModal(false);
      setDebtCreditor('');
      setDebtPrincipal('');
      setDebtOutstanding('');
      setDebtMonthly('');
      setDebtNotes('');
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat utang', 'error');
    } finally {
      setDebtSubmitting(false);
    }
  };

  const handlePayDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || !payAccountId) {
      push('Data utang atau rekening sumber tidak valid.', 'error');
      return;
    }
    const princ = Number(payPrincipal) || 0;
    const interest = Number(payInterest) || 0;
    const fee = Number(payFee) || 0;
    if (princ + interest + fee <= 0) {
      push('Total pembayaran harus lebih besar dari 0.', 'error');
      return;
    }

    setPaySubmitting(true);
    try {
      await recordDebtPayment({
        debt_id: payingDebt.id,
        account_id: payAccountId,
        payment_date: payDate,
        principal_paid: princ,
        interest_paid: interest,
        fee_paid: fee,
        notes: payNotes,
      });
      push(`Cicilan ${payingDebt.creditor_name} berhasil dibayar & saldo rekening terpotong!`);
      setPayingDebt(null);
      setPayPrincipal('');
      setPayInterest('0');
      setPayFee('0');
      setPayNotes('');
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat pembayaran cicilan', 'error');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      if (deletingItem.type === 'transaction') {
        await deleteTransaction(deletingItem.id);
        push('Transaksi berhasil dihapus');
      } else if (deletingItem.type === 'account') {
        await deleteAccount(deletingItem.id);
        push('Rekening berhasil dihapus');
      } else if (deletingItem.type === 'debt') {
        await deleteDebt(deletingItem.id);
        push('Catatan utang berhasil dihapus');
      }
      setDeletingItem(null);
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal menghapus', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !txSearch.trim() ||
        (t.description && t.description.toLowerCase().includes(txSearch.toLowerCase())) ||
        (t.account_name && t.account_name.toLowerCase().includes(txSearch.toLowerCase())) ||
        (t.category_name && t.category_name.toLowerCase().includes(txSearch.toLowerCase()));

      const matchType = txFilterType === 'all' || t.transaction_type === txFilterType;
      return matchSearch && matchType;
    });
  }, [transactions, txSearch, txFilterType]);

  if (loading) return <Loading text="Memuat RuangUang (Keuangan)..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">RuangUang</h1>
            <Badge>Kelola Keuangan</Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Pencatatan kas, mutasi rekening, dan pemantauan cicilan utang keluarga.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setTxType('expense');
              setShowTxModal(true);
            }}
            className="text-xs py-2 bg-rose-600 hover:bg-rose-700"
          >
            - Catat Pengeluaran
          </Button>
          <Button
            onClick={() => {
              setTxType('income');
              setShowTxModal(true);
            }}
            className="text-xs py-2 bg-emerald-600 hover:bg-emerald-700"
          >
            + Catat Pemasukan
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'dashboard'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'transactions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transaksi ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'accounts'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rekening & Kas ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === 'debts'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Utang & Cicilan ({debts.filter((d) => d.status === 'active').length})
        </button>
      </div>

      {/* TAB 1: RINGKASAN (DASHBOARD) */}
      {activeTab === 'dashboard' && summary && (
        <div className="space-y-5">
          {/* Main 6 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-md">
              <span className="text-[11px] font-medium text-slate-300">Total Saldo Seluruh Rekening</span>
              <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-emerald-400">
                {formatRupiah(summary.totalBalance)}
              </p>
              <span className="mt-1 block text-[10px] text-slate-400">
                Dari {summary.accounts.length} rekening aktif
              </span>
            </Card>

            <Card>
              <span className="text-[11px] font-medium text-slate-500">Pemasukan Bulan Ini</span>
              <p className="mt-1 text-base sm:text-lg font-bold text-emerald-600">
                {formatRupiah(summary.monthlyIncome)}
              </p>
              <span className="mt-1 block text-[10px] text-slate-400">Total uang masuk</span>
            </Card>

            <Card>
              <span className="text-[11px] font-medium text-slate-500">Pengeluaran Bulan Ini</span>
              <p className="mt-1 text-base sm:text-lg font-bold text-rose-600">
                {formatRupiah(summary.monthlyExpense)}
              </p>
              <span className="mt-1 block text-[10px] text-slate-400">Termasuk cicilan utang</span>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <span className="text-[11px] font-medium text-amber-800">Kewajiban Cicilan / Bulan</span>
              <p className="mt-1 text-base sm:text-lg font-bold text-amber-900">
                {formatRupiah(summary.monthlyDebtObligation)}
              </p>
              <span className="mt-1 block text-[10px] text-amber-700">Wajib dibayar tiap bulan</span>
            </Card>

            <Card className={summary.remainingSafeMoney >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}>
              <span className={`text-[11px] font-medium ${summary.remainingSafeMoney >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                Sisa Uang Aman
              </span>
              <p className={`mt-1 text-base sm:text-lg font-bold ${summary.remainingSafeMoney >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatRupiah(summary.remainingSafeMoney)}
              </p>
              <span className="mt-1 block text-[10px] text-slate-500">Saldo dikurangi beban cicilan</span>
            </Card>

            <Card className="border-rose-200 bg-rose-50/30">
              <span className="text-[11px] font-medium text-rose-800">Total Sisa Pokok Utang</span>
              <p className="mt-1 text-base sm:text-lg font-bold text-rose-900">
                {formatRupiah(summary.totalOutstandingDebt)}
              </p>
              <span className="mt-1 block text-[10px] text-rose-700">Total sisa kewajiban</span>
            </Card>
          </div>

          {/* Quick Account Balances */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900">Saldo per Rekening</h2>
              <button
                onClick={() => setActiveTab('accounts')}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Kelola Rekening →
              </button>
            </div>
            {accounts.length === 0 ? (
              <EmptyState
                title="Belum ada rekening"
                desc="Tambahkan rekening pertama Anda (Tunai/Bank/E-wallet) untuk mulai mencatat."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {accounts.map((acc) => (
                  <Card key={acc.id} className="p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {ACCOUNT_TYPE_LABELS[acc.account_type]}
                    </span>
                    <p className="font-semibold text-slate-800 text-sm truncate">{acc.name}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatRupiah(acc.current_balance)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Debts and Recent Transactions side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tagihan Cicilan Terdekat */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kewajiban Cicilan Utang
                </span>
                <button
                  onClick={() => setActiveTab('debts')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Lihat Semua
                </button>
              </div>
              {summary.upcomingDebts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Tidak ada utang atau semua cicilan sudah lunas! 🎉
                </p>
              ) : (
                <div className="space-y-2.5">
                  {summary.upcomingDebts.slice(0, 4).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{d.creditor_name}</p>
                        <p className="text-[10px] text-slate-500">
                          Jatuh tempo: Tgl {d.due_day} • Sisa {d.remaining_tenor} bln
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-rose-600">
                          {formatRupiah(d.monthly_installment)}/bln
                        </p>
                        <button
                          onClick={() => {
                            setPayingDebt(d);
                            setPayPrincipal(String(d.monthly_installment));
                          }}
                          className="mt-0.5 text-[10px] font-semibold text-indigo-600 hover:underline"
                        >
                          Bayar Cicilan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Transaksi Terakhir */}
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Transaksi Terakhir
                </span>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Semua Transaksi
                </button>
              </div>
              {summary.recentTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Belum ada transaksi tercatat.</p>
              ) : (
                <div className="space-y-2">
                  {summary.recentTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-slate-800 truncate">
                          {t.description || t.category_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatJakarta(t.transaction_date)} • {t.account_name}
                        </p>
                      </div>
                      <span
                        className={`font-bold whitespace-nowrap ${
                          t.transaction_type === 'income'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {t.transaction_type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSAKSI */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <TextInput
                placeholder="Cari transaksi..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="text-xs py-1.5 w-full sm:w-60"
              />
              <SelectInput
                value={txFilterType}
                onChange={(e) => setTxFilterType(e.target.value)}
                className="text-xs py-1.5 w-36"
              >
                <option value="all">Semua Jenis</option>
                <option value="income">Pemasukan (+)</option>
                <option value="expense">Pengeluaran (-)</option>
                <option value="debt_payment">Cicilan Utang (-)</option>
              </SelectInput>
            </div>
            <Button
              onClick={() => {
                setTxType('expense');
                setShowTxModal(true);
              }}
              className="text-xs py-2 self-end sm:self-auto"
            >
              + Catat Transaksi Baru
            </Button>
          </div>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              title="Tidak ada transaksi yang cocok"
              desc="Mulai catat pemasukan atau pengeluaran Anda dengan tombol di atas."
            />
          ) : (
            <Card className="overflow-hidden p-0 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 uppercase text-[10px] font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Deskripsi / Kategori</th>
                      <th className="py-2.5 px-3">Rekening</th>
                      <th className="py-2.5 px-3 text-right">Nominal</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                          {formatJakarta(t.transaction_date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800">{t.description || '-'}</p>
                          <span className="text-[10px] text-slate-400">{t.category_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {t.account_name}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                            t.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.transaction_type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() =>
                              setDeletingItem({
                                type: 'transaction',
                                id: t.id,
                                title: `transaksi ${t.description || t.category_name || ''} (${formatRupiah(t.amount)})`,
                              })
                            }
                            className="text-red-500 hover:text-red-700 font-medium text-[11px]"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: REKENING & KAS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Kelola dompet tunai, rekening bank, tabungan, dan dompet digital (e-wallet).
            </p>
            <Button onClick={() => setShowAccModal(true)} className="text-xs py-2">
              + Tambah Rekening
            </Button>
          </div>

          {accounts.length === 0 ? (
            <EmptyState
              title="Belum ada rekening"
              desc="Tambahkan rekening pertama Anda seperti 'BCA', 'Dompet Tunai', atau 'GoPay'."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {accounts.map((acc) => (
                <Card key={acc.id} className="relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {ACCOUNT_TYPE_LABELS[acc.account_type]}
                      </span>
                      <button
                        onClick={() =>
                          setDeletingItem({
                            type: 'account',
                            id: acc.id,
                            title: `rekening ${acc.name}`,
                          })
                        }
                        className="text-red-400 hover:text-red-600 text-xs"
                        title="Hapus Rekening"
                      >
                        ×
                      </button>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{acc.name}</h3>
                    {acc.notes && <p className="text-xs text-slate-400 mt-0.5">{acc.notes}</p>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">Saldo Terkini</span>
                      <p className="text-base font-bold text-slate-900">
                        {formatRupiah(acc.current_balance)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Awal: {formatRupiah(acc.opening_balance)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UTANG & CICILAN */}
      {activeTab === 'debts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Pantau seluruh kewajiban utang, sisa pokok, tenor, dan jadwal pembayaran cicilan.
            </p>
            <Button onClick={() => setShowDebtModal(true)} className="text-xs py-2 bg-rose-600 hover:bg-rose-700">
              + Catat Utang Baru
            </Button>
          </div>

          {debts.length === 0 ? (
            <EmptyState
              title="Tidak ada utang tercatat"
              desc="Bagus! Tidak ada kewajiban cicilan utang. Jika ada pinjaman atau cicilan barang, catat di sini."
            />
          ) : (
            <div className="space-y-3">
              {debts.map((d) => {
                const paidOffPercent =
                  d.principal_amount > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round(
                            ((d.principal_amount - d.outstanding_principal) / d.principal_amount) * 100,
                          ),
                        ),
                      )
                    : 100;

                return (
                  <Card key={d.id} className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {d.creditor_name}
                          </h3>
                          <Badge>{DEBT_TYPE_LABELS[d.debt_type] || d.debt_type}</Badge>
                          {d.status === 'paid_off' && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              LUNAS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Jatuh tempo setiap tanggal <strong>{d.due_day}</strong> • Sisa tenor: {d.remaining_tenor} bln
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {d.status === 'active' && (
                          <Button
                            onClick={() => {
                              setPayingDebt(d);
                              setPayPrincipal(String(d.monthly_installment));
                            }}
                            className="text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700"
                          >
                            Bayar Cicilan
                          </Button>
                        )}
                        <button
                          onClick={() =>
                            setDeletingItem({
                              type: 'debt',
                              id: d.id,
                              title: `kewajiban utang ${d.creditor_name}`,
                            })
                          }
                          className="text-xs text-red-500 hover:text-red-700 p-1"
                          title="Hapus data utang"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar Pelunasan */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">
                          Sisa Pokok: <strong>{formatRupiah(d.outstanding_principal)}</strong>
                        </span>
                        <span className="font-bold text-indigo-600">{paidOffPercent}% Lunas</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${paidOffPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Pinjaman Awal</span>
                        <span className="font-semibold text-slate-700">{formatRupiah(d.principal_amount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Cicilan / Bulan</span>
                        <span className="font-semibold text-rose-600">{formatRupiah(d.monthly_installment)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sisa Tenor</span>
                        <span className="font-semibold text-slate-700">{d.remaining_tenor} Bulan</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Catatan</span>
                        <span className="font-medium text-slate-600 truncate block">{d.notes || '-'}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CATAT TRANSAKSI */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">
                Catat {txType === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
              </h3>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 rounded-lg font-semibold text-xs transition ${
                    txType === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  - Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 rounded-lg font-semibold text-xs transition ${
                    txType === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + Pemasukan
                </button>
              </div>

              <Field label="Nominal (Rp)">
                <TextInput
                  type="number"
                  placeholder="Contoh: 50000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  min="1"
                  required
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Rekening / Kas">
                  <SelectInput
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatRupiah(a.current_balance)})
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Tanggal">
                  <TextInput
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field label="Kategori">
                <div className="flex gap-1.5">
                  <SelectInput
                    value={txCategoryId}
                    onChange={(e) => setTxCategoryId(e.target.value)}
                    className="flex-1"
                  >
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </SelectInput>
                  <button
                    type="button"
                    onClick={() => setShowCatInput(!showCatInput)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50"
                    title="Tambah kategori baru"
                  >
                    + Baru
                  </button>
                </div>
              </Field>

              {showCatInput && (
                <div className="flex gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <TextInput
                    placeholder="Nama kategori baru..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="text-xs py-1"
                  />
                  <Button type="button" onClick={handleAddCategory} className="text-xs py-1 px-3">
                    Simpan
                  </Button>
                </div>
              )}

              <Field label="Keterangan / Catatan">
                <TextInput
                  placeholder="Contoh: Belanja mingguan di pasar"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="flex-1"
                  disabled={txSubmitting}
                >
                  Batal
                </SecondaryButton>
                <Button
                  type="submit"
                  className={`flex-1 ${txType === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  disabled={txSubmitting}
                >
                  {txSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH REKENING */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Tambah Rekening / Kas</h3>
              <button onClick={() => setShowAccModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <Field label="Nama Rekening / Dompet">
                <TextInput
                  placeholder="Contoh: BCA Utama, Dompet Tunai, GoPay"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  required
                  autoFocus
                />
              </Field>

              <Field label="Jenis Rekening">
                <SelectInput
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as AccountType)}
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Saldo Awal (Rp)">
                <TextInput
                  type="number"
                  placeholder="0"
                  value={accOpening}
                  onChange={(e) => setAccOpening(e.target.value)}
                />
              </Field>

              <Field label="Catatan / Keterangan (Opsional)">
                <TextInput
                  placeholder="Contoh: Rekening payroll gaji bulanan"
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setShowAccModal(false)}
                  className="flex-1"
                  disabled={accSubmitting}
                >
                  Batal
                </SecondaryButton>
                <Button type="submit" className="flex-1" disabled={accSubmitting}>
                  {accSubmitting ? 'Menyimpan...' : 'Simpan Rekening'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH UTANG */}
      {showDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">Catat Kewajiban Utang Baru</h3>
              <button onClick={() => setShowDebtModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3">
              <Field label="Nama Kreditur / Utang">
                <TextInput
                  placeholder="Contoh: KPR BTN, Cicilan Laptop BCA, dll"
                  value={debtCreditor}
                  onChange={(e) => setDebtCreditor(e.target.value)}
                  required
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Jenis Utang">
                  <SelectInput
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value as DebtType)}
                  >
                    {Object.entries(DEBT_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Tgl Jatuh Tempo (1-31)">
                  <TextInput
                    type="number"
                    min="1"
                    max="31"
                    value={debtDueDay}
                    onChange={(e) => setDebtDueDay(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Pinjaman Awal (Rp)">
                  <TextInput
                    type="number"
                    placeholder="10000000"
                    value={debtPrincipal}
                    onChange={(e) => setDebtPrincipal(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Sisa Pokok Saat Ini (Rp)">
                  <TextInput
                    type="number"
                    placeholder="Jika kosong, sama dengan awal"
                    value={debtOutstanding}
                    onChange={(e) => setDebtOutstanding(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Cicilan Bulanan (Rp)">
                  <TextInput
                    type="number"
                    placeholder="Contoh: 850000"
                    value={debtMonthly}
                    onChange={(e) => setDebtMonthly(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Sisa Tenor (Bulan)">
                  <TextInput
                    type="number"
                    value={debtTenor}
                    onChange={(e) => setDebtTenor(e.target.value)}
                    min="1"
                    required
                  />
                </Field>
              </div>

              <Field label="Catatan Tambahan (Opsional)">
                <TextArea
                  rows={2}
                  placeholder="Contoh: No rekening transfer cicilan atau virtual account"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setShowDebtModal(false)}
                  className="flex-1"
                  disabled={debtSubmitting}
                >
                  Batal
                </SecondaryButton>
                <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700" disabled={debtSubmitting}>
                  {debtSubmitting ? 'Menyimpan...' : 'Simpan Utang'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BAYAR CICILAN UTANG */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Bayar Cicilan Utang</h3>
                <p className="text-xs text-slate-500">{payingDebt.creditor_name}</p>
              </div>
              <button onClick={() => setPayingDebt(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handlePayDebtSubmit} className="space-y-3">
              <Field label="Rekening Sumber Dana">
                <SelectInput
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: {formatRupiah(a.current_balance)})
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Tanggal Bayar">
                  <TextInput
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Pembayaran Pokok (Rp)">
                  <TextInput
                    type="number"
                    value={payPrincipal}
                    onChange={(e) => setPayPrincipal(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Bunga (Opsional)">
                  <TextInput
                    type="number"
                    value={payInterest}
                    onChange={(e) => setPayInterest(e.target.value)}
                  />
                </Field>

                <Field label="Biaya Admin (Opsional)">
                  <TextInput
                    type="number"
                    value={payFee}
                    onChange={(e) => setPayFee(e.target.value)}
                  />
                </Field>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-600">Total Potong Saldo:</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatRupiah(
                    (Number(payPrincipal) || 0) + (Number(payInterest) || 0) + (Number(payFee) || 0),
                  )}
                </span>
              </div>

              <Field label="Catatan Pembayaran">
                <TextInput
                  placeholder="Contoh: Cicilan ke-5 bulan ini"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="flex-1"
                  disabled={paySubmitting}
                >
                  Batal
                </SecondaryButton>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={paySubmitting}>
                  {paySubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deletingItem && (
        <ConfirmDialog
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus ${deletingItem.title}? Data yang sudah dihapus tidak dapat dikembalikan.`}
          confirmLabel="Hapus Sekarang"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
