import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { admDb } from "../db/adm/client";
import { resolveBetterAuthEnvironment } from "./server/better-auth-config";

const betterAuthEnvironment = resolveBetterAuthEnvironment();

export const auth = betterAuth({
  database: drizzleAdapter(admDb(), {
    provider: "pg",
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
