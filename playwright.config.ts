import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173/StalkerTamagochi/",
    viewport: { width: 1440, height: 1080 },
    launchOptions: existsSync("/usr/bin/google-chrome")
      ? { executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/StalkerTamagochi/",
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
