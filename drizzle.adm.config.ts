import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./db/adm/schema.ts"],
  out: "./db/adm/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // cast to string to satisfy typing; presence is checked by db/seed/check-env.ts
    url: process.env.ADM_DATABASE_URL as string,
  },
});
