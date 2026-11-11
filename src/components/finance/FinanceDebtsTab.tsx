import type { Debt } from '../../types/finance';
import { DEBT_TYPE_LABELS } from '../../types/finance';
import { formatRupiah } from '../../services/finance';
import { Badge, Button, Card, EmptyState } from '../ui';

interface FinanceDebtsTabProps {
  debts: Debt[];
  onOpenAddDebt: () => void;
  onPayDebt: (debt: Debt) => void;
  onDeleteDebt: (debt: Debt) => void;
}

export function FinanceDebtsTab({
  debts,
  onOpenAddDebt,
  onPayDebt,
  onDeleteDebt,
}: FinanceDebtsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Pantau seluruh kewajiban utang, sisa pokok, tenor, dan jadwal pembayaran cicilan.
        </p>
        <Button onClick={onOpenAddDebt} className="text-xs py-2 bg-rose-600 hover:bg-rose-700">
          + Catat Utang Baru
        </Button>
      </div>

      {debts.length === 0 ? (
        <EmptyState
          title="Tidak ada utang tercatat"
          desc="Bagus! Tidak ada kewajiban cicilan utang. Jika ada pinjaman atau cicilan barang, catat di sini."
        />
      ) : (
        <div className="space-y-3">
          {debts.map((d) => {
            const paidOffPercent =
              d.principal_amount > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(
                        ((d.principal_amount - d.outstanding_principal) / d.principal_amount) * 100,
                      ),
                    ),
                  )
                : 100;

            return (
              <Card key={d.id} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {d.creditor_name}
                      </h3>
                      <Badge>{DEBT_TYPE_LABELS[d.debt_type] || d.debt_type}</Badge>
                      {d.status === 'paid_off' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          LUNAS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jatuh tempo setiap tanggal <strong>{d.due_day}</strong> • Sisa tenor: {d.remaining_tenor} bln
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {d.status === 'active' && (
                      <Button
                        onClick={() => onPayDebt(d)}
                        className="text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700"
                      >
                        Bayar Cicilan
                      </Button>
                    )}
                    <button
                      onClick={() => onDeleteDebt(d)}
                      className="text-xs text-red-500 hover:text-red-700 p-1"
                      title="Hapus data utang"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Progress Bar Pelunasan */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">
                      Sisa Pokok: <strong>{formatRupiah(d.outstanding_principal)}</strong>
                    </span>
                    <span className="font-bold text-indigo-600">{paidOffPercent}% Lunas</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${paidOffPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pinjaman Awal</span>
                    <span className="font-semibold text-slate-700">{formatRupiah(d.principal_amount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cicilan / Bulan</span>
                    <span className="font-semibold text-rose-600">{formatRupiah(d.monthly_installment)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sisa Tenor</span>
                    <span className="font-semibold text-slate-700">{d.remaining_tenor} Bulan</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Catatan</span>
                    <span className="font-medium text-slate-600 truncate block">{d.notes || '-'}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

