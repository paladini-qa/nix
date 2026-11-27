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
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("fake-password");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("button", { name: "Nova", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Nova Transação" });
  const descriptionInput = dialog.getByRole("combobox", { name: "Descrição" });
  await descriptionInput.pressSequentially(description);
  await expect(descriptionInput).toHaveValue(description);
  await dialog.locator("#transaction-amount").fill("12,34");
  await dialog.getByRole("combobox", { name: "Categoria" }).click();
  await page.getByRole("option", { name: "Alimentação", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Método de pagamento" }).click();
  await page.getByRole("option", { name: "Pix", exact: true }).click();

  await expect(dialog.getByRole("combobox", { name: "Descrição" })).toHaveValue(description);
  await dialog.getByRole("button", { name: "Criar Transação" }).click();
  await expect(dialog.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  await expect.poll(() => requests).toBe(1);
  await dialog.locator("form").dispatchEvent("submit", { bubbles: true, cancelable: true });
  releaseFailure();
  await expect(page.getByText("Erro ao salvar transação. Tente novamente.")).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Descrição" })).toHaveValue(description);
  expect(rows).toHaveLength(0);
  expect(requests).toBe(1);

  const savedRows = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    response.url().includes("/rest/v1/transactions") &&
    !new URL(response.url()).searchParams.has("or")
  );
  await dialog.getByRole("button", { name: "Criar Transação" }).click();
  await savedRows;
  await expect(dialog).toBeHidden();
  expect(rows).toMatchObject([{ description, amount: 12.34, is_paid: false, category: "Food" }]);

  await page.getByRole("complementary").getByText("Transações", { exact: true }).click();
  await page.getByRole("button", { name: `Editar ${description}` }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByRole("combobox", { name: "Descrição" }).fill(`${description} editada`);
  await editDialog.getByRole("button", { name: "Salvar Alterações" }).click();
  await expect(editDialog).toBeHidden();
  expect(rows).toMatchObject([{ description: `${description} editada`, is_paid: false }]);

  await page.getByRole("button", { name: `Excluir ${description} editada` }).click();
  await page.getByRole("dialog").getByRole("button", { name: /delete|excluir/i }).click();
  await expect(page.getByRole("button", { name: `Editar ${description} editada` })).toHaveCount(0);
  await expect.poll(() => rows.length).toBe(0);
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
  await expect(header.getByRole("button", { name: "Menu" })).toHaveCount(0);
  const dateButton = header.getByRole("button", { name: /Selecionar mês/ });
  const searchButton = header.getByRole("button", { name: "Buscar" });
  await expect(searchButton).toBeVisible();
  const dateBounds = await dateButton.boundingBox();
  const searchBounds = await searchButton.boundingBox();
  expect(dateBounds!.x + dateBounds!.width).toBeLessThanOrEqual(searchBounds!.x);
  expect(searchBounds!.width).toBeGreaterThanOrEqual(44);

  await page.getByRole("navigation", { name: "Menu" }).getByRole("button", { name: "Perfil" }).click();
  const profile = page.getByRole("dialog", { name: "Perfil" });
  await expect(profile.getByRole("button", { name: "Sair" })).toBeVisible();
  await profile.getByRole("button", { name: "Fechar perfil" }).click();

  await dateButton.click();
  await page.getByRole("button", { name: "Fev", exact: true }).click();
  await expect(dateButton).toHaveAccessibleName(/Selecionar mês, Fev/);

  await searchButton.click();
  const search = page.getByPlaceholder("Buscar transações, navegar para...");
  await search.fill("Transações");
  await expect(page.getByRole("dialog").getByText("Transações", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("navigation", { name: "Menu" }).getByRole("button", { name: "Nova Transação" }).click();
  const createDialog = page.getByRole("dialog", { name: "Nova Transação" });
  await expect(createDialog.getByRole("combobox", { name: "Descrição" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(createDialog).toBeHidden();

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/transactions");
    await page.getByRole("button", { name: "Nova", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Nova Transação" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Descrição" })).toBeVisible();
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
  await page.getByRole("button", { name: "Excluir Assinatura de auditoria" }).click();
  await expect(page.getByRole("button", { name: /Parar a recorrência/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Excluir apenas esta ocorrência/i })).toBeEnabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Editar Assinatura de auditoria" }).click();
  await expect(page.getByRole("button", { name: /Editar esta e as futuras/i })).toBeDisabled();
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
  await page.getByRole("button", { name: "Alterar vencimentos" }).click();
  const draft = page.getByRole("dialog", { name: "Alterar vencimentos" });
  const dueDay = draft.getByRole("combobox", { name: /Dia do vencimento/ });
  await dueDay.click();
  await page.getByRole("option", { name: "Dia 15", exact: true }).click();
  await draft.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(draft.getByRole("alert")).toBeVisible();
  await expect(dueDay).toHaveText("Dia 15");
  expect(requests).toEqual([{ p_changes: [
    { id: timestamps[0].id, date: "2026-11-15", previous_date: "2026-11-10",
      invoice_due_date: "2026-12-20", previous_invoice_due_date: "2026-11-20" },
    { id: timestamps[1].id, date: "2026-12-15", previous_date: "2026-12-10",
      invoice_due_date: "2027-01-20", previous_invoice_due_date: "2026-12-20" },
  ] }]);

  await draft.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(draft).toBeHidden();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
});

test("shows compact mobile rows with full details and a stationary bottom bar", async ({ page }) => {
  const title = "Pagamento para o fornecedor de serviços da unidade de Vila Nova";
  const rows = Array.from({ length: 35 }, (_, index) => ({
    id: `synthetic-${String(99 - index).padStart(2, "0")}`,
    user_id: user.id,
    description: index === 0 ? title : `Synthetic expense ${index}`,
    amount: 128.99,
    date: index === 0 ? "2026-11-08" : "2026-11-07",
    invoice_due_date: "2026-11-20",
    payment_method: "Card",
    category: "Office",
    type: "expense",
    is_paid: false,
    notes: "Contrato da unidade",
    installments: 3,
    current_installment: 2,
    created_at: "2026-11-05T13:00:00Z",
  }));
  await page.clock.setFixedTime(new Date("2026-11-05T15:00:00Z"));
  await page.setViewportSize({ width: 320, height: 700 });
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
      return route.fulfill({ json: { user_id: user.id, payment_method_configs: [] } });
    }
    if (url.pathname.endsWith("/transactions") && request.method() === "PATCH") {
      const target = rows.find((row) => `eq.${row.id}` === url.searchParams.get("id"))!;
      Object.assign(target, request.postDataJSON());
      return route.fulfill({ json: target });
    }
    if (url.pathname.endsWith("/transactions") && !url.searchParams.has("or")) {
      return route.fulfill({ json: rows });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto("/transactions");
  const navigation = page.getByRole("navigation", { name: "Menu" });
  const isAnchored = () => navigation.evaluate((element) => ({
    bottom: Math.round(window.innerHeight - element.getBoundingClientRect().bottom),
    transform: getComputedStyle(element).transform,
  }));
  await expect.poll(isAnchored).toEqual({ bottom: 12, transform: "none" });

  const row = page.getByRole("button", { name: new RegExp(title) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Card", { exact: true })).toBeVisible();
  await expect(row.getByText("Office", { exact: true })).toHaveCount(0);
  const description = row.getByText(title, { exact: true });
  expect(await description.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await row.click();
  const details = page.getByRole("dialog", { name: title });
  await expect(details.getByText("Office", { exact: true })).toBeVisible();
  await expect(details.getByText("20/11/2026", { exact: true })).toBeVisible();
  await expect(details.getByText(/R\$\s*128,99/)).toBeVisible();
  await expect(details.getByText("2 / 3", { exact: true })).toBeVisible();
  await expect(details.getByText("Contrato da unidade", { exact: true })).toBeVisible();
  const paid = details.getByRole("checkbox", { name: "Pago" });
  await expect(paid).not.toBeChecked();
  await paid.check();
  await expect.poll(() => rows[0].is_paid).toBe(true);
  await expect(paid).toBeChecked();
  await expect(details.getByRole("button", { name: "Editar" })).toBeVisible();
  await expect(details.getByRole("button", { name: "Excluir" })).toBeVisible();
  await details.getByRole("button", { name: "Fechar", exact: true }).click();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect.poll(isAnchored).toEqual({ bottom: 12, transform: "none" });
  await page.reload();
  await expect.poll(isAnchored).toEqual({ bottom: 12, transform: "none" });
});
