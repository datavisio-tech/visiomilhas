import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { defineConfig } from "drizzle-kit";

// Load and expand .env so interpolations like ${POSTGRES_USER} work
const myEnv = dotenv.config();
// dotenv-expand default export is a function; call it to expand variables
dotenvExpand(myEnv);

export default defineConfig({
  schema: ["./db/app/schema.ts"],
  out: "./db/app/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.APP_DATABASE_URL as string,
  },
});
