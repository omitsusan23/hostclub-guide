#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: "minimal-vercel-mcp",
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
        name: "create_store_mock",
        description: "モック店舗作成（Supabase接続なし）",
        inputSchema: {
          type: "object",
          properties: {
            store_name: {
              type: "string",
              description: "店舗名"
            },
            store_id: {
              type: "string", 
              description: "店舗ID"
            }
          },
          required: ["store_name", "store_id"]
        }
      },
      {
        name: "check_domain_mock",
        description: "モックドメイン確認（Vercel接続なし）",
        inputSchema: {
          type: "object",
          properties: {
            store_id: {
              type: "string",
              description: "店舗ID"
            }
          },
          required: ["store_id"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "create_store_mock") {
    const { store_name, store_id } = request.params.arguments;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ モック店舗「${store_name}」が作成されました！
🏪 店舗ID: ${store_id}
🌐 モックURL: https://${store_id}.susukino-hostclub-guide.online
👤 モックログイン: ${store_id}@hostclub.local

※ これはモックレスポンスです（実際のSupabase/Vercel接続なし）`
        }
      ]
    };
  }

  if (request.params.name === "check_domain_mock") {
    const { store_id } = request.params.arguments;
    
    return {
      content: [
        {
          type: "text",
          text: `🌐 モックドメイン状況: ${store_id}.susukino-hostclub-guide.online
ステータス: ✅ モックアクティブ

※ これはモックレスポンスです`
        }
      ]
    };
  }

  throw new McpError(ErrorCode.ToolNotFound, `Unknown tool: ${request.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport); 