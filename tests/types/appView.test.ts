import { describe, expect, it } from "vitest";
import { ROUTE_VIEWS, VIEW_ROUTES } from "@/presentation/routes";

describe("App routes", () => {
  it("maps each view to its path and back", () => {
    for (const [view, path] of Object.entries(VIEW_ROUTES)) {
      expect(ROUTE_VIEWS[path]).toBe(view);
    }
  });

  it("does not register the retired notification and shared screens", () => {
    expect(ROUTE_VIEWS).not.toHaveProperty("/notifications");
    expect(ROUTE_VIEWS).not.toHaveProperty("/shared");
  });
});
