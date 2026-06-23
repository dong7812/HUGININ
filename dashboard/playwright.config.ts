import { defineConfig } from "@playwright/test";
export default defineConfig({
  testMatch: "*.spec.ts",
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
  },
  webServer: {
    command: "echo 'already running'",
    url: "http://localhost:3001",
    reuseExistingServer: true,
  },
});
