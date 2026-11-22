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

test("keeps mobile navigation and transaction creation reachable", async ({ page }) => {
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

  await page.clock.setFixedTime(new Date("2026-11-05T15:00:00Z"));
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/dashboard");
  const header = page.getByRole("banner");
  const menuButton = header.getByRole("button", { name: "Menu" });
  const dateButton = header.getByRole("button", { name: /Choose month/ });
  const searchButton = header.getByRole("button", { name: "Search" });
  await expect(searchButton).toBeVisible();
  const dateBounds = await dateButton.boundingBox();
  const searchBounds = await searchButton.boundingBox();
  expect(dateBounds!.x + dateBounds!.width).toBeLessThanOrEqual(searchBounds!.x);
  expect(searchBounds!.width).toBeGreaterThanOrEqual(44);

  await menuButton.click();
  const menu = page.getByRole("dialog", { name: "Nix Finance" });
  await expect(menu.getByText("Payment Methods", { exact: true })).toBeVisible();
  await menu.getByRole("button", { name: "Close" }).click({ timeout: 8000 });

  await dateButton.click();
  await page.getByRole("button", { name: "Feb", exact: true }).click();
  await expect(dateButton).toHaveAccessibleName(/Choose month, Feb/);

  await searchButton.click();
  const search = page.getByPlaceholder("Buscar transações, navegar para...");
  await search.fill("transactions");
  await expect(page.getByRole("dialog").getByText("Transactions", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("navigation", { name: "Menu" }).getByRole("button", { name: "New Transaction" }).click();
  const createDialog = page.getByRole("dialog", { name: "Nova Transação" });
  await expect(createDialog.getByRole("combobox", { name: "Description" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(createDialog).toBeHidden();

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

test("reschedules all selected installments in one request and keeps the draft on failure", async ({ page }) => {
  const timestamps = [
    { id: "00000000-0000-0000-0000-000000000901", date: "2026-11-10", invoice_due_date: "2026-11-20" },
    { id: "00000000-0000-0000-0000-000000000902", date: "2026-12-10", invoice_due_date: "2026-12-20" },
  ];
  const requests: unknown[] = [];
  await page.addInitScript((sessionUser) => {
    localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
      user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, user);
  await page.route("https://nix-audit.invalid/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/user_settings")) {
      return route.fulfill({ json: {
        user_id: user.id, payment_method_configs: [
          { id: "card", name: "Card", type: "card", closingDay: 12, paymentDay: 20 },
        ],
      } });
    }
    if (url.pathname.endsWith("/reschedule_installments")) {
      requests.push(request.postDataJSON());
      return requests.length === 1
        ? route.fulfill({ status: 503, json: { message: "Simulated failure" } })
        : route.fulfill({ status: 204, body: "" });
    }
    if (url.pathname.endsWith("/transactions") && !url.searchParams.has("or")) {
      return route.fulfill({ json: timestamps.map((row, index) => ({
        ...row, description: "Synthetic purchase", amount: 25.01, user_id: user.id,
        installments: 2, current_installment: index + 1, is_paid: index === 0,
        installment_group_id: "00000000-0000-0000-0000-000000000900",
        type: "expense", category: "Other", payment_method: "Card", created_at: "2026-11-05T13:00:00Z",
      })).reverse() });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto("/splits");
  await page.getByRole("button", { name: "Change due dates" }).click();
  const draft = page.getByRole("dialog", { name: "Change Due Dates" });
  const dueDay = draft.getByRole("combobox", { name: /Due Day/ });
  await dueDay.click();
  await page.getByRole("option", { name: "Day 15", exact: true }).click();
  await draft.getByRole("button", { name: "Save Changes" }).click();
  await expect(draft.getByRole("alert")).toBeVisible();
  await expect(dueDay).toHaveText("Day 15");
  expect(requests).toEqual([{ p_changes: [
    { id: timestamps[0].id, date: "2026-11-15", previous_date: "2026-11-10",
      invoice_due_date: "2026-12-20", previous_invoice_due_date: "2026-11-20" },
    { id: timestamps[1].id, date: "2026-12-15", previous_date: "2026-12-10",
      invoice_due_date: "2027-01-20", previous_invoice_due_date: "2026-12-20" },
  ] }]);

  await draft.getByRole("button", { name: "Save Changes" }).click();
  await expect(draft).toBeHidden();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
});
