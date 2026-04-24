import { describe, it, expectTypeOf } from "vitest";
import type { AppCurrentView } from "../../types/appView";

describe("AppCurrentView", () => {
  it("accepts known view ids", () => {
    const views: AppCurrentView[] = [
      "dashboard",
      "transactions",
      "nixai",
      "budgets",
      "goals",
      "planning",
      "paymentMethods",
      "categories",
      "splits",
      "shared",
      "recurring",
    ];
    expectTypeOf(views).toEqualTypeOf<AppCurrentView[]>();
    expect(views).toHaveLength(11);
  });
});
