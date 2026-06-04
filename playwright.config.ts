import { defineConfig } from "@playwright/test";

type PlaywrightMode = "visible" | "headless";

function resolvePlaywrightMode(): PlaywrightMode {
  const explicit = process.env.PLAYWRIGHT_MODE?.toLowerCase();
  if (explicit === "visible" || explicit === "headless") {
    return explicit;
  }

  const baseUrl =
    process.env.PLAYWRIGHT_BASE_URL ??
    process.env.BASE_URL ??
    "https://hm.visiomilhas.visiochat.cloud";

  if (
    baseUrl.includes("localhost") ||
    baseUrl.includes("127.0.0.1") ||
    baseUrl.includes("hm.visiomilhas.visiochat.cloud")
  ) {
    return "visible";
  }

  return "headless";
}

const mode = resolvePlaywrightMode();

export default defineConfig({
  testDir: "./tests-e2e",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  use: {
    headless: mode === "headless",
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ??
      "https://hm.visiomilhas.visiochat.cloud",
    viewport: null,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      slowMo: 300,
      args: ["--start-maximized"],
    },
  },
});
