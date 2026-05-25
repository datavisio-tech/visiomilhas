import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "../../../../lib/auth";

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
	const handlers = toNextJsHandler(auth as any);
	GET = handlers.GET;
	POST = handlers.POST;
}

export { GET, POST };
