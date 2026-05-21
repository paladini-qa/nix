import { useMemo } from "react";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useTransactionsQuery } from "@/presentation/hooks/useTransactionsQuery";
import { useSettingsQuery } from "@/presentation/hooks/useSettingsQuery";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";

import dayjs from "dayjs";

export function useFilteredTransactions() {
  const { filters, advancedFilters } = useAppStore();
  const { data: transactions = [] } = useTransactionsQuery();
  const { data: settings } = useSettingsQuery();
  
  const paymentMethodConfigs = settings?.payment_method_configs || [];

  const filteredTransactions = useMemo(() => {
    let baseTransactions = [];

    const hasDateRange = advancedFilters.startDate !== null && advancedFilters.endDate !== null;

    if (hasDateRange) {
      const start = advancedFilters.startDate!.startOf("day");
      const end = advancedFilters.endDate!.endOf("day");
      baseTransactions = transactions.filter((t) => {
        const tDate = dayjs(t.date);
        return (tDate.isAfter(start) || tDate.isSame(start)) && 
               (tDate.isBefore(end) || tDate.isSame(end));
      });
    } else {
      baseTransactions = transactions.filter((t) => {
        const [y, m] = getEffectiveReportDate(t, paymentMethodConfigs).split("-");
        const isCurrentMonth =
          parseInt(y) === filters.year && parseInt(m) === filters.month + 1;

        if (!isCurrentMonth) return false;

        if (t.isRecurring && !t.isVirtual && t.excludedDates?.includes(t.date)) {
          return false;
        }

        return true;
      });
    }

    const virtualTransactions = generateRecurringTransactions(
      transactions,
      filters,
      paymentMethodConfigs
    );

    let allTransactions = [
      ...baseTransactions,
      ...virtualTransactions,
    ];

    // Filter by type
    if (advancedFilters.type !== "all") {
      allTransactions = allTransactions.filter((t) => t.type === advancedFilters.type);
    }

    // Filter by categories
    if (advancedFilters.categories && advancedFilters.categories.length > 0) {
      allTransactions = allTransactions.filter((t) => advancedFilters.categories.includes(t.category));
    }

    // Filter by payment methods
    if (advancedFilters.paymentMethods && advancedFilters.paymentMethods.length > 0) {
      allTransactions = allTransactions.filter((t) => advancedFilters.paymentMethods.includes(t.paymentMethod));
    }

    return allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, filters, advancedFilters, paymentMethodConfigs]);

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
