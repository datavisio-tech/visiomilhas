import {
  buildUser,
  connectChromeDevToolsMcp,
  ensureDevServer,
  normalizeUserPrefix,
  openIsolatedPage,
  waitForPageState,
  submitJsonPost,
  evaluatePage,
  scanVisibleControls,
  navigatePage,
  signOutCurrentPage,
  callTool,
} from "./runtime-browser";
import { admPool, closeAdmPool } from "../../db/adm/client";
import { appPool, closeAppPool } from "../../db/app/client";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenvExpand(dotenv.config());

const baseUrl =
  process.env.RUNTIME_BASE_URL?.trim() ||
  process.env.AUTH_BASE_URL?.trim() ||
  "http://localhost:3001";
const noSubUser = buildUser(
  normalizeUserPrefix(process.argv[2] || "emailteste05"),
);
const trialUser = buildUser("emailteste04");

async function setSubscriptionActiveForEmail(email: string) {
  const pool = admPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      "SELECT id FROM global_users WHERE email = $1 LIMIT 1",
      [email],
    );

    if (!userRes.rows.length) {
      throw new Error(`User not found: ${email}`);
    }

    const membershipRes = await client.query(
      "SELECT organization_id FROM organization_memberships WHERE user_id = $1 LIMIT 1",
      [userRes.rows[0].id],
    );

    if (!membershipRes.rows.length) {
      throw new Error(`Organization membership not found for user: ${email}`);
    }

    const subscriptionRes = await client.query(
      "SELECT id FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [membershipRes.rows[0].organization_id],
    );

    if (!subscriptionRes.rows.length) {
      throw new Error(`Subscription not found for user: ${email}`);
    }

    await client.query(
      "UPDATE subscriptions SET status = 'active', access_state = 'ACTIVE', activated_at = NOW(), updated_at = NOW() WHERE id = $1",
      [subscriptionRes.rows[0].id],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getFirstProgramAccountForEmail(email: string) {
  const adm = admPool();
  const pool = appPool();
  const admClient = await adm.connect();
  const client = await pool.connect();

  try {
    const userRes = await admClient.query(
      "SELECT id FROM global_users WHERE email = $1 LIMIT 1",
      [email],
    );

    if (!userRes.rows.length) {
      return null;
    }

    const membershipRes = await admClient.query(
      "SELECT organization_id FROM organization_memberships WHERE user_id = $1 LIMIT 1",
      [userRes.rows[0].id],
    );

    if (!membershipRes.rows.length) {
      return null;
    }

    const accountRes = await client.query(
      "SELECT id, program_id FROM program_accounts WHERE organization_id = $1 ORDER BY id ASC LIMIT 1",
      [membershipRes.rows[0].organization_id],
    );

    if (!accountRes.rows.length) {
      return null;
    }

    return {
      accountId: Number(accountRes.rows[0].id),
      programId: Number(accountRes.rows[0].program_id),
    };
  } finally {
    admClient.release();
    client.release();
  }
}

async function fetchJson(client: any, url: string) {
  return (await callTool(client, "evaluate_script", {
    function: `() => fetch(${JSON.stringify(url)}, { credentials: 'include' })
      .then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => null) }))`,
  })) as { content?: Array<{ text?: string }>; isError?: boolean };
}

async function checkUnauthenticated(client: any, route: string) {
  await openIsolatedPage(client, `${baseUrl}${route}`, `unauth-${route}`);
  try {
    await waitForPageState(
      client,
      ["Entrar com e-mail", "Criar conta"],
      15_000,
    );
    return { route, unauthenticatedRedirect: true };
  } catch (err) {
    return { route, unauthenticatedRedirect: false, error: String(err) };
  }
}

async function run() {
  const devServer = await ensureDevServer(baseUrl);
  let client: Awaited<ReturnType<typeof connectChromeDevToolsMcp>> | null =
    null;
  const report: any = { checks: [], notes: [] };
  try {
    client = await connectChromeDevToolsMcp();
    // unauthenticated checks
    for (const route of [
      "/app/dashboard",
      "/app/accounts",
      "/app/programs",
      "/app/purchases",
    ]) {
      const res = await checkUnauthenticated(client, route);
      report.checks.push({ scenario: "NOT_AUTH", ...res });
    }

    // Authenticated but NO subscription (read-only access must remain observable).
    await openIsolatedPage(client, `${baseUrl}/sign-in`, "auth-no-sub");
    const signInNoSub = await submitJsonPost(
      client,
      "/api/auth/sign-in/email",
      {
        email: noSubUser.email,
        password: noSubUser.password,
        callbackURL: "/app/dashboard",
        rememberMe: true,
      },
    );

    report.checks.push({
      scenario: "SIGN_IN_ATTEMPT_NO_SUB",
      user: noSubUser.email,
      result: signInNoSub,
    });

    if (!signInNoSub?.ok) {
      const signUpNoSub = await submitJsonPost(
        client,
        "/api/auth/sign-up/email",
        {
          name: noSubUser.name,
          email: noSubUser.email,
          password: noSubUser.password,
          callbackURL: "/app/dashboard",
          rememberMe: true,
        },
      );

      report.checks.push({
        scenario: "SIGN_UP_ATTEMPT_NO_SUB",
        user: noSubUser.email,
        result: signUpNoSub,
      });

      if (!signUpNoSub?.ok) {
        report.notes.push("NO_SUB sign-up failed for: " + noSubUser.email);
      }
    }

    if (
      signInNoSub?.ok ||
      report.checks.some(
        (item) => item.scenario === "SIGN_UP_ATTEMPT_NO_SUB" && item.result?.ok,
      )
    ) {
      await navigatePage(client, `${baseUrl}/app/dashboard`);
      await waitForPageState(
        client,
        ["Assinar por R$ 4,99/mês", "Acesso restrito"],
        15_000,
      ).catch(() => undefined);

      await navigatePage(client, `${baseUrl}/app/purchases`);
      await waitForPageState(
        client,
        ["Nova Compra Bonificada", "Lista de compras"],
        15_000,
      ).catch(() => undefined);

      const scan = await scanVisibleControls(client, "main");
      report.checks.push({
        scenario: "AUTH_NO_SUB",
        user: noSubUser.email,
        visibleControls: scan?.slice(0, 10),
      });

      const accessNoSub = await evaluatePage(
        client,
        `(() => fetch('/api/subscription/access', { credentials: 'include' }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => null) })))()`,
      );
      report.checks.push({
        scenario: "AUTH_NO_SUB_ACCESS",
        user: noSubUser.email,
        result: accessNoSub,
      });

      const noSubAccount = await getFirstProgramAccountForEmail(
        noSubUser.email,
      );
      const noSubWrite = await submitJsonPost(client, "/api/purchases/create", {
        accountId: noSubAccount?.accountId ?? 1,
        organizationId: 1,
        title: "ia-audit-test-no-sub",
        purchaseAmountCents: 1000,
        multiplier: 1,
        status: "REGISTERED",
        programId: noSubAccount?.programId ?? 1,
        expectedPoints: 1000,
        expectedCreditDate: "2026-06-29",
        purchaseDate: "2026-05-29",
      });
      report.checks.push({
        scenario: "AUTH_NO_SUB_API",
        endpoint: "/api/purchases/create",
        result: noSubWrite,
      });
    }

    await signOutCurrentPage(client);

    // TRIAL: use a user that already carries trial state.
    await openIsolatedPage(client, `${baseUrl}/sign-in`, "auth-trial");
    const signInTrial = await submitJsonPost(
      client,
      "/api/auth/sign-in/email",
      {
        email: trialUser.email,
        password: trialUser.password,
        callbackURL: "/app/dashboard",
        rememberMe: true,
      },
    );

    report.checks.push({
      scenario: "SIGN_IN_ATTEMPT_TRIAL",
      user: trialUser.email,
      result: signInTrial,
    });

    await navigatePage(client, `${baseUrl}/app/dashboard`);
    await waitForPageState(
      client,
      ["Saldo consolidado", "Resultado operacional"],
      30_000,
    ).catch(() => undefined);

    const trialAccess = await evaluatePage(
      client,
      `(() => fetch('/api/subscription/access', { credentials: 'include' }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => null) })))()`,
    );
    report.checks.push({
      scenario: "TRIAL_ACCESS",
      user: trialUser.email,
      result: trialAccess,
    });

    const trialAccount = await getFirstProgramAccountForEmail(trialUser.email);
    const trialWrite = await submitJsonPost(client, "/api/purchases/create", {
      accountId: trialAccount?.accountId ?? 1,
      organizationId: 1,
      title: "ia-audit-test-trial",
      purchaseAmountCents: 1000,
      multiplier: 1,
      status: "REGISTERED",
      programId: trialAccount?.programId ?? 1,
      expectedPoints: 1000,
      expectedCreditDate: "2026-06-29",
      purchaseDate: "2026-05-29",
    });
    report.checks.push({
      scenario: "TRIAL_API_WRITE",
      endpoint: "/api/purchases/create",
      result: trialWrite,
    });

    await signOutCurrentPage(client);

    // ACTIVE: promote the same audited user in the DB, then validate full access.
    await setSubscriptionActiveForEmail(trialUser.email);

    await openIsolatedPage(client, `${baseUrl}/sign-in`, "auth-active");
    const signInActive = await submitJsonPost(
      client,
      "/api/auth/sign-in/email",
      {
        email: trialUser.email,
        password: trialUser.password,
        callbackURL: "/app/dashboard",
        rememberMe: true,
      },
    );
    report.checks.push({
      scenario: "SIGN_IN_ATTEMPT_ACTIVE",
      user: trialUser.email,
      result: signInActive,
    });

    await navigatePage(client, `${baseUrl}/app/dashboard`);
    await waitForPageState(
      client,
      ["Saldo consolidado", "Resultado operacional"],
      30_000,
    ).catch(() => undefined);

    const activeAccess = await evaluatePage(
      client,
      `(() => fetch('/api/subscription/access', { credentials: 'include' }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => null) })))()`,
    );
    report.checks.push({
      scenario: "ACTIVE_ACCESS",
      user: trialUser.email,
      result: activeAccess,
    });

    const activeAccount = await getFirstProgramAccountForEmail(trialUser.email);
    const activeWrite = await submitJsonPost(client, "/api/purchases/create", {
      accountId: activeAccount?.accountId ?? 1,
      organizationId: 1,
      title: "ia-audit-test-active",
      purchaseAmountCents: 1000,
      multiplier: 1,
      status: "REGISTERED",
      programId: activeAccount?.programId ?? 1,
      expectedPoints: 1000,
      expectedCreditDate: "2026-06-29",
      purchaseDate: "2026-05-29",
    });
    report.checks.push({
      scenario: "ACTIVE_API_WRITE",
      endpoint: "/api/purchases/create",
      result: activeWrite,
    });

    // sign out
    await signOutCurrentPage(client);

    console.log("ACCESS_AUDIT_REPORT_JSON");
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error("Audit runner failed:", err);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
    if (devServer) devServer.kill();
    await closeAdmPool();
    await closeAppPool();
  }
}

void run();
