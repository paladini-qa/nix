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
