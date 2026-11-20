import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/audit",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3101",
    browserName: "chromium",
    launchOptions: { executablePath: process.env.AUDIT_CHROMIUM },
    timezoneId: "America/Sao_Paulo",
    serviceWorkers: "block",
  },
  webServer: {
    command: "npm run dev -- --port 3101 --strictPort",
    url: "http://localhost:3101",
    env: {
      SUPABASE_URL: "https://nix-audit.invalid",
      SUPABASE_ANON_KEY: "local-test-only",
      GEMINI_API_KEY: "",
    },
  },
});
