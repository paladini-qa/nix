import { expect, test } from "@playwright/test";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHOD_CONFIGS } from "../../src/shared/constants";

const user = { id: "707781c6-9ac3-449a-a818-f7e46b4c1804", email: "audit@example.test", user_metadata: {} };
const description = "Compra de privacidade";
const amountPattern = /(?:1[.,]357[.,]49|123[.,]45|1[.,]234[.,]04)/;
const transactions = [
  { id: "11111111-1111-4111-8111-111111111111", description, amount: 123.45, type: "expense", category: "Food" },
  { id: "22222222-2222-4222-8222-222222222222", description: "Receita de privacidade", amount: 1357.49, type: "income", category: "Salary" },
].map((row) => ({
  ...row,
  date: "2026-11-05",
  created_at: "2026-11-05T13:00:00Z",
  payment_method: "Pix",
  user_id: user.id,
  is_paid: false,
}));

for (const { name, viewport, theme } of [
  { name: "mobile", viewport: { width: 390, height: 844 }, theme: "light" },
  { name: "desktop", viewport: { width: 1440, height: 900 }, theme: "dark" },
]) {
  test(`masks dashboard, search and transaction amounts on ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-11-05T15:00:00Z"));
    await page.addInitScript((sessionUser) => {
      if (localStorage.getItem("sb-nix-audit-auth-token")) return;
      localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
        user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }));
    }, user);

    await page.route("https://nix-audit.invalid/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/user_settings")) {
        return route.fulfill({ json: {
          user_id: user.id, theme_preference: theme, display_name: "Auditoria",
          categories_income: DEFAULT_CATEGORIES.income, categories_expense: DEFAULT_CATEGORIES.expense,
          payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
        } });
      }
      return route.fulfill({ json: url.pathname.endsWith("/transactions") && !url.searchParams.has("or") ? transactions : [] });
    });

    const isMobile = name === "mobile";
    const main = page.getByRole("main");
    const mask = "••••••";
    const chartHidden = /Chart data hidden|Dados do gráfico ocultos/;
    await page.goto("/dashboard");
    await expect(main).toContainText(amountPattern);
    await expect(main.locator(".recharts-wrapper").first()).toBeVisible();

    if (isMobile) {
      await page.getByRole("button", { name: "Ocultar valores" }).click();
    } else {
      await page.keyboard.press("Alt+p");
    }
    await expect(main).toContainText(mask);
    await expect(main).not.toContainText(amountPattern);
    await expect(main.getByText(chartHidden).first()).toBeVisible();
    await expect(main.locator(".recharts-wrapper")).toHaveCount(0);

    if (isMobile) {
      await page.getByRole("banner").getByRole("button", { name: "Search" }).click();
    } else {
      await page.getByText("Search transactions, categories…", { exact: true }).click();
    }
    const search = page.getByRole("dialog", { name: "Busca global" });
    await search.getByRole("textbox", { name: "Buscar transações ou páginas" }).fill(description);
    await expect(search.getByText(description, { exact: true })).toBeVisible();
    await expect(search).toContainText(mask);
    await expect(search).not.toContainText(amountPattern);
    expect(await search.ariaSnapshot()).not.toMatch(amountPattern);

    await page.goto("/transactions");
    await expect(main.getByText(description, { exact: true })).toBeVisible();
    await expect(main).toContainText(mask);
    await expect(main).not.toContainText(amountPattern);
    if (isMobile) {
      await main.getByRole("button", { name: new RegExp(description) }).click();
      const detail = page.getByRole("dialog", { name: description });
      await expect(detail).toContainText(mask);
      await expect(detail).not.toContainText(amountPattern);
      expect(await detail.ariaSnapshot()).not.toMatch(amountPattern);
      await detail.getByRole("button", { name: "Close", exact: true }).click();
      await page.getByRole("button", { name: "Mostrar valores" }).click();
    } else {
      await page.keyboard.press("Alt+p");
    }
    await expect(main).toContainText(amountPattern);
    await page.goto("/dashboard");
    await expect(main.locator(".recharts-wrapper").first()).toBeVisible();
    await expect(main).toContainText(amountPattern);
  });
}
