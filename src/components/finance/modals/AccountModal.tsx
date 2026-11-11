import { useState, useEffect } from 'react';
import type { AccountType } from '../../../types/finance';
import { ACCOUNT_TYPE_LABELS } from '../../../types/finance';
import { createAccount } from '../../../services/finance';
import { useToast } from '../../../hooks/useToast';
import { Button, SecondaryButton, SelectInput, TextInput, Field } from '../../ui';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function AccountModal({ isOpen, onClose, onSuccess }: AccountModalProps) {
  const { push } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [opening, setOpening] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType('bank');
      setOpening('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      push('Nama rekening wajib diisi.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createAccount({
        name: name.trim(),
        account_type: type,
        opening_balance: Number(opening) || 0,
        notes: notes.trim(),
      });
      push('Rekening baru berhasil dibuat!');
      onClose();
      await onSuccess();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal membuat rekening', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-base">Tambah Rekening / Kas</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nama Rekening / Dompet">
            <TextInput
              placeholder="Contoh: BCA Utama, Dompet Tunai, GoPay"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Jenis Rekening">
            <SelectInput
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
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
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </Field>

          <Field label="Catatan / Keterangan (Opsional)">
            <TextInput
              placeholder="Contoh: Rekening payroll gaji bulanan"
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
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Rekening'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

