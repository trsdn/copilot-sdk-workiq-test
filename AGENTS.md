# Agent Instructions

This file provides instructions for AI coding agents working in this repository.

## Repository Overview

A TypeScript project demonstrating the GitHub Copilot SDK with Work IQ MCP integration for Microsoft 365 data access.

**Tech Stack:** Node.js 18+, TypeScript, Express, Zod, Vitest

## Project Structure

```
src/
├── agent.ts           # Main CLI agent with M365 integration
└── news-app/
    ├── server.ts      # Express server for news aggregation
    ├── server.test.ts # Vitest tests
    └── public/        # Static frontend files
docs/architecture/     # Architecture documentation
```

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run CLI agent | `npm run agent` |
| Run news app | `npm run news` |
| Run tests | `npm test` |
| Run tests (watch) | `npm test:watch` |

Always run `npm install` before other commands if `node_modules` is missing.

## Coding Conventions

- Use ESM imports (`import`/`export`)
- Define tools using `defineTool()` from `@github/copilot-sdk`
- Use Zod for schema validation
- Write tests in `*.test.ts` files alongside source files
- Use Vitest for testing

## Key Patterns

### Tool Definition
```typescript
import { defineTool } from "@github/copilot-sdk";

const myTool = defineTool("tool_name", {
    description: "What the tool does",
    parameters: { key: { type: "string", description: "..." } },
    handler: (args) => { /* return result */ },
});
```

### MCP Server Config
```typescript
const mcpServer = {
    "server-name": {
        type: "http" as const,
        url: "https://...",
        tools: ["*"],
    },
};
```

## Testing

- Run `npm test` before committing
- Tests use Vitest with TypeScript support
- Mock external APIs in tests
