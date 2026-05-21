const http = require("node:http");

const target = process.env.HEALTHCHECK_URL || "http://127.0.0.1:3000/";
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);

const request = http.get(target, (response) => {
  const statusCode = response.statusCode || 0;
  response.resume();

  if (statusCode >= 200 && statusCode < 400) {
    process.exit(0);
  }

  console.error(`Healthcheck failed with HTTP ${statusCode}`);
  process.exit(1);
});

request.on("error", (error) => {
  console.error(`Healthcheck request failed: ${error.message}`);
  process.exit(1);
});

request.setTimeout(timeoutMs, () => {
  request.destroy(new Error("Healthcheck timed out"));
});
