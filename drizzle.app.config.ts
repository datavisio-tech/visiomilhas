import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./db/app/schema.ts"],
  out: "./db/app/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // cast to string to satisfy typing; presence is checked by db/seed/check-env.ts
    url: process.env.APP_DATABASE_URL as string,
  },
});
