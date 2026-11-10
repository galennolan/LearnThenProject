import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
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

type Tab = 'dashboard' | 'planner' | 'transactions' | 'accounts' | 'debts';

const PIE_COLORS = [
  '#4f46e5', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#64748b', // slate
  '#14b8a6', // teal
  '#eab308', // yellow
];

export default function KeuanganPage() {
  const { push } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Projection range selection (3, 6, 12 months)
  const [projectionRange, setProjectionRange] = useState<3 | 6 | 12>(6);

  // User custom monthly investment simulator
  const [customInvestAmount, setCustomInvestAmount] = useState<number | null>(null);

  // Data state
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Separate Modals for Pengeluaran and Pemasukan
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);

  // Transaction form states
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

  // Selected account object for live cash balance preview
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === txAccountId) || accounts[0] || null;
  }, [accounts, txAccountId]);

  const parsedAmount = Number(txAmount) || 0;
  const currentAccBal = Number(selectedAccount?.current_balance) || 0;
  const simulatedExpenseBal = currentAccBal - parsedAmount;
  const simulatedIncomeBal = currentAccBal + parsedAmount;

  // Open modal helpers with complete field separation
  const openExpenseModal = () => {
    setTxType('expense');
    setTxAmount('');
    setTxDesc('');
    setTxDate(todayJakartaISO());
    if (accounts.length > 0 && !txAccountId) {
      setTxAccountId(accounts[0].id);
    }
    setShowExpenseModal(true);
    setShowIncomeModal(false);
  };

  const openIncomeModal = () => {
    setTxType('income');
    setTxAmount('');
    setTxDesc('');
    setTxDate(todayJakartaISO());
    if (accounts.length > 0 && !txAccountId) {
      setTxAccountId(accounts[0].id);
    }
    setShowIncomeModal(true);
    setShowExpenseModal(false);
  };

  const quickAddAmount = (val: number) => {
    const cur = Number(txAmount) || 0;
    setTxAmount(String(cur + val));
  };

  const handleCreateTransaction = async (e: React.FormEvent, type: 'income' | 'expense') => {
    e.preventDefault();
    if (!txAccountId) {
      push(type === 'expense' ? 'Pilih rekening sumber uang keluar terlebih dahulu.' : 'Pilih rekening tujuan uang masuk terlebih dahulu.', 'error');
      return;
    }
    const amt = Number(txAmount);
    if (!amt || amt <= 0) {
      push('Nominal uang harus lebih dari 0.', 'error');
      return;
    }

    setTxSubmitting(true);
    try {
      await createTransaction({
        account_id: txAccountId,
        category_id: txCategoryId || null,
        transaction_type: type,
        transaction_date: txDate,
        amount: amt,
        description: txDesc,
      });
      push(`${type === 'income' ? 'Pemasukan uang' : 'Pengeluaran uang'} berhasil dicatat!`);
      setShowExpenseModal(false);
      setShowIncomeModal(false);
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
    const monthly = Number(debtMonthly);
    if (!monthly || monthly <= 0) {
      push('Nominal cicilan bulanan harus lebih dari 0.', 'error');
      return;
    }
    const tenor = parseInt(debtTenor, 10);
    if (!tenor || tenor <= 0) {
      push('Sisa tenor bulan harus minimal 1.', 'error');
      return;
    }
    const dueDay = parseInt(debtDueDay, 10);
    if (!dueDay || dueDay < 1 || dueDay > 31) {
      push('Tanggal jatuh tempo harus di antara 1 - 31.', 'error');
      return;
    }

    const outstanding = debtOutstanding ? Number(debtOutstanding) : princ;

    setDebtSubmitting(true);
    try {
      await createDebt({
        creditor_name: debtCreditor.trim(),
        debt_type: debtType,
        principal_amount: princ,
        outstanding_principal: outstanding,
        monthly_installment: monthly,
        due_day: dueDay,
        remaining_tenor: tenor,
        notes: debtNotes,
      });
      push('Kewajiban utang baru berhasil dicatat!');
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
    if (!payingDebt) return;
    if (!payAccountId) {
      push('Pilih rekening untuk pembayaran cicilan.', 'error');
      return;
    }
    const princ = Number(payPrincipal);
    if (!princ || princ <= 0) {
      push('Nominal pembayaran pokok harus lebih dari 0.', 'error');
      return;
    }

    setPaySubmitting(true);
    try {
      await recordDebtPayment({
        debt_id: payingDebt.id,
        account_id: payAccountId,
        payment_date: payDate,
        principal_paid: princ,
        interest_paid: Number(payInterest) || 0,
        fee_paid: Number(payFee) || 0,
        notes: payNotes,
      });
      push('Pembayaran cicilan berhasil dicatat dan memotong saldo rekening!');
      setPayingDebt(null);
      setPayPrincipal('');
      setPayInterest('0');
      setPayFee('0');
      setPayNotes('');
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal memproses pembayaran cicilan', 'error');
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
        push('Data utang berhasil dihapus');
      }
      setDeletingItem(null);
      await loadData();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal menghapus data', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered transactions for Tab 2
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = txSearch.toLowerCase();
      const matchSearch =
        !txSearch ||
        (t.description?.toLowerCase() || '').includes(q) ||
        (t.category_name?.toLowerCase() || '').includes(q) ||
        (t.account_name?.toLowerCase() || '').includes(q);

      const matchType = txFilterType === 'all' || t.transaction_type === txFilterType;
      return matchSearch && matchType;
    });
  }, [transactions, txSearch, txFilterType]);

  const incomeTxCount = transactions.filter((t) => t.transaction_type === 'income').length;
  const expenseTxCount = transactions.filter((t) => t.transaction_type === 'expense').length;
  const debtTxCount = transactions.filter((t) => t.transaction_type === 'debt_payment').length;

  if (loading) return <Loading text="Memuat RuangUang & Analisis Keuangan..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const health = summary?.healthAnalysis;
  const currentProjections = (summary?.projections || []).slice(0, projectionRange);

  const activeSimAmount =
    customInvestAmount !== null
      ? customInvestAmount
      : (health?.investmentReadiness?.recommendedMonthlyAmount || 250000);

  const calculateCustomSimulation = (years: number, monthlyPmt: number) => {
    const r = 0.07 / 12; // 7% annual rate
    const n = years * 12;
    const fv = monthlyPmt > 0 ? monthlyPmt * ((Math.pow(1 + r, n) - 1) / r) : 0;
    const totalContributed = monthlyPmt * n;
    return {
      years,
      totalContributed: Math.round(totalContributed),
      estimatedValue: Math.round(fv),
      estimatedProfit: Math.round(fv - totalContributed),
    };
  };

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
            onClick={openExpenseModal}
            className="text-xs py-2 bg-rose-600 hover:bg-rose-700 shadow-xs"
          >
            - Catat Pengeluaran
          </Button>
          <Button
            onClick={openIncomeModal}
            className="text-xs py-2 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
          >
            + Catat Pemasukan
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'planner'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Analisis & Grafik</span>
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
            CFP
          </span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'transactions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transaksi ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'accounts'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rekening & Kas ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
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

          {/* CFP Planner Quick Banner */}
          {health && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg shadow-sm">
                  {health.healthScore}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Financial Health Score</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${health.statusColor}`}>
                      {health.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    DSR: <strong>{health.dsrPercent}%</strong> • Dana Darurat: <strong>{health.emergencyFundMonths} bln</strong> • Kesiapan Investasi: <strong className={health.investmentReadiness?.readinessColor === 'emerald' ? 'text-emerald-700' : health.investmentReadiness?.readinessColor === 'amber' ? 'text-amber-700' : 'text-rose-700'}>{health.investmentReadiness?.readinessStatus || 'Evaluasi'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('planner')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 self-end sm:self-auto"
              >
                Buka Analisis & Grafik Lengkap →
              </button>
            </div>
          )}

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

      {/* TAB: ANALISIS & GRAFIK (FINANCIAL PLANNER ENGINE) */}
      {activeTab === 'planner' && summary && health && (
        <div className="space-y-6">
          {/* Header Card: CFP Score & Diagnosis */}
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide border border-indigo-400/30">
                    CFP Advisory Engine
                  </span>
                  <span className="text-xs text-slate-400">Kesehatan Finansial Keluarga</span>
                </div>
                <h2 className="text-xl font-bold text-white">Financial Health Score</h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Evaluasi otomatis berdasarkan rasio utang aman (DSR), ketahanan dana darurat,
                  laju tabungan, dan kekayaan bersih riil Anda.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm self-start md:self-auto">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor</span>
                  <span className="text-3xl font-black text-indigo-400">{health.healthScore}</span>
                  <span className="text-[10px] text-slate-400 block">/ 100</span>
                </div>
                <div className="border-l border-white/10 pl-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-1 rounded-md border ${health.statusColor}`}>
                    {health.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Pillars of Financial Ratios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Debt Service (DSR)
                </span>
                <p className={`text-base font-bold mt-0.5 ${health.dsrPercent > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {health.dsrPercent}%
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {health.dsrPercent <= 30 ? '✓ Sangat Aman (<30%)' : '⚠ Di atas batas aman (>30%)'}
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Dana Darurat
                </span>
                <p className={`text-base font-bold mt-0.5 ${health.emergencyFundMonths >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {health.emergencyFundMonths} Bulan
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {health.emergencyFundMonths >= 6 ? '✓ Sangat Kokoh (≥6 bln)' : health.emergencyFundMonths >= 3 ? '✓ Cukup (3-6 bln)' : '⚠ Butuh Ditingkatkan (<3 bln)'}
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Savings Rate
                </span>
                <p className={`text-base font-bold mt-0.5 ${health.savingsRatePercent >= 20 ? 'text-emerald-400' : health.savingsRatePercent > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {health.savingsRatePercent}%
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {health.savingsRatePercent >= 20 ? '✓ Target Tercapai (≥20%)' : health.savingsRatePercent > 0 ? 'Wajar (0-20%)' : '⚠ Defisit Kas'}
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Kekayaan Bersih (Net Worth)
                </span>
                <p className={`text-base font-bold mt-0.5 ${health.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupiah(health.netWorth)}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Saldo aset dikurangi utang
                </span>
              </div>
            </div>
          </Card>

          {/* CFP Recommendations Checklist */}
          <Card className="border-indigo-100 bg-white shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-base">💡</span>
              <h3 className="font-bold text-sm text-slate-900">
                Rekomendasi Aksi dari Certified Financial Planner
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {health.advice.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs ${
                    item.level === 'danger'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : item.level === 'warning'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>{item.level === 'danger' ? '🚨' : item.level === 'warning' ? '⚠️' : '✅'}</span>
                      <span>{item.title}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-600">
                      {item.category}
                    </span>
                  </div>
                  <p className="leading-relaxed text-slate-600 mt-1">{item.message}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* CFP INVESTMENT READINESS & SIMULATOR */}
          {health.investmentReadiness && (
            <Card className="border-indigo-100 bg-white shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-lg shadow-xs">
                    📈
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">
                        Evaluasi Kesiapan Investasi & Estimasi Alokasi
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          health.investmentReadiness.readinessColor === 'emerald'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : health.investmentReadiness.readinessColor === 'amber'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {health.investmentReadiness.readinessStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Berdasarkan kaidah Piramida Keuangan Certified Financial Planner (CFP).
                    </p>
                  </div>
                </div>

                {/* Status Header Pill */}
                <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Rekomendasi Investasi Bulanan
                  </span>
                  <span className="text-base sm:text-lg font-black text-indigo-700">
                    {health.investmentReadiness.recommendedMonthlyAmount > 0
                      ? `${formatRupiah(health.investmentReadiness.recommendedMonthlyAmount)} / bln`
                      : 'Fokus Dana Darurat Dulu'}
                  </span>
                </div>
              </div>

              {/* Diagnosis Headline & Explanation */}
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  health.investmentReadiness.readinessColor === 'emerald'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : health.investmentReadiness.readinessColor === 'amber'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}
              >
                <h4 className="font-bold text-sm mb-1">{health.investmentReadiness.headline}</h4>
                <p className="leading-relaxed text-slate-700">{health.investmentReadiness.explanation}</p>
              </div>

              {/* 3 Core Prerequisites (Syarat Sebelum Investasi) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    3 Syarat Keamanan Finansial Sebelum Berinvestasi
                  </span>
                  <span className="text-[10px] text-slate-400">Prinsip CFP Piramida Keuangan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {health.investmentReadiness.conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        cond.isMet
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px] truncate">{cond.label}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            cond.isMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cond.isMet ? '✓ Aman' : '✕ Belum'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-0.5 border-t border-slate-100">
                        <span className="text-slate-500">Saat Ini:</span>
                        <span className={`font-semibold ${cond.isMet ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {cond.currentValue}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Target Ideal:</span>
                        <span className="font-medium text-slate-600">{cond.targetValue}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1 leading-tight">{cond.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Investment Simulator */}
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 p-4 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>🧮</span> Kalkulator Simulasi Pertumbuhan Investasi
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Estimasi compound interest moderat (~7% p.a.) jika konsisten menyisihkan dana tiap bulan.
                    </p>
                  </div>

                  {/* Amount quick selectors */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[100000, 250000, 500000, 1000000, 2000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomInvestAmount(amt)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition ${
                          activeSimAmount === amt
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000}rb`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Monthly Investment Display */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Alokasi Investasi Bulanan yang Disimulasikan:
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {formatRupiah(activeSimAmount)}
                      <span className="text-xs font-normal text-slate-500 ml-1">/ bulan</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Atur Nominal:</span>
                    <input
                      type="number"
                      min="50000"
                      step="50000"
                      value={activeSimAmount}
                      onChange={(e) => setCustomInvestAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-36 px-2.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 4 Cards: 1, 3, 5, 10 Years Projections */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1, 3, 5, 10].map((yr) => {
                    const sim = calculateCustomSimulation(yr, activeSimAmount);
                    return (
                      <div key={yr} className="bg-white p-3 rounded-xl border border-indigo-100 text-xs shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400 font-semibold text-[10px]">
                          <span>Horizon {yr} Tahun</span>
                          <span className="text-indigo-600 font-bold">{yr * 12}x setor</span>
                        </div>
                        <p className="text-base font-black text-indigo-700 tracking-tight">
                          {formatRupiah(sim.estimatedValue)}
                        </p>
                        <div className="text-[10px] space-y-0.5 pt-1 border-t border-slate-100 text-slate-500">
                          <div className="flex justify-between">
                            <span>Pokok disetor:</span>
                            <span className="font-medium text-slate-700">{formatRupiah(sim.totalContributed)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Est. Imbal Hasil:</span>
                            <span>+{formatRupiah(sim.estimatedProfit)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * Simulasi di atas menggunakan rumus majemuk (compound interest) dengan asumsi imbal hasil moderat rata-rata 7% per tahun yang diinvestasikan kembali.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                ⚖️ <strong>Disclaimer Finansial:</strong> Evaluasi dan estimasi investasi di atas bersifat simulasi edukatif berdasarkan standar perencana keuangan (CFP). Keputusan investasi sepenuhnya merupakan tanggung jawab pribadi pengguna. Pastikan selalu memahami profil risiko Anda sebelum menempatkan dana.
              </div>
            </Card>
          )}

          {/* CHART 1: 6-Month Cash Flow Trend */}
          <Card className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Tren Arus Kas (6 Bulan Terakhir)
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan pemasukan, pengeluaran rutin, dan alokasi pembayaran cicilan utang.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.cashFlowHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`)}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatRupiah(Number(value) || 0),
                      name === 'income' ? 'Pemasukan' : name === 'expense' ? 'Pengeluaran' : name === 'debtPayment' ? 'Cicilan Utang' : 'Net Arus Kas',
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => {
                      if (val === 'income') return 'Pemasukan';
                      if (val === 'expense') return 'Pengeluaran';
                      if (val === 'debtPayment') return 'Cicilan Utang';
                      return val;
                    }}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="income" />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="expense" />
                  <Bar dataKey="debtPayment" fill="#f59e0b" radius={[4, 4, 0, 0]} name="debtPayment" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* CHART 2 & 3: Expense Breakdown Donut & Projections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donut Chart: Komposisi Pengeluaran Bulan Ini */}
            <Card className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Distribusi Pengeluaran Bulan Ini
                </h3>
                <p className="text-xs text-slate-500">
                  Berdasarkan kategori transaksi pengeluaran aktif.
                </p>
              </div>

              {summary.categoryBreakdown.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <p>Belum ada pengeluaran di bulan ini.</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {summary.categoryBreakdown.map((item: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={item.color || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, _: any, item: any) => [
                          `${formatRupiah(Number(value) || 0)} (${item.payload.percentage}%)`,
                          item.payload.name,
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val) => <span className="text-[11px] text-slate-600">{val}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* CHART 3: Proyeksi Saldo (AreaChart) */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Proyeksi Saldo Kumulatif
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulasi pertumbuhan kas berdasarkan arus kas rata-rata.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setProjectionRange(3)}
                    className={`px-2 py-1 rounded-md transition ${
                      projectionRange === 3 ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    3B
                  </button>
                  <button
                    onClick={() => setProjectionRange(6)}
                    className={`px-2 py-1 rounded-md transition ${
                      projectionRange === 6 ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    6B
                  </button>
                  <button
                    onClick={() => setProjectionRange(12)}
                    className={`px-2 py-1 rounded-md transition ${
                      projectionRange === 12 ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    12B
                  </button>
                </div>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentProjections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`)}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Estimasi Saldo']}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedBalance"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Catatan: Proyeksi di atas merupakan simulasi matematis berbasis arus kas rata-rata, bukan jaminan saldo pasti.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSAKSI */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            {/* Search and Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <TextInput
                placeholder="Cari transaksi..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="text-xs py-1.5 w-full sm:w-48"
              />
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTxFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    txFilterType === 'all'
                      ? 'bg-white shadow text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semua ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilterType('income')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    txFilterType === 'income'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  <span>+ Masuk</span>
                  <span className="text-[10px] opacity-80">({incomeTxCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilterType('expense')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    txFilterType === 'expense'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'text-rose-700 hover:text-rose-800'
                  }`}
                >
                  <span>- Keluar</span>
                  <span className="text-[10px] opacity-80">({expenseTxCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxFilterType('debt_payment')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    txFilterType === 'debt_payment'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-amber-700 hover:text-amber-800'
                  }`}
                >
                  <span>Cicilan</span>
                  <span className="text-[10px] opacity-80">({debtTxCount})</span>
                </button>
              </div>
            </div>

            {/* Explicit Separate Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={openExpenseModal}
                className="text-xs py-1.5 px-3 bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                - Catat Pengeluaran
              </Button>
              <Button
                onClick={openIncomeModal}
                className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                + Catat Pemasukan
              </Button>
            </div>
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
                      <th className="py-2.5 px-3">Rekening Kas</th>
                      <th className="py-2.5 px-3 text-right">Nominal Uang</th>
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

      {/* MODAL 1: KHUSUS CATAT PENGELUARAN (DENGAN PEMISAHAN BAGIAN UANG JELAS) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4 my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 font-bold text-base">
                  -
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Catat Pengeluaran Kas</h3>
                  <p className="text-[11px] text-slate-500">Mencatat pengeluaran dan otomatis memotong saldo rekening terkait.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => handleCreateTransaction(e, 'expense')} className="space-y-4">
              {/* BAGIAN UANG & SUMBER KAS (MONEY SECTION) */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200/70 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <span>💸</span> Bagian Uang & Sumber Kas
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full">
                    Uang Keluar
                  </span>
                </div>

                {/* Input Nominal Uang */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Nominal Pengeluaran
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-black text-rose-600 text-base select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Contoh: 50000"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 text-lg font-black text-slate-900 bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Formatted Text Preview & Reset */}
                  {parsedAmount > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-rose-700 px-1">
                      <span>{formatRupiah(parsedAmount)}</span>
                      <button
                        type="button"
                        onClick={() => setTxAmount('')}
                        className="text-[11px] font-normal text-slate-400 hover:text-slate-600 underline"
                      >
                        Reset Nominal
                      </button>
                    </div>
                  )}

                  {/* Quick Add Amount Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[20000, 50000, 100000, 250000, 500000, 1000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => quickAddAmount(val)}
                        className="text-[11px] font-semibold bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 px-2 py-1 rounded-md transition shadow-xs"
                      >
                        +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000}rb`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Rekening Sumber Uang */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Rekening Sumber Uang (Saldo Terpotong)
                  </label>
                  <SelectInput
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({ACCOUNT_TYPE_LABELS[a.account_type]}) — Saldo: {formatRupiah(a.current_balance)}
                      </option>
                    ))}
                  </SelectInput>
                </div>

                {/* Live Saldo Simulation Card */}
                {selectedAccount && (
                  <div className="bg-white p-3 rounded-lg border border-rose-200 text-xs space-y-1.5 shadow-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Saldo Saat Ini ({selectedAccount.name}):</span>
                      <span className="font-semibold">{formatRupiah(currentAccBal)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Uang Dikeluarkan:</span>
                      <span>- {formatRupiah(parsedAmount)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold">
                      <span className="text-slate-800">Estimasi Sisa Saldo:</span>
                      <span className={simulatedExpenseBal < 0 ? 'text-red-600 font-black' : 'text-slate-900'}>
                        {formatRupiah(simulatedExpenseBal)}
                      </span>
                    </div>
                    {simulatedExpenseBal < 0 && (
                      <p className="text-[11px] text-red-600 font-bold pt-1 bg-red-50 p-1.5 rounded border border-red-200">
                        ⚠️ Saldo rekening ini tidak mencukupi untuk pengeluaran ini!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* BAGIAN DETAIL & KATEGORI (DETAIL SECTION) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1.5">
                  📋 Detail & Kategori Pengeluaran
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Tanggal Pengeluaran">
                    <TextInput
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      required
                    />
                  </Field>

                  <Field label="Kategori Pengeluaran">
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
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white hover:bg-slate-100 font-semibold"
                        title="Tambah kategori baru"
                      >
                        + Baru
                      </button>
                    </div>
                  </Field>
                </div>

                {showCatInput && (
                  <div className="flex gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                    <TextInput
                      placeholder="Nama kategori pengeluaran baru..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="text-xs py-1"
                    />
                    <Button type="button" onClick={handleAddCategory} className="text-xs py-1 px-3">
                      Simpan
                    </Button>
                  </div>
                )}

                <Field label="Keterangan / Catatan Tambahan (Opsional)">
                  <TextInput
                    placeholder="Contoh: Belanja sayur di pasar, bensin motor, dll"
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                  />
                </Field>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1"
                  disabled={txSubmitting}
                >
                  Batal
                </SecondaryButton>
                <Button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5"
                  disabled={txSubmitting}
                >
                  {txSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KHUSUS CATAT PEMASUKAN (DENGAN PEMISAHAN BAGIAN UANG JELAS) */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4 my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-base">
                  +
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Catat Pemasukan Kas</h3>
                  <p className="text-[11px] text-slate-500">Mencatat uang masuk dan otomatis menambah saldo rekening tujuan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => handleCreateTransaction(e, 'income')} className="space-y-4">
              {/* BAGIAN UANG & REKENING PENERIMA (MONEY SECTION) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <span>💵</span> Bagian Uang & Rekening Tujuan
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                    Uang Masuk
                  </span>
                </div>

                {/* Input Nominal Uang */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Nominal Pemasukan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-black text-emerald-600 text-base select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Contoh: 3500000"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 text-lg font-black text-slate-900 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Formatted Text Preview & Reset */}
                  {parsedAmount > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-emerald-700 px-1">
                      <span>{formatRupiah(parsedAmount)}</span>
                      <button
                        type="button"
                        onClick={() => setTxAmount('')}
                        className="text-[11px] font-normal text-slate-400 hover:text-slate-600 underline"
                      >
                        Reset Nominal
                      </button>
                    </div>
                  )}

                  {/* Quick Add Amount Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[50000, 100000, 500000, 1000000, 2500000, 5000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => quickAddAmount(val)}
                        className="text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-2 py-1 rounded-md transition shadow-xs"
                      >
                        +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000}rb`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Rekening Penerima Uang */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Rekening Penerima (Uang Masuk Disimpan ke Mana)
                  </label>
                  <SelectInput
                    value={txAccountId}
                    onChange={(e) => setTxAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({ACCOUNT_TYPE_LABELS[a.account_type]}) — Saldo: {formatRupiah(a.current_balance)}
                      </option>
                    ))}
                  </SelectInput>
                </div>

                {/* Live Saldo Simulation Card */}
                {selectedAccount && (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs space-y-1.5 shadow-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Saldo Saat Ini ({selectedAccount.name}):</span>
                      <span className="font-semibold">{formatRupiah(currentAccBal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Uang Diterima:</span>
                      <span>+ {formatRupiah(parsedAmount)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold">
                      <span className="text-slate-800">Estimasi Saldo Baru:</span>
                      <span className="text-emerald-700 font-black">
                        {formatRupiah(simulatedIncomeBal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* BAGIAN DETAIL & KATEGORI (DETAIL SECTION) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1.5">
                  📋 Detail & Sumber Pemasukan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Tanggal Pemasukan">
                    <TextInput
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      required
                    />
                  </Field>

                  <Field label="Kategori Pemasukan">
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
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white hover:bg-slate-100 font-semibold"
                        title="Tambah kategori baru"
                      >
                        + Baru
                      </button>
                    </div>
                  </Field>
                </div>

                {showCatInput && (
                  <div className="flex gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                    <TextInput
                      placeholder="Nama kategori pemasukan baru..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="text-xs py-1"
                    />
                    <Button type="button" onClick={handleAddCategory} className="text-xs py-1 px-3">
                      Simpan
                    </Button>
                  </div>
                )}

                <Field label="Keterangan / Catatan Tambahan (Opsional)">
                  <TextInput
                    placeholder="Contoh: Gaji bulanan kantor, hasil jualan, transfer teman, dll"
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                  />
                </Field>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1"
                  disabled={txSubmitting}
                >
                  Batal
                </SecondaryButton>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5"
                  disabled={txSubmitting}
                >
                  {txSubmitting ? 'Menyimpan...' : 'Simpan Pemasukan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH REKENING */}
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

      {/* MODAL 4: TAMBAH UTANG */}
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

      {/* MODAL 5: BAYAR CICILAN UTANG */}
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
