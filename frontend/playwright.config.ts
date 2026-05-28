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
    // CI: the workflow builds the app first, then `vite preview` starts
    //     instantly from the pre-built dist/ folder.
    // Local: `vite dev` gives you HMR and fast iteration.
    command: isCI
      ? "npm run preview -- --host 127.0.0.1 --port 4173"
      : "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    timeout: 30_000,
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
