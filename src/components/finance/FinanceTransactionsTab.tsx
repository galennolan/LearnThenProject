import { useState, useMemo } from 'react';
import type { Transaction } from '../../types/finance';
import { formatRupiah } from '../../services/finance';
import { formatJakarta } from '../../lib/time';
import { Button, Card, EmptyState, TextInput } from '../ui';

interface FinanceTransactionsTabProps {
  transactions: Transaction[];
  onOpenExpense: () => void;
  onOpenIncome: () => void;
  onCopyTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export function FinanceTransactionsTab({
  transactions,
  onOpenExpense,
  onOpenIncome,
  onCopyTransaction,
  onDeleteTransaction,
}: FinanceTransactionsTabProps) {
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState<string>('all');

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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Top row: Search input & Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-xs">
            <TextInput
              placeholder="Cari transaksi..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="text-xs py-2 w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              onClick={onOpenExpense}
              className="text-xs py-2 px-3 bg-rose-600 hover:bg-rose-700 shadow-xs justify-center"
            >
              - Catat Keluar
            </Button>
            <Button
              onClick={onOpenIncome}
              className="text-xs py-2 px-3 bg-emerald-600 hover:bg-emerald-700 shadow-xs justify-center"
            >
              + Catat Masuk
            </Button>
          </div>
        </div>

        {/* Filter Pills row: 4 Equal Columns on Mobile (No Horizontal Scrolling) */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTxFilterType('all')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
              txFilterType === 'all'
                ? 'bg-white shadow-xs text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="truncate">Semua</span>
            <span className="text-[10px] opacity-75">({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTxFilterType('income')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
              txFilterType === 'income'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            <span className="truncate">+ Masuk</span>
            <span className="text-[10px] opacity-85">({incomeTxCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTxFilterType('expense')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
              txFilterType === 'expense'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-rose-700 hover:text-rose-800'
            }`}
          >
            <span className="truncate">- Keluar</span>
            <span className="text-[10px] opacity-85">({expenseTxCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTxFilterType('debt_payment')}
            className={`py-2 px-1 rounded-lg text-center transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
              txFilterType === 'debt_payment'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-amber-700 hover:text-amber-800'
            }`}
          >
            <span className="truncate">Cicilan</span>
            <span className="text-[10px] opacity-85">({debtTxCount})</span>
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi yang cocok"
          desc="Mulai catat pemasukan atau pengeluaran Anda dengan tombol di atas."
        />
      ) : (
        <Card className="overflow-hidden p-0 border-slate-200 shadow-xs">
          {/* MOBILE VIEW (CARD FEED / ZERO HORIZONTAL SCROLL) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredTransactions.map((t) => {
              const isIncome = t.transaction_type === 'income';
              const isDebt = t.transaction_type === 'debt_payment';
              return (
                <div key={t.id} className="p-3.5 space-y-2 hover:bg-slate-50/70 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-700'
                            : isDebt
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {t.description || t.category_name || (isDebt ? 'Cicilan Utang' : 'Pengeluaran')}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                          {t.category_name && (
                            <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {t.category_name}
                            </span>
                          )}
                          <span>•</span>
                          <span>{t.account_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-extrabold whitespace-nowrap block ${
                          isIncome
                            ? 'text-emerald-600'
                            : isDebt
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatRupiah(t.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/70 text-slate-500">
                    <span className="text-[10px] text-slate-400">
                      {formatJakarta(t.transaction_date)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {t.transaction_type !== 'debt_payment' && (
                        <button
                          type="button"
                          onClick={() => onCopyTransaction(t)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-[11px] inline-flex items-center gap-1 transition"
                          title="Salin transaksi ini (untuk transaksi rutin)"
                        >
                          <span>📋</span>
                          <span>Salin</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(t)}
                        className="text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-md hover:bg-red-50 text-[11px] transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (TABLE FORMAT) */}
          <div className="hidden md:block overflow-x-auto">
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
                    <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-2">
                      {t.transaction_type !== 'debt_payment' && (
                        <button
                          type="button"
                          onClick={() => onCopyTransaction(t)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] inline-flex items-center gap-1"
                          title="Salin transaksi ini (untuk transaksi rutin)"
                        >
                          <span>📋</span>
                          <span>Salin</span>
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteTransaction(t)}
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
  );
}
