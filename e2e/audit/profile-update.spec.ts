import { expect, test } from "@playwright/test";
import { DEFAULT_PAYMENT_METHOD_CONFIGS } from "../../src/shared/constants";

test("updates the web version from the profile and keeps the session and route", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const user = { id: "707781c6-9ac3-449a-a818-f7e46b4c1804", email: "audit@example.test", user_metadata: {} };
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("https://nix-audit.invalid/**", (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith("/user")) return route.fulfill({ json: { user } });
    return route.fulfill({ json: pathname.endsWith("/user_settings") ? {
      user_id: user.id, display_name: "Auditoria", payment_method_configs: DEFAULT_PAYMENT_METHOD_CONFIGS,
    } : [] });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((sessionUser) => {
    localStorage.setItem("sb-nix-audit-auth-token", JSON.stringify({
      user: sessionUser, access_token: "fake-access", refresh_token: "fake-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
    localStorage.setItem("themePreference", "dark");
  }, user);

  const route = "/transactions?origem=perfil#lista";
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const openProfile = page.getByRole("navigation", { name: "Menu" }).getByRole("button", { name: "Perfil" });
  await openProfile.click();
  const profile = page.getByRole("dialog", { name: "Perfil" });
  const update = profile.getByRole("button", { name: "Atualizar versão" });
  await expect(profile.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible();

  let checks = 0;
  await page.route(/\/index\.html\?nix-update=\d+/, (request) => {
    checks += 1;
    return checks === 1 ? request.abort("internetdisconnected") : request.continue();
  });
  await update.click();
  await expect(profile.getByRole("alert")).toContainText("Não foi possível atualizar a versão.");
  await expect(update).toBeEnabled();

  const navigation = page.waitForRequest((request) =>
    request.isNavigationRequest() && new URL(request.url()).searchParams.has("nix-update")
  );
  await update.click();
  await navigation;
  await expect(profile).toBeHidden();
  await expect(page).toHaveURL(new URL(route, page.url()).href);
  await expect(openProfile).toBeVisible();
  await openProfile.click();
  await expect(update).toBeVisible();
  expect(checks).toBe(2);
  expect(await page.evaluate(() => ({
    session: JSON.parse(localStorage.getItem("sb-nix-audit-auth-token") ?? "{}").user?.id,
    theme: localStorage.getItem("themePreference"),
  }))).toEqual({ session: user.id, theme: "dark" });
});
