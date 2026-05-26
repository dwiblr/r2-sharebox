# r2-sharebox

MCP server that lets AI assistants upload screenshots and files to Cloudflare R2 and return shareable pre-signed URLs.

**Works with:** Claude Code, Cursor (Desktop + CLI)

## Install

Run the interactive setup on any machine:

```sh
npx -y github:dwiblr/r2-sharebox setup
```

This will ask for your R2 credentials and automatically configure Claude Code and Cursor.

Then restart Claude Code / Cursor — the tools are available immediately.

## Tools

| Tool | Description |
|------|-------------|
| `upload_file(path)` | Upload any file by path, get a pre-signed URL |
| `screenshot_and_upload()` | Take a screenshot, upload it, get a pre-signed URL |

## Usage

Just ask naturally:
- *"take a screenshot and send me the link"*
- *"upload `/tmp/recording.mp4` to R2"*

## Manual config

If you prefer to configure manually, add this to your MCP config:

**Claude Code** (`~/.claude/claude_mcp_config.json`):
```json
{
  "mcpServers": {
    "r2-sharebox": {
      "command": "npx",
      "args": ["-y", "github:dwiblr/r2-sharebox"],
      "env": {
        "R2_ACCOUNT_ID": "...",
        "R2_ACCESS_KEY_ID": "...",
        "R2_SECRET_ACCESS_KEY": "...",
        "R2_BUCKET_NAME": "...",
        "R2_PREFIX": "from-ai"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`) — same format.

## Env vars

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `R2_ACCOUNT_ID` | ✅ | — | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | ✅ | — | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | — | R2 API secret |
| `R2_BUCKET_NAME` | ✅ | — | Target bucket |
| `R2_PREFIX` | — | *(root)* | Folder prefix, e.g. `from-ai` |
| `R2_URL_EXPIRY` | — | `604800` | Pre-signed URL TTL in seconds (7 days) |
