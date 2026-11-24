import { Theme } from "@radix-ui/themes";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ConfirmDialogProvider, useConfirmDialog } from "@/presentation/contexts/ConfirmDialog";

function Confirmations({ onResult }: { onResult: (value: boolean) => void }) {
  const { confirm } = useConfirmDialog();
  return (
    <button onClick={() => {
      void confirm({ title: "First confirmation", message: "First message" }).then(onResult);
      void confirm({ title: "Second confirmation", message: "Second message" }).then(onResult);
    }}>
      Start
    </button>
  );
}

describe("ConfirmDialogProvider", () => {
  it("presents simultaneous confirmations in order and resolves each answer", async () => {
    const user = userEvent.setup();
    const results: boolean[] = [];
    render(
      <Theme>
        <ConfirmDialogProvider>
          <Confirmations onResult={(value) => results.push(value)} />
        </ConfirmDialogProvider>
      </Theme>
    );

    await user.click(screen.getByRole("button", { name: "Start" }));
    const first = screen.getByRole("dialog", { name: "First confirmation" });
    expect(first).toHaveAccessibleDescription("First message");
    expect(within(first).getByRole("button", { name: "Cancelar" })).toHaveFocus();
    await user.keyboard("{Escape}");
    const second = screen.getByRole("dialog", { name: "Second confirmation" });
    await user.click(within(second).getByRole("button", { name: "Confirmar" }));
    expect(results).toEqual([false, true]);
  });
});
