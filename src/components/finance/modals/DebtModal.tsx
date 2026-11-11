import { useState, useEffect } from 'react';
import type { DebtType } from '../../../types/finance';
import { DEBT_TYPE_LABELS } from '../../../types/finance';
import { createDebt } from '../../../services/finance';
import { useToast } from '../../../hooks/useToast';
import { Button, SecondaryButton, SelectInput, TextInput, Field } from '../../ui';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function DebtModal({ isOpen, onClose, onSuccess }: DebtModalProps) {
  const { push } = useToast();
  const [creditor, setCreditor] = useState('');
  const [type, setType] = useState<DebtType>('bank_loan');
  const [principal, setPrincipal] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [monthly, setMonthly] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [tenor, setTenor] = useState('12');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCreditor('');
      setType('bank_loan');
      setPrincipal('');
      setOutstanding('');
      setMonthly('');
      setDueDay('1');
      setTenor('12');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor.trim()) {
      push('Nama kreditur / instansi utang wajib diisi.', 'error');
      return;
    }
    const princ = Number(principal);
    if (!princ || princ <= 0) {
      push('Jumlah pinjaman awal harus lebih dari 0.', 'error');
      return;
    }
    const monthlyAmt = Number(monthly);
    if (!monthlyAmt || monthlyAmt <= 0) {
      push('Nominal cicilan bulanan harus lebih dari 0.', 'error');
      return;
    }
    const tenorNum = parseInt(tenor, 10);
    if (!tenorNum || tenorNum <= 0) {
      push('Sisa tenor bulan harus minimal 1.', 'error');
      return;
    }
    const dueDayNum = parseInt(dueDay, 10);
    if (!dueDayNum || dueDayNum < 1 || dueDayNum > 31) {
      push('Tanggal jatuh tempo harus di antara 1 - 31.', 'error');
      return;
    }

    const outst = outstanding ? Number(outstanding) : princ;

    setSubmitting(true);
    try {
      await createDebt({
        creditor_name: creditor.trim(),
        debt_type: type,
        principal_amount: princ,
        outstanding_principal: outst,
        monthly_installment: monthlyAmt,
        due_day: dueDayNum,
        remaining_tenor: tenorNum,
        notes: notes.trim(),
      });
      push('Kewajiban utang baru berhasil dicatat!');
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal mencatat utang', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-base">Catat Kewajiban Utang Baru</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nama Kreditur / Jenis Utang">
            <TextInput
              placeholder="Contoh: KPR BCA, Kartu Kredit Mandiri, Cicilan Laptop"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Kategori Utang">
            <SelectInput
              value={type}
              onChange={(e) => setType(e.target.value as DebtType)}
            >
              {Object.entries(DEBT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Total Pinjaman Awal (Rp)">
              <TextInput
                type="number"
                placeholder="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                required
              />
            </Field>

            <Field label="Sisa Pokok Saat Ini (Rp)">
              <TextInput
                type="number"
                placeholder="Sama jika baru mulai"
                value={outstanding}
                onChange={(e) => setOutstanding(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Field label="Cicilan per Bulan (Rp)">
                <TextInput
                  type="number"
                  placeholder="0"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field label="Tgl Tempo">
              <TextInput
                type="number"
                min="1"
                max="31"
                placeholder="Tgl (1-31)"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Sisa Tenor (Jumlah Bulan)">
            <TextInput
              type="number"
              min="1"
              placeholder="Contoh: 12"
              value={tenor}
              onChange={(e) => setTenor(e.target.value)}
              required
            />
          </Field>

          <Field label="Catatan Tambahan (Opsional)">
            <TextInput
              placeholder="Contoh: Bunga flat 5%, auto debet tiap tgl 25"
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
            <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Utang'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

