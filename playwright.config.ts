import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "test/features",
  snapshotPathTemplate: "test/screenshots/{arg}-{projectName}{ext}",
  outputDir: "test/results",
  reporter: "dot",

  timeout: 300000,
  expect: { timeout: 5000 },
  use: { actionTimeout: 5000 },

  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "desktop-safari", use: { ...devices["Desktop Safari"] } },
    { name: "desktop-edge", use: { channel: "msedge", } },
    { name: "mobile-android", use: { ...devices["Pixel 5"] } },
    { name: "mobile-ios", use: { ...devices["iPhone 12"] } },
  ],
  workers: 6,

  webServer: {
    command: "./bin/server",
    reuseExistingServer: true,
    port: 8000,
  },
};

export default config;
