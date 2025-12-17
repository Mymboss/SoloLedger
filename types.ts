export type TransactionType = 'income' | 'expense';
export type CategoryType = 'routine' | 'extra';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: CategoryType;
  description: string;
  date: string; // ISO String
  timestamp: number;
}

export type ViewState = 'dashboard' | 'add' | 'history' | 'ai-insight';

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  routine: '日常',
  extra: '额外',
};

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: '收入',
  expense: '支出',
};