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
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f43f5e', // rose
  '#64748b', // slate
  '#14b8a6', // teal
  '#eab308', // yellow
];

export function FinancePlannerTab({ summary, health }: FinancePlannerTabProps) {
  const [projectionRange, setProjectionRange] = useState<3 | 6 | 12>(6);
  const currentProjections = (summary.projections || []).slice(0, projectionRange);

  return (
    <div className="space-y-6">
      {/* Header Card: CFP Score & Diagnosis */}
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide border border-indigo-400/30">
                CFP Advisory Engine
              </span>
              <span className="text-xs text-slate-400">Kesehatan Finansial Keluarga</span>
            </div>
            <h2 className="text-xl font-bold text-white">Financial Health Score</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Evaluasi otomatis berdasarkan rasio utang aman (DSR), ketahanan dana darurat,
              laju tabungan, dan kekayaan bersih riil Anda.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm self-start md:self-auto">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor</span>
              <span className="text-3xl font-black text-indigo-400">{health.healthScore}</span>
              <span className="text-[10px] text-slate-400 block">/ 100</span>
            </div>
            <div className="border-l border-white/10 pl-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <span className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-1 rounded-md border ${health.statusColor}`}>
                {health.status}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Financial Ratios */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Debt Service (DSR)
            </span>
            <p className={`text-base font-bold mt-0.5 ${health.dsrPercent > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {health.dsrPercent}%
            </p>
            <span className="text-[10px] text-slate-400 block">
              {health.dsrPercent <= 30 ? '✓ Sangat Aman (<30%)' : '⚠ Di atas batas aman (>30%)'}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Dana Darurat
            </span>
            <p className={`text-base font-bold mt-0.5 ${health.emergencyFundMonths >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {health.emergencyFundMonths} Bulan
            </p>
            <span className="text-[10px] text-slate-400 block">
              {health.emergencyFundMonths >= 6
                ? '✓ Sangat Kokoh (≥6 bln)'
                : health.emergencyFundMonths >= 3
                ? '✓ Cukup (3-6 bln)'
                : '⚠ Butuh Ditingkatkan (<3 bln)'}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Savings Rate
            </span>
            <p className={`text-base font-bold mt-0.5 ${health.savingsRatePercent >= 20 ? 'text-emerald-400' : health.savingsRatePercent > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {health.savingsRatePercent}%
            </p>
            <span className="text-[10px] text-slate-400 block">
              {health.savingsRatePercent >= 20 ? '✓ Target Tercapai (≥20%)' : health.savingsRatePercent > 0 ? 'Wajar (0-20%)' : '⚠ Defisit Kas'}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Kekayaan Bersih (Net Worth)
            </span>
            <p className={`text-base font-bold mt-0.5 ${health.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatRupiah(health.netWorth)}
            </p>
            <span className="text-[10px] text-slate-400 block">
              Saldo aset dikurangi utang
            </span>
          </div>
        </div>
      </Card>

      {/* CFP Recommendations Checklist */}
      <Card className="border-indigo-100 bg-white shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="text-base">💡</span>
          <h3 className="font-bold text-sm text-slate-900">
            Rekomendasi Aksi dari Certified Financial Planner
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {health.advice.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs ${
                item.level === 'danger'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                  : item.level === 'warning'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <span>{item.level === 'danger' ? '🚨' : item.level === 'warning' ? '⚠️' : '✅'}</span>
                  <span>{item.title}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-600">
                  {item.category}
                </span>
              </div>
              <p className="leading-relaxed text-slate-600 mt-1">{item.message}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* CFP INVESTMENT READINESS & SIMULATOR */}
      {health.investmentReadiness && (
        <Card className="border-indigo-100 bg-white shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-bold text-lg shadow-xs">
                📈
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    Evaluasi Kesiapan Investasi & Estimasi Alokasi
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
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
                <p className="text-xs text-slate-500 mt-0.5">
                  Berdasarkan kaidah Piramida Keuangan Certified Financial Planner (CFP).
                </p>
              </div>
            </div>

            {/* Status Header Pill */}
            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Rekomendasi Investasi Bulanan
              </span>
              <span className="text-base sm:text-lg font-black text-indigo-700">
                {health.investmentReadiness.recommendedMonthlyAmount > 0
                  ? `${formatRupiah(health.investmentReadiness.recommendedMonthlyAmount)} / bln`
                  : 'Fokus Dana Darurat Dulu'}
              </span>
            </div>
          </div>

          {/* Diagnosis Headline & Explanation */}
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              health.investmentReadiness.readinessColor === 'emerald'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : health.investmentReadiness.readinessColor === 'amber'
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <h4 className="font-bold text-sm mb-1">{health.investmentReadiness.headline}</h4>
            <p className="leading-relaxed text-slate-700">{health.investmentReadiness.explanation}</p>
          </div>

          {/* 3 Core Prerequisites (Syarat Sebelum Investasi) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                3 Syarat Keamanan Finansial Sebelum Berinvestasi
              </span>
              <span className="text-[10px] text-slate-400">Prinsip CFP Piramida Keuangan</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {health.investmentReadiness.conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    cond.isMet
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] truncate">{cond.label}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        cond.isMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cond.isMet ? '✓ Aman' : '✕ Belum'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-0.5 border-t border-slate-100">
                    <span className="text-slate-500">Saat Ini:</span>
                    <span className={`font-semibold ${cond.isMet ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {cond.currentValue}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Target Ideal:</span>
                    <span className="font-medium text-slate-600">{cond.targetValue}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 leading-tight">{cond.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            ⚖️ <strong>Disclaimer Finansial:</strong> Evaluasi dan estimasi investasi di atas bersifat simulasi edukatif berdasarkan standar perencana keuangan (CFP). Keputusan investasi sepenuhnya merupakan tanggung jawab pribadi pengguna. Pastikan selalu memahami profil risiko Anda sebelum menempatkan dana.
          </div>
        </Card>
      )}

      {/* CHART 1: 6-Month Cash Flow Trend */}
      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Tren Arus Kas (6 Bulan Terakhir)
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan pemasukan, pengeluaran rutin, dan alokasi pembayaran cicilan utang.
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.cashFlowHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => formatRupiahShort(Number(v) || 0)}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${formatRupiah(Number(value) || 0)} (${formatRupiahShort(Number(value) || 0)})`,
                  name === 'income' ? 'Pemasukan' : name === 'expense' ? 'Pengeluaran' : name === 'debtPayment' ? 'Cicilan Utang' : 'Net Arus Kas',
                ]}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(val) => {
                  if (val === 'income') return 'Pemasukan';
                  if (val === 'expense') return 'Pengeluaran';
                  if (val === 'debtPayment') return 'Cicilan Utang';
                  return val;
                }}
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="expense" />
              <Bar dataKey="debtPayment" fill="#f59e0b" radius={[4, 4, 0, 0]} name="debtPayment" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* CHART 2 & 3: Expense Breakdown Donut & Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut Chart: Komposisi Pengeluaran Bulan Ini */}
        <Card className="space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900">
              Distribusi Pengeluaran Bulan Ini
            </h3>
            <p className="text-xs text-slate-500">
              Berdasarkan kategori transaksi pengeluaran aktif.
            </p>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <p>Belum ada pengeluaran di bulan ini.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-[11px] text-slate-600">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* CHART 3: Proyeksi Saldo (AreaChart) */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Proyeksi Saldo Kumulatif
              </h3>
              <p className="text-xs text-slate-500">
                Simulasi pertumbuhan kas berdasarkan arus kas rata-rata.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setProjectionRange(3)}
                className={`px-2 py-1 rounded-md transition ${
                  projectionRange === 3
                    ? 'bg-white shadow text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3B
              </button>
              <button
                onClick={() => setProjectionRange(6)}
                className={`px-2 py-1 rounded-md transition ${
                  projectionRange === 6
                    ? 'bg-white shadow text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                6B
              </button>
              <button
                onClick={() => setProjectionRange(12)}
                className={`px-2 py-1 rounded-md transition ${
                  projectionRange === 12
                    ? 'bg-white shadow text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                12B
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentProjections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => formatRupiahShort(Number(v) || 0)}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${formatRupiah(Number(val) || 0)} (${formatRupiahShort(Number(val) || 0)})`,
                    'Estimasi Saldo',
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="projectedBalance"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            * Catatan: Proyeksi di atas merupakan simulasi matematis berbasis arus kas rata-rata, bukan jaminan saldo pasti.
          </p>
        </Card>
      </div>
    </div>
  );
}
