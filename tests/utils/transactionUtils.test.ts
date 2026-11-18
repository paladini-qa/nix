import { describe, it, expect } from "vitest";
import {
  getReportDate,
  getEffectiveReportDate,
  calculateInvoiceDueDate,
  formatInvoiceMonth,
  getBalanceOnDate,
  getInstallmentAmounts,
} from "@/domain/usecases/transactionUtils";
import type { Transaction, PaymentMethodConfig } from "@/domain/entities";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    description: "Test",
    amount: 100,
    type: "expense",
    category: "Food",
    paymentMethod: "Credit Card",
    date: "2024-01-15",
    createdAt: 1700000000000,
    ...overrides,
  };
}

function makeCardConfig(
  name: string,
  closingDay: number,
  paymentDay: number
): PaymentMethodConfig {
  return {
    id: "pm1",
    name,
    type: "card",
    closingDay,
    paymentDay,
  };
}

describe("getBalanceOnDate", () => {
  it("includes transactions on the selected date and excludes later income", () => {
    const transactions = [
      makeTransaction({ id: "salary", type: "income", amount: 10697, date: "2026-12-01" }),
      makeTransaction({ id: "income", type: "income", amount: 500, date: "2026-06-01" }),
      makeTransaction({ id: "expense", amount: 75, date: "2026-06-10" }),
    ];

    expect(getBalanceOnDate(transactions, "2026-06-10")).toBe(425);
    expect(getBalanceOnDate(transactions, "2026-12-01")).toBe(11122);
  });

  it("excludes the old value of the transaction being edited", () => {
    const transactions = [
      makeTransaction({ id: "edit", amount: 100 }),
      makeTransaction({ id: "keep", amount: 25 }),
    ];

    expect(getBalanceOnDate(transactions, "2024-01-15", "edit")).toBe(-25);
  });
});

describe("getInstallmentAmounts", () => {
  it("uses one installment of 250 for a purchase of 2500 split ten ways", () => {
    expect(getInstallmentAmounts(2500, 10)).toEqual({ first: 250, regular: 250 });
  });

  it("keeps the cent adjustment on the first installment", () => {
    expect(getInstallmentAmounts(100, 3)).toEqual({ first: 33.34, regular: 33.33 });
    expect(getInstallmentAmounts(50, 3)).toEqual({ first: 16.66, regular: 16.67 });
  });
});

// ---------------------------------------------------------------------------
// getReportDate
// ---------------------------------------------------------------------------

describe("getReportDate", () => {
  it("returns invoiceDueDate when present", () => {
    const t = makeTransaction({ date: "2024-01-15", invoiceDueDate: "2024-02-05" });
    expect(getReportDate(t)).toBe("2024-02-05");
  });

  it("returns date when invoiceDueDate is absent", () => {
    const t = makeTransaction({ date: "2024-01-15" });
    expect(getReportDate(t)).toBe("2024-01-15");
  });

  it("returns date when invoiceDueDate is undefined", () => {
    const t = makeTransaction({ date: "2024-03-20", invoiceDueDate: undefined });
    expect(getReportDate(t)).toBe("2024-03-20");
  });
});

// ---------------------------------------------------------------------------
// calculateInvoiceDueDate
// ---------------------------------------------------------------------------

describe("calculateInvoiceDueDate", () => {
  describe("non-card payment methods", () => {
    it("returns undefined for cash type", () => {
      const config: PaymentMethodConfig = { id: "pm2", name: "Cash", type: "cash" };
      expect(calculateInvoiceDueDate("2024-01-15", config)).toBeUndefined();
    });

    it("returns undefined for card without closingDay", () => {
      const config: PaymentMethodConfig = { id: "pm3", name: "Card", type: "card", paymentDay: 25 };
      expect(calculateInvoiceDueDate("2024-01-15", config)).toBeUndefined();
    });

    it("returns undefined for card without paymentDay", () => {
      const config: PaymentMethodConfig = { id: "pm4", name: "Card", type: "card", closingDay: 10 };
      expect(calculateInvoiceDueDate("2024-01-15", config)).toBeUndefined();
    });
  });

  describe("paymentDay > closingDay (payment same month as closing)", () => {
    // Closes on day 10, pays on day 25 of the same month
    const config = makeCardConfig("Visa", 10, 25);

    it("transaction before closing → invoice due same month", () => {
      // Jan 8 → closes Jan → paid Jan 25
      expect(calculateInvoiceDueDate("2024-01-08", config)).toBe("2024-01-25");
    });

    it("transaction on closing day → invoice due same month (not yet past)", () => {
      // Jan 10 → NOT > closingDay (10 > 10 is false) → same month
      expect(calculateInvoiceDueDate("2024-01-10", config)).toBe("2024-01-25");
    });

    it("transaction after closing → invoice due next month", () => {
      // Jan 11 → past closing → Feb invoice → paid Feb 25
      expect(calculateInvoiceDueDate("2024-01-11", config)).toBe("2024-02-25");
    });

    it("transaction at end of year before closing → invoice due same month", () => {
      // Dec 5 → closes Dec → paid Dec 25
      expect(calculateInvoiceDueDate("2024-12-05", config)).toBe("2024-12-25");
    });

    it("transaction at end of year after closing → invoice due January next year", () => {
      // Dec 15 → past Dec closing (10) → Jan next year invoice → paid Jan 25
      expect(calculateInvoiceDueDate("2024-12-15", config)).toBe("2025-01-25");
    });
  });

  describe("paymentDay <= closingDay (payment in month after closing)", () => {
    // Closes on day 25, pays on day 5 of the next month
    const config = makeCardConfig("Mastercard", 25, 5);

    it("transaction before closing → invoice due next month (paymentDay after closingMonth)", () => {
      // Jan 20 → closes Jan → paid Feb 5
      expect(calculateInvoiceDueDate("2024-01-20", config)).toBe("2024-02-05");
    });

    it("transaction after closing → invoice due two months ahead", () => {
      // Jan 26 → past Jan closing (25) → Feb invoice → paid Mar 5
      expect(calculateInvoiceDueDate("2024-01-26", config)).toBe("2024-03-05");
    });

    it("transaction in November after closing → wraps into January next year", () => {
      // Nov 26 → past Nov closing (25) → Dec invoice → paid Jan next year
      expect(calculateInvoiceDueDate("2024-11-26", config)).toBe("2025-01-05");
    });

    it("transaction in December before closing → Jan payment", () => {
      // Dec 20 → closes Dec → paid Jan 5 next year
      expect(calculateInvoiceDueDate("2024-12-20", config)).toBe("2025-01-05");
    });
  });

  describe("day padding", () => {
    it("pads single-digit month and day with leading zeros", () => {
      const config = makeCardConfig("Card", 10, 5);
      // Jan 8 → closes Jan → payment month = Feb (paymentDay 5 <= closingDay 10) → 2024-02-05
      expect(calculateInvoiceDueDate("2024-01-08", config)).toBe("2024-02-05");
    });
  });
});

