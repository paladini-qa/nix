import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrency } from "../../hooks/useCurrency";

describe("useCurrency", () => {
  it("should format currency correctly in BRL", () => {
    const { result } = renderHook(() => useCurrency());

    expect(result.current.format(1234.56)).toBe("R$\u00A01.234,56");
    expect(result.current.format(0)).toBe("R$\u00A00,00");
    expect(result.current.format(1000000)).toBe("R$\u00A01.000.000,00");
  });

  it("should format with sign correctly", () => {
    const { result } = renderHook(() => useCurrency());

    expect(result.current.formatWithSign(100)).toContain("+");
    expect(result.current.formatWithSign(-100)).toContain("-");
    expect(result.current.formatWithSign(0)).not.toContain("+");
    expect(result.current.formatWithSign(0)).not.toContain("-");
  });

  it("should format compact values", () => {
    const { result } = renderHook(() => useCurrency());

    const compact1K = result.current.formatCompact(1500);
    expect(compact1K).toContain("mil");

    const compact1M = result.current.formatCompact(1500000);
    expect(compact1M).toContain("mi");
  });

  it("should parse currency strings correctly", () => {
    const { result } = renderHook(() => useCurrency());

    expect(result.current.parse("R$ 1.234,56")).toBe(1234.56);
    expect(result.current.parse("1234,56")).toBe(1234.56);
    expect(result.current.parse("invalid")).toBe(0);
  });

  it("should return correct currency symbol", () => {
    const { result } = renderHook(() => useCurrency());

    expect(result.current.currencySymbol).toBe("R$");
  });

  it("should use custom options", () => {
    const { result } = renderHook(() =>
      useCurrency({ locale: "en-US", currency: "USD" })
    );

    expect(result.current.currency).toBe("USD");
    expect(result.current.format(100)).toContain("$");
  });
});




