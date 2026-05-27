---
description: Upload a file or screenshot to Cloudflare R2 and return a shareable pre-signed URL. Use this when asked to upload, share, send a screenshot, or take a screenshot and give a link.
---

The r2-sharebox MCP tools may be deferred. Always load them first before calling.

## Steps

1. Call ToolSearch with query `select:mcp__r2-sharebox__screenshot_and_upload,mcp__r2-sharebox__upload_file` to load the tools.

2. Then call the appropriate tool:
   - To take a screenshot and upload: call `mcp__r2-sharebox__screenshot_and_upload` (no arguments needed)
   - To upload an existing file: call `mcp__r2-sharebox__upload_file` with `{ "path": "<absolute path>" }`

3. Return the pre-signed URL to the user.

## Triggers

Use this skill whenever the user says things like:
- "take a screenshot and send me the link"
- "upload this screenshot"
- "share what's on the screen"
- "take a screenshot and upload it"
- "upload [file] to R2"
