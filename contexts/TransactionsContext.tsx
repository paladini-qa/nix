import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import {
  Transaction,
  FilterState,
  FinancialSummary,
} from "../types";
import { getInitialMonthYear } from "../hooks/useFilters";

// ============================================
// Context Types
// ============================================

interface TransactionsContextValue {
  // Data
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  summary: FinancialSummary;
  
  // Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  refreshTransactions: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const TransactionsContext = createContext<TransactionsContextValue | undefined>(
  undefined
);

// ============================================
// Provider
// ============================================

interface TransactionsProviderProps {
  children: ReactNode;
  session: Session;
}

export const TransactionsProvider: React.FC<TransactionsProviderProps> = ({
  children,
  session,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() => {
    const { month, year } = getInitialMonthYear();
    return { month, year };
  });

  // Fetch transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      if (txs) {
        const mappedTxs: Transaction[] = txs.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category,
          paymentMethod: t.payment_method,
          date: t.date,
          createdAt: new Date(t.created_at).getTime(),
          isRecurring: t.is_recurring,
          frequency: t.frequency,
          installments: t.installments,
          currentInstallment: t.current_installment,
          isPaid: t.is_paid ?? true,
          isShared: t.is_shared,
          sharedWith: t.shared_with,
          iOwe: t.i_owe,
          relatedTransactionId: t.related_transaction_id,
          installmentGroupId: t.installment_group_id,
          excludedDates: t.excluded_dates ?? [],
          recurringGroupId: t.recurring_group_id,
        }));
        setTransactions(mappedTxs);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Generate recurring transactions for current filter period
  const generateRecurringTransactions = useMemo(() => {
    const virtualTransactions: Transaction[] = [];
    const targetMonth = filters.month + 1;
    const targetYear = filters.year;

    transactions.forEach((t) => {
      if (!t.isRecurring || !t.frequency) return;
      if (t.installments && t.installments > 1) return;

      const [origYear, origMonth, origDay] = t.date.split("-").map(Number);
      const origDate = new Date(origYear, origMonth - 1, origDay);
      const targetDate = new Date(targetYear, targetMonth - 1, 1);

      if (targetDate < new Date(origYear, origMonth - 1, 1)) return;

      const isOriginalMonth =
        origYear === targetYear && origMonth === targetMonth;
      if (isOriginalMonth) return;

      let shouldAppear = false;

      if (t.frequency === "monthly") {
        shouldAppear = true;
      } else if (t.frequency === "yearly") {
        shouldAppear = origMonth === targetMonth && targetYear > origYear;
      }

      if (shouldAppear) {
        const daysInTargetMonth = new Date(
          targetYear,
          targetMonth,
          0
        ).getDate();
        const adjustedDay = Math.min(origDay, daysInTargetMonth);
        const virtualDate = `${targetYear}-${String(targetMonth).padStart(
          2,
          "0"
        )}-${String(adjustedDay).padStart(2, "0")}`;

        // Verifica se esta data está no excluded_dates da transação original
        const excludedDates = t.excludedDates || [];
        if (excludedDates.includes(virtualDate)) {
          return; // Não gera a transação virtual para esta data
        }

        virtualTransactions.push({
          ...t,
          id: `${t.id}_recurring_${targetYear}-${String(targetMonth).padStart(
            2,
            "0"
          )}`,
          date: virtualDate,
          isVirtual: true,
          originalTransactionId: t.id,
        });
      }
    });

    return virtualTransactions;
  }, [transactions, filters]);

  // Filtered transactions for current month/year
  const filteredTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split("-");
      return parseInt(y) === filters.year && parseInt(m) === filters.month + 1;
    });

    const allTransactions = [
      ...currentMonthTransactions,
      ...generateRecurringTransactions,
    ];

    return allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filters, generateRecurringTransactions]);

  // Financial summary
  const summary = useMemo<FinancialSummary>(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const value: TransactionsContextValue = {
    transactions,
    filteredTransactions,
    summary,
    filters,
    setFilters,
    isLoading,
    setTransactions,
    refreshTransactions: fetchTransactions,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useTransactions = (): TransactionsContextValue => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error(
      "useTransactions must be used within a TransactionsProvider"
    );
  }
  return context;
};

export default TransactionsContext;

