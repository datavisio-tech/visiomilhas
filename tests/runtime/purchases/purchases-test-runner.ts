import {
  buildUser,
  connectChromeDevToolsMcp,
  ensureDevServer,
  normalizeUserPrefix,
} from "../runtime-browser";
import runPurchasesJourney from "../../../src/modules/purchases/mcp/purchases-journey";

const baseUrl =
  process.env.RUNTIME_BASE_URL?.trim() ||
  process.env.AUTH_BASE_URL?.trim() ||
  "http://localhost:3001";
const userPrefix = normalizeUserPrefix(process.argv[2] || "emailteste01");

async function main() {
  const user = buildUser(userPrefix);
  const browserContextId = `runtime-purchases-${userPrefix}`;
  const devServer = await ensureDevServer(baseUrl);
  let client: Awaited<ReturnType<typeof connectChromeDevToolsMcp>> | null =
    null;
  try {
    client = await connectChromeDevToolsMcp();
    const result = await runPurchasesJourney({
      client,
      baseUrl,
      user,
      browserContextId,
      toolNames: new Set(),
    });
    console.log(JSON.stringify(result, null, 2));
    console.log("PURCHASES_JOURNEY: SUCCESS");
  } catch (err) {
    console.error("PURCHASES_JOURNEY: FAIL", err);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
    if (devServer) devServer.kill();
  }
}

void main();
