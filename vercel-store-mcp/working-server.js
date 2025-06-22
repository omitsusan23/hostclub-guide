#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "working-vercel-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello_world",
        description: "Hello World テストツール",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "表示するメッセージ"
            }
          },
          required: ["message"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "hello_world") {
    const { message } = request.params.arguments;
    return {
      content: [
        {
          type: "text",
          text: `Hello World: ${message}`
        }
      ]
    };
  }

  throw new McpError(ErrorCode.ToolNotFound, `Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport); 