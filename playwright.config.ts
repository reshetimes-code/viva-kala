import { defineConfig, devices } from "@playwright/test";

// Cross-engine smoke coverage for browser-specific quirks (the lead-popup
// date field's phantom-"change" guard is the first case - see
// e2e/leadDateGuard.spec.ts). No dev server/DB needed: these tests only
// load a minimal static fixture, never a real invite page, so they never
// touch production data.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
