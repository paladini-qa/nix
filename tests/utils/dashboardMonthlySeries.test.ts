import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type { Transaction } from "@/domain/entities";
import { buildDashboardMonthlySeries } from "@/domain/usecases/dashboardMonthlySeries";

const noFilters = { type: "all", categories: [], paymentMethods: [] } as const;

function entry(id: string, date: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    date,
    description: id,
    type: "income",
    amount: 100,
    category: "Other",
    paymentMethod: "Cash",
    createdAt: 0,
    ...overrides,
  };
}

describe("buildDashboardMonthlySeries", () => {
  it.each([undefined, null])("projects recurring entries with missing payment configuration (%s)", (configs) => {
    const transactions = [
      entry("subscription", "2026-11-05", { type: "expense", amount: 20, isRecurring: true, frequency: "monthly" }),
    ];

    const months = buildDashboardMonthlySeries(transactions, configs, dayjs("2026-11-18"), noFilters);

    expect(months.map((month) => month.expense)).toEqual([0, 0, 0, 20, 20, 20, 20]);
  });

  it("centers the calendar month even after the tenth and includes empty months across the year boundary", () => {
    const months = buildDashboardMonthlySeries([], [], dayjs("2026-11-18"), noFilters);

    expect(months.map((month) => month.monthKey)).toEqual([
      "2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02",
    ]);
    expect(months.filter((month) => month.isCurrentMonth).map((month) => month.monthKey)).toEqual(["2026-11"]);
    expect(months.every(({ income, expense, balance }) => !income && !expense && !balance)).toBe(true);
  });

  it("carries the opening balance and includes scheduled and recurring entries in later months", () => {
    const transactions = [
      entry("opening", "2026-07-01", { amount: 500 }),
      entry("salary", "2026-11-01"),
      entry("subscription", "2026-11-05", { type: "expense", amount: 20, isRecurring: true, frequency: "monthly", excludedDates: ["2027-01-05"] }),
      entry("installment", "2026-10-15", { type: "expense", amount: 30, invoiceDueDate: "2026-12-15", installments: 3, currentInstallment: 2 }),
      entry("outside", "2027-03-01", { amount: 999 }),
    ];
    const months = buildDashboardMonthlySeries(transactions, [], dayjs("2026-11-18"), noFilters);

    expect(months.map(({ income, expense, balance }) => [income, expense, balance])).toEqual([
      [0, 0, 500], [0, 0, 500], [0, 0, 500], [100, 20, 580],
      [0, 50, 530], [0, 0, 530], [0, 20, 510],
    ]);
  });

  it("applies category filters without removing months from the axis", () => {
    const transactions = [entry("matching", "2026-11-01", { category: "Salary" }), entry("other", "2026-11-01")];
    const months = buildDashboardMonthlySeries(transactions, [], dayjs("2026-11-18"), { ...noFilters, categories: ["Salary"] });
    expect(months).toHaveLength(7);
    expect(months[3].income).toBe(100);
  });
});
