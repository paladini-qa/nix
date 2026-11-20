import type { PaymentMethodConfig, Transaction } from "@/domain/entities";
import dayjs, { type Dayjs } from "dayjs";
import { generateRecurringTransactions } from "@/domain/usecases/recurringUtils";
import { getEffectiveReportDate } from "@/domain/usecases/transactionUtils";

interface SeriesFilters {
  type: "all" | Transaction["type"];
  categories: readonly string[];
  paymentMethods: readonly string[];
}

export function buildDashboardMonthlySeries(
  transactions: Transaction[],
  paymentMethodConfigs: PaymentMethodConfig[] | null | undefined,
  reference: Dayjs,
  filters: SeriesFilters,
) {
  const start = reference.startOf("month").subtract(3, "month");
  const configs = paymentMethodConfigs ?? [];
  const months = Array.from({ length: 7 }, (_, index) => start.add(index, "month"));
  const startKey = start.format("YYYY-MM");
  const firstRecurringMonth = transactions.reduce((earliest, transaction) => {
    const month = transaction.date.slice(0, 7);
    return transaction.isRecurring && month < earliest ? month : earliest;
  }, startKey);
  const projected: Transaction[] = [];
  for (let month = dayjs(`${firstRecurringMonth}-01`); !month.isAfter(months[6], "month"); month = month.add(1, "month")) {
    projected.push(...generateRecurringTransactions(
      transactions, { year: month.year(), month: month.month() }, configs,
    ));
  }
  const totals = new Map<string, { income: number; expense: number }>();

  for (const transaction of [...transactions, ...projected]) {
    if (transaction.isRecurring && !transaction.isVirtual && transaction.excludedDates?.includes(transaction.date)) continue;
    if (filters.type !== "all" && filters.type !== transaction.type) continue;
    if (filters.categories.length && !filters.categories.includes(transaction.category)) continue;
    if (filters.paymentMethods.length && !filters.paymentMethods.includes(transaction.paymentMethod)) continue;

    const key = getEffectiveReportDate(transaction, configs).slice(0, 7);
    const values = totals.get(key) ?? { income: 0, expense: 0 };
    values[transaction.type] += Math.round((transaction.amount || 0) * 100);
    totals.set(key, values);
  }

  let balance = 0;
  for (const [key, values] of totals) {
    if (key < startKey) balance += values.income - values.expense;
  }

  return months.map((month, index) => {
    const key = month.format("YYYY-MM");
    const { income, expense } = totals.get(key) ?? { income: 0, expense: 0 };
    const monthBalance = income - expense;
    balance += monthBalance;

    const label = month.toDate().toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return {
      month: label.charAt(0).toUpperCase() + label.slice(1),
      monthKey: key,
      income: income / 100,
      expense: expense / 100,
      monthBalance: monthBalance / 100,
      balance: balance / 100,
      isCurrentMonth: index === 3,
    };
  });
}
