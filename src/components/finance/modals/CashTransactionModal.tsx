import { useState, useEffect, useMemo } from 'react';
import type { Account, Category, TransactionType } from '../../../types/finance';
import { ACCOUNT_TYPE_LABELS } from '../../../types/finance';
import { formatRupiah, createTransaction, createCategory } from '../../../services/finance';
import { todayJakartaISO } from '../../../lib/time';
import { useToast } from '../../../hooks/useToast';
import { Button, SecondaryButton, SelectInput, TextInput, Field } from '../../ui';

export interface TransactionInitialData {
  amount?: string;
  accountId?: string;
  categoryId?: string;
  description?: string;
  date?: string;
}

interface CashTransactionModalProps {
  transactionType: Extract<TransactionType, 'expense' | 'income'>;
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: TransactionInitialData | null;
  onSuccess: () => Promise<void> | void;
  onCategoryCreated?: (newCategory: Category) => void;
}

const MODAL_CONFIG = {
  expense: {
    title: 'Catat Pengeluaran Kas',
    subtitle: 'Catat kas keluar dan perbarui saldo rekening.',
    symbol: '−',
    amountLabel: 'Nominal Pengeluaran',
    accountLabel: 'Rekening Sumber Dana',
    simulatedLabel: 'Sisa saldo:',
    categoryLabel: 'Kategori Pengeluaran',
    dateLabel: 'Tanggal Pengeluaran',
    descPlaceholder: 'Contoh: Makan siang, bensin motor, belanja harian',
    quickAmounts: [10000, 20000, 50000, 100000, 250000, 500000, 1000000],
    submitLabel: 'Simpan Pengeluaran',
    successMessage: (amt: number) => `Pengeluaran ${formatRupiah(amt)} berhasil dicatat.`,
    errorMessage: 'Gagal mencatat pengeluaran',
    emptyAccountError: 'Pilih rekening sumber uang keluar terlebih dahulu.',
    newCategorySuccess: 'Kategori pengeluaran baru ditambahkan.',
    badgeClass: 'bg-rose-50 text-rose-600 border-rose-200',
    prefixClass: 'text-rose-600',
    inputFocusClass: 'focus:ring-rose-500 focus:border-rose-500',
    previewTextClass: 'text-rose-700',
    chipHoverClass: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200',
    activeCatClass: 'bg-rose-600 text-white font-semibold border-rose-600',
    submitBtnClass: 'bg-rose-600 hover:bg-rose-700',
  },
  income: {
    title: 'Catat Pemasukan Kas',
    subtitle: 'Catat kas masuk dan perbarui saldo rekening tujuan.',
    symbol: '+',
    amountLabel: 'Nominal Pemasukan',
    accountLabel: 'Rekening Penerima',
    simulatedLabel: 'Saldo setelahnya:',
    categoryLabel: 'Kategori Pemasukan',
    dateLabel: 'Tanggal Pemasukan',
    descPlaceholder: 'Contoh: Gaji bulanan, bonus proyek, hasil penjualan',
    quickAmounts: [50000, 100000, 500000, 1000000, 2500000, 5000000],
    submitLabel: 'Simpan Pemasukan',
    successMessage: (amt: number) => `Pemasukan ${formatRupiah(amt)} berhasil dicatat.`,
    errorMessage: 'Gagal mencatat pemasukan',
    emptyAccountError: 'Pilih rekening tujuan uang masuk terlebih dahulu.',
    newCategorySuccess: 'Kategori pemasukan baru ditambahkan.',
    badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    prefixClass: 'text-emerald-600',
    inputFocusClass: 'focus:ring-emerald-500 focus:border-emerald-500',
    previewTextClass: 'text-emerald-700',
    chipHoverClass: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
    activeCatClass: 'bg-emerald-600 text-white font-semibold border-emerald-600',
    submitBtnClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
} as const;

function toDigitString(val?: string | number): string {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (!Number.isNaN(num) && num > 0) {
    return String(Math.round(num));
  }
  return String(val).replace(/\D/g, '').replace(/^0+/, '');
}

function formatThousands(digits: string): string {
  if (!digits) return '';
  const num = Number(digits);
  if (Number.isNaN(num) || num <= 0) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

/** Modal pencatatan kas keluar / masuk dengan format nominal ribuan otomatis. */
export function CashTransactionModal({
  transactionType,
  isOpen,
  onClose,
  accounts,
  categories,
  initialData,
  onSuccess,
  onCategoryCreated,
}: CashTransactionModalProps) {
  const { push } = useToast();
  const cfg = MODAL_CONFIG[transactionType];

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.category_type === transactionType),
    [categories, transactionType]
  );

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayJakartaISO());
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(toDigitString(initialData?.amount));
      setAccountId(initialData?.accountId || (accounts[0]?.id ?? ''));
      setCategoryId(initialData?.categoryId || (filteredCategories[0]?.id ?? ''));
      setDate(initialData?.date || todayJakartaISO());
      setDesc(initialData?.description || '');
      setShowCatInput(false);
      setNewCatName('');
    }
  }, [isOpen, initialData, accounts, filteredCategories]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0] || null;
  const parsedAmount = Number(amount) || 0;
  const currentAccBal = Number(selectedAccount?.current_balance) || 0;
  const simulatedBalance =
    transactionType === 'expense' ? currentAccBal - parsedAmount : currentAccBal + parsedAmount;
  const isDeficit = transactionType === 'expense' && simulatedBalance < 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
    setAmount(digitsOnly);
  };

  const quickAddAmount = (val: number) => {
    const cur = Number(amount) || 0;
    setAmount(String(cur + val));
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    try {
      const created = await createCategory(trimmed, transactionType);
      onCategoryCreated?.(created);
      setCategoryId(created.id);
      setNewCatName('');
      setShowCatInput(false);
      push(cfg.newCategorySuccess);
    } catch {
      push('Gagal membuat kategori baru', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      push(cfg.emptyAccountError, 'error');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      push('Nominal uang harus lebih dari 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createTransaction({
        account_id: accountId,
        category_id: categoryId || null,
        transaction_type: transactionType,
        transaction_date: date,
        amount: parsedAmount,
        description: desc,
      });
      push(cfg.successMessage(parsedAmount));
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : cfg.errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200 my-4">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-lg border ${cfg.badgeClass}`}
            >
              {cfg.symbol}
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{cfg.title}</h3>
              <p className="text-xs text-slate-500">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-lg"
            aria-label="Tutup dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nominal Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {cfg.amountLabel}
              </label>
              {parsedAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline transition"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold select-none ${cfg.prefixClass}`}
              >
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatThousands(amount)}
                onChange={handleAmountChange}
                className={`w-full pl-12 pr-4 py-3 text-2xl font-bold tabular-nums text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition ${cfg.inputFocusClass}`}
                required
                autoFocus
              />
            </div>

            {/* Quick Add Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cfg.quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => quickAddAmount(val)}
                  className={`text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition ${cfg.chipHoverClass}`}
                >
                  +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Rekening & Simulasi Saldo */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <Field label={cfg.accountLabel}>
              <SelectInput
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({ACCOUNT_TYPE_LABELS[a.account_type]}) — Saldo:{' '}
                    {formatRupiah(a.current_balance)}
                  </option>
                ))}
              </SelectInput>
            </Field>

            {selectedAccount && (
              <div
                className={`px-3.5 py-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                  isDeficit
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Saldo saat ini:</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatRupiah(currentAccBal)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{cfg.simulatedLabel}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isDeficit
                        ? 'text-rose-600'
                        : transactionType === 'income'
                          ? cfg.previewTextClass
                          : 'text-slate-900'
                    }`}
                  >
                    {formatRupiah(simulatedBalance)}
                  </span>
                  {isDeficit && (
                    <span className="font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">
                      Saldo kurang
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tanggal & Kategori */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={cfg.dateLabel}>
                <TextInput
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    {cfg.categoryLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCatInput(!showCatInput)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                  >
                    {showCatInput ? 'Batal' : '+ Baru'}
                  </button>
                </div>
                <SelectInput
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </div>

            {/* Quick Category Chips */}
            {filteredCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filteredCategories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      categoryId === c.id
                        ? cfg.activeCatClass
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Inline New Category Input */}
            {showCatInput && (
              <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <TextInput
                  placeholder="Nama kategori baru..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="text-xs py-1.5 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  className="text-xs py-1.5 px-3"
                >
                  Simpan
                </Button>
              </div>
            )}

            <Field label="Catatan (Opsional)">
              <TextInput
                placeholder={cfg.descPlaceholder}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </Field>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold"
              disabled={submitting}
            >
              Batal
            </SecondaryButton>
            <Button
              type="submit"
              className={`flex-1 text-white font-semibold py-2.5 text-sm ${cfg.submitBtnClass}`}
              disabled={submitting || parsedAmount <= 0}
            >
              {submitting
                ? 'Menyimpan...'
                : parsedAmount > 0
                  ? `${cfg.submitLabel} (${cfg.symbol} ${formatRupiah(parsedAmount)})`
                  : cfg.submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

