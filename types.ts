export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  date: string; // ISO String YYYY-MM-DD
  createdAt: number;
  isRecurring?: boolean;
  frequency?: "monthly" | "yearly";
  installments?: number; // Number of installments (parcelas)
  currentInstallment?: number; // Current installment number (1, 2, 3...)
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface FilterState {
  month: number;
  year: number;
}
