import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const GITHUB_REPO = "dwiblr/r2-sharebox";

const MCP_CONFIGS = [
  {
    label: "Claude Code",
    path: join(homedir(), ".claude", "claude_mcp_config.json"),
    dir: join(homedir(), ".claude"),
  },
  {
    label: "Cursor",
    path: join(homedir(), ".cursor", "mcp.json"),
    dir: join(homedir(), ".cursor"),
  },
];

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function readJson(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function runSetup() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n🪣  r2-sharebox setup\n");
  console.log("This will configure the MCP server in Claude Code and Cursor.\n");

  const accountId = await ask(rl, "Cloudflare Account ID: ");
  const accessKeyId = await ask(rl, "R2 Access Key ID: ");
  const secretAccessKey = await ask(rl, "R2 Secret Access Key: ");
  const bucketName = await ask(rl, "R2 Bucket Name: ");
  const prefix = await ask(rl, "Folder prefix (e.g. from-ai) [optional]: ");
  const expiry = await ask(rl, "Pre-signed URL expiry in seconds [604800 = 7 days]: ");

  rl.close();

  const env = {
    R2_ACCOUNT_ID: accountId.trim(),
    R2_ACCESS_KEY_ID: accessKeyId.trim(),
    R2_SECRET_ACCESS_KEY: secretAccessKey.trim(),
    R2_BUCKET_NAME: bucketName.trim(),
    ...(prefix.trim() && { R2_PREFIX: prefix.trim() }),
    ...(expiry.trim() && { R2_URL_EXPIRY: expiry.trim() }),
  };

  const serverEntry = {
    command: "npx",
    args: ["-y", `github:${GITHUB_REPO}`],
    env,
  };

  const installed = [];
  const skipped = [];

  for (const config of MCP_CONFIGS) {
    if (!existsSync(config.dir)) {
      skipped.push(`${config.label} (${config.dir} not found — not installed)`);
      continue;
    }

    mkdirSync(config.dir, { recursive: true });
    const existing = readJson(config.path);
    existing.mcpServers = existing.mcpServers ?? {};
    existing.mcpServers["r2-sharebox"] = serverEntry;
    writeJson(config.path, existing);
    installed.push(`${config.label} → ${config.path}`);
  }

  console.log("\n✅  Done!\n");
  if (installed.length) {
    console.log("Configured:");
    installed.forEach((s) => console.log(`  ${s}`));
  }
  if (skipped.length) {
    console.log("\nSkipped (app not installed):");
    skipped.forEach((s) => console.log(`  ${s}`));
  }

  console.log("\nRestart Claude Code / Cursor to pick up the new MCP server.");
  console.log('Then ask: "take a screenshot and upload it"\n');
}
