import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import betterAuthSchema from "./server/better-auth-schema";

import { admDb } from "../db/adm/client";
import { resolveBetterAuthEnvironment } from "./server/better-auth-config";
import { reportAuthEvent } from "./server/auth-observability";

export const auth: any = (() => {
  try {
    const betterAuthEnvironment = resolveBetterAuthEnvironment();

    return betterAuth({
      database: drizzleAdapter(admDb(), {
        provider: "pg",
        // Pass explicit schema mapping to avoid runtime errors where the
        // adapter cannot find expected models (e.g. `verification`). This is
        // a minimal, isolated mapping that prevents 'model not found' errors
        // while preserving the existing DB and migrations.
        schema: betterAuthSchema as any,
      }),
      baseURL: betterAuthEnvironment.baseURL,
      secret: betterAuthEnvironment.secret,
      trustedOrigins: betterAuthEnvironment.trustedOrigins,
      socialProviders: {
        google: {
          clientId: betterAuthEnvironment.googleClientId,
          clientSecret: betterAuthEnvironment.googleClientSecret,
        },
      },
      advanced: {
        useSecureCookies: true,
        disableCSRFCheck: false,
        disableOriginCheck: false,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Report bootstrap failure without exposing secrets
    reportAuthEvent({
      level: "error",
      code: "AUTH_BOOTSTRAP_FAILED",
      message: "Better Auth bootstrap failed: missing or invalid environment",
      details: { message },
    });

    // Return a lightweight disabled auth object. Consumers should check
    // for `__authOperationalDisabled` to decide behaviour at runtime.
    return {
      __authOperationalDisabled: true,
      __authBootstrapMessage: message,
    } as const;
  }
})();
