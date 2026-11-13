import type { Account, Category } from '../../../types/finance';
import { CashTransactionModal, type TransactionInitialData } from './CashTransactionModal';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: TransactionInitialData | null;
  onSuccess: () => Promise<void> | void;
  onCategoryCreated?: (newCategory: Category) => void;
}

/** Modal pencatatan pemasukan kas. */
export function IncomeModal(props: IncomeModalProps) {
  return <CashTransactionModal {...props} transactionType="income" />;
}
