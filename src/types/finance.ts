export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'other';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'debt_payment';
export type DebtType =
  | 'bank_loan'
  | 'bpr'
  | 'credit_card'
  | 'kta'
  | 'personal'
  | 'installment'
  | 'other';
export type DebtStatus = 'active' | 'paid_off' | 'paused';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  opening_balance: number;
  opening_date: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  current_balance?: number; // dihitung dari opening + mutasi
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  category_type: CategoryType;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  transaction_type: TransactionType;
  transaction_date: string;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  account_name?: string;
  category_name?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  creditor_name: string;
  debt_type: DebtType;
  principal_amount: number;
  outstanding_principal: number;
  interest_rate: number;
  interest_type: string;
  start_date: string;
  original_tenor: number;
  remaining_tenor: number;
  monthly_installment: number;
  due_day: number;
  early_settlement_fee: number;
  status: DebtStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  user_id: string;
  debt_id: string;
  account_id: string;
  payment_date: string;
  principal_paid: number;
  interest_paid: number;
  fee_paid: number;
  total_paid: number;
  notes: string | null;
  created_at: string;
  creditor_name?: string;
  account_name?: string;
}

export interface CashFlowPoint {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
  debtPayment: number;
  netCashFlow: number;
}

export interface CategoryExpenseBreakdown {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface FinancialProjectionPoint {
  month: string;
  monthKey: string;
  projectedBalance: number;
  estimatedIncome: number;
  estimatedExpense: number;
  estimatedDebtPayment: number;
}

export interface InvestmentCondition {
  label: string;
  isMet: boolean;
  currentValue: string;
  targetValue: string;
  note: string;
}

export interface InvestmentInstrumentSuggestion {
  category: 'Konservatif' | 'Moderat' | 'Agresif';
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  examples: string;
  expectedReturn: string;
  suitableFor: string;
  timeHorizon: string;
}

export interface InvestmentGrowthSimulation {
  years: number;
  totalContributed: number;
  estimatedValue: number;
  estimatedProfit: number;
}

export interface InvestmentReadiness {
  readinessStatus: 'Sangat Siap' | 'Siap Bertahap' | 'Belum Siap';
  readinessColor: 'emerald' | 'amber' | 'rose';
  headline: string;
  explanation: string;
  recommendedMonthlyAmount: number;
  recommendedPercentage: number;
  monthlySurplus: number;
  emergencyFundGap: number;
  targetEmergencyFund: number;
  conditions: InvestmentCondition[];
  suggestedInstruments: InvestmentInstrumentSuggestion[];
  growthSimulations: InvestmentGrowthSimulation[];
}

export interface FinancialHealthAnalysis {
  healthScore: number;
  status: 'Sangat Sehat' | 'Sehat' | 'Waspada' | 'Kritis';
  statusColor: string;
  dsrPercent: number;
  emergencyFundMonths: number;
  savingsRatePercent: number;
  netWorth: number;
  advice: {
    category: string;
    level: 'good' | 'warning' | 'danger';
    title: string;
    message: string;
  }[];
  investmentReadiness: InvestmentReadiness;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyDebtObligation: number;
  remainingSafeMoney: number;
  totalOutstandingDebt: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  upcomingDebts: Debt[];
  cashFlowHistory: CashFlowPoint[];
  categoryBreakdown: CategoryExpenseBreakdown[];
  projections: FinancialProjectionPoint[];
  healthAnalysis: FinancialHealthAnalysis;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Tunai / Kas',
  bank: 'Rekening Bank',
  ewallet: 'E-Wallet',
  savings: 'Tabungan',
  other: 'Lainnya',
};

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  bank_loan: 'Pinjaman Bank',
  bpr: 'BPR',
  credit_card: 'Kartu Kredit',
  kta: 'KTA (Tanpa Agunan)',
  personal: 'Pinjaman Pribadi',
  installment: 'Cicilan Barang / Paylater',
  other: 'Kewajiban Lainnya',
};

export const DEFAULT_INCOME_CATEGORIES = [
  'Gaji Utama',
  'Bisnis / Usaha',
  'Freelance / Proyek',
  'Honorarium',
  'Bonus / THR',
  'Investasi / Dividen',
  'Pendapatan Lainnya',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Belanja Bahan Makanan',
  'Listrik, Air & Gas',
  'Internet & Komunikasi',
  'Pendidikan Anak',
  'Kesehatan & Obat',
  'Bensin & Transportasi',
  'Kebutuhan Rumah Tangga',
  'Kebutuhan Pribadi & Hiburan',
  'Pembayaran Cicilan Utang',
  'Pajak & Biaya Admin',
  'Sosial & Sedekah',
  'Pengeluaran Lainnya',
];

