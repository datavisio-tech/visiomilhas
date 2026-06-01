import { createAuthClient } from "better-auth/client";

function resolveAuthBaseURL() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    "http://localhost:3000"
  );
}

const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
});

export default authClient;
