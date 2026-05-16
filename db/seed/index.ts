import { seedAdm } from "./adm-seed";
import { seedApp } from "./app-seed";
import { admPool, closeAdmPool } from "../../db/adm/client";
import { appPool, closeAppPool } from "../../db/app/client";

/**
 * Safety: require explicit authorization to run seeds.
 * - Either set environment variable `VISIOMILHEIRO_ALLOW_DB_SEED=1`
 * - Or pass `--apply` on the command line: `npm run db:seed -- --apply`
 */
function isAuthorized() {
  if (process.env.VISIOMILHEIRO_ALLOW_DB_SEED === "1") return true;
  if (process.argv.includes("--apply")) return true;
  return false;
}

async function main() {
  if (!isAuthorized()) {
    console.error(
      "Seed runner NOT AUTHORIZED. To allow execution set VISIOMILHEIRO_ALLOW_DB_SEED=1 or pass --apply. No secrets are printed.",
    );
    process.exit(2);
  }

  console.log(
    "Authorization confirmed. Running db seed (safe, idempotent operations).",
  );
  const orgId = await seedAdm();
  console.log("Seed ADM concluído");
  await seedApp(orgId);
  console.log("Seed APP concluído");

  // Close pools
  await closeAdmPool();
  await closeAppPool();

  console.log("Seed finalizado");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Seed failed:", err?.message || err);
    process.exit(1);
  });
}
