import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// e2e tests run against the dev server, started automatically below.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // Fail CI if a stray test.only was committed.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // The app records audio: grant the mic and feed it a fake device so the
    // capture flow runs headless without a real microphone or a permission prompt.
    permissions: ["microphone"],
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream"
      ]
    },
    // Pin locale/timezone so date/time rendering (format.ts uses fr-FR) is
    // deterministic regardless of the runner's machine.
    locale: "fr-FR",
    timezoneId: "Europe/Paris"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !isCI,
    timeout: 120_000
  }
});
