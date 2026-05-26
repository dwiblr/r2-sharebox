#!/usr/bin/env node
const arg = process.argv[2];

if (arg === "setup") {
  const { runSetup } = await import("./lib/setup.js");
  await runSetup();
} else {
  const { startServer } = await import("./lib/server.js");
  await startServer();
}
