import { describe, it, expect } from "vitest";
import { generateRecurringTransactions, readRecurringOccurrenceId } from "@/domain/usecases/recurringUtils";
import type { Transaction, FilterState, PaymentMethodConfig } from "@/domain/entities";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// FilterState.month is 0-indexed (0 = January … 11 = December).
// generateRecurringTransactions adds 1 internally to convert to 1-12.
function makeFilter(month: number, year: number): FilterState {
  return { month, year };
}

function makeRecurring(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "rec1",
    description: "Rent",
    amount: 1000,
    type: "expense",
    category: "Housing",
    paymentMethod: "Cash",
    date: "2024-01-15",
    createdAt: 1700000000000,
    isRecurring: true,
    frequency: "monthly",
    isPaid: true,
    ...overrides,
  };
}

const noPmConfigs: PaymentMethodConfig[] = [];

// ---------------------------------------------------------------------------
// Basic monthly recurrence
// ---------------------------------------------------------------------------

describe("generateRecurringTransactions — monthly", () => {
  it("uses the stored amount and payment state for the matching occurrence", () => {
    const t = makeRecurring({
      occurrences: [
        { number: 2, dueDate: "2024-02-15", amount: 950, isPaid: true },
        { number: 3, dueDate: "2024-03-15", amount: 1020, isPaid: false },
      ],
    });

    expect(generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs))
      .toMatchObject([{ date: "2024-02-15", amount: 950, isPaid: true }]);
  });

  it("generates a virtual transaction for a future month", () => {
    // origin: Jan 2024 → filter: Feb 2024 (month=1 in 0-indexed)
    const t = makeRecurring({ date: "2024-01-15" });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);

    expect(results).toHaveLength(1);
    const v = results[0];
    expect(v.date).toBe("2024-02-15");
    expect(v.isVirtual).toBe(true);
    expect(v.originalTransactionId).toBe(t.id);
    expect(v.isPaid).toBe(false);
  });

  it("generates virtual ID with correct format", () => {
    const t = makeRecurring({ id: "abc123", date: "2024-01-15" });
    // filter month=2 → March (0-indexed)
    const results = generateRecurringTransactions([t], makeFilter(2, 2024), noPmConfigs);
    expect(results[0].id).toBe("abc123_recurring_2024-03-15");
  });

  it("identifies a card occurrence by transaction date even if its invoice is in the next month", () => {
    const transaction = makeRecurring({
      id: "viarnet",
      date: "2026-06-10",
      paymentMethod: "Azul",
      recurringOverrides: [{ date: "2026-08-10", amount: null, isPaid: true }],
    });
    const config: PaymentMethodConfig = {
      id: "azul", name: "Azul", type: "card", closingDay: 24, paymentDay: 5,
    };
    const [occurrence] = generateRecurringTransactions([transaction], makeFilter(8, 2026), [config]);

    expect(occurrence).toMatchObject({ date: "2026-08-10", invoiceDueDate: "2026-09-05", isPaid: true });
    expect(readRecurringOccurrenceId(occurrence.id)).toEqual({ transactionId: "viarnet", date: "2026-08-10" });
  });

  it("does NOT generate a virtual for the same month as the original date", () => {
    // origin: March 2024 → filter: March 2024 (month=2 in 0-indexed)
    const t = makeRecurring({ date: "2024-03-10" });
    const results = generateRecurringTransactions([t], makeFilter(2, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("does NOT generate a virtual for a month before the original date", () => {
    // origin: June 2024 → filter: Feb 2024 (month=1 in 0-indexed)
    const t = makeRecurring({ date: "2024-06-01" });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("carries over all original fields except id, date, isVirtual, isPaid, originalTransactionId", () => {
    const t = makeRecurring({ date: "2024-01-10", description: "Gym", amount: 50, category: "Health" });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    const v = results[0];
    expect(v.description).toBe("Gym");
    expect(v.amount).toBe(50);
    expect(v.category).toBe("Health");
    expect(v.isRecurring).toBe(true);
    expect(v.frequency).toBe("monthly");
  });

  it("generates for multiple months when called independently", () => {
    const t = makeRecurring({ date: "2024-01-15" });

    // month=1 → Feb, month=2 → Mar, month=11 → Dec
    const feb = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    const mar = generateRecurringTransactions([t], makeFilter(2, 2024), noPmConfigs);
    const dec = generateRecurringTransactions([t], makeFilter(11, 2024), noPmConfigs);

    expect(feb[0].date).toBe("2024-02-15");
    expect(mar[0].date).toBe("2024-03-15");
    expect(dec[0].date).toBe("2024-12-15");
  });

  it("adjusts day when the original day does not exist in the target month (e.g. Jan 31 → Feb)", () => {
    const t = makeRecurring({ date: "2024-01-31" });
    // month=1 → Feb 2024 (leap year → 29 days)
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results[0].date).toBe("2024-02-29");
  });

  it("adjusts day for Feb in a non-leap year (Jan 31 → Feb 28)", () => {
    const t = makeRecurring({ date: "2023-01-31" });
    // month=1 → Feb 2023 (non-leap → 28 days)
    const results = generateRecurringTransactions([t], makeFilter(1, 2023), noPmConfigs);
    expect(results[0].date).toBe("2023-02-28");
  });

  it("adjusts day for months with 30 days (Mar 31 → Apr 30)", () => {
    const t = makeRecurring({ date: "2024-03-31" });
    // month=3 → April 2024 (30 days)
    const results = generateRecurringTransactions([t], makeFilter(3, 2024), noPmConfigs);
    expect(results[0].date).toBe("2024-04-30");
  });

  it("crosses year boundary correctly (Dec → Jan next year)", () => {
    const t = makeRecurring({ date: "2024-12-10" });
    // month=0, year=2025 → January 2025
    const results = generateRecurringTransactions([t], makeFilter(0, 2025), noPmConfigs);
    expect(results[0].date).toBe("2025-01-10");
  });

  it("ignores transactions with installments > 1", () => {
    const t = makeRecurring({ date: "2024-01-15", installments: 3, currentInstallment: 1 });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("skips non-recurring transactions", () => {
    const t = makeRecurring({ date: "2024-01-15", isRecurring: false });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("skips transactions without frequency set", () => {
    const t = makeRecurring({ date: "2024-01-15", frequency: undefined });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("returns empty array when input list is empty", () => {
    const results = generateRecurringTransactions([], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Yearly recurrence
// ---------------------------------------------------------------------------

describe("generateRecurringTransactions — yearly", () => {
  it("generates virtual for the same month in a future year", () => {
    // origin: June 2023 → filter: June 2024 (month=5 in 0-indexed)
    const t = makeRecurring({ date: "2023-06-15", frequency: "yearly" });
    const results = generateRecurringTransactions([t], makeFilter(5, 2024), noPmConfigs);
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe("2024-06-15");
  });

  it("does NOT generate virtual in a different month even in a future year", () => {
    // origin: June 2023 → filter: July 2024 (month=6 in 0-indexed)
    const t = makeRecurring({ date: "2023-06-15", frequency: "yearly" });
    const results = generateRecurringTransactions([t], makeFilter(6, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("does NOT generate virtual for the same year as original (targetYear <= origYear)", () => {
    // origin: June 2024 → filter: June 2024
    const t = makeRecurring({ date: "2024-06-15", frequency: "yearly" });
    const results = generateRecurringTransactions([t], makeFilter(5, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("does NOT generate virtual for years before original", () => {
    // origin: June 2024 → filter: June 2023
    const t = makeRecurring({ date: "2024-06-15", frequency: "yearly" });
    const results = generateRecurringTransactions([t], makeFilter(5, 2023), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("adjusts Feb 29 on non-leap year for yearly recurrence", () => {
    // 2024 is a leap year; 2025 is not → Feb 29 clamps to Feb 28
    const t = makeRecurring({ date: "2024-02-29", frequency: "yearly" });
    // month=1 → February
    const results = generateRecurringTransactions([t], makeFilter(1, 2025), noPmConfigs);
    expect(results[0].date).toBe("2025-02-28");
  });

  it("keeps Feb 29 on another leap year", () => {
    // 2024 → 2028 (both leap years)
    const t = makeRecurring({ date: "2024-02-29", frequency: "yearly" });
    const results = generateRecurringTransactions([t], makeFilter(1, 2028), noPmConfigs);
    expect(results[0].date).toBe("2028-02-29");
  });
});

// ---------------------------------------------------------------------------
// Exclusion dates
// ---------------------------------------------------------------------------

describe("generateRecurringTransactions — excludedDates", () => {
  it("does NOT generate virtual for an excluded date", () => {
    // origin: Jan 15 2024 → filter: Feb 2024; virtual date = "2024-02-15" is excluded
    const t = makeRecurring({ date: "2024-01-15", excludedDates: ["2024-02-15"] });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("generates virtual when date is not in excludedDates", () => {
    // March is excluded, but we ask for Feb
    const t = makeRecurring({ date: "2024-01-15", excludedDates: ["2024-03-15"] });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe("2024-02-15");
  });

  it("handles empty excludedDates array", () => {
    const t = makeRecurring({ date: "2024-01-15", excludedDates: [] });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(1);
  });

  it("handles undefined excludedDates (treated as empty)", () => {
    const t = makeRecurring({ date: "2024-01-15", excludedDates: undefined });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(1);
  });

  it("correctly excludes an adjusted date (e.g. Jan 31 adjusted to Feb 29)", () => {
    // origin: Jan 31 2024 → filter: Feb 2024; virtual date = "2024-02-29" is excluded
    const t = makeRecurring({ date: "2024-01-31", excludedDates: ["2024-02-29"] });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Deduplication — real transaction already exists in target month
// ---------------------------------------------------------------------------

describe("generateRecurringTransactions — deduplication", () => {
  it("does NOT generate virtual when a real transaction already matches in the target month", () => {
    const original: Transaction = {
      id: "orig1",
      description: "Rent",
      amount: 1000,
      type: "expense",
      category: "Housing",
      paymentMethod: "Cash",
      date: "2024-01-15",
      createdAt: 1700000000000,
      isRecurring: true,
      frequency: "monthly",
      isPaid: true,
    };
    const real: Transaction = {
      id: "real1",
      description: "Rent",
      amount: 1000,
      type: "expense",
      category: "Housing",
      paymentMethod: "Cash",
      date: "2024-02-15",
      createdAt: 1700000000000,
      isVirtual: false,
    };
    // month=1 → Feb 2024
    const results = generateRecurringTransactions([original, real], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("does NOT generate virtual when a real transaction has recurringGroupId matching original id", () => {
    const original: Transaction = {
      id: "orig2",
      description: "Rent",
      amount: 1000,
      type: "expense",
      category: "Housing",
      paymentMethod: "Cash",
      date: "2024-01-15",
      createdAt: 1700000000000,
      isRecurring: true,
      frequency: "monthly",
      isPaid: true,
    };
    const real: Transaction = {
      id: "real2",
      description: "Modified Rent",
      amount: 1200,
      type: "expense",
      category: "Housing",
      paymentMethod: "Cash",
      date: "2024-02-15",
      createdAt: 1700000000000,
      recurringGroupId: "orig2",
      isVirtual: false,
    };
    const results = generateRecurringTransactions([original, real], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(0);
  });

  it("generates virtual when the only matching transaction in that month is itself virtual", () => {
    const original: Transaction = {
      id: "orig3",
      description: "Rent",
      amount: 1000,
      type: "expense",
      category: "Housing",
      paymentMethod: "Cash",
      date: "2024-01-15",
      createdAt: 1700000000000,
      isRecurring: true,
      frequency: "monthly",
      isPaid: true,
    };
    const existingVirtual: Transaction = {
      ...original,
      id: "orig3_recurring_2024-02",
      date: "2024-02-15",
      isVirtual: true,
      originalTransactionId: "orig3",
      isPaid: false,
    };
    // The deduplication check requires `!tx.isVirtual`, so a virtual should NOT block generation
    const results = generateRecurringTransactions([original, existingVirtual], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(1);
  });

  it("generates for each original when multiple recurring transactions exist", () => {
    const t1: Transaction = {
      id: "netflix1",
      description: "Netflix",
      amount: 15,
      type: "expense",
      category: "Entertainment",
      paymentMethod: "Cash",
      date: "2024-01-01",
      createdAt: 1700000000000,
      isRecurring: true,
      frequency: "monthly",
    };
    const t2: Transaction = {
      id: "spotify1",
      description: "Spotify",
      amount: 10,
      type: "expense",
      category: "Entertainment",
      paymentMethod: "Cash",
      date: "2024-01-05",
      createdAt: 1700000000000,
      isRecurring: true,
      frequency: "monthly",
    };
    const results = generateRecurringTransactions([t1, t2], makeFilter(1, 2024), noPmConfigs);
    expect(results).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Card payment method with invoice config
// ---------------------------------------------------------------------------

describe("generateRecurringTransactions — card invoice config", () => {
  // Closes on day 10, pays on day 25 of the same month (paymentDay > closingDay)
  const cardConfig: PaymentMethodConfig = {
    id: "card1",
    name: "Nubank",
    type: "card",
    closingDay: 10,
    paymentDay: 25,
  };

  it("generates virtual transaction whose invoiceDueDate falls in the target month", () => {
    // origin: Jan 8 → invoiceDueDate = Jan 25 (Jan 8 < closingDay 10 → same month)
    // filter: Feb (month=1) → sourceMonth = Feb; Feb 8 → invoiceDueDate Feb 25. Found!
    const t = makeRecurring({ date: "2024-01-08", paymentMethod: "Nubank", frequency: "monthly" });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), [cardConfig]);
    expect(results).toHaveLength(1);
    expect(results[0].invoiceDueDate).toBe("2024-02-25");
  });

  it("virtual transaction date is the source transaction date, not the invoice due date", () => {
    // source month = Feb → virtualDate = "2024-02-08"
    const t = makeRecurring({ date: "2024-01-08", paymentMethod: "Nubank", frequency: "monthly" });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), [cardConfig]);
    expect(results[0].date).toBe("2024-02-08");
  });

  it("uses offset look-back to find source month for invoice (after-closing scenario)", () => {
    // origin: Jan 11 → invoiceDueDate = Feb 25 (Jan 11 > closingDay 10 → next month invoice)
    // filter: Jan 2025 (month=0) → source candidate: Dec 2024 (offset -1)
    //   Dec 11 > 10 → invoiceDueDate = Jan 2025. Found!
    const t = makeRecurring({ date: "2024-01-11", paymentMethod: "Nubank", frequency: "monthly" });
    const results = generateRecurringTransactions([t], makeFilter(0, 2025), [cardConfig]);
    expect(results).toHaveLength(1);
    expect(results[0].invoiceDueDate).toBe("2025-01-25");
  });

  it("sets correct invoiceDueDate for a later filter month", () => {
    // filter: Mar (month=2) → source = Mar; Mar 8 → invoiceDueDate Mar 25
    const t = makeRecurring({ date: "2024-01-08", paymentMethod: "Nubank", frequency: "monthly" });
    const results = generateRecurringTransactions([t], makeFilter(2, 2024), [cardConfig]);
    expect(results[0].invoiceDueDate).toBe("2024-03-25");
  });

  it("propagates invoiceDueDate for transaction with stored invoiceDueDate but no matching card config", () => {
    // No config matches "OtherCard" → offset-based invoiceDueDate propagation
    // origin: Jan 8 with invoiceDueDate Jan 25 → filter: Feb (month=1)
    // paymentDay of the original: day 25; targetMonth = 2 (Feb) → "2024-02-25"
    const t = makeRecurring({
      id: "t_other",
      date: "2024-01-08",
      paymentMethod: "OtherCard",
      invoiceDueDate: "2024-01-25",
      frequency: "monthly",
    });
    const results = generateRecurringTransactions([t], makeFilter(1, 2024), [cardConfig]);
    expect(results).toHaveLength(1);
    expect(results[0].invoiceDueDate).toBe("2024-02-25");
  });
});

// ---------------------------------------------------------------------------
// Large installment count is ignored
// ---------------------------------------------------------------------------

describe("generateRecurringTransactions — installments guard", () => {
  it("ignores recurring transaction with installments = 2", () => {
    const t = makeRecurring({ date: "2024-01-15", installments: 2 });
    expect(generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs)).toHaveLength(0);
  });

  it("ignores recurring transaction with installments = 12", () => {
    const t = makeRecurring({ date: "2024-01-15", installments: 12 });
    expect(generateRecurringTransactions([t], makeFilter(5, 2024), noPmConfigs)).toHaveLength(0);
  });

  it("generates for recurring transaction with installments = 1 (single installment is OK)", () => {
    const t = makeRecurring({ date: "2024-01-15", installments: 1 });
    expect(generateRecurringTransactions([t], makeFilter(1, 2024), noPmConfigs)).toHaveLength(1);
  });
});
