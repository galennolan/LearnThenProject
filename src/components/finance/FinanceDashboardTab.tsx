import type { FinanceSummary, Account, Debt, Transaction } from '../../types/finance';
import { ACCOUNT_TYPE_LABELS } from '../../types/finance';
import { formatRupiah } from '../../services/finance';
import { formatJakarta } from '../../lib/time';
import { Card, EmptyState } from '../ui';

interface FinanceDashboardTabProps {
  summary: FinanceSummary;
  accounts: Account[];
  onNavigateTab: (tab: 'dashboard' | 'planner' | 'transactions' | 'accounts' | 'debts') => void;
  onPayDebt: (debt: Debt) => void;
  onCopyTransaction: (tx: Transaction) => void;
}

export function FinanceDashboardTab({
  summary,
  accounts,
  onNavigateTab,
  onPayDebt,
  onCopyTransaction,
}: FinanceDashboardTabProps) {
  const health = summary.healthAnalysis;

  return (
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

        <Card
          className={
            summary.remainingSafeMoney >= 0
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-red-50/50 border-red-200'
          }
        >
          <span
            className={`text-[11px] font-medium ${
              summary.remainingSafeMoney >= 0 ? 'text-emerald-800' : 'text-red-800'
            }`}
          >
            Sisa Uang Aman
          </span>
          <p
            className={`mt-1 text-base sm:text-lg font-bold ${
              summary.remainingSafeMoney >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
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
                DSR: <strong>{health.dsrPercent}%</strong> • Dana Darurat: <strong>{health.emergencyFundMonths} bln</strong> • Kesiapan Investasi:{' '}
                <strong
                  className={
                    health.investmentReadiness?.readinessColor === 'emerald'
                      ? 'text-emerald-700'
                      : health.investmentReadiness?.readinessColor === 'amber'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }
                >
                  {health.investmentReadiness?.readinessStatus || 'Evaluasi'}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('planner')}
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
            onClick={() => onNavigateTab('accounts')}
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
              onClick={() => onNavigateTab('debts')}
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
                      onClick={() => onPayDebt(d)}
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
              onClick={() => onNavigateTab('transactions')}
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-bold whitespace-nowrap ${
                        t.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {t.transaction_type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                    </span>
                    {t.transaction_type !== 'debt_payment' && (
                      <button
                        type="button"
                        onClick={() => onCopyTransaction(t)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold px-1.5 py-0.5 rounded hover:bg-indigo-50 border border-slate-200"
                        title="Salin transaksi ini (untuk transaksi rutin)"
                      >
                        Salin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
