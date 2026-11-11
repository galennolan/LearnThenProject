import { useState } from 'react';
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
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#64748b', // slate
  '#eab308', // yellow
];

/** Custom Tooltip dengan tampilan elegan & kontras tinggi */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
      <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 text-sm">{label}</p>
      {payload.map((entry: any, index: number) => {
        const val = Number(entry.value) || 0;
        const nameMap: Record<string, string> = {
          income: 'Pemasukan',
          expense: 'Pengeluaran',
          debtPayment: 'Cicilan Utang',
          projectedBalance: 'Estimasi Saldo',
        };
        const displayName = nameMap[entry.dataKey || entry.name] || entry.name || 'Nilai';

        return (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {displayName}
            </span>
            <span className="font-bold text-slate-900">
              {formatRupiah(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function FinancePlannerTab({ summary, health }: FinancePlannerTabProps) {
  const [projectionRange, setProjectionRange] = useState<3 | 6 | 12>(6);
  const currentProjections = (summary.projections || []).slice(0, projectionRange);

  // Status visual badge styling
  const statusBadgeStyle = {
    'Sangat Sehat': 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Sehat: 'bg-blue-50 text-blue-800 border-blue-300',
    Waspada: 'bg-amber-50 text-amber-800 border-amber-300',
    Kritis: 'bg-rose-50 text-rose-800 border-rose-300',
  }[health.status] || 'bg-slate-50 text-slate-800 border-slate-300';

  return (
    <div className="space-y-7">
      {/* 1. MASTER HEADER CARD: CFP SCORE & 4 PILLARS */}
      <Card className="p-6 md:p-8 bg-gradient-to-b from-white to-slate-50/70 border-slate-200 shadow-sm space-y-6">
        {/* Top: Score Gauge & Description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
                CFP Advisory Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">Kesehatan Finansial Keluarga</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Financial Health Score
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Analisis komprehensif mengacu pada 4 pilar standar perencana keuangan resmi (CFP): batas cicilan utang aman, ketahanan dana darurat, laju tabungan rutin, dan kekayaan bersih riil Anda.
            </p>
          </div>

          {/* Master Score Display */}
          <div className="flex items-center gap-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto min-w-[200px] justify-center">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Skor Anda
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-indigo-600">
                  {health.healthScore}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="border-l border-slate-200 pl-4 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Status
              </span>
              <span
                className={`inline-block text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${statusBadgeStyle}`}
              >
                {health.status}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars Grid */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              4 Pilar Penilaian Kesehatan Finansial
            </span>
            <span className="text-xs text-slate-400">Target skor maksimal: 100 poin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1: Beban Cicilan (DSR) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Beban Cicilan (DSR)
                </span>
                <span
                  className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded"
                  title="Persentase beban cicilan dari pendapatan bulanan"
                >
                  Maks. 30%
                </span>
              </div>
              <p
                className={`text-2xl font-black ${
                  health.dsrPercent > 35 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {health.dsrPercent}%
              </p>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Evaluasi:</span>
                <span
                  className={`font-bold ${
                    health.dsrPercent <= 30 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {health.dsrPercent <= 30 ? '✓ Sangat Aman' : '⚠ Perlu Diturunkan'}
                </span>
              </div>
            </div>

            {/* Pilar 2: Dana Darurat */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Dana Darurat
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Target: 3-6 Bln
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {health.emergencyFundMonths} <span className="text-sm font-semibold text-slate-500">Bulan</span>
              </p>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ketahanan:</span>
                <span
                  className={`font-bold ${
                    health.emergencyFundMonths >= 3 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {health.emergencyFundMonths >= 6
                    ? '✓ Sangat Kokoh'
                    : health.emergencyFundMonths >= 3
                    ? '✓ Cukup Aman'
                    : '⚠ Perlu Ditingkatkan'}
                </span>
              </div>
            </div>

            {/* Pilar 3: Savings Rate */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Laju Tabungan
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Target: ≥ 20%
                </span>
              </div>
              <p
                className={`text-2xl font-black ${
                  health.savingsRatePercent >= 20
                    ? 'text-emerald-600'
                    : health.savingsRatePercent >= 0
                    ? 'text-slate-900'
                    : 'text-rose-600'
                }`}
              >
                {health.savingsRatePercent}%
              </p>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Arus Kas:</span>
                <span
                  className={`font-bold ${
                    health.savingsRatePercent >= 20
                      ? 'text-emerald-700'
                      : health.savingsRatePercent >= 0
                      ? 'text-slate-700'
                      : 'text-rose-700'
                  }`}
                >
                  {health.savingsRatePercent >= 20
                    ? '✓ Tabungan Prima'
                    : health.savingsRatePercent >= 0
                    ? 'Wajar / Impas'
                    : '⚠ Kas Defisit'}
                </span>
              </div>
            </div>

            {/* Pilar 4: Net Worth */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Kekayaan Bersih
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Aset - Utang
                </span>
              </div>
              <p
                className={`text-2xl font-black truncate ${
                  health.netWorth >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatRupiahShort(health.netWorth)}
              </p>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo Riil:</span>
                <span
                  className={`font-bold truncate max-w-[130px] ${
                    health.netWorth >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                  title={formatRupiah(health.netWorth)}
                >
                  {formatRupiah(health.netWorth)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. CFP ACTIONABLE ADVICE */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Rekomendasi Aksi Finansial (CFP Advisory)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Langkah strategis prioritas untuk mengoptimalkan kesehatan arus kas dan perlindungan keluarga.
            </p>
          </div>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {item.category}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
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
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-lg text-slate-900">
                  Evaluasi Kesiapan Investasi & Estimasi Alokasi
                </h3>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
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
              <p className="text-xs text-slate-500 mt-1">
                Kaidah Piramida Perencanaan Finansial: Memastikan fondasi keamanan kas sebelum eksposur instrumen berisiko.
              </p>
            </div>

            {/* Rekomendasi Bulanan Box */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 shrink-0 text-left sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Rekomendasi Alokasi Investasi
              </span>
              <span className="text-xl font-extrabold text-indigo-700">
                {health.investmentReadiness.recommendedMonthlyAmount > 0
                  ? `${formatRupiah(health.investmentReadiness.recommendedMonthlyAmount)} / bln`
                  : 'Fokus Dana Darurat Dulu'}
              </span>
            </div>
          </div>

          {/* Headline Diagnosis Banner */}
          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed ${
              health.investmentReadiness.readinessColor === 'emerald'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : health.investmentReadiness.readinessColor === 'amber'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <h4 className="font-bold text-base mb-1">{health.investmentReadiness.headline}</h4>
            <p className="text-slate-700 text-xs sm:text-sm">{health.investmentReadiness.explanation}</p>
          </div>

          {/* 3 Syarat Fondasi Finansial */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              3 Syarat Keamanan Finansial Sebelum Berinvestasi
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {health.investmentReadiness.conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 ${
                    cond.isMet
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">{cond.label}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        cond.isMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cond.isMet ? '✓ Terpenuhi' : '✕ Belum'}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kondisi Saat Ini:</span>
                      <span className={`font-bold ${cond.isMet ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {cond.currentValue}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Target Standar:</span>
                      <span className="font-medium text-slate-700">{cond.targetValue}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 pt-1 border-t border-slate-100/60 leading-relaxed">
                    {cond.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
            💡 <strong>Disclaimer Finansial:</strong> Evaluasi dan estimasi alokasi di atas merupakan simulasi matematis berbasis standar perencana keuangan (CFP). Keputusan investasi sepenuhnya merupakan tanggung jawab pribadi.
          </div>
        </Card>
      )}

      {/* 4. CHART 1: TREN ARUS KAS 6 BULAN (GENEROUS HEIGHT & HIGH CLARITY) */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Tren Arus Kas (6 Bulan Terakhir)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan riil pemasukan masuk, pengeluaran operasional, dan alokasi pembayaran cicilan utang.
            </p>
          </div>
        </div>

        <div className="h-80 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={summary.cashFlowHistory}
              margin={{ top: 10, right: 15, left: -5, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatRupiahShort(Number(v) || 0)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={40}
                formatter={(val) => {
                  const labels: Record<string, string> = {
                    income: 'Pemasukan',
                    expense: 'Pengeluaran',
                    debtPayment: 'Cicilan Utang',
                  };
                  return <span className="text-xs font-semibold text-slate-700 ml-1">{labels[val] || val}</span>;
                }}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="income" maxBarSize={48} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="expense" maxBarSize={48} />
              <Bar dataKey="debtPayment" fill="#f59e0b" radius={[6, 6, 0, 0]} name="debtPayment" maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 5. CHART 2 & 3: DISTRIBUTION DONUT & PROJECTION AREA CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Komposisi Pengeluaran Bulan Ini */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Distribusi Pengeluaran Bulan Ini
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Porsi alokasi uang keluar berdasarkan kategori transaksi aktif.
            </p>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
              <p>Belum ada pengeluaran tercatat di bulan ini.</p>
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
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
                    contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={48}
                    formatter={(val) => <span className="text-xs font-medium text-slate-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Proyeksi Saldo Kumulatif */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Proyeksi Saldo Kumulatif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasi pertumbuhan kas masa depan berbasis arus kas rata-rata.
              </p>
            </div>

            {/* Pill range selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setProjectionRange(3)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  projectionRange === 3
                    ? 'bg-white shadow-xs text-indigo-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                3 Bln
              </button>
              <button
                onClick={() => setProjectionRange(6)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  projectionRange === 6
                    ? 'bg-white shadow-xs text-indigo-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                6 Bln
              </button>
              <button
                onClick={() => setProjectionRange(12)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  projectionRange === 12
                    ? 'bg-white shadow-xs text-indigo-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                12 Bln
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentProjections} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
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

          <p className="text-xs text-slate-400 italic">
            * Catatan: Nilai di sumbu grafik menggunakan format ringkas (misal 3,7 jt = Rp 3.700.000). Sorot titik grafik untuk melihat nominal detail.
          </p>
        </Card>
      </div>
    </div>
  );
}
