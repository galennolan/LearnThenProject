import type { Account, Category } from '../../../types/finance';
import { CashTransactionModal, type TransactionInitialData } from './CashTransactionModal';

export type { TransactionInitialData };

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialData?: TransactionInitialData | null;
  onSuccess: () => Promise<void> | void;
  onCategoryCreated?: (newCategory: Category) => void;
}

/** Modal pencatatan pengeluaran kas. */
export function ExpenseModal(props: ExpenseModalProps) {
  return <CashTransactionModal {...props} transactionType="expense" />;
}
