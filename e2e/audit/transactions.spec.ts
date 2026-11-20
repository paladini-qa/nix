import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHOD_CONFIGS } from "../../src/shared/constants";

const user = { id: "707781c6-9ac3-449a-a818-f7e46b4c1804", email: "audit@example.test", user_metadata: {} };
const description = "Compra de auditoria";

test("confirms only saved transactions and supports create, edit and delete", async ({ page }) => {
  const rows: Record<string, unknown>[] = [];
  let requests = 0;
  let releaseFailure!: () => void;
  const failure = new Promise<void>((resolve) => { releaseFailure = resolve; });

  await page.route("https://nix-audit.invalid/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.endsWith("/token")) {
      return route.fulfill({ json: {
        user, access_token: "fake-access", refresh_token: "fake-refresh",
        expires_in: 3600, token_type: "bearer",
      } });
    }
    if (path.endsWith("/user")) return route.fulfill({ json: user });
    if (path.endsWith("/user_settings")) {
      return route.fulfill({ json: {
        user_id: user.id, theme_preference: "dark", display_name: "Auditoria",
        categories_income: DEFAULT_CATEGORIES.income, categories_expense: DEFAULT_CATEGORIES.expense,
        payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
      } });
    }
    if (!path.endsWith("/transactions")) return route.fulfill({ json: [] });
    const id = url.searchParams.get("id")?.slice(3);
    switch (request.method()) {
      case "POST": {
        requests++;
        if (requests === 1) {
          await failure;
          return route.fulfill({ status: 503, json: { message: "Simulated loss of connectivity" } });
        }
        const row = { ...request.postDataJSON(), id: randomUUID(), created_at: new Date().toISOString() };
        rows.push(row);
        return route.fulfill({ json: row });
      }
      case "PATCH": {
        const row = rows.find((candidate) => candidate.id === id)!;
        Object.assign(row, request.postDataJSON());
        return route.fulfill({ json: row });
      }
      case "DELETE":
        rows.splice(rows.findIndex((row) => row.id === id), 1);
        return route.fulfill({ status: 204, body: "" });
      default:
        return route.fulfill({ json: url.searchParams.has("or") ? [] : rows });
    }
  });

  await page.clock.setFixedTime(new Date("2026-11-05T15:00:00Z"));
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("fake-password");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("button", { name: "New", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Nova Transação" });
  const descriptionInput = dialog.getByRole("combobox", { name: "Description" });
  await descriptionInput.pressSequentially(description);
  await expect(descriptionInput).toHaveValue(description);
  await dialog.locator("#transaction-amount").fill("12,34");
  await dialog.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Food", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Payment Method" }).click();
  await page.getByRole("option", { name: "Pix", exact: true }).click();

  await expect(dialog.getByRole("combobox", { name: "Description" })).toHaveValue(description);
  await dialog.getByRole("button", { name: "Criar Transação" }).click();
  await expect(dialog.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  await expect.poll(() => requests).toBe(1);
  await dialog.locator("form").dispatchEvent("submit", { bubbles: true, cancelable: true });
  releaseFailure();
  await expect(page.getByText("Erro ao salvar transação. Tente novamente.")).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Description" })).toHaveValue(description);
  expect(rows).toHaveLength(0);
  expect(requests).toBe(1);

  await dialog.getByRole("button", { name: "Criar Transação" }).click();
  await expect(dialog).toBeHidden();
  expect(rows).toMatchObject([{ description, amount: 12.34, is_paid: false }]);

  await page.goto("/transactions");
  await page.getByRole("button", { name: `Edit ${description}` }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByRole("combobox", { name: "Description" }).fill(`${description} editada`);
  await editDialog.getByRole("button", { name: "Salvar Alterações" }).click();
  await expect(editDialog).toBeHidden();
  expect(rows).toMatchObject([{ description: `${description} editada`, is_paid: false }]);

  await page.getByRole("button", { name: `Delete ${description} editada` }).click();
  await page.getByRole("dialog").getByRole("button", { name: /delete|excluir/i }).click();
  await expect(page.getByRole("button", { name: `Edit ${description} editada` })).toHaveCount(0);
  expect(rows).toHaveLength(0);
});

test("shows a reachable new transaction action on mobile and tablet", async ({ page }) => {
  await page.addInitScript((sessionUser) => {
    localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
      user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, user);
  await page.route("https://nix-audit.invalid/**", (route) =>
    route.fulfill({ json: route.request().url().includes("/user_settings") ? {
      user_id: user.id, theme_preference: "light", payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
    } : [] })
  );

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/transactions");
    await page.getByRole("button", { name: "New", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Nova Transação" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Description" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});

test("blocks future-only recurrence changes while leaving occurrence actions available", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T15:00:00Z"));
  await page.addInitScript((sessionUser) => {
    localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
      user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, user);
  await page.route("https://nix-audit.invalid/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/user_settings")) {
      return route.fulfill({ json: {
        user_id: user.id, theme_preference: "light", payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
      } });
    }
    if (url.pathname.endsWith("/transactions") && !url.searchParams.has("or")) {
      return route.fulfill({ json: [{
        id: "3775aa75-74a3-4030-9c06-886f55c84bbb", user_id: user.id,
        date: "2026-11-05", description: "Assinatura de auditoria", type: "expense",
        is_recurring: true, frequency: "monthly", amount: 50, payment_method: "Pix",
        category: "Subscriptions", is_paid: false, created_at: "2026-11-05T13:00:00Z",
      }] });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto("/transactions");
  await page.getByRole("button", { name: "Delete Assinatura de auditoria" }).click();
  await expect(page.getByRole("button", { name: /Stop the recurrence/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Delete only this occurrence/i })).toBeEnabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Edit Assinatura de auditoria" }).click();
  await expect(page.getByRole("button", { name: /Edit this and future ones/i })).toBeDisabled();
});
