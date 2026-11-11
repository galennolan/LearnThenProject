import { useState, useEffect, useMemo } from 'react';
import type { Account, Category } from '../../../types/finance';
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

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: TransactionInitialData | null;
  onSuccess: () => Promise<void> | void;
  onCategoryCreated?: (newCategory: Category) => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  accounts,
  categories,
  initialData,
  onSuccess,
  onCategoryCreated,
}: ExpenseModalProps) {
  const { push } = useToast();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.category_type === 'expense'),
    [categories]
  );

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayJakartaISO());
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New category creation within modal
  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setAmount(initialData?.amount || '');
      setAccountId(initialData?.accountId || (accounts[0]?.id ?? ''));
      setCategoryId(initialData?.categoryId || (expenseCategories[0]?.id ?? ''));
      setDate(initialData?.date || todayJakartaISO());
      setDesc(initialData?.description || '');
      setShowCatInput(false);
      setNewCatName('');
    }
  }, [isOpen, initialData, accounts, expenseCategories]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0] || null;
  const parsedAmount = Number(amount) || 0;
  const currentAccBal = Number(selectedAccount?.current_balance) || 0;
  const simulatedBalance = currentAccBal - parsedAmount;

  const quickAddAmount = (val: number) => {
    const cur = Number(amount) || 0;
    setAmount(String(cur + val));
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await createCategory(newCatName.trim(), 'expense');
      onCategoryCreated?.(created);
      setCategoryId(created.id);
      setNewCatName('');
      setShowCatInput(false);
      push('Kategori pengeluaran baru ditambahkan!');
    } catch {
      push('Gagal membuat kategori baru', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      push('Pilih rekening sumber uang keluar terlebih dahulu.', 'error');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      push('Nominal uang harus lebih dari 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createTransaction({
        account_id: accountId,
        category_id: categoryId || null,
        transaction_type: 'expense',
        transaction_date: date,
        amount: amt,
        description: desc,
      });
      push('Pengeluaran uang berhasil dicatat!');
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat pengeluaran', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg p-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* BAGIAN UANG & SUMBER KAS */}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-11 pr-3 py-2 text-lg font-black text-slate-900 bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                  required
                  autoFocus
                />
              </div>

              {parsedAmount > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-rose-700 px-1">
                  <span>{formatRupiah(parsedAmount)}</span>
                  <button
                    type="button"
                    onClick={() => setAmount('')}
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
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
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
                  <span className={simulatedBalance < 0 ? 'text-red-600 font-black' : 'text-slate-900'}>
                    {formatRupiah(simulatedBalance)}
                  </span>
                </div>
                {simulatedBalance < 0 && (
                  <p className="text-[11px] text-red-600 font-bold pt-1 bg-red-50 p-1.5 rounded border border-red-200">
                    ⚠️ Saldo rekening ini tidak mencukupi untuk pengeluaran ini!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* BAGIAN DETAIL & KATEGORI */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1.5">
              📋 Detail & Kategori Pengeluaran
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tanggal Pengeluaran">
                <TextInput
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Field>

              <Field label="Kategori Pengeluaran">
                <div className="flex gap-1.5">
                  <SelectInput
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1"
                  >
                    {expenseCategories.map((c) => (
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
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </Field>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Batal
            </SecondaryButton>
            <Button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
