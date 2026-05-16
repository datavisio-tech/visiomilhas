#!/usr/bin/env node
// Explanatory seed runner example (safe):
// - Does NOT print secret values
// - Lists missing env var NAMES if any
// - Shows the intended pattern for idempotent seeds

const required = [
  "ADM_DATABASE_URL",
  "APP_DATABASE_URL",
  "APP_NAME",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    "Missing required environment variables (names only):",
    missing.join(", "),
  );
  console.error(
    "Set them before running migrations or seeds. No values are shown for security.",
  );
  process.exit(2);
}

console.log(
  "Environment variables present. This is a non-destructive example seed runner.",
);
console.log("To implement seeds, create a TypeScript script that:");
console.log(
  "- imports your Drizzle client from db/app/client.ts or db/adm/client.ts",
);
console.log(
  "- uses idempotent operations (INSERT ... ON CONFLICT DO NOTHING / upsert)",
);
console.log(
  "- wraps multi-statement work in transactions and logs only non-sensitive status messages.",
);

// Do not run any real DB operations in this example.
process.exit(0);
