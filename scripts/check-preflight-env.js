const d = require("dotenv");
const de = require("dotenv-expand");
const env = d.config();
de(env);

const vars = [
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "DATABASE_STAGING",
  "DATABASE_TEST",
  "STAGING_DATABASE_URL",
  "TEST_DATABASE_URL",
];

function check(name) {
  const v = process.env[name];
  if (!v) return `${name}:MISSING`;
  const issues = [];
  if (v.indexOf("${") !== -1) issues.push("UNEXPANDED_VARS");
  if (/\s/.test(v)) issues.push("WHITESPACE");
  if (v.indexOf("\n") !== -1) issues.push("MULTILINE");
  if (v.length > 2048) issues.push("TOO_LONG");
  return issues.length ? `${name}:${issues.join("|")}` : `${name}:OK`;
}

vars.forEach((v) => console.log(check(v)));
