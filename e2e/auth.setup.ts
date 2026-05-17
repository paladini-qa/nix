import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("autenticar usuário de teste", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL e E2E_TEST_PASSWORD devem estar definidos no .env"
    );
  }

  await page.goto("/");

  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
