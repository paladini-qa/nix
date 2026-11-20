import { useMemo } from "react";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import type { PaymentMethodConfig, Transaction } from "@/domain/entities";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";

import dayjs from "dayjs";

export function useFilteredTransactions(transactions: Transaction[], paymentMethodConfigs: PaymentMethodConfig[]) {
  const { filters, advancedFilters } = useAppStore();

  const filteredTransactions = useMemo(() => {
    const selectedMonth = dayjs().year(filters.year).month(filters.month).startOf("month");
    const start = advancedFilters.startDate?.isValid() ? advancedFilters.startDate : null;
    const end = advancedFilters.endDate?.isValid() ? advancedFilters.endDate : null;
    const periodStart = start ?? (end ? end.startOf("month") : selectedMonth);
    const periodEnd = end ?? (start ?? selectedMonth).endOf("month");
    const startDate = periodStart.format("YYYY-MM-DD");
    const endDate = periodEnd.format("YYYY-MM-DD");
    const projected: Transaction[] = [];

    for (let month = periodStart.startOf("month"); !month.isAfter(periodEnd, "month"); month = month.add(1, "month")) {
      projected.push(...generateRecurringTransactions(
        transactions, { month: month.month(), year: month.year() }, paymentMethodConfigs,
      ));
    }

    return [...transactions, ...projected].filter((tx) => {
      if (tx.isRecurring && !tx.isVirtual && tx.excludedDates?.includes(tx.date)) return false;
      const reportDate = getEffectiveReportDate(tx, paymentMethodConfigs);
      if (reportDate < startDate || reportDate > endDate) return false;
      if (advancedFilters.type !== "all" && tx.type !== advancedFilters.type) return false;
      if (advancedFilters.categories.length && !advancedFilters.categories.includes(tx.category)) return false;
      return !advancedFilters.paymentMethods.length || advancedFilters.paymentMethods.includes(tx.paymentMethod);
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filters, advancedFilters, paymentMethodConfigs]);

  const summary = useMemo(() => {
    const totals = { income: 0, expense: 0 };
    for (const transaction of filteredTransactions) {
      totals[transaction.type] += Math.round((transaction.amount || 0) * 100);
    }
    
    return {
      totalIncome: totals.income / 100,
      totalExpense: totals.expense / 100,
      balance: (totals.income - totals.expense) / 100,
    };
  }, [filteredTransactions]);

  return {
    filteredTransactions,
    summary,
  };
}
