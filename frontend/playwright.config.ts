import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    // In CI use the pre-built preview server (starts instantly after build).
    // Locally keep the HMR dev server for fast iteration.
    command: isCI
      ? "npm run build -- --outDir dist && npm run preview -- --host 127.0.0.1 --port 4173"
      : "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    // Allow 2 min for the build + server startup on CI (30 s locally)
    timeout: isCI ? 120_000 : 30_000,
    // In CI always start fresh; locally reuse if already running
    reuseExistingServer: !isCI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
