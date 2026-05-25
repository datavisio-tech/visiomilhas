import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "../../../../lib/auth";
import { reportAuthEvent } from "../../../../lib/server/auth-observability";

let GET: any;
let POST: any;

if ((auth as any)?.__authOperationalDisabled) {
	const message = (auth as any).__authBootstrapMessage || "Authentication unavailable";

	const unavailableHandler = async () =>
		new Response(JSON.stringify({ ok: false, error: "AUTH_BOOTSTRAP_FAILED", message }), {
			status: 503,
			headers: { "Content-Type": "application/json" },
		});

	GET = unavailableHandler;
	POST = unavailableHandler;
} else {
	// Lazy-initialize the Better Auth handlers at request time so bootstrap
	// errors inside the adapter are caught and transformed into controlled
	// 503 responses instead of crashing the module import.
	let realHandlers: any | null = null;

	const initHandlers = () => {
		if (realHandlers) return realHandlers;
		try {
			realHandlers = toNextJsHandler(auth as any);
			return realHandlers;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			reportAuthEvent({
				level: "error",
				code: "OAUTH_RUNTIME_ERROR",
				message: "Failed to initialize OAuth handlers",
				details: { message },
			});
			realHandlers = null;
			return null;
		}
	};

	const wrap = (method: "GET" | "POST") => async (req: Request) => {
		const handlers = initHandlers();
		if (!handlers) {
			const message = "Authentication subsystem unavailable";
			return new Response(JSON.stringify({ ok: false, error: "OAUTH_RUNTIME_ERROR", message }), {
				status: 503,
				headers: { "Content-Type": "application/json" },
			});
		}

		try {
			return await handlers[method](req);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const normalized = message.toLowerCase();
			const isMissingTable = normalized.includes("relation") && normalized.includes("does not exist");
			const errorCode = isMissingTable ? "AUTH_DB_TABLE_MISSING" : "OAUTH_RUNTIME_ERROR";

			reportAuthEvent({
				level: "error",
				code: errorCode,
				message: isMissingTable
					? "Auth database table missing during OAuth runtime"
					: "Runtime error in OAuth handler",
				details: { message },
			});

			return new Response(JSON.stringify({ ok: false, error: errorCode, message }), {
				status: 503,
				headers: { "Content-Type": "application/json" },
			});
		}
	};

	GET = wrap("GET");
	POST = wrap("POST");
}

export { GET, POST };
