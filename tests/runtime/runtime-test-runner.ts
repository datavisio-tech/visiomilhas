import {
  buildUser,
  connectChromeDevToolsMcp,
  ensureDevServer,
  listToolNames,
  normalizeUserPrefix,
  openIsolatedPage,
} from "./runtime-browser";
import { TEST_SUITE_VERSION } from "./version-registry";
import { runAuthJourney } from "./auth/journey";
import { runDashboardJourney } from "./dashboard/journey";
import { runAccountsJourney } from "./accounts/journey";

type SuiteStatus = "PASS" | "FAIL";

type RuntimeReport = {
  auth: SuiteStatus;
  dashboard: SuiteStatus;
  accounts: SuiteStatus;
  newFeatures: Array<{ route: string; feature: string; status: string }>;
  result: "SUCCESS" | "FAILURE";
  failedAt?: string;
  notes: string[];
};

const baseUrl =
  process.env.RUNTIME_BASE_URL?.trim() ||
  process.env.AUTH_BASE_URL?.trim() ||
  "http://localhost:3001";
const userPrefix = normalizeUserPrefix(process.argv[2] || "emailteste01");

function formatReport(report: RuntimeReport) {
  const lines: string[] = [
    "VISIOMILHAS MVP TEST REPORT",
    "",
    "Auth:",
    report.auth,
    "",
    "Dashboard:",
    report.dashboard,
    "",
    "Accounts:",
    report.accounts,
    "",
    "New Features:",
    String(report.newFeatures.length),
    "",
  ];

  for (const feature of report.newFeatures) {
    lines.push(
      "NEW_FEATURE_DETECTED",
      `Route: ${feature.route}`,
      `Feature: ${feature.feature}`,
      `Status: ${feature.status}`,
      "",
    );
  }

  lines.push("Result:", report.result);

  if (report.failedAt) {
    lines.push("", `FAILED_AT_${report.failedAt}`);
    for (const note of report.notes) {
      lines.push(note);
    }
  }

  return lines.join("\n").trim();
}

async function main() {
  const user = buildUser(userPrefix);
  const browserContextId = `runtime-suite-${userPrefix}`;
  const report: RuntimeReport = {
    auth: "FAIL",
    dashboard: "FAIL",
    accounts: "FAIL",
    newFeatures: [],
    result: "FAILURE",
    notes: [],
  };

  const devServer = await ensureDevServer(baseUrl);
  let client: Awaited<ReturnType<typeof connectChromeDevToolsMcp>> | null =
    null;

  try {
    client = await connectChromeDevToolsMcp();
    const toolNames = await listToolNames(client);
    for (const tool of [
      "new_page",
      "select_page",
      "list_pages",
      "navigate_page",
      "evaluate_script",
      "list_network_requests",
    ]) {
      if (!toolNames.has(tool)) {
        throw new Error(`Missing MCP tool: ${tool}`);
      }
    }

    await openIsolatedPage(client, `${baseUrl}/sign-in`, browserContextId);

    const authResult = await runAuthJourney({
      client,
      baseUrl,
      user,
      browserContextId,
      toolNames,
    });
    report.auth = "PASS";
    report.notes.push(...authResult.notes);

    const dashboardResult = await runDashboardJourney({
      client,
      baseUrl,
      user,
      browserContextId,
      toolNames,
    });
    report.dashboard = "PASS";
    report.notes.push(...dashboardResult.notes);

    const accountsResult = await runAccountsJourney({
      client,
      baseUrl,
      user,
      browserContextId,
      toolNames,
    });
    report.accounts = "PASS";
    report.notes.push(...accountsResult.notes);
    report.newFeatures.push(...accountsResult.newFeatures);

    report.result = "SUCCESS";
    console.log(formatReport(report));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report.failedAt =
      report.failedAt ??
      message.match(/^(AUTH|DASHBOARD|ACCOUNTS)/)?.[1] ??
      "UNKNOWN";
    report.result = "FAILURE";
    report.notes.push(message);
    console.log(formatReport(report));
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.close();
    }
    if (devServer) {
      devServer.kill();
    }
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exitCode = 1;
});
