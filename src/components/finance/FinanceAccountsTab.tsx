import type { Account } from '../../types/finance';
import { ACCOUNT_TYPE_LABELS } from '../../types/finance';
import { formatRupiah } from '../../services/finance';
import { Button, Card, EmptyState } from '../ui';

interface FinanceAccountsTabProps {
  accounts: Account[];
  onOpenAddAccount: () => void;
  onDeleteAccount: (account: Account) => void;
}

export function FinanceAccountsTab({
  accounts,
  onOpenAddAccount,
  onDeleteAccount,
}: FinanceAccountsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Kelola dompet tunai, rekening bank, tabungan, dan dompet digital (e-wallet).
        </p>
        <Button onClick={onOpenAddAccount} className="text-xs py-2">
          + Tambah Rekening
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="Belum ada rekening"
          desc="Tambahkan rekening pertama Anda seperti 'BCA', 'Dompet Tunai', atau 'GoPay'."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className="relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {ACCOUNT_TYPE_LABELS[acc.account_type]}
                  </span>
                  <button
                    onClick={() => onDeleteAccount(acc)}
                    className="text-red-400 hover:text-red-600 text-xs"
                    title="Hapus Rekening"
                  >
                    ×
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{acc.name}</h3>
                {acc.notes && <p className="text-xs text-slate-400 mt-0.5">{acc.notes}</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400">Saldo Terkini</span>
                  <p className="text-base font-bold text-slate-900">
                    {formatRupiah(acc.current_balance)}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">
                  Awal: {formatRupiah(acc.opening_balance)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
