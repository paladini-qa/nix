import { describe, expect, it } from "vitest";
import { formatTransactionAmount, parseTransactionAmount } from "@/domain/usecases/transactionAmount";

describe("transaction amount", () => {
  it.each([
    ["150", 150],
    ["12,3", 12.3],
    ["12.30", 12.3],
    [",05", 0.05],
    ["0", 0],
    ["R$ 1.234,56", 1234.56],
    ["$1,234.56", 1234.56],
    ["1.234.567", 1234567],
  ])("parses %s", (input, expected) => {
    expect(parseTransactionAmount(input)).toBe(expected);
  });

  it.each(["", ".", "12..30", "34,5678", "12,3x", "100+50", "-12", "9".repeat(25)])(
    "rejects %j",
    (input) => expect(parseTransactionAmount(input)).toBeNull()
  );

  it("formats whole amounts and cents without changing their value", () => {
    expect(formatTransactionAmount(12)).toBe("12,00");
    expect(formatTransactionAmount(1234.5)).toBe("1.234,50");
    expect(parseTransactionAmount(formatTransactionAmount(1234.56))).toBe(1234.56);
  });
});
