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
  sharedWith?: string; // Nome do amigo com quem o gasto foi dividido
  iOwe?: boolean; // Se true, EU devo ao amigo (amigo pagou). Se false/undefined, amigo deve a mim (eu paguei)
  relatedTransactionId?: string; // ID da transação relacionada (ex: income gerada de shared expense)
  // Campos para transações recorrentes virtuais (geradas automaticamente)
  isVirtual?: boolean; // Indica se é uma ocorrência virtual de transação recorrente
  originalTransactionId?: string; // ID da transação original (para virtuais)
  // Campos para agrupamento de parcelamentos e exclusões de recorrências
  installmentGroupId?: string; // UUID que agrupa todas as parcelas de um mesmo parcelamento
  excludedDates?: string[]; // Array de datas (YYYY-MM-DD) excluídas de recorrências
  // Campos para transações importadas do Pluggy
  pluggyTransactionId?: string; // ID da transação no Pluggy (para evitar duplicatas)
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

// Smart Input - Cadastro inteligente via IA
export type SmartInputMode = 'text' | 'audio' | 'image';

export interface ParsedTransaction {
  description: string;
  amount: number | null;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  date: string; // ISO String YYYY-MM-DD
  confidence: number; // 0-1, nível de confiança da IA
  rawInput: string; // input original para debug
}

// =============================================
// Sistema de Integração Pluggy (Open Finance)
// =============================================

export type PluggyConnectionStatus = 'active' | 'error' | 'updating' | 'inactive';

export interface PluggyConnection {
  id: string;
  itemId: string;
  connectorName: string;
  connectorLogo?: string;
  accountType?: string;
  status: PluggyConnectionStatus;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Resposta da API Pluggy para transações
export interface PluggyTransaction {
  id: string;
  description: string;
  descriptionRaw?: string;
  currencyCode: string;
  amount: number;
  amountInAccountCurrency?: number;
  date: string;
  balance?: number;
  category?: {
    id: string;
    description: string;
    descriptionTranslated?: string;
    primaryDescription?: string;
  };
  accountId: string;
  providerCode?: string;
  status?: string;
  paymentData?: {
    payer?: {
      name?: string;
      branchNumber?: string;
      accountNumber?: string;
      routingNumber?: string;
      documentNumber?: {
        type?: string;
        value?: string;
      };
    };
    receiver?: {
      name?: string;
      branchNumber?: string;
      accountNumber?: string;
      routingNumber?: string;
      documentNumber?: {
        type?: string;
        value?: string;
      };
    };
    paymentMethod?: string;
    referenceNumber?: string;
    reason?: string;
  };
  creditCardMetadata?: {
    installmentNumber?: number;
    totalInstallments?: number;
    totalAmount?: number;
    purchaseDate?: string;
    payeeMCC?: number;
  };
  merchant?: {
    name?: string;
    businessName?: string;
    cnpj?: string;
    cnae?: string;
    category?: string;
  };
}

// Resposta da API Pluggy para contas
export interface PluggyAccount {
  id: string;
  itemId: string;
  type: string;
  subtype?: string;
  number?: string;
  name: string;
  marketingName?: string;
  balance: number;
  currencyCode: string;
  bankData?: {
    transferNumber?: string;
    closingBalance?: number;
  };
  creditData?: {
    level?: string;
    brand?: string;
    balanceCloseDate?: string;
    balanceDueDate?: string;
    availableCreditLimit?: number;
    balanceForeignCurrency?: number;
    minimumPayment?: number;
    creditLimit?: number;
  };
}

// Resposta do widget Pluggy Connect
export interface PluggyConnectResult {
  item: {
    id: string;
  };
}

// Resultado da sincronização
export interface PluggySyncResult {
  success: boolean;
  transactionsImported: number;
  transactionsSkipped: number;
  errors?: string[];
}