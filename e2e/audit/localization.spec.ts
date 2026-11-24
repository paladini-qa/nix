import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHOD_CONFIGS } from "../../src/shared/constants";

test("shows Portuguese and reais on the main screens and in the fiscal CSV", async ({ page }) => {
  test.setTimeout(150_000);
  const user = { id: "707781c6-9ac3-449a-a818-f7e46b4c1804", email: "audit@example.test", user_metadata: {} };
  const transactions = [
    { id: "11111111-1111-4111-8111-111111111111", description: "Compra para auditoria", amount: 1234.56, type: "expense", category: "Food", payment_method: "Credit Card" },
    { id: "22222222-2222-4222-8222-222222222222", description: "Aporte para auditoria", amount: 345.67, type: "expense", category: "Investments", payment_method: "Pix" },
  ].map((transaction) => ({
    ...transaction,
    date: "2026-11-05",
    created_at: "2026-11-05T13:00:00Z",
    user_id: user.id,
    is_paid: false,
  }));

  await page.clock.setFixedTime(new Date("2026-11-05T15:00:00Z"));
  await page.addInitScript((sessionUser) => {
    localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
      user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, user);

  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("https://nix-audit.invalid/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/user_settings")) {
      return route.fulfill({ json: {
        user_id: user.id, display_name: "Auditoria",
        categories_income: DEFAULT_CATEGORIES.income, categories_expense: DEFAULT_CATEGORIES.expense,
        payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
      } });
    }
    return route.fulfill({ json: url.pathname.endsWith("/transactions") && !url.searchParams.has("or") ? transactions : [] });
  });

  const main = page.getByRole("main");
  const realAmount = /R\$\s*1\.234,56/;
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(main.getByText("Comparativo Mensal")).toBeVisible();
  await expect(main).toContainText(realAmount);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  const row = main.getByRole("button", { name: /Compra para auditoria/ });
  await expect(row).toContainText(realAmount);
  await expect(row).toContainText("Cartão de crédito");
  await row.click();
  const details = page.getByRole("dialog", { name: "Compra para auditoria" });
  await expect(details.getByText("Alimentação", { exact: true })).toBeVisible();
  await expect(details.getByText("05/11/2026", { exact: true })).toBeVisible();
  await expect(details).toContainText(realAmount);

  for (const [route, heading] of [
    ["payment-methods", "Métodos de pagamento"],
    ["recurring", "Recorrentes"],
    ["splits", "Parcelas"],
    ["categories", "Categorias"],
    ["investments", "Investimentos"],
    ["subscriptions", "Assinaturas"],
    ["fiscal-report", "Relatório fiscal"],
  ]) {
    await page.goto(`/${route}`, { waitUntil: "domcontentloaded" });
    await expect(main.getByText(heading, { exact: true }).first()).toBeVisible();
    await expect(main).toContainText(/R\$\s*\d/);
  }

  const downloadPromise = page.waitForEvent("download");
  await main.getByRole("button", { name: "CSV", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("relatorio-fiscal-2026.csv");
  const path = await download.path();
  const csv = await readFile(path!, "utf-8");
  expect(csv).toContain("Mês;Receita (R$);Despesas (R$);Saldo (R$)");
  expect(csv).toContain("Novembro;0,00;1580,23;-1580,23");
});
