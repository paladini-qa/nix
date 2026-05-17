import { test, expect } from "@playwright/test";

// Estes testes rodam sem sessão salva
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Autenticação", () => {
  test("exibe formulário de login para usuário não autenticado", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("exibe erro com credenciais inválidas", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill("invalido@teste.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha_errada_123");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
  });

  test("autentica e redireciona para o dashboard", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL!;
    const password = process.env.E2E_TEST_PASSWORD!;

    await page.goto("/");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/dashboard", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("faz logout e retorna para login", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL!;
    const password = process.env.E2E_TEST_PASSWORD!;

    await page.goto("/");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 20_000 });

    // Abre menu de configurações / perfil e clica em sair
    const logoutButton = page.locator(
      'button:has-text("Sair"), [aria-label*="sair" i], [aria-label*="logout" i]'
    );
    // Se logout estiver em submenu, tenta abrir settings primeiro
    const settingsButton = page.locator(
      '[aria-label*="configurações" i], [aria-label*="settings" i], [aria-label*="perfil" i]'
    );
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
    }
    await expect(logoutButton.first()).toBeVisible({ timeout: 5_000 });
    await logoutButton.first().click();

    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 10_000 });
  });
});
