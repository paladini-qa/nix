import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilters } from "../../hooks/useFilters";

describe("useFilters", () => {
  it("should initialize with current month and year", () => {
    const { result } = renderHook(() => useFilters());
    const now = new Date();

    expect(result.current.filters.month).toBe(now.getMonth());
    expect(result.current.filters.year).toBe(now.getFullYear());
  });

  it("should initialize with custom values", () => {
    const { result } = renderHook(() => useFilters({ month: 5, year: 2023 }));

    expect(result.current.filters.month).toBe(5);
    expect(result.current.filters.year).toBe(2023);
  });

  it("should update date correctly", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setDate(3, 2024);
    });

    expect(result.current.filters.month).toBe(3);
    expect(result.current.filters.year).toBe(2024);
  });

  it("should update search term", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setSearchTerm("groceries");
    });

    expect(result.current.filters.searchTerm).toBe("groceries");
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it("should navigate to previous month", () => {
    const { result } = renderHook(() => useFilters({ month: 5, year: 2024 }));

    act(() => {
      result.current.previousMonth();
    });

    expect(result.current.filters.month).toBe(4);
    expect(result.current.filters.year).toBe(2024);
  });

  it("should handle year change when navigating previous month from January", () => {
    const { result } = renderHook(() => useFilters({ month: 0, year: 2024 }));

    act(() => {
      result.current.previousMonth();
    });

    expect(result.current.filters.month).toBe(11);
    expect(result.current.filters.year).toBe(2023);
  });

  it("should navigate to next month", () => {
    const { result } = renderHook(() => useFilters({ month: 5, year: 2024 }));

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.filters.month).toBe(6);
    expect(result.current.filters.year).toBe(2024);
  });

  it("should handle year change when navigating next month from December", () => {
    const { result } = renderHook(() => useFilters({ month: 11, year: 2024 }));

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.filters.month).toBe(0);
    expect(result.current.filters.year).toBe(2025);
  });

  it("should reset all filters", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setSearchTerm("test");
      result.current.setType("income");
      result.current.setCategory("Food");
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.searchTerm).toBe("");
    expect(result.current.filters.type).toBe("all");
    expect(result.current.filters.category).toBe("all");
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("should count active filters correctly", () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.activeFiltersCount).toBe(0);

    act(() => {
      result.current.setSearchTerm("test");
      result.current.setType("expense");
      result.current.setCategory("Food");
      result.current.setPaymentMethod("Credit Card");
    });

    expect(result.current.activeFiltersCount).toBe(4);
  });

  it("should detect current month correctly", () => {
    const now = new Date();
    const { result } = renderHook(() =>
      useFilters({ month: now.getMonth(), year: now.getFullYear() })
    );

    expect(result.current.isCurrentMonth).toBe(true);

    act(() => {
      result.current.previousMonth();
    });

    expect(result.current.isCurrentMonth).toBe(false);
  });
});




