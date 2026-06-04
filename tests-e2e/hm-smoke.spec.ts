import { expect, test } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://hm.visiomilhas.visiochat.cloud";

const browserRoutes = [
  {
    path: "/",
    label: "homepage",
    expectedText: ["CENTRAL OPERACIONAL PARA MILHAS", "Começar gratuitamente"],
  },
  {
    path: "/sign-in",
    label: "sign-in",
    expectedText: ["Entrar com e-mail", "Entrar com Google"],
  },
  {
    path: "/subscribe",
    label: "subscribe",
    expectedText: [],
  },
];

const protectedRoutes = [
  {
    path: "/app/dashboard",
    label: "dashboard",
    expectedText: ["Saldo consolidado", "Resultado operacional"],
  },
  {
    path: "/app/accounts",
    label: "accounts",
    expectedText: ["Nova conta", "Buscar contas", "Filtrar por status"],
  },
  {
    path: "/app/programs",
    label: "programs",
    expectedText: ["Saldo do programa", "Contas cadastradas", "Conta ativa"],
  },
  {
    path: "/app/purchases",
    label: "purchases",
    expectedText: ["Nova Compra Bonificada", "Compra Bonificada"],
  },
];

const authUser = {
  email:
    process.env.PLAYWRIGHT_AUTH_EMAIL ??
    `playwright-${Date.now()}@teste.com`,
  password: process.env.PLAYWRIGHT_AUTH_PASSWORD ?? "playwright-12345",
  name: process.env.PLAYWRIGHT_AUTH_NAME ?? "Playwright HM",
};

async function recordPageIssues(page: Parameters<typeof test>[0]["page"]) {
  const issues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (
        text.includes("Failed to fetch RSC payload") ||
        text.includes("Falling back to browser navigation")
      ) {
        return;
      }
      issues.push(`console:${text}`);
    }
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror:${error.message}`);
  });
  page.on("response", (response) => {
    if (!response.url().startsWith(baseURL)) {
      return;
    }
    if (response.url().includes("_rsc")) {
      return;
    }
    if ([401, 403, 404, 500, 502, 503].includes(response.status())) {
      issues.push(`network:${response.status()}:${response.url()}`);
    }
  });
  return issues;
}

async function assertDoctype(page: Parameters<typeof test>[0]["page"]) {
  const html = await page.content();
  expect(html.toLowerCase()).toContain("<!doctype html>");
}

async function openAndCheck(page: Parameters<typeof test>[0]["page"], path: string) {
  const issues = await recordPageIssues(page);
  const response = await page.goto(new URL(path, baseURL).toString(), {
    waitUntil: "domcontentloaded",
  });

  expect(response, `expected a response for ${path}`).not.toBeNull();
  expect(response!.status(), `unexpected status for ${path}`).toBeLessThan(500);
  await assertDoctype(page);
  expect(issues, `runtime issues on ${path}`).toEqual([]);
}

async function ensureTestUserSignedIn(page: Parameters<typeof test>[0]["page"]) {
  const signInResponse = await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: authUser.email,
      password: authUser.password,
      callbackURL: "/app/dashboard",
      rememberMe: true,
    },
  });

  if (signInResponse.ok()) {
    return;
  }

  const signUpResponse = await page.request.post("/api/auth/sign-up/email", {
    data: {
      name: authUser.name,
      email: authUser.email,
      password: authUser.password,
      callbackURL: "/subscribe",
      rememberMe: true,
    },
  });

  if (!signUpResponse.ok()) {
    const body = await signUpResponse.text();
    if (!body.includes("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")) {
      throw new Error(`Sign-up failed: ${signUpResponse.status()} ${body}`);
    }

    const retry = await page.request.post("/api/auth/sign-in/email", {
      data: {
        email: authUser.email,
        password: authUser.password,
        callbackURL: "/app/dashboard",
        rememberMe: true,
      },
    });

    expect(retry.ok(), "fallback login failed").toBeTruthy();
  }
}

async function expectVisibleTexts(page: Parameters<typeof test>[0]["page"], expected: string[]) {
  if (!expected.length) {
    return;
  }
  const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  for (const text of expected) {
    expect(bodyText, `missing text: ${text}`).toContain(text);
  }
}

test.describe("HM release candidate smoke", () => {
  test("homepage, sign-in and subscribe render cleanly", async ({ page }) => {
    for (const route of browserRoutes) {
      await openAndCheck(page, route.path);
      await expectVisibleTexts(page, route.expectedText);
    }
  });

  test("auth bootstrap, dashboard, accounts, programs, purchases and logout", async ({
    page,
  }) => {
    await ensureTestUserSignedIn(page);

    await page.goto(new URL("/app/dashboard", baseURL).toString(), {
      waitUntil: "domcontentloaded",
    });
    if ((await page.url()).includes("/subscribe")) {
      await page.request.post("/api/subscription/activate-trial");
      await page.goto(new URL("/app/dashboard", baseURL).toString(), {
        waitUntil: "domcontentloaded",
      });
    }

    await openAndCheck(page, "/app/dashboard");
    await expectVisibleTexts(page, protectedRoutes[0].expectedText);

    await openAndCheck(page, "/app/accounts");
    await expectVisibleTexts(page, protectedRoutes[1].expectedText);

    await openAndCheck(page, "/app/programs");
    await expectVisibleTexts(page, protectedRoutes[2].expectedText);

    await openAndCheck(page, "/app/purchases");
    await expectVisibleTexts(page, protectedRoutes[3].expectedText);

    await openAndCheck(page, "/subscribe");
    await expectVisibleTexts(page, []);

    const logoutButton = page.getByRole("button", { name: /sair/i }).first();
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else {
      await page.request.post("/api/auth/sign-out", { data: {} });
    }

    await openAndCheck(page, "/app/dashboard");
    await expectVisibleTexts(page, ["Entrar com e-mail", "Criar conta", "callbackUrl=/app/dashboard"]);

    await ensureTestUserSignedIn(page);
    await page.request.post("/api/subscription/activate-trial");
    await page.goto(new URL("/app/dashboard", baseURL).toString(), {
      waitUntil: "domcontentloaded",
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.url()).toContain("/app/dashboard");
    await expectVisibleTexts(page, protectedRoutes[0].expectedText);
  });

  test("google oauth bootstrap remains healthy", async ({ page }) => {
    const response = await page.request.post("/api/auth/sign-in/social", {
      data: {
        provider: "google",
        callbackURL: "/app/dashboard",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(String(body?.url ?? "")).toContain("accounts.google.com");
    expect(String(body?.url ?? "")).toContain("redirect_uri=");
    expect(String(body?.url ?? "")).toContain("client_id=");
  });
});
