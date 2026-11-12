import { useState, useEffect, useMemo } from 'react';
import type { Account, Category } from '../../../types/finance';
import { ACCOUNT_TYPE_LABELS } from '../../../types/finance';
import { formatRupiah, createTransaction, createCategory } from '../../../services/finance';
import { todayJakartaISO, currentTimeJakarta } from '../../../lib/time';
import { useToast } from '../../../hooks/useToast';
import { Button, SecondaryButton, SelectInput, TextInput, Field } from '../../ui';
import type { TransactionInitialData } from './ExpenseModal';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: TransactionInitialData | null;
  onSuccess: () => Promise<void> | void;
  onCategoryCreated?: (newCategory: Category) => void;
}

const QUICK_INCOME_AMOUNTS = [50000, 100000, 500000, 1000000, 2500000, 5000000];

export function IncomeModal({
  isOpen,
  onClose,
  accounts,
  categories,
  initialData,
  onSuccess,
  onCategoryCreated,
}: IncomeModalProps) {
  const { push } = useToast();

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.category_type === 'income'),
    [categories]
  );

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayJakartaISO());
  const [time, setTime] = useState(currentTimeJakarta());
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form kategori baru
  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Sinkronisasi state saat modal dibuka atau initialData berubah
  useEffect(() => {
    if (isOpen) {
      setAmount(initialData?.amount || '');
      setAccountId(initialData?.accountId || (accounts[0]?.id ?? ''));
      setCategoryId(initialData?.categoryId || (incomeCategories[0]?.id ?? ''));
      setDate(initialData?.date || todayJakartaISO());
      setTime(currentTimeJakarta());
      setDesc(initialData?.description || '');
      setShowCatInput(false);
      setNewCatName('');
    }
  }, [isOpen, initialData, accounts, incomeCategories]);

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0] || null;
  const parsedAmount = Number(amount) || 0;
  const currentAccBal = Number(selectedAccount?.current_balance) || 0;
  const simulatedBalance = currentAccBal + parsedAmount;

  // Nama hari dalam Bahasa Indonesia untuk tanggal yang dipilih
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
      const created = await createCategory(newCatName.trim(), 'income');
      onCategoryCreated?.(created);
      setCategoryId(created.id);
      setNewCatName('');
      setShowCatInput(false);
      push('Kategori pemasukan baru ditambahkan!');
    } catch {
      push('Gagal membuat kategori baru', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      push('Pilih rekening tujuan uang masuk terlebih dahulu.', 'error');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      push('Nominal uang harus lebih dari 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Simpan waktu lengkap ke reference_type bila ada jam
      const fullTimestamp = `${date}T${time ? time + ':00' : '00:00:00'}+07:00`;

      await createTransaction({
        account_id: accountId,
        category_id: categoryId || null,
        transaction_type: 'income',
        transaction_date: date,
        amount: amt,
        description: desc,
        reference_type: fullTimestamp,
      });
      push(`Pemasukan ${formatRupiah(amt)} berhasil dicatat!`);
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat pemasukan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all">
        {/* Header Modal Bersih & Modern */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg border border-emerald-200/60">
              +
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Catat Pemasukan</h3>
              <p className="text-xs text-slate-500">Mencatat kas masuk dan menambah saldo rekening.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition text-lg"
            title="Tutup dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Hero Input Nominal Uang */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Nominal Pemasukan
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-emerald-600 select-none">
                Rp
              </span>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-900 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs"
                required
                autoFocus
              />
            </div>

            {/* Formatted Text Preview & Reset */}
            <div className="flex items-center justify-between text-xs min-h-[20px] px-1">
              {parsedAmount > 0 ? (
                <>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(parsedAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="text-slate-400 hover:text-slate-600 font-medium underline transition"
                  >
                    Reset
                  </button>
                </>
              ) : (
                <span className="text-slate-400">Ketik angka atau klik tombol nominal cepat di bawah</span>
              )}
            </div>

            {/* Quick Add Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_INCOME_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => quickAddAmount(val)}
                  className="text-xs font-semibold bg-slate-100/90 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
                >
                  +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Rekening Tujuan & Simulasi Saldo */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <Field label="Rekening Tujuan (Kas Masuk Disimpan ke Mana)">
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
            </Field>

            {/* Live Saldo Impact Strip */}
            {selectedAccount && (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 transition">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Saldo saat ini:</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(currentAccBal)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Saldo setelah transaksi:</span>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(simulatedBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tanggal, Hari, & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Tanggal Transaksi</label>
                <span className="text-xs font-semibold text-indigo-700">
                  {formattedDayLabel || 'Hari ini'}
                </span>
              </div>
              <TextInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Jam (WIB)</label>
              <TextInput
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Kategori & Keterangan */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Kategori Pemasukan</label>
                <button
                  type="button"
                  onClick={() => setShowCatInput(!showCatInput)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
                >
                  {showCatInput ? 'Batal Tambah' : '+ Kategori Baru'}
                </button>
              </div>

              {/* Popular Category Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {incomeCategories.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      categoryId === c.id
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-2xs'
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
              >
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* Quick Add Category Field */}
            {showCatInput && (
              <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <TextInput
                  placeholder="Nama kategori baru..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="text-xs py-1.5 flex-1"
                />
                <Button type="button" onClick={handleAddCategory} className="text-xs py-1.5 px-3">
                  Simpan
                </Button>
              </div>
            )}

            <Field label="Catatan / Keterangan (Opsional)">
              <TextInput
                placeholder="Contoh: Gaji bulanan kantor, hasil jualan, transfer, dsb"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </Field>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
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
              className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm shadow-sm transition active:scale-[0.99]"
              disabled={submitting || parsedAmount <= 0}
            >
              {submitting
                ? 'Menyimpan...'
                : parsedAmount > 0
                ? `Simpan Pemasukan (+ ${formatRupiah(parsedAmount)})`
                : 'Simpan Pemasukan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
