import { useState, useEffect } from 'react';
import type { Debt, Account } from '../../../types/finance';
import { formatRupiah, recordDebtPayment } from '../../../services/finance';
import { todayJakartaISO } from '../../../lib/time';
import { useToast } from '../../../hooks/useToast';
import { Button, SecondaryButton, SelectInput, TextInput, Field } from '../../ui';

interface DebtPaymentModalProps {
  debt: Debt | null;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function DebtPaymentModal({
  debt,
  accounts,
  onClose,
  onSuccess,
}: DebtPaymentModalProps) {
  const { push } = useToast();
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(todayJakartaISO());
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('0');
  const [fee, setFee] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (debt) {
      setAccountId(accounts[0]?.id ?? '');
      setDate(todayJakartaISO());
      setPrincipal(String(debt.monthly_installment || ''));
      setInterest('0');
      setFee('0');
      setNotes('');
    }
  }, [debt, accounts]);

  if (!debt) return null;

  const totalDeduction =
    (Number(principal) || 0) + (Number(interest) || 0) + (Number(fee) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      push('Pilih rekening untuk pembayaran cicilan.', 'error');
      return;
    }
    const princ = Number(principal);
    if (!princ || princ <= 0) {
      push('Nominal pembayaran pokok harus lebih dari 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await recordDebtPayment({
        debt_id: debt.id,
        account_id: accountId,
        payment_date: date,
        principal_paid: princ,
        interest_paid: Number(interest) || 0,
        fee_paid: Number(fee) || 0,
        notes: notes.trim(),
      });
      push('Pembayaran cicilan berhasil dicatat dan memotong saldo rekening!');
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal memproses pembayaran cicilan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Bayar Cicilan Utang</h3>
            <p className="text-xs text-slate-500">{debt.creditor_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Rekening Sumber Dana">
            <SelectInput
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>

            <Field label="Pembayaran Pokok (Rp)">
              <TextInput
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Bunga (Opsional)">
              <TextInput
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              />
            </Field>

            <Field label="Biaya Admin (Opsional)">
              <TextInput
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </Field>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
            <span className="text-slate-600">Total Potong Saldo:</span>
            <span className="text-sm font-bold text-slate-900">
              {formatRupiah(totalDeduction)}
            </span>
          </div>

          <Field label="Catatan Pembayaran">
            <TextInput
              placeholder="Contoh: Cicilan ke-5 bulan ini"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Batal
            </SecondaryButton>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

