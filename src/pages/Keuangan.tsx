import { useEffect, useState } from 'react';
import {
  getFinanceSummary,
  listAccounts,
  listCategories,
  listTransactions,
  listDebts,
  deleteAccount,
  deleteTransaction,
  deleteDebt,
} from '../services/finance';
import type {
  Account,
  Category,
  Transaction,
  Debt,
  FinanceSummary,
} from '../types/finance';
import { useToast } from '../hooks/useToast';
import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  Loading,
} from '../components/ui';
import {
  FinanceDashboardTab,
  FinancePlannerTab,
  FinanceTransactionsTab,
  FinanceAccountsTab,
  FinanceDebtsTab,
  ExpenseModal,
  IncomeModal,
  AccountModal,
  DebtModal,
  DebtPaymentModal,
  type TransactionInitialData,
} from '../components/finance';
import { todayJakartaISO } from '../lib/time';

type Tab = 'dashboard' | 'planner' | 'transactions' | 'accounts' | 'debts';

export default function KeuanganPage() {
  const { push } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Core Data
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Modals Visibility
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  // Pre-filled data for copying transactions
  const [copyTxData, setCopyTxData] = useState<TransactionInitialData | null>(null);

  // Deletion confirm
  const [deletingItem, setDeletingItem] = useState<{
    type: 'transaction' | 'account' | 'debt';
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Modal open triggers
  const openExpenseModal = () => {
    setCopyTxData(null);
    setShowExpenseModal(true);
  };

  const openIncomeModal = () => {
    setCopyTxData(null);
    setShowIncomeModal(true);
  };

  const handleCopyTransaction = (t: Transaction) => {
    const isIncome = t.transaction_type === 'income';
    const initialData: TransactionInitialData = {
      amount: String(t.amount),
      accountId: t.account_id,
      categoryId: t.category_id || '',
      description: t.description || '',
      date: todayJakartaISO(),
    };
    setCopyTxData(initialData);

    if (isIncome) {
      setShowIncomeModal(true);
    } else {
      setShowExpenseModal(true);
    }

    push(
      `Data transaksi "${t.description || t.category_name || 'transaksi'}" disalin. Tanggal disetel ke hari ini, silakan sesuaikan jika perlu.`
    );
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

  if (loading) return <Loading text="Memuat RuangUang & Analisis Keuangan..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2 font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'planner'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-indigo-600'
          }`}
        >
          <span>Analisis & Grafik</span>
          {summary?.healthAnalysis && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${summary.healthAnalysis.statusColor}`}
            >
              {summary.healthAnalysis.healthScore}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'transactions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transaksi ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'accounts'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rekening & Kas ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-4 py-2 font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'debts'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Utang & Cicilan ({debts.filter((d) => d.status === 'active').length})
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'dashboard' && summary && (
        <FinanceDashboardTab
          summary={summary}
          accounts={accounts}
          onNavigateTab={setActiveTab}
          onPayDebt={(debt) => setPayingDebt(debt)}
          onCopyTransaction={handleCopyTransaction}
        />
      )}

      {activeTab === 'planner' && summary && summary.healthAnalysis && (
        <FinancePlannerTab summary={summary} health={summary.healthAnalysis} />
      )}

      {activeTab === 'transactions' && (
        <FinanceTransactionsTab
          transactions={transactions}
          onOpenExpense={openExpenseModal}
          onOpenIncome={openIncomeModal}
          onCopyTransaction={handleCopyTransaction}
          onDeleteTransaction={(tx) =>
            setDeletingItem({
              type: 'transaction',
              id: tx.id,
              title: `transaksi ${tx.description || tx.category_name || ''}`,
            })
          }
        />
      )}

      {activeTab === 'accounts' && (
        <FinanceAccountsTab
          accounts={accounts}
          onOpenAddAccount={() => setShowAccModal(true)}
          onDeleteAccount={(acc) =>
            setDeletingItem({
              type: 'account',
              id: acc.id,
              title: `rekening ${acc.name}`,
            })
          }
        />
      )}

      {activeTab === 'debts' && (
        <FinanceDebtsTab
          debts={debts}
          onOpenAddDebt={() => setShowDebtModal(true)}
          onPayDebt={(debt) => setPayingDebt(debt)}
          onDeleteDebt={(debt) =>
            setDeletingItem({
              type: 'debt',
              id: debt.id,
              title: `kewajiban utang ${debt.creditor_name}`,
            })
          }
        />
      )}

      {/* MODALS */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        accounts={accounts}
        categories={categories}
        initialData={copyTxData}
        onSuccess={loadData}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />

      <IncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        accounts={accounts}
        categories={categories}
        initialData={copyTxData}
        onSuccess={loadData}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />

      <AccountModal
        isOpen={showAccModal}
        onClose={() => setShowAccModal(false)}
        onSuccess={loadData}
      />

      <DebtModal
        isOpen={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        onSuccess={loadData}
      />

      <DebtPaymentModal
        debt={payingDebt}
        accounts={accounts}
        onClose={() => setPayingDebt(null)}
        onSuccess={loadData}
      />

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
