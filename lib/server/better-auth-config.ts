type BetterAuthEnvironment = {
  baseURL: string;
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
  trustedOrigins: string[];
};

function normalizeOrigin(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return undefined;
  }
}

function uniqueOrigins(values: Array<string | undefined>): string[] {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

function resolveBaseURL(env: Record<string, string | undefined>): string {
  return (
    env.BETTER_AUTH_URL?.trim() ||
    env.APP_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000"
  );
}

export function resolveBetterAuthEnvironment(
  env: Record<string, string | undefined> = process.env,
): BetterAuthEnvironment {
  const secret = env.BETTER_AUTH_SECRET?.trim() || env.AUTH_SECRET?.trim();
  const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();

  const missing = [
    !secret ? "BETTER_AUTH_SECRET" : null,
    !googleClientId ? "GOOGLE_CLIENT_ID" : null,
    !googleClientSecret ? "GOOGLE_CLIENT_SECRET" : null,
  ].filter((value): value is string => Boolean(value));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  const resolvedSecret = secret as string;
  const resolvedGoogleClientId = googleClientId as string;
  const resolvedGoogleClientSecret = googleClientSecret as string;

  const baseURL = resolveBaseURL(env);
  const trustedOrigins = uniqueOrigins([
    normalizeOrigin(baseURL),
    normalizeOrigin(env.APP_URL),
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL),
    env.NODE_ENV === "production"
      ? undefined
      : normalizeOrigin("http://localhost:3000"),
  ]);

  return {
    baseURL,
    secret: resolvedSecret,
    googleClientId: resolvedGoogleClientId,
    googleClientSecret: resolvedGoogleClientSecret,
    trustedOrigins,
  };
}
