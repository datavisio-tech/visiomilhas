import { expect, test, type Page } from "@playwright/test";
import { discoverTestUsers, type TestUser } from "./test-user-discovery";

type RouteSpec = {
  path: string;
  label: string;
};

const publicRoutes: RouteSpec[] = [
  { path: "/", label: "homepage" },
  { path: "/subscribe", label: "subscribe" },
];

const protectedRoutes: RouteSpec[] = [
  { path: "/app/dashboard", label: "dashboard" },
  { path: "/app/accounts", label: "accounts" },
  { path: "/app/programs", label: "programs" },
  { path: "/app/purchases", label: "purchases" },
  { path: "/app/movements", label: "movements" },
];

const ignoredConsoleMessages = [
  "Failed to fetch RSC payload",
  "Falling back to browser navigation",
  "ResizeObserver loop completed with undelivered notifications",
  "Failed to load resource: the server responded with a status of 404",
];

let testUsers: Record<string, TestUser>;

test.beforeAll(async () => {
  testUsers = await discoverTestUsers();
});

function isRelevantIssue(message: string) {
  return !ignoredConsoleMessages.some((pattern) => message.includes(pattern));
}

async function collectIssues(page: Page) {
  const issues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && isRelevantIssue(message.text())) {
      issues.push(`console:${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    const message = error.message ?? String(error);
    if (isRelevantIssue(message)) {
      issues.push(`pageerror:${message}`);
    }
  });
  page.on("response", (response) => {
    const status = response.status();
    if (
      response.url().includes("_rsc") ||
      ![401, 403, 404, 500, 502, 503].includes(status)
    ) {
      return;
    }

    if (response.request().resourceType() === "document") {
      issues.push(`http:${status}:${response.url()}`);
    }
  });

  return issues;
}

async function assertHealthyRoute(page: Page, path: string, label: string) {
  const issues = await collectIssues(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });

  const doctype = await page.evaluate(() => document.doctype?.name ?? "");
  expect(doctype, `${label} must render with a doctype`).toBe("html");

  const bodyText = await page.locator("body").innerText({ timeout: 15000 });
  expect(bodyText.trim().length, `${label} must render visible content`).toBeGreaterThan(0);

  await page.waitForLoadState("networkidle").catch(() => undefined);

  expect(
    issues.filter((issue) => !issue.includes("/api/auth/sign-out")),
    `${label} must not emit runtime/network issues`
  ).toEqual([]);
}

async function ensureSignedIn(page: Page, user: TestUser) {
  await page.request.post("/api/auth/sign-up/email", {
    data: {
      email: user.email,
      password: user.password,
      name: user.name,
    },
  }).catch(() => undefined);

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  const openEmailLogin = page
    .getByRole("button", { name: "Entrar com e-mail" })
    .first();
  if ((await openEmailLogin.count()) > 0) {
    await openEmailLogin.click();
  }

  const dialog = page.getByRole("dialog").first();
  await expect(dialog).toBeVisible();

  const emailField = dialog
    .getByLabel(/e-?mail|email/i)
    .first();
  const passwordField = dialog
    .getByLabel(/senha|password/i)
    .first();

  await emailField.fill(user.email);
  await passwordField.fill(user.password);

  const submit = dialog.getByRole("button", { name: /^Entrar$/i }).first();
  await submit.click();

  await page.goto("/app/dashboard", { waitUntil: "domcontentloaded" });
  if (page.url().includes("/sign-in")) {
    throw new Error(`Session did not persist for ${user.role}`);
  }

  await expect(page).not.toHaveURL(/\/sign-in/);
}

async function signOut(page: Page) {
  await page.request.post("/api/auth/sign-out").catch(() => undefined);
  await page.context().clearCookies().catch(() => undefined);
  await page
    .evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    })
    .catch(() => undefined);
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

test("homepage renders and stays clean", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const doctype = await page.evaluate(() => document.doctype?.name ?? "");
  expect(doctype).toBe("html");
  await expect(page.getByText("CENTRAL OPERACIONAL PARA MILHAS")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Começar gratuitamente" }).first()
  ).toBeVisible();
});

for (const route of publicRoutes) {
  test(`${route.label} route is healthy`, async ({ page }) => {
    await assertHealthyRoute(page, route.path, route.label);
  });
}

test("google oauth bootstrap is available", async ({ page }) => {
  const response = await page.request.post("/api/auth/sign-in/social", {
    data: { provider: "google" },
  });
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.url).toContain("accounts.google.com/o/oauth2/v2/auth");
  expect(payload.url).toContain("redirect_uri=https%3A%2F%2Fhm.visiomilhas.visiochat.cloud%2Fapi%2Fauth%2Fcallback%2Fgoogle");
});

test("owner onboarding and authenticated HM surfaces are available", async ({
  page,
}) => {
  await ensureSignedIn(page, testUsers.QA_OWNER);

  for (const route of protectedRoutes) {
    await assertHealthyRoute(page, route.path, route.label);
  }

  await page.goto("/app", { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await expect(page).not.toHaveURL(/\/sign-in/);
});

test("new owner onboarding can bootstrap the app surface", async ({ page }) => {
  await ensureSignedIn(page, testUsers.QA_NEW);
  await page.goto("/app", { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await expect(page).not.toHaveURL(/\/sign-in/);
});

test("trial and subscribe flow are available", async ({ page }) => {
  await ensureSignedIn(page, testUsers.QA_TRIAL);
  await page.goto("/subscribe", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Teste grátis de 15 dias").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Começar teste grátis" }).first()).toBeVisible();
});

test("expired users can recover via subscribe", async ({ page }) => {
  await ensureSignedIn(page, testUsers.QA_EXPIRED);
  await page.goto("/subscribe", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Teste grátis de 15 dias").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Começar teste grátis" }).first()).toBeVisible();
});

test("session refresh survives reload", async ({ page }) => {
  await ensureSignedIn(page, testUsers.QA_ACTIVE);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/sign-in/);
});

test("logout clears the session", async ({ page }) => {
  await ensureSignedIn(page, testUsers.QA_OWNER);
  await signOut(page);
  await page.goto("/app/dashboard", { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await expect(page).toHaveURL(/\/sign-in|\/$/);
});
