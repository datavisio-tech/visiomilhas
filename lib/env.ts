import { z } from "zod";

const ServerEnvSchema = z.object({
  ADM_DATABASE_URL: z.string().min(1),
  APP_DATABASE_URL: z.string().min(1),
  APP_NAME: z.string().min(1),
  APP_URL: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Safely parse server env without throwing on import.
 * Returns parsed env or null when required keys are missing.
 */
export function safeParseServerEnv(
  env: Record<string, string | undefined> = process.env,
): ServerEnv | null {
  const partial = {
    ADM_DATABASE_URL: env.ADM_DATABASE_URL,
    APP_DATABASE_URL: env.APP_DATABASE_URL,
    APP_NAME: env.APP_NAME,
    APP_URL: env.APP_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  };

  const result = ServerEnvSchema.safeParse(partial);
  return result.success ? result.data : null;
}

/**
 * Assert required server env variables exist and return typed env.
 * Throws an error listing missing variable NAMES (never prints values).
 */
export function assertServerEnv(
  env: Record<string, string | undefined> = process.env,
): ServerEnv {
  const required = [
    "ADM_DATABASE_URL",
    "APP_DATABASE_URL",
    "APP_NAME",
    "APP_URL",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // At this point values exist (non-empty), validate shape
  const parsed = ServerEnvSchema.parse({
    ADM_DATABASE_URL: env.ADM_DATABASE_URL,
    APP_DATABASE_URL: env.APP_DATABASE_URL,
    APP_NAME: env.APP_NAME,
    APP_URL: env.APP_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  });

  return parsed;
}

const envUtils = {
  safeParseServerEnv,
  assertServerEnv,
};

export default envUtils;
