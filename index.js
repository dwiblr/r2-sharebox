#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Load .env from script dir or one level up (handles both root and dist/ locations)
const __dirname = dirname(fileURLToPath(import.meta.url));
for (const dir of [__dirname, resolve(__dirname, "..")]) {
  const envPath = resolve(dir, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
    break;
  }
}

const arg = process.argv[2];

if (arg === "setup") {
  const { runSetup } = await import("./lib/setup.js");
  await runSetup();
} else {
  const { startServer } = await import("./lib/server.js");
  await startServer();
}
