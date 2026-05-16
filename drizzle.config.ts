import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["db/adm/schema.ts", "db/app/schema.ts"],
  out: "drizzle",
  dialect: "postgresql",
});
