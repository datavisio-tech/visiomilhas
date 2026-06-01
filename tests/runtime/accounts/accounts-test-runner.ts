import {
  connectChromeDevToolsMcp,
  ensureDevServer,
  normalizeUserPrefix,
  buildUser,
} from "../runtime-browser";
import { runAccountsJourney } from "./journey";

const baseUrl =
  process.env.RUNTIME_BASE_URL?.trim() ||
  process.env.AUTH_BASE_URL?.trim() ||
  "http://localhost:3001";
const userPrefix = normalizeUserPrefix(process.argv[2] || "emailteste01");
const user = buildUser(userPrefix);

async function main() {
  const devServer = await ensureDevServer(baseUrl);
  let client: Awaited<ReturnType<typeof connectChromeDevToolsMcp>> | null =
    null;
  try {
    client = await connectChromeDevToolsMcp();
    const toolList = (await client.listTools({})).tools ?? [];
    const toolNames = toolList.map((t: any) => t.name);
    const toolNamesSet = new Set<string>(toolNames);
    const result = await runAccountsJourney({
      client,
      baseUrl,
      user,
      browserContextId: `accounts-${userPrefix}`,
      toolNames: toolNamesSet,
    });
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
    if (devServer) devServer.kill();
  }
}

void main();
