import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "test/features",
  snapshotPathTemplate: "test/screenshots/{arg}-{projectName}{ext}",
  outputDir: "test/results",
  reporter: "dot",

  timeout: 30000,
  expect: { timeout: 5000 },
  use: { actionTimeout: 5000 },

  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "safari", use: { ...devices["Desktop Safari"] } },
    { name: "edge", use: { channel: "msedge", } },
    { name: "android", use: { ...devices["Pixel 5"] } },
    { name: "ios", use: { ...devices["iPhone 12"] } },
  ],

  webServer: {
    command: "./bin/server",
    reuseExistingServer: true,
    port: 8000,
  },
};

export default config;
