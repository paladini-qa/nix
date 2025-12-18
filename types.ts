export type TransactionType = "income" | "expense";
export type ThemePreference = "light" | "dark" | "system";

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
  isPaid?: boolean; // Status de pagamento (pago/não pago)
  isShared?: boolean; // Gasto compartilhado 50/50 com outra pessoa
  // Campos para transações recorrentes virtuais (geradas automaticamente)
  isVirtual?: boolean; // Indica se é uma ocorrência virtual de transação recorrente
  originalTransactionId?: string; // ID da transação original (para virtuais)
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

// Configuração de cores com duas cores (gradiente)
export interface ColorConfig {
  primary: string; // Cor principal
  secondary: string; // Cor secundária (para gradiente)
}

// Mapa de cores para categorias e métodos de pagamento
export interface CategoryColors {
  income: Record<string, ColorConfig>;
  expense: Record<string, ColorConfig>;
}

export interface PaymentMethodColors {
  [method: string]: ColorConfig;
}

// Sistema de Orçamentos
export interface Budget {
  id: string;
  category: string;
  type: TransactionType;
  limitAmount: number;
  month: number; // 1-12
  year: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

// Sistema de Metas Financeiras
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO Date
  category?: string;
  color: string;
  icon: string;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalProgress extends Goal {
  percentage: number;
  remainingAmount: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}

// Sistema de Contas/Carteiras
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountWithBalance extends Account {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
}

// Sistema de Tags
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
}

export interface TagWithCount extends Tag {
  transactionCount: number;
}