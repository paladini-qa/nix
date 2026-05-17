import { useMemo } from "react";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useTransactionsQuery } from "@/presentation/hooks/useTransactionsQuery";
import { useSettingsQuery } from "@/presentation/hooks/useSettingsQuery";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";

export function useFilteredTransactions() {
  const { filters } = useAppStore();
  const { data: transactions = [] } = useTransactionsQuery();
  const { data: settings } = useSettingsQuery();
  
  const paymentMethodConfigs = settings?.payment_method_configs || [];

  const filteredTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = getEffectiveReportDate(t, paymentMethodConfigs).split("-");
      const isCurrentMonth =
        parseInt(y) === filters.year && parseInt(m) === filters.month + 1;

      if (!isCurrentMonth) return false;

      if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) {
        return false;
      }

      return true;
    });

    const virtualTransactions = generateRecurringTransactions(
      transactions,
      filters,
      paymentMethodConfigs
    );

    const allTransactions = [
      ...currentMonthTransactions,
      ...virtualTransactions,
    ];

    return allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filters, paymentMethodConfigs]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  return {
    filteredTransactions,
    summary,
  };
}
