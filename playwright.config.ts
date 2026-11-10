import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/** Smoke tests run against the real static export, served from ./out. */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, hasTouch: true },
      grep: /@mobile/,
    },
  ],
  webServer: {
    command: process.env.E2E_SKIP_BUILD
      ? "node scripts/serve-static.mjs"
      : "npm run build && node scripts/serve-static.mjs",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { PORT: String(PORT) },
  },
});
