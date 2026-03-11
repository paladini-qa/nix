import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyState from "../../components/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        type="generic"
        title="No data"
        description="Add something to get started."
      />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Add something to get started.")).toBeInTheDocument();
  });

  it("calls onAction when action button is clicked", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        type="transactions"
        title="No transactions"
        description="Start tracking"
        actionLabel="Add"
        onAction={onAction}
      />
    );
    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
