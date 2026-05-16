import { safeParseServerEnv } from "../../lib/env";

const missingNames = (() => {
  const parsed = safeParseServerEnv();
  if (parsed) return [];
  const required = [
    "ADM_DATABASE_URL",
    "APP_DATABASE_URL",
    "APP_NAME",
    "APP_URL",
    "NEXT_PUBLIC_APP_URL",
  ];
  return required.filter((k) => !process.env[k]);
})();

if (missingNames.length > 0) {
  console.error("MISSING:" + missingNames.join(","));
  process.exit(2);
}

console.log("ALL_PRESENT");
