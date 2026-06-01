import {
  connectChromeDevToolsMcp,
  ensureDevServer,
  listToolNames,
} from "../runtime-browser";
import { runProgramsCockpitJourney } from "./programs-cockpit-journey";

const baseUrl = process.env.RUNTIME_BASE_URL?.trim() || "http://localhost:3001";

async function main() {
  const devServer = await ensureDevServer(baseUrl);
  let client = null;

  try {
    client = await connectChromeDevToolsMcp();
    const toolNames = await listToolNames(client);
    for (const tool of [
      "new_page",
      "select_page",
      "list_pages",
      "navigate_page",
      "evaluate_script",
    ]) {
      if (!toolNames.has(tool)) {
        throw new Error(`Missing MCP tool: ${tool}`);
      }
    }

    const result = await runProgramsCockpitJourney({
      client,
      baseUrl,
      toolNames,
    } as any);

    console.log("PROGRAMS_JOURNEY_NOTES", result.notes.join(" | "));
    process.exitCode = 0;
  } catch (err) {
    console.error(
      err instanceof Error ? err.stack || err.message : String(err),
    );
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
    if (devServer) devServer.kill();
  }
}

void main();
