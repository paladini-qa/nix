import { expect, test } from "@playwright/test";
import { DEFAULT_CATEGORIES } from "../../src/shared/constants";

test("shows and compares payment method expenses for the selected month", async ({ page }) => {
  const user = { id: "707781c6-9ac3-449a-a818-f7e46b4c1804", email: "audit@example.test", user_metadata: {} };
  const methods = [
    { id: "pix", name: "Pix", type: "cash" },
    { id: "azul", name: "Azul", type: "card" },
    { id: "magalu", name: "Magalu", type: "card" },
    { id: "revolut", name: "Revolut", type: "cash" },
    { id: "cash", name: "Cash", type: "cash" },
  ];
  const transactions = [
    { description: "Compra via Pix", amount: 600, type: "expense", payment_method: "Pix", date: "2026-11-05" },
    { description: "Compra no Azul", amount: 250, type: "expense", payment_method: "Azul", date: "2026-10-27", invoice_due_date: "2026-11-05" },
    { description: "Compra na Magalu", amount: 100, type: "expense", payment_method: "Magalu", date: "2026-11-05", is_paid: true },
    { description: "Compra no Revolut", amount: 50, type: "expense", payment_method: "Revolut", date: "2026-11-05" },
    { description: "Despesa no mês seguinte", amount: 4000, type: "expense", payment_method: "Azul", date: "2026-11-20", invoice_due_date: "2026-12-05" },
    { description: "Receita via Pix", amount: 500, type: "income", payment_method: "Pix", date: "2026-11-05" },
  ].map((transaction, index) => ({
    id: `11111111-1111-4111-8111-11111111111${index}`,
    created_at: "2026-11-05T13:00:00Z",
    user_id: user.id,
    category: "Other",
    is_paid: false,
    ...transaction,
  }));

  await page.setViewportSize({ width: 1440, height: 900 });
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
        user_id: user.id, display_name: "Auditoria",
        categories_income: DEFAULT_CATEGORIES.income, categories_expense: DEFAULT_CATEGORIES.expense,
        payment_methods: methods.map(({ name }) => name), payment_method_configs: methods,
      } });
    }
    return route.fulfill({ json: url.pathname.endsWith("/transactions") && !url.searchParams.has("or") ? transactions : [] });
  });

  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.goto("/payment-methods", { waitUntil: "domcontentloaded" });
  const main = page.getByRole("main");
  await expect(page.getByRole("complementary").getByText("Métodos de pagamento", { exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { level: 1, name: "Métodos de pagamento" })).toBeVisible();
  await expect(main.getByText("Total a pagar", { exact: true }).locator("..")).toContainText(/R\$\s*900,00/);
  await expect(main.getByText("Cobranças pendentes", { exact: true }).locator("..").getByText("3", { exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Gastos por método" })).toBeVisible();
  await expect(main.locator(".recharts-pie-sector path.recharts-sector")).toHaveCount(4);
  await expect(main.locator("path.recharts-rectangle")).toHaveCount(4);
  for (const chart of await main.locator(".recharts-surface").all()) {
    await expect(chart).toBeVisible();
  }
  await expect(main.getByText("Pix representa a maior fatia dos gastos do mês (60%).")).toBeVisible();

  const table = main.getByRole("table", { name: "Métodos de pagamento" });
  await expect(table.getByRole("row").nth(1)).toContainText(/Pix.*600,00.*60%/);
  await expect(table.getByRole("row", { name: /Azul/ })).toContainText(/R\$\s*250,00/);
  await expect(table.getByRole("row", { name: /^Total / })).toContainText(/R\$\s*1\.000,00/);
  await expect(table.getByRole("row", { name: /^Total / }).getByRole("cell").nth(2)).toHaveText("4");
  await table.getByRole("button", { name: "Método", exact: true }).click();
  await expect(table.getByRole("row").nth(1)).toContainText("Azul");

  await main.getByRole("button", { name: "Ações de Azul", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Pagar pendências" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Editar método" }).click();
  await expect(page.getByRole("dialog").getByRole("textbox", { name: "Nome" })).toHaveValue("Azul");
  await page.getByRole("button", { name: "Cancelar" }).click();

  await main.getByRole("button", { name: "Novo método", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Novo método de pagamento" }).getByRole("button", { name: "Cartão", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(table.getByRole("row", { name: /Pix/ })).toContainText("60% · 1 despesa");
  await expect.poll(() => table.evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(375);

  await main.getByRole("button", { name: "Ver transações por método" }).click();
  await page.getByRole("menuitem", { name: "Pix", exact: true }).click();
  await expect(main.getByText("Compra via Pix", { exact: true })).toBeVisible();
  await expect(main.getByText("Compra no Azul", { exact: true })).toHaveCount(0);
});