// ---------------------------------------------------------------------------
// getEffectiveReportDate
// ---------------------------------------------------------------------------

describe("getEffectiveReportDate", () => {
  it("returns invoiceDueDate when already stored on transaction", () => {
    const t = makeTransaction({ date: "2024-01-08", invoiceDueDate: "2024-01-25" });
    const configs = [makeCardConfig("Visa", 10, 25)];
    expect(getEffectiveReportDate(t, configs)).toBe("2024-01-25");
  });

  it("calculates invoiceDueDate dynamically from matching config when not stored", () => {
    const t = makeTransaction({ date: "2024-01-08", paymentMethod: "Visa" });
    const configs = [makeCardConfig("Visa", 10, 25)];
    // Jan 8 < 10 → same month invoice → Jan 25
    expect(getEffectiveReportDate(t, configs)).toBe("2024-01-25");
  });

  it("falls back to transaction date when no config matches", () => {
    const t = makeTransaction({ date: "2024-01-08", paymentMethod: "Unknown" });
    const configs = [makeCardConfig("Visa", 10, 25)];
    expect(getEffectiveReportDate(t, configs)).toBe("2024-01-08");
  });

  it("falls back to transaction date when configs array is empty", () => {
    const t = makeTransaction({ date: "2024-01-08", paymentMethod: "Visa" });
    expect(getEffectiveReportDate(t, [])).toBe("2024-01-08");
  });

  it("falls back to transaction date when configs is undefined", () => {
    const t = makeTransaction({ date: "2024-01-08" });
    expect(getEffectiveReportDate(t)).toBe("2024-01-08");
  });

  it("falls back to date when matching config is cash type (calculateInvoiceDueDate returns undefined)", () => {
    const t = makeTransaction({ date: "2024-01-08", paymentMethod: "Cash" });
    const configs: PaymentMethodConfig[] = [{ id: "c1", name: "Cash", type: "cash" }];
    expect(getEffectiveReportDate(t, configs)).toBe("2024-01-08");
  });

  it("resolves correct month for transaction after closing day", () => {
    const t = makeTransaction({ date: "2024-01-11", paymentMethod: "Visa" });
    const configs = [makeCardConfig("Visa", 10, 25)];
    // Jan 11 > 10 → Feb invoice → Feb 25
    expect(getEffectiveReportDate(t, configs)).toBe("2024-02-25");
  });
});

// ---------------------------------------------------------------------------
// formatInvoiceMonth
// ---------------------------------------------------------------------------

describe("formatInvoiceMonth", () => {
  it("formats January correctly", () => {
    expect(formatInvoiceMonth("2024-01-25")).toBe("Janeiro 2024");
  });

  it("formats February correctly", () => {
    expect(formatInvoiceMonth("2024-02-05")).toBe("Fevereiro 2024");
  });

  it("formats March correctly", () => {
    expect(formatInvoiceMonth("2024-03-10")).toBe("Março 2024");
  });

  it("formats April correctly", () => {
    expect(formatInvoiceMonth("2024-04-01")).toBe("Abril 2024");
  });

  it("formats May correctly", () => {
    expect(formatInvoiceMonth("2024-05-15")).toBe("Maio 2024");
  });

  it("formats June correctly", () => {
    expect(formatInvoiceMonth("2024-06-20")).toBe("Junho 2024");
  });

  it("formats July correctly", () => {
    expect(formatInvoiceMonth("2024-07-01")).toBe("Julho 2024");
  });

  it("formats August correctly", () => {
    expect(formatInvoiceMonth("2024-08-10")).toBe("Agosto 2024");
  });

  it("formats September correctly", () => {
    expect(formatInvoiceMonth("2024-09-05")).toBe("Setembro 2024");
  });

  it("formats October correctly", () => {
    expect(formatInvoiceMonth("2024-10-25")).toBe("Outubro 2024");
  });

  it("formats November correctly", () => {
    expect(formatInvoiceMonth("2024-11-15")).toBe("Novembro 2024");
  });

  it("formats December correctly", () => {
    expect(formatInvoiceMonth("2024-12-31")).toBe("Dezembro 2024");
  });

  it("uses only year and month — ignores the day part", () => {
    expect(formatInvoiceMonth("2025-06-01")).toBe("Junho 2025");
    expect(formatInvoiceMonth("2025-06-28")).toBe("Junho 2025");
  });

  it("handles year change correctly", () => {
    expect(formatInvoiceMonth("2025-01-05")).toBe("Janeiro 2025");
  });
});
