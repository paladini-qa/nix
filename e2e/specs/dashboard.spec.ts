import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("carrega o dashboard sem erros", async ({ page }) => {
    // Não deve ter loading infinito
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 10_000 });
    // URL correta
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("exibe cards de resumo financeiro", async ({ page }) => {
    // Deve haver pelo menos um card com valor monetário (R$)
    const moneyText = page.locator("text=/R\\$\\s*\\d/").first();
    await expect(moneyText).toBeVisible({ timeout: 10_000 });
  });

  test("permite navegar para transações", async ({ page }) => {
    // Clica em algum link/botão de transações na nav
    const transactionsLink = page
      .locator('a[href*="transactions"], button:has-text("Transações"), [aria-label*="transações" i]')
      .first();
    await expect(transactionsLink).toBeVisible({ timeout: 5_000 });
    await transactionsLink.click();
    await expect(page).toHaveURL(/\/transactions/, { timeout: 8_000 });
  });

  test("permite navegar para orçamentos", async ({ page }) => {
    const budgetsLink = page
      .locator('a[href*="budgets"], button:has-text("Orçamentos"), [aria-label*="orçamentos" i]')
      .first();
    await expect(budgetsLink).toBeVisible({ timeout: 5_000 });
    await budgetsLink.click();
    await expect(page).toHaveURL(/\/budgets/, { timeout: 8_000 });
  });
});
