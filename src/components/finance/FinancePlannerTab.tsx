import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import type { FinanceSummary, FinancialHealthAnalysis } from '../../types/finance';
import { formatRupiah, formatRupiahShort } from '../../services/finance';
import { Card } from '../ui';

interface FinancePlannerTabProps {
  summary: FinanceSummary;
  health: FinancialHealthAnalysis;
}

const PIE_COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#64748b',
  '#eab308',
];

const SERIES_LABELS: Record<string, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  debtPayment: 'Cicilan Utang',
  projectedBalance: 'Estimasi Saldo',
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm text-xs space-y-1.5 min-w-[190px]">
      <p className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 text-sm">{label}</p>
      {payload.map((entry: any, index: number) => {
        const val = Number(entry.value) || 0;
        const displayName = SERIES_LABELS[entry.dataKey || entry.name] || entry.name || 'Nilai';

        return (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {displayName}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{formatRupiah(val)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface PillarCardProps {
  title: string;
  targetLabel: string;
  value: React.ReactNode;
  valueClass?: string;
  footerLabel: string;
  footerStatus: string;
  footerClass?: string;
  footerTitle?: string;
}

function PillarCard({
  title,
  targetLabel,
  value,
  valueClass = 'text-slate-900',
  footerLabel,
  footerStatus,
  footerClass = 'text-slate-700',
  footerTitle,
}: PillarCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
          {targetLabel}
        </span>
      </div>
      <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 shrink-0">{footerLabel}</span>
        <span
          className={`font-semibold tabular-nums truncate ${footerClass}`}
          title={footerTitle}
        >
          {footerStatus}
        </span>
      </div>
    </div>
  );
}

export function FinancePlannerTab({ summary, health }: FinancePlannerTabProps) {
  const [projectionRange, setProjectionRange] = useState<3 | 6 | 12>(6);
  const currentProjections = (summary.projections || []).slice(0, projectionRange);

  const totalCategoryExpense = useMemo(
    () => summary.categoryBreakdown.reduce((acc, item) => acc + (Number(item.amount) || 0), 0),
    [summary.categoryBreakdown]
  );

  const statusBadgeStyle =
    {
      'Sangat Sehat': 'bg-emerald-50 text-emerald-800 border-emerald-300',
      Sehat: 'bg-blue-50 text-blue-800 border-blue-300',
      Waspada: 'bg-amber-50 text-amber-800 border-amber-300',
      Kritis: 'bg-rose-50 text-rose-800 border-rose-300',
    }[health.status] || 'bg-slate-50 text-slate-800 border-slate-300';

  const scoreBarColor =
    health.healthScore >= 80
      ? 'bg-emerald-500'
      : health.healthScore >= 65
        ? 'bg-indigo-600'
        : health.healthScore >= 45
          ? 'bg-amber-500'
          : 'bg-rose-500';

  return (
    <div className="space-y-6">
      {/* 1. MASTER HEADER CARD: CFP SCORE & 4 PILLARS */}
      <Card className="p-5 sm:p-7 bg-gradient-to-b from-white to-slate-50/70 border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
                CFP Advisory Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Kesehatan Finansial Keluarga
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Financial Health Score
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Evaluasi berbasis 4 pilar standar perencana keuangan: batas cicilan aman, ketahanan dana darurat, laju tabungan rutin, dan kekayaan bersih riil.
            </p>
          </div>

          {/* Master Score Display */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto w-full sm:w-auto sm:min-w-[230px] space-y-3">
            <div className="flex items-center justify-between gap-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Skor Anda
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tabular-nums tracking-tight text-indigo-600">
                    {health.healthScore}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="border-l border-slate-200 pl-4 space-y-1 text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Status
                </span>
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${statusBadgeStyle}`}
                >
                  {health.status}
                </span>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
                style={{ width: `${Math.min(100, Math.max(0, health.healthScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Core Pillars Grid */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              4 Pilar Penilaian Kesehatan Finansial
            </span>
            <span className="text-xs text-slate-400">Target skor maksimal: 100 poin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <PillarCard
              title="Beban Cicilan (DSR)"
              targetLabel="Maks. 30%"
              value={`${health.dsrPercent}%`}
              valueClass={health.dsrPercent > 35 ? 'text-rose-600' : 'text-slate-900'}
              footerLabel="Evaluasi:"
              footerStatus={health.dsrPercent <= 30 ? 'Aman' : 'Perlu Diturunkan'}
              footerClass={health.dsrPercent <= 30 ? 'text-emerald-700' : 'text-rose-700'}
            />

            <PillarCard
              title="Dana Darurat"
              targetLabel="Target 3–6 Bln"
              value={
                <>
                  {health.emergencyFundMonths}{' '}
                  <span className="text-sm font-semibold text-slate-500">Bulan</span>
                </>
              }
              footerLabel="Ketahanan:"
              footerStatus={
                health.emergencyFundMonths >= 6
                  ? 'Sangat Kokoh'
                  : health.emergencyFundMonths >= 3
                    ? 'Cukup Aman'
                    : 'Perlu Ditingkatkan'
              }
              footerClass={
                health.emergencyFundMonths >= 3 ? 'text-emerald-700' : 'text-amber-700'
              }
            />

            <PillarCard
              title="Laju Tabungan"
              targetLabel="Target ≥ 20%"
              value={`${health.savingsRatePercent}%`}
              valueClass={
                health.savingsRatePercent >= 20
                  ? 'text-emerald-600'
                  : health.savingsRatePercent >= 0
                    ? 'text-slate-900'
                    : 'text-rose-600'
              }
              footerLabel="Arus Kas:"
              footerStatus={
                health.savingsRatePercent >= 20
                  ? 'Tabungan Prima'
                  : health.savingsRatePercent >= 0
                    ? 'Wajar / Impas'
                    : 'Kas Defisit'
              }
              footerClass={
                health.savingsRatePercent >= 20
                  ? 'text-emerald-700'
                  : health.savingsRatePercent >= 0
                    ? 'text-slate-700'
                    : 'text-rose-700'
              }
            />

            <PillarCard
              title="Kekayaan Bersih"
              targetLabel="Aset − Utang"
              value={formatRupiahShort(health.netWorth)}
              valueClass={health.netWorth >= 0 ? 'text-slate-900' : 'text-rose-600'}
              footerLabel="Saldo Riil:"
              footerStatus={formatRupiah(health.netWorth)}
              footerClass={health.netWorth >= 0 ? 'text-emerald-700' : 'text-rose-700'}
              footerTitle={formatRupiah(health.netWorth)}
            />
          </div>
        </div>
      </Card>

      {/* 2. CFP ACTIONABLE ADVICE */}
      <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900">
            Rekomendasi Aksi Finansial
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Langkah prioritas untuk mengoptimalkan arus kas dan perlindungan keluarga.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {health.advice.map((item, idx) => {
            const isDanger = item.level === 'danger';
            const isWarning = item.level === 'warning';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border-l-4 border transition ${
                  isDanger
                    ? 'border-l-rose-500 bg-rose-50/40 border-slate-200'
                    : isWarning
                      ? 'border-l-amber-500 bg-amber-50/40 border-slate-200'
                      : 'border-l-emerald-500 bg-emerald-50/40 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {item.category}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isDanger
                        ? 'bg-rose-100 text-rose-800'
                        : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isDanger ? 'Prioritas Kritis' : isWarning ? 'Perlu Perhatian' : 'Optimal'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3. CFP INVESTMENT READINESS & ESTIMATED ALLOCATION */}
      {health.investmentReadiness && (
        <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  Evaluasi Kesiapan Investasi
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    health.investmentReadiness.readinessColor === 'emerald'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : health.investmentReadiness.readinessColor === 'amber'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {health.investmentReadiness.readinessStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Piramida Perencanaan Finansial: memastikan fondasi kas aman sebelum masuk ke instrumen berisiko.
              </p>
            </div>

            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 shrink-0 text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Rekomendasi Alokasi
              </span>
              <span className="text-lg sm:text-xl font-extrabold tabular-nums text-indigo-700">
                {health.investmentReadiness.recommendedMonthlyAmount > 0
                  ? `${formatRupiah(health.investmentReadiness.recommendedMonthlyAmount)} / bln`
                  : 'Fokus Dana Darurat Dulu'}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed ${
              health.investmentReadiness.readinessColor === 'emerald'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : health.investmentReadiness.readinessColor === 'amber'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
            }`}
          >
            <h4 className="font-bold text-sm sm:text-base mb-1">
              {health.investmentReadiness.headline}
            </h4>
            <p className="text-slate-700 text-xs sm:text-sm">
              {health.investmentReadiness.explanation}
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              3 Syarat Fondasi Sebelum Berinvestasi
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {health.investmentReadiness.conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    cond.isMet
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs">{cond.label}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        cond.isMet
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cond.isMet ? 'Terpenuhi' : 'Belum'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Saat Ini:</span>
                      <span
                        className={`font-bold tabular-nums ${
                          cond.isMet ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {cond.currentValue}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-400">
                      <span>Target:</span>
                      <span className="font-medium tabular-nums text-slate-700">
                        {cond.targetValue}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 pt-1.5 border-t border-slate-100 leading-relaxed">
                    {cond.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700">Catatan:</strong> Evaluasi dan estimasi alokasi di atas merupakan simulasi matematis berbasis standar perencana keuangan (CFP). Keputusan investasi sepenuhnya merupakan tanggung jawab pribadi.
          </p>
        </Card>
      )}

      {/* 4. CHART 1: TREN ARUS KAS 6 BULAN */}
      <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900">
            Tren Arus Kas (6 Bulan Terakhir)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan pemasukan, pengeluaran operasional, dan pembayaran cicilan utang.
          </p>
        </div>

        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={summary.cashFlowHistory}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                width={52}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatRupiahShort(Number(v) || 0)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => (
                  <span className="text-xs font-semibold text-slate-700 ml-1">
                    {SERIES_LABELS[val] || val}
                  </span>
                )}
              />
              <Bar
                dataKey="income"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                name="income"
                maxBarSize={36}
              />
              <Bar
                dataKey="expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                name="expense"
                maxBarSize={36}
              />
              <Bar
                dataKey="debtPayment"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                name="debtPayment"
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 5. CHART 2 & 3: DISTRIBUTION DONUT & PROJECTION AREA CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart + Structured Category Breakdown */}
        <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Distribusi Pengeluaran Bulan Ini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Porsi alokasi uang keluar berdasarkan kategori.
              </p>
            </div>
            {totalCategoryExpense > 0 && (
              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 block">Total</span>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {formatRupiahShort(totalCategoryExpense)}
                </span>
              </div>
            )}
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <p>Belum ada pengeluaran tercatat di bulan ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {summary.categoryBreakdown.map((item, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={item.color || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, _: any, item: any) => [
                        `${formatRupiah(Number(value) || 0)} (${item.payload.percentage}%)`,
                        item.payload.name,
                      ]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Structured Category Breakdown List */}
              <div className="space-y-2 border-t border-slate-100 pt-3 max-h-48 overflow-y-auto pr-1">
                {summary.categoryBreakdown.map((item, idx) => {
                  const color = item.color || PIE_COLORS[idx % PIE_COLORS.length];
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 min-w-0 font-medium text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                          {formatRupiah(item.amount)}{' '}
                          <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Proyeksi Saldo Kumulatif */}
        <Card className="p-5 sm:p-6 bg-white border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Proyeksi Saldo Kumulatif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasi saldo masa depan berbasis arus kas rata-rata.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto shrink-0">
              {([3, 6, 12] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setProjectionRange(range)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    projectionRange === range
                      ? 'bg-white shadow-sm text-indigo-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {range} Bln
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentProjections}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  width={52}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatRupiahShort(Number(v) || 0)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="projectedBalance"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  name="projectedBalance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-slate-400">
            Nominal pada sumbu grafik menggunakan format ringkas (misal 3,7 jt = Rp 3.700.000). Arahkan kursor atau ketuk titik grafik untuk detail lengkap.
          </p>
        </Card>
      </div>
    </div>
  );
}
