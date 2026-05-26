import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync } from "fs";
import { uploadFile } from "./upload.js";
import { takeScreenshot } from "./screenshot.js";

const server = new Server(
  { name: "r2-sharebox", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "upload_file",
      description:
        "Upload an image or video file to Cloudflare R2 and return a shareable pre-signed URL. Use this when asked to upload, share, or send a file.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute path to the file to upload.",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "screenshot_and_upload",
      description:
        "Take a screenshot of the current screen, upload it to Cloudflare R2, and return a shareable pre-signed URL. Use this when asked to take a screenshot and share it, or when the user wants visual feedback on what is currently on screen.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "upload_file") {
      const { path } = args;
      if (!path) throw new Error("path is required");
      if (!existsSync(path)) throw new Error(`File not found: ${path}`);

      const { url, key, bucket } = await uploadFile(path);
      return {
        content: [
          {
            type: "text",
            text: `Uploaded successfully.\n\nPre-signed URL (7 days):\n${url}\n\nBucket: ${bucket}\nKey: ${key}`,
          },
        ],
      };
    }

    if (name === "screenshot_and_upload") {
      const screenshotPath = takeScreenshot();
      const { url, key, bucket } = await uploadFile(screenshotPath);
      return {
        content: [
          {
            type: "text",
            text: `Screenshot taken and uploaded.\n\nPre-signed URL (7 days):\n${url}\n\nBucket: ${bucket}\nKey: ${key}`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
