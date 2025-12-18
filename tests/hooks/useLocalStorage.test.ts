import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return initial value when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useLocalStorage("testKey", "initialValue")
    );

    expect(result.current[0]).toBe("initialValue");
  });

  it("should read existing value from localStorage", () => {
    localStorage.setItem("testKey", JSON.stringify("existingValue"));

    const { result } = renderHook(() =>
      useLocalStorage("testKey", "initialValue")
    );

    expect(result.current[0]).toBe("existingValue");
  });

  it("should update value and persist to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorage("testKey", "initialValue")
    );

    act(() => {
      result.current[1]("newValue");
    });

    expect(result.current[0]).toBe("newValue");
    expect(JSON.parse(localStorage.getItem("testKey") || "")).toBe("newValue");
  });

  it("should handle function updates", () => {
    const { result } = renderHook(() => useLocalStorage("testKey", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(6);
  });

  it("should handle object values", () => {
    const initialValue = { name: "test", count: 0 };
    const { result } = renderHook(() =>
      useLocalStorage("testKey", initialValue)
    );

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      result.current[1]({ name: "updated", count: 10 });
    });

    expect(result.current[0]).toEqual({ name: "updated", count: 10 });
  });

  it("should handle array values", () => {
    const { result } = renderHook(() =>
      useLocalStorage<string[]>("testKey", [])
    );

    act(() => {
      result.current[1](["item1", "item2"]);
    });

    expect(result.current[0]).toEqual(["item1", "item2"]);
  });

  it("should remove value from localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorage("testKey", "initialValue")
    );

    act(() => {
      result.current[1]("storedValue");
    });

    expect(localStorage.getItem("testKey")).not.toBeNull();

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe("initialValue");
    expect(localStorage.getItem("testKey")).toBeNull();
  });

  it("should handle boolean values", () => {
    const { result } = renderHook(() => useLocalStorage("testKey", false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });
});





