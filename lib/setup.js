import { createInterface } from "readline";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const GITHUB_REPO = "dwiblr/r2-sharebox";

// Dynamically find the plugin cache directory (structure: cache/<marketplace>/<plugin>/<version>/)
function findPluginCacheDir() {
  const cacheRoot = join(homedir(), ".claude", "plugins", "cache");
  if (!existsSync(cacheRoot)) return null;
  for (const marketplace of readdirSync(cacheRoot)) {
    const pluginDir = join(cacheRoot, marketplace, "r2-sharebox");
    if (!existsSync(pluginDir)) continue;
    // Pick the latest version directory
    const versions = readdirSync(pluginDir).sort().reverse();
    if (versions.length) return join(pluginDir, versions[0]);
  }
  return null;
}

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

function writeEnv(path, env) {
  const lines = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  writeFileSync(path, lines + "\n", "utf8");
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

  const installed = [];
  const skipped = [];

  // Write .env to plugin cache dir if plugin is installed (both root and dist/)
  const cacheDir = findPluginCacheDir();
  if (cacheDir) {
    for (const subdir of [cacheDir, join(cacheDir, "dist")]) {
      if (existsSync(subdir)) {
        writeEnv(join(subdir, ".env"), env);
      }
    }
    installed.push(`Plugin cache .env → ${cacheDir}`);
  }

  // Write to MCP configs (for non-plugin / manual installs)
  const serverEntry = {
    command: "npx",
    args: ["-y", `github:${GITHUB_REPO}`],
    env,
  };

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
    installed.push(`${config.label} MCP config → ${config.path}`);
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

  console.log("\nRestart Claude Code / Cursor to pick up the credentials.");
  console.log('Then ask: "take a screenshot and upload it"\n');
}
