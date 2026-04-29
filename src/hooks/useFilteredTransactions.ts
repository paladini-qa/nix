import { useMemo } from "react";
import { useAppStore } from "./useAppStore";
import { useTransactionsQuery } from "./useTransactionsQuery";
import { useSettingsQuery } from "./useSettingsQuery";
import { generateRecurringTransactions } from "../utils/recurringUtils";
import { getReportDate } from "../utils/transactionUtils";

export function useFilteredTransactions() {
  const { filters } = useAppStore();
  const { data: transactions = [] } = useTransactionsQuery();
  const { data: settings } = useSettingsQuery();
  
  const paymentMethodConfigs = settings?.payment_method_configs || [];

  const filteredTransactions = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) => {
      const [y, m] = getReportDate(t).split("-");
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
