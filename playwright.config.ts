import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "test/features",
  reporter: "dot",

  timeout: 30000,
  expect: { timeout: 5000 },
  use: { actionTimeout: 5000 },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Microsoft Edge", use: { channel: "msedge", } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
  ],

  webServer: {
    command: "./bin/server",
    reuseExistingServer: true,
    port: 8000,
  },
};

export default config;
