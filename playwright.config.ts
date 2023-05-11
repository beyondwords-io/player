import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const getDevice = (name) => {
  if (devices[name]) { return devices[name]; }
  throw new Error(`Device ${name} does not exist`);
}

const config: PlaywrightTestConfig = {
  testDir: "test/features",
  snapshotPathTemplate: "test/screenshots/{arg}-{projectName}{ext}",
  outputDir: "test/results",
  reporter: "dot",

  timeout: 600000,
  expect: { timeout: 5000 },
  use: { actionTimeout: 5000 },

  projects: [
    { name: "desktop-chrome", use: { ...getDevice("Desktop Chrome") } },
    { name: "desktop-firefox", use: { ...getDevice("Desktop Firefox") } },
    { name: "desktop-safari", use: { ...getDevice("Desktop Safari") } },
//  { name: "desktop-edge", use: { channel: "msedge", } },
    { name: "mobile-android", use: { ...getDevice("Pixel 5") } },
    { name: "mobile-ios", use: { ...getDevice("iPhone 11") } },
  ],
  workers: 10,

  webServer: {
    command: "./bin/server",
    reuseExistingServer: true,
    port: 8000,
  },
};

export default config;
