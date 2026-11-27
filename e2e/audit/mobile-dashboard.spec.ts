import { expect, test } from "@playwright/test";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHOD_CONFIGS } from "../../src/shared/constants";

test("shows the mobile overview, upcoming bills and a floating dock", async ({ page }) => {
  const user = { id: "707781c6-9ac3-449a-a818-f7e46b4c1804", email: "audit@example.test", user_metadata: {} };
  const rows = [
    { description: "Salário", amount: 5000, date: "2026-11-01", type: "income", category: "Salary", is_paid: true },
    { description: "Aluguel pago", amount: 800, date: "2026-11-04", is_paid: true },
    { description: "Compra no cartão", amount: 1234.56, date: "2026-10-29", invoice_due_date: "2026-11-20", payment_method: "Credit Card" },
    { description: "Internet", amount: 89.9, date: "2026-11-12" },
    { description: "Assinatura mensal", amount: 39.9, date: "2026-10-24", is_recurring: true, frequency: "monthly", category: "Subscriptions" },
    { description: "Compra fora da janela", amount: 100, date: "2026-12-05" },
  ].map((row, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    user_id: user.id, payment_method: "Pix", type: "expense", category: "Housing",
    created_at: "2026-10-01T12:00:00Z", is_paid: false, ...row,
  }));

  await page.setViewportSize({ width: 320, height: 700 });
  await page.clock.setFixedTime(new Date("2026-11-05T12:00:00Z"));
  await page.addInitScript((sessionUser) => {
    localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
      user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, user);
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://nix-audit.invalid/**", (route) => {
    const url = new URL(route.request().url());
    return route.fulfill({ json: url.pathname.endsWith("/user_settings") ? {
      user_id: user.id, display_name: "Marina Teste", theme_preference: "light",
      categories_income: DEFAULT_CATEGORIES.income, categories_expense: DEFAULT_CATEGORIES.expense,
      payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
    } : url.pathname.endsWith("/transactions") && !url.searchParams.has("or") ? rows : [] });
  });

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  const header = page.getByRole("banner");
  const main = page.getByRole("main");
  await expect(header.getByRole("heading", { name: "Bom dia, Marina" })).toBeVisible();
  await expect(header.getByRole("button", { name: /Selecionar mês, Nov/ })).toBeVisible();

  const card = (title: string) => main.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await expect(card("Saldo registrado")).toContainText(/R\$\s*4\.200,00/);
  await expect(card("Saldo registrado")).toContainText(/R\$\s*2\.965,44/);
  await expect(card("Faturas em aberto")).toContainText(/R\$\s*1\.234,56/);
  await expect(card("Fluxo de novembro")).toContainText(/R\$\s*5\.000,00/);

  const upcoming = card("Próximos 30 dias");
  await expect(upcoming.getByRole("listitem")).toHaveCount(3);
  await expect(upcoming.getByRole("listitem").nth(0)).toContainText("Internet");
  await expect(upcoming.getByRole("listitem").nth(1)).toContainText("Compra no cartão");
  await expect(upcoming.locator('time[datetime="2026-11-20"]')).toHaveCount(1);
  await expect(upcoming.getByRole("listitem").nth(2)).toContainText("Assinatura mensal");

  const nav = page.getByRole("navigation", { name: "Menu" });
  await expect(nav.getByRole("button", { name: "Painel" })).toHaveAttribute("aria-current", "page");
  const dockInsets = () => nav.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: Math.round(rect.left), bottom: Math.round(innerHeight - rect.bottom) };
  });
  await expect.poll(dockInsets).toEqual({ x: 12, bottom: 12 });
  await upcoming.scrollIntoViewIfNeeded();
  await expect.poll(dockInsets).toEqual({ x: 12, bottom: 12 });

  await header.getByRole("button", { name: "Ocultar valores" }).click();
  await expect(main).not.toContainText(/1\.234,56|4\.200,00|89,90/);
  await expect(main).toContainText("Valor oculto");
  await nav.getByRole("button", { name: "Nova Transação" }).click();
  await expect(page.getByRole("dialog", { name: "Nova Transação" })).toBeVisible();
});
