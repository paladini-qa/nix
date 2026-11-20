import { afterEach, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import { useAppStore } from "@/presentation/hooks/useAppStore";
import { useFilteredTransactions } from "@/presentation/hooks/useFilteredTransactions";
import type { Transaction } from "@/domain/entities";

afterEach(() => useAppStore.setState(useAppStore.getInitialState()));

it("projects all months in a range and filters both stored and virtual rows by invoice date", () => {
  useAppStore.setState({
    filters: { month: 5, year: 2026 },
    advancedFilters: {
      ...useAppStore.getInitialState().advancedFilters,
      startDate: dayjs("2026-12-05"),
      endDate: dayjs("2027-01-05"),
    },
  });
  const series: Transaction = {
    id: "series", description: "Assinatura", amount: 0.1, category: "Other",
    type: "expense", paymentMethod: "Card", date: "2026-11-20", createdAt: 1,
    isRecurring: true, frequency: "monthly", excludedDates: ["2026-11-20"],
  };
  const imported: Transaction = {
    ...series, id: "single", description: "Compra", amount: 0.2, isRecurring: false,
    date: "2026-12-30", invoiceDueDate: "2027-01-05",
  };
  const { result } = renderHook(() => useFilteredTransactions([series, imported], [
    { id: "card", name: "Card", type: "card", closingDay: 25, paymentDay: 5 },
  ]));
  expect(result.current.filteredTransactions.map(({ id }) => id)).toEqual(["single", "series_recurring_2026-12-20"]);
  expect(result.current.summary).toEqual({ totalIncome: 0, totalExpense: 0.3, balance: -0.3 });
});
