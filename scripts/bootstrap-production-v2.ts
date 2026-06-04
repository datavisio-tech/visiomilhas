#!/usr/bin/env tsx

import { readFile } from "node:fs/promises";
import path from "node:path";

type BootstrapStep = {
  title: string;
  details: string[];
};

const steps: BootstrapStep[] = [
  {
    title: "Provision empty target databases",
    details: [
      "Ensure ADM and APP targets exist for Production V2.",
      "Do not reuse DEV/HM assumptions silently.",
    ],
  },
  {
    title: "Apply ADM migrations",
    details: [
      "Create admin, organization, plan, subscription, and audit tables.",
      "Include Better Auth physical tables before runtime auth is considered ready.",
    ],
  },
  {
    title: "Apply APP migrations",
    details: [
      "Create loyalty programs, accounts, ledger, purchases, sales, transfers, and related operational tables.",
      "Apply FIFO/lot support when go-live scope requires it.",
    ],
  },
  {
    title: "Provision first owner and organization",
    details: [
      "Authenticate the first owner through Google OAuth.",
      "Run onboarding to create the initial organization and default operational context.",
    ],
  },
  {
    title: "Activate the first trial",
    details: [
      "Use the Subscribe flow to activate the trial explicitly.",
      "Confirm the access state transitions to TRIAL.",
    ],
  },
];

async function main() {
  const mode = process.argv.includes("--json") ? "json" : "text";
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

  const admMigration = await readFile(
    path.join(repoRoot, "db/adm/migrations/0000_strange_thor_girl.sql"),
    "utf8",
  );
  const appMigration = await readFile(
    path.join(repoRoot, "db/app/migrations/0000_misty_kulan_gath.sql"),
    "utf8",
  );

  const payload = {
    mode: "planning-only",
    summary: "Production V2 bootstrap checklist prepared; no migrations executed.",
    requiredMigrations: [
      "db/adm/migrations/0000_strange_thor_girl.sql",
      "db/app/migrations/0000_misty_kulan_gath.sql",
      "db/adm/migrations/0001_better_auth_tables.sql",
    ],
    optionalMigrations: ["db/app/migrations/0001_add_mile_point_lots.sql"],
    bootstrapSteps: steps,
    risks: [
      "Empty admin database without Better Auth tables can block auth bootstrap.",
      "Trial activation is explicit and not automatic on first login.",
      "Production rollback after applied migrations requires DB backups/snapshots.",
    ],
    checks: {
      admMigrationPresent: admMigration.includes("CREATE TABLE"),
      appMigrationPresent: appMigration.includes("CREATE TABLE"),
      envVarsRequired: [
        "ADM_DATABASE_URL",
        "APP_DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
      ],
    },
  };

  if (mode === "json") {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log("Production V2 bootstrap planning only");
  console.log("");
  console.log("Required migrations:");
  for (const migration of payload.requiredMigrations) {
    console.log(`- ${migration}`);
  }
  console.log("");
  console.log("Optional migrations:");
  for (const migration of payload.optionalMigrations) {
    console.log(`- ${migration}`);
  }
  console.log("");
  console.log("Execution order:");
  payload.bootstrapSteps.forEach((step, index) => {
    console.log(`${index + 1}. ${step.title}`);
    for (const detail of step.details) {
      console.log(`   - ${detail}`);
    }
  });
  console.log("");
  console.log("Risks:");
  for (const risk of payload.risks) {
    console.log(`- ${risk}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
