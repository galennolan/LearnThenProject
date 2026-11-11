import type {
  Transaction,
  Debt,
  CashFlowPoint,
  CategoryExpenseBreakdown,
  FinancialProjectionPoint,
  FinancialHealthAnalysis,
  InvestmentReadiness,
} from '../../types/finance';

export const PALETTE = [
  '#059669', // emerald
  '#4f46e5', // indigo
  '#e11d48', // rose
  '#d97706', // amber
  '#0284c7', // sky
  '#7c3aed', // violet
  '#db2777', // pink
  '#0d9488', // teal
  '#ea580c', // orange
  '#64748b', // slate
];

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatRupiah(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRupiahShort(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}${val} M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${sign}${val} jt`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toFixed(0);
    return `${sign}${val} rb`;
  }
  return `${sign}${abs}`;
}

/**
 * Menghitung arus kas 6 bulan terakhir (Pemasukan, Pengeluaran, Pembayaran Cicilan)
 */
export function calculateCashFlowHistory(
  transactions: Transaction[],
  referenceDate: Date = new Date(),
): CashFlowPoint[] {
  const history: CashFlowPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;

    let inc = 0;
    let exp = 0;
    let debtPay = 0;

    for (const t of transactions) {
      if (t.transaction_date && t.transaction_date.startsWith(key)) {
        const amt = Number(t.amount) || 0;
        if (t.transaction_type === 'income') {
          inc += amt;
        } else if (t.transaction_type === 'expense') {
          exp += amt;
        } else if (t.transaction_type === 'debt_payment') {
          debtPay += amt;
        }
      }
    }

    history.push({
      month: monthLabel,
      monthKey: key,
      income: inc,
      expense: exp,
      debtPayment: debtPay,
      netCashFlow: inc - exp - debtPay,
    });
  }

  return history;
}

/**
 * Menghitung distribusi pengeluaran bulan berjalan berdasarkan kategori
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  monthPrefix: string,
): CategoryExpenseBreakdown[] {
  const catExpenseMap = new Map<string, number>();
  let totalCurrentMonthExp = 0;

  for (const t of transactions) {
    if (t.transaction_date && t.transaction_date.startsWith(monthPrefix)) {
      if (t.transaction_type === 'expense' || t.transaction_type === 'debt_payment') {
        const catName =
          t.category_name || (t.transaction_type === 'debt_payment' ? 'Cicilan Utang' : 'Lain-lain');
        const amt = Number(t.amount) || 0;
        catExpenseMap.set(catName, (catExpenseMap.get(catName) || 0) + amt);
        totalCurrentMonthExp += amt;
      }
    }
  }

  return Array.from(catExpenseMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount], idx) => ({
      name,
      amount,
      percentage: totalCurrentMonthExp > 0 ? Math.round((amount / totalCurrentMonthExp) * 100) : 0,
      color: PALETTE[idx % PALETTE.length],
    }));
}

/**
 * Menghitung proyeksi saldo kumulatif masa depan (12 bulan ke depan)
 */
export function calculateFinancialProjections(
  totalBalance: number,
  monthlyIncome: number,
  monthlyExpense: number,
  activeDebts: Debt[],
  currentMonthDebtTx: number,
  referenceDate: Date = new Date(),
): FinancialProjectionPoint[] {
  const projections: FinancialProjectionPoint[] = [];
  let runningBalance = totalBalance;
  const estMonthlyIncome = monthlyIncome > 0 ? monthlyIncome : 0;
  const estMonthlyExpenseOnly = Math.max(0, monthlyExpense - currentMonthDebtTx);

  for (let m = 1; m <= 12; m++) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;

    let estDebtPayment = 0;
    for (const debt of activeDebts) {
      if (debt.remaining_tenor >= m) {
        estDebtPayment += Number(debt.monthly_installment) || 0;
      }
    }

    runningBalance = runningBalance + estMonthlyIncome - estMonthlyExpenseOnly - estDebtPayment;

    projections.push({
      month: label,
      monthKey: key,
      projectedBalance: Math.round(runningBalance),
      estimatedIncome: estMonthlyIncome,
      estimatedExpense: estMonthlyExpenseOnly,
      estimatedDebtPayment: estDebtPayment,
    });
  }

  return projections;
}

/**
 * Mesin Analisis Kesehatan Finansial & Kesiapan Investasi (CFP Advisory Engine)
 */
export function calculateCFPHealthAnalysis(
  totalBalance: number,
  monthlyIncome: number,
  monthlyExpense: number,
  monthlyDebtObligation: number,
  totalOutstandingDebt: number,
  activeDebtsCount: number,
): FinancialHealthAnalysis {
  const dsrPercent =
    monthlyIncome > 0
      ? Math.round((monthlyDebtObligation / monthlyIncome) * 100)
      : monthlyDebtObligation > 0
      ? 100
      : 0;

  const emergencyFundMonths =
    monthlyExpense > 0
      ? Math.round((totalBalance / monthlyExpense) * 10) / 10
      : totalBalance > 0
      ? 12
      : 0;

  const savingsRatePercent =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
      : 0;

  const netWorth = totalBalance - totalOutstandingDebt;

  // Skor Kesehatan Finansial 0 - 100
  let score = 0;
  if (dsrPercent === 0 && activeDebtsCount === 0) score += 35;
  else if (dsrPercent <= 20) score += 35;
  else if (dsrPercent <= 30) score += 28;
  else if (dsrPercent <= 40) score += 18;
  else if (dsrPercent <= 50) score += 10;
  else score += 5;

  if (emergencyFundMonths >= 6) score += 30;
  else if (emergencyFundMonths >= 3) score += 22;
  else if (emergencyFundMonths >= 1) score += 14;
  else score += 5;

  if (savingsRatePercent >= 25) score += 25;
  else if (savingsRatePercent >= 15) score += 20;
  else if (savingsRatePercent >= 5) score += 12;
  else if (savingsRatePercent >= 0) score += 8;
  else score += 0;

  if (netWorth > 0) score += 10;
  else if (netWorth === 0) score += 5;
  else score += 0;

  score = Math.min(100, Math.max(0, score));

  let status: FinancialHealthAnalysis['status'] = 'Sehat';
  let statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
  if (score >= 80) {
    status = 'Sangat Sehat';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  } else if (score >= 65) {
    status = 'Sehat';
    statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
  } else if (score >= 45) {
    status = 'Waspada';
    statusColor = 'text-amber-700 bg-amber-50 border-amber-300';
  } else {
    status = 'Kritis';
    statusColor = 'text-rose-700 bg-rose-50 border-rose-300';
  }

  const advice: FinancialHealthAnalysis['advice'] = [];

  // Saran DSR
  if (dsrPercent > 35) {
    advice.push({
      category: 'Beban Utang (DSR)',
      level: 'danger',
      title: `Rasio Cicilan Tinggi (${dsrPercent}%)`,
      message:
        'Standar CFP menyarankan total cicilan maksimal 30% dari pendapatan bulanan. Prioritaskan pelunasan utang berbunga tertinggi untuk melegakan arus kas.',
    });
  } else if (dsrPercent > 0) {
    advice.push({
      category: 'Beban Utang (DSR)',
      level: 'good',
      title: `Rasio Cicilan Terkendali (${dsrPercent}%)`,
      message:
        'Beban cicilan Anda berada dalam koridor aman (< 30%). Pertahankan disiplin pembayaran hingga seluruh tenor selesai.',
    });
  } else {
    advice.push({
      category: 'Beban Utang (DSR)',
      level: 'good',
      title: 'Bebas Beban Cicilan (0%)',
      message:
        'Kondisi keuangan bebas utang. Seluruh sisa arus kas dapat dioptimalkan untuk akumulasi aset dan investasi.',
    });
  }

  // Saran Dana Darurat
  if (emergencyFundMonths < 3) {
    advice.push({
      category: 'Dana Darurat',
      level: emergencyFundMonths < 1 ? 'danger' : 'warning',
      title: `Cadangan Kas ${emergencyFundMonths} Bulan`,
      message: `Cadangan kas Anda saat ini cukup untuk menopang sekitar ${emergencyFundMonths} bulan biaya hidup. Targetkan minimal 3–6 bulan pengeluaran untuk perlindungan keluarga dari risiko mendadak.`,
    });
  } else {
    advice.push({
      category: 'Dana Darurat',
      level: 'good',
      title: `Cadangan Kas Kokoh (${emergencyFundMonths} Bulan)`,
      message: 'Dana darurat Anda sudah memenuhi standar ideal keluarga (3–6 bulan pengeluaran).',
    });
  }

  // Saran Tabungan & Arus Kas
  if (savingsRatePercent < 0) {
    advice.push({
      category: 'Arus Kas',
      level: 'danger',
      title: 'Defisit Bulanan',
      message:
        'Pengeluaran bulan ini melebihi pemasukan. Segera tinjau pengeluaran non-primer agar tidak menggerus saldo tabungan pokok.',
    });
  } else if (savingsRatePercent < 15) {
    advice.push({
      category: 'Arus Kas',
      level: 'warning',
      title: `Tingkat Tabungan ${savingsRatePercent}%`,
      message:
        'Rekomendasi perencana keuangan idealnya menyisihkan 15–20% pendapatan ke tabungan atau investasi rutin.',
    });
  } else {
    advice.push({
      category: 'Arus Kas',
      level: 'good',
      title: `Tingkat Tabungan Prima (${savingsRatePercent}%)`,
      message:
        'Kemampuan menyisihkan uang Anda sangat baik. Anda berada di jalur yang tepat untuk pertumbuhan kekayaan jangka panjang.',
    });
  }

  // Analisis Kesiapan Investasi (CFP Piramida Keuangan)
  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpense);
  const targetEmergencyFund = Math.max(monthlyExpense * 6, 6000000);
  const emergencyFundGap = Math.max(0, targetEmergencyFund - totalBalance);

  const condCashFlow = {
    label: 'Arus Kas Bulanan Surplus',
    isMet: monthlySurplus > 0 && monthlyIncome > 0,
    currentValue: monthlySurplus > 0 ? `+${formatRupiah(monthlySurplus)}/bln` : 'Defisit / Nihil',
    targetValue: '> Rp 0 (Surplus)',
    note: 'Sumber dana investasi rutin berasal dari selisih positif antara pemasukan dan pengeluaran.',
  };

  const condDsr = {
    label: 'Beban Cicilan Utang Aman (DSR ≤ 30%)',
    isMet: dsrPercent <= 30,
    currentValue: `${dsrPercent}%`,
    targetValue: 'Maks. 30%',
    note: 'Jika cicilan > 30%, bunga pinjaman biasanya lebih tinggi daripada potensi return investasi awal.',
  };

  const condEmergencyFund = {
    label: 'Cadangan Dana Darurat Terisi (≥ 3 Bulan)',
    isMet: emergencyFundMonths >= 3,
    currentValue: `${emergencyFundMonths} Bulan (${formatRupiah(totalBalance)})`,
    targetValue: `Min. 3-6 Bulan (${formatRupiah(targetEmergencyFund)})`,
    note: 'Perisai keuangan agar Anda tidak terpaksa menjual instrumen investasi saat pasar turun.',
  };

  let readinessStatus: InvestmentReadiness['readinessStatus'] = 'Belum Siap';
  let readinessColor: InvestmentReadiness['readinessColor'] = 'rose';
  let headline = '';
  let explanation = '';
  let recommendedPercentage = 0;
  let recommendedMonthlyAmount = 0;

  if (!condCashFlow.isMet || dsrPercent > 35 || emergencyFundMonths < 1) {
    readinessStatus = 'Belum Siap';
    readinessColor = 'rose';
    recommendedPercentage = 0;
    recommendedMonthlyAmount = 0;
    headline = 'Fokus Perbaiki Fondasi: Lunasi Utang & Kumpulkan Dana Darurat';
    explanation =
      'Standar Certified Financial Planner (CFP) menyarankan untuk menahan diri dari produk investasi volatil terlebih dahulu. Sisa dana saat ini wajib diprioritaskan untuk melunasi cicilan berbunga tinggi serta mengisi rekening dana darurat minimal hingga 3 bulan biaya hidup.';
  } else if (emergencyFundMonths < 3 || dsrPercent > 25 || savingsRatePercent < 15) {
    readinessStatus = 'Siap Bertahap';
    readinessColor = 'amber';
    recommendedPercentage = 10;
    const baseAmount = monthlyIncome > 0 ? monthlyIncome * 0.1 : 250000;
    recommendedMonthlyAmount = Math.max(100000, Math.min(baseAmount, monthlySurplus * 0.4 || baseAmount));
    headline = 'Mulai Bertahap: Alokasikan ke Instrumen Berisiko Rendah';
    explanation =
      'Fondasi arus kas Anda sudah mulai terbentuk. Anda disarankan membagi sisa dana bulanan: 60-70% dialokasikan mengisi dana darurat di tabungan likuid, dan 30-40% (~10% pendapatan) mulai diinvestasikan ke instrumen berisiko rendah agar terbiasa disiplin berinvestasi.';
  } else {
    readinessStatus = 'Sangat Siap';
    readinessColor = 'emerald';
    recommendedPercentage = 20;
    const baseAmount = monthlyIncome > 0 ? monthlyIncome * 0.2 : 500000;
    recommendedMonthlyAmount = Math.max(250000, Math.min(baseAmount, monthlySurplus * 0.7 || baseAmount));
    headline = 'Kondisi Finansial Prima untuk Akumulasi & Pertumbuhan Aset';
    explanation =
      'Selamat! Anda memiliki cadangan dana darurat aman dan beban utang terkendali. Anda sangat siap mengalokasikan 15%–25% pendapatan bulanan ke portofolio investasi terencana (diversifikasi) untuk tujuan jangka menengah hingga kemandirian finansial.';
  }

  const suggestedInstruments: InvestmentReadiness['suggestedInstruments'] = [
    {
      category: 'Konservatif',
      riskLevel: 'Rendah',
      examples: 'Reksadana Pasar Uang (RDPU), Deposito Digital, Emas',
      expectedReturn: '4.5% - 6.5% / thn',
      suitableFor: 'Parkir dana darurat lanjutan & target jangka pendek (< 1-2 tahun)',
      timeHorizon: '< 2 Tahun',
    },
    {
      category: 'Moderat',
      riskLevel: 'Sedang',
      examples: 'Obligasi Negara (SBN / ORI / Sukuk), Reksadana Pendapatan Tetap',
      expectedReturn: '6.0% - 8.5% / thn',
      suitableFor: 'Dana pendidikan anak, renovasi, atau target jangka menengah (2-5 tahun)',
      timeHorizon: '2 - 5 Tahun',
    },
    {
      category: 'Agresif',
      riskLevel: 'Tinggi',
      examples: 'Reksadana Saham / Indeks (IDX30), Saham Bluechip Dividen',
      expectedReturn: '10% - 15%+ / thn (fluktuatif)',
      suitableFor: 'Dana pensiun & akumulasi kekayaan jangka panjang (> 5 tahun)',
      timeHorizon: '> 5 Tahun',
    },
  ];

  const simPmt = recommendedMonthlyAmount > 0 ? recommendedMonthlyAmount : Math.max(250000, Math.round(monthlySurplus * 0.5) || 500000);
  const annualRate = 0.07;
  const growthSimulations: InvestmentReadiness['growthSimulations'] = [1, 3, 5, 10].map((years) => {
    const r = annualRate / 12;
    const n = years * 12;
    const fv = simPmt * (((Math.pow(1 + r, n) - 1)) / r);
    const totalContributed = simPmt * n;
    return {
      years,
      totalContributed: Math.round(totalContributed),
      estimatedValue: Math.round(fv),
      estimatedProfit: Math.round(fv - totalContributed),
    };
  });

  const investmentReadiness: InvestmentReadiness = {
    readinessStatus,
    readinessColor,
    headline,
    explanation,
    recommendedMonthlyAmount: Math.round(recommendedMonthlyAmount),
    recommendedPercentage,
    monthlySurplus,
    emergencyFundGap,
    targetEmergencyFund,
    conditions: [condCashFlow, condDsr, condEmergencyFund],
    suggestedInstruments,
    growthSimulations,
  };

  return {
    healthScore: score,
    status,
    statusColor,
    dsrPercent,
    emergencyFundMonths,
    savingsRatePercent,
    netWorth,
    advice,
    investmentReadiness,
  };
}

