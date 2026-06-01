import { toNextJsHandler } from "better-auth/next-js";
import { resolveBrowserContextTag } from "../../../../lib/server/auth-observability";

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
		const pathname = new URL(req.url).pathname;
		const isSignOutRequest = pathname.endsWith("/sign-out");
		const browserContext = resolveBrowserContextTag(req.headers.get("user-agent"));
		if (!handlers) {
			const message = "Authentication subsystem unavailable";
			return new Response(JSON.stringify({ ok: false, error: "OAUTH_RUNTIME_ERROR", message }), {
				status: 503,
				headers: { "Content-Type": "application/json" },
			});
		}

		try {
			const response = await handlers[method](req);

			if (isSignOutRequest) {
				if (response.ok) {
					reportAuthEvent({
						level: "info",
						code: "USER_LOGOUT_SUCCESS",
						message: "User signed out successfully",
						details: {
							browserContext,
							sessionLifecycle: "invalidated",
							onboardingStage: "not-applicable",
							recoveryStage: "normal",
							ownershipState: "cleared",
						},
					});
					reportAuthEvent({
						level: "info",
						code: "SESSION_INVALIDATED",
						message: "Session invalidated after sign-out",
						details: {
							browserContext,
							sessionLifecycle: "invalidated",
							onboardingStage: "not-applicable",
							recoveryStage: "normal",
							ownershipState: "cleared",
						},
					});
				} else {
					reportAuthEvent({
						level: "error",
						code: "USER_LOGOUT_FAILED",
						message: "User sign-out failed",
						details: {
							browserContext,
							sessionLifecycle: "unknown",
							onboardingStage: "unknown",
							recoveryStage: "unknown",
							ownershipState: "unknown",
							status: response.status,
						},
					});
				}
			}

			return response;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const normalized = message.toLowerCase();
			const isMissingTable = normalized.includes("relation") && normalized.includes("does not exist");
			const isRedirectUriMismatch = normalized.includes("redirect_uri_mismatch") || normalized.includes("redirect uri");

			let errorCode: "AUTH_DB_TABLE_MISSING" | "OAUTH_REDIRECT_URI_MISMATCH" | "OAUTH_RUNTIME_ERROR";
			if (isMissingTable) {
				errorCode = "AUTH_DB_TABLE_MISSING";
			} else if (isRedirectUriMismatch) {
				errorCode = "OAUTH_REDIRECT_URI_MISMATCH";
			} else {
				errorCode = "OAUTH_RUNTIME_ERROR";
			}

			reportAuthEvent({
				level: "error",
				code: errorCode,
				message:
					isMissingTable ? "Auth database table missing during OAuth runtime" :
					isRedirectUriMismatch ? "OAuth redirect URI mismatch - check Google Console configuration" :
					"Runtime error in OAuth handler",
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
