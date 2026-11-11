import { useState, useEffect, useMemo } from 'react';
import type { Account, Category } from '../../../types/finance';
import { ACCOUNT_TYPE_LABELS } from '../../../types/finance';
import { formatRupiah, createTransaction, createCategory } from '../../../services/finance';
import { todayJakartaISO, currentTimeJakarta } from '../../../lib/time';
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

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 250000, 500000, 1000000];

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
  const [time, setTime] = useState(currentTimeJakarta());
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
      setTime(currentTimeJakarta());
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

  // Format label hari untuk tanggal yang dipilih
  const formattedDayLabel = useMemo(() => {
    if (!date) return '';
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }, [date]);

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
      // Satukan tanggal dan jam ke ISO timestamp
      const fullTimestamp = `${date}T${time ? time + ':00' : '00:00:00'}+07:00`;

      await createTransaction({
        account_id: accountId,
        category_id: categoryId || null,
        transaction_type: 'expense',
        transaction_date: date,
        amount: amt,
        description: desc,
        reference_type: fullTimestamp,
      });
      push(`Pengeluaran ${formatRupiah(amt)} berhasil dicatat!`);
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat pengeluaran', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Sleek Modern Header */}
        <div className="bg-gradient-to-r from-rose-500/10 via-rose-50/60 to-white px-6 py-4.5 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white font-extrabold text-lg shadow-md shadow-rose-200">
              −
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Catat Pengeluaran Kas</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Uang Keluar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Memotong saldo rekening dan mencatat histori pengeluaran.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-lg transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. HERO AMOUNT SECTION */}
          <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/40 to-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Nominal Uang Dikeluarkan
              </label>
              {parsedAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Big Fintech Input */}
            <div className="relative flex items-center">
              <span className="absolute left-4 font-black text-rose-600 text-xl sm:text-2xl select-none">
                Rp
              </span>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3 text-2xl sm:text-3xl font-black text-slate-900 bg-white border-2 border-rose-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 shadow-xs transition"
                required
                autoFocus
              />
            </div>

            {/* Formatted Text Preview */}
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span>Terbilang:</span>
              <span className="font-extrabold text-rose-700 text-sm">
                {parsedAmount > 0 ? formatRupiah(parsedAmount) : 'Rp 0'}
              </span>
            </div>

            {/* Quick Add Pills */}
            <div className="pt-1 border-t border-rose-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                Tambah Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => quickAddAmount(val)}
                    className="text-xs font-semibold bg-white border border-rose-200/90 text-rose-800 hover:bg-rose-100 hover:border-rose-300 px-2.5 py-1 rounded-xl transition shadow-2xs active:scale-95"
                  >
                    +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. REKENING SUMBER & SIMULASI SALDO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Rekening Sumber Uang
            </label>
            <SelectInput
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="py-2.5 font-medium text-slate-800"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({ACCOUNT_TYPE_LABELS[a.account_type]}) — Saldo: {formatRupiah(a.current_balance)}
                </option>
              ))}
            </SelectInput>

            {/* Live Flow Balance Visual */}
            {selectedAccount && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Saldo Saat Ini ({selectedAccount.name}):</span>
                  <span className="font-bold text-slate-800">{formatRupiah(currentAccBal)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 font-semibold">
                  <span>Dipotong Pengeluaran:</span>
                  <span>− {formatRupiah(parsedAmount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center font-bold">
                  <span className="text-slate-800">Estimasi Sisa Saldo:</span>
                  <span className={simulatedBalance < 0 ? 'text-rose-600 font-black text-sm' : 'text-slate-900 text-sm'}>
                    {formatRupiah(simulatedBalance)}
                  </span>
                </div>
                {simulatedBalance < 0 && (
                  <p className="text-xs text-rose-600 font-bold pt-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    ⚠️ Saldo rekening ini tidak mencukupi untuk pengeluaran ini!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3. WAKTU, TANGGAL & HARI */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Waktu Transaksi (Hari & Jam)
              </span>
              <span className="text-xs font-semibold text-indigo-700">
                {formattedDayLabel || 'Hari ini'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tanggal">
                <TextInput
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-xs py-2"
                  required
                />
              </Field>

              <Field label="Jam (WIB)">
                <TextInput
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="text-xs py-2"
                  required
                />
              </Field>
            </div>
          </div>

          {/* 4. KATEGORI & KETERANGAN */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Kategori Pengeluaran
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatInput(!showCatInput)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                >
                  {showCatInput ? 'Batal Buat' : '+ Kategori Baru'}
                </button>
              </div>

              {/* Quick Category Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {expenseCategories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      categoryId === c.id
                        ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <SelectInput
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="text-xs py-2"
              >
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </div>

            {showCatInput && (
              <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <TextInput
                  placeholder="Nama kategori pengeluaran baru..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="text-xs py-1.5 flex-1"
                />
                <Button type="button" onClick={handleAddCategory} className="text-xs py-1.5 px-3">
                  Simpan
                </Button>
              </div>
            )}

            <Field label="Catatan Tambahan (Opsional)">
              <TextInput
                placeholder="Contoh: Makan siang nasi padang, bensin motor, dsb"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="text-xs py-2"
              />
            </Field>
          </div>

          {/* 5. ACTION BUTTONS */}
          <div className="flex gap-3 pt-2">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold"
              disabled={submitting}
            >
              Batal
            </SecondaryButton>
            <Button
              type="submit"
              className="flex-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 text-sm shadow-md shadow-rose-200 transition active:scale-[0.99]"
              disabled={submitting || parsedAmount <= 0}
            >
              {submitting
                ? 'Menyimpan...'
                : parsedAmount > 0
                ? `Simpan Pengeluaran (− ${formatRupiah(parsedAmount)})`
                : 'Masukkan Nominal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
