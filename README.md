# Copilot SDK + Work IQ Examples

<div align="center">

![License](https://img.shields.io/github/license/trsdn/copilot-sdk-workiq-test)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![CI](https://github.com/trsdn/copilot-sdk-workiq-test/actions/workflows/ci.yml/badge.svg)

**Examples using the GitHub Copilot SDK with Work IQ MCP integration to access Microsoft 365 data.**

</div>

## ✨ Features

- 🤖 **CLI Agent** — Interactive chatbot with streaming responses
- 📰 **News App** — Web app to fetch and summarize newsletter emails
- 📧 **M365 Integration** — Access emails, meetings, files via Work IQ
- 🔧 **Custom Tools** — Extensible tool definitions with Zod schemas
- 🔄 **Retry Logic** — Exponential backoff with circuit breaker
- 📊 **Observability** — Structured logging with Pino, health checks
- 📖 **API Docs** — OpenAPI/Swagger at `/api/docs`
- 🐳 **Docker Ready** — Dockerfile and docker-compose included

## 📋 Prerequisites

- Node.js 18+
- GitHub Copilot subscription
- Microsoft 365 account (for Work IQ features)

## 🚀 Installation

```bash
git clone https://github.com/trsdn/copilot-sdk-workiq-test.git
cd copilot-sdk-workiq-test
npm install
```

## 📖 Examples

### 1. CLI Agent

Interactive CLI chatbot that can:
- Access Microsoft 365 data (emails, meetings, files)
- Use custom tools (get_secret_number, get_current_time)
- Stream responses in real-time

```bash
npm run agent
```

<details>
<summary>Example prompts</summary>

- "What emails did I receive today?"
- "Do I have any meetings this week?"
- "Summarize my recent emails from [person]"
- "What time is it?"

</details>

### 2. News App

Web app that fetches and summarizes newsletter emails from your Inbox/news folder.

```bash
npm run news
```

Then open:
- http://localhost:3000 - News App
- http://localhost:3000/api/docs - API Documentation

**Keyboard Shortcuts:**
- `R` - Refresh/fetch news
- `T` - Toggle dark/light theme
- `ESC` - Cancel current fetch

## 🐳 Docker

```bash
# Build and run with Docker
docker build -t news-app .
docker run -p 3000:3000 news-app

# Or use docker-compose
docker-compose up
```

## ⚙️ MCP Configuration

The `.vscode/mcp.json` configures Work IQ:

```json
{
  "servers": {
    "workiq": {
      "command": "npx",
      "args": ["-y", "@microsoft/workiq", "mcp"]
    }
  }
}
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run agent` | Run the CLI agent |
| `npm run news` | Start the news app server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type checking |

## 🗂️ Project Structure

```
src/
├── agent.ts           # CLI agent with Work IQ
├── utils/
│   ├── logger.ts      # Pino structured logging
│   └── retry.ts       # Retry logic & circuit breaker
└── news-app/
    ├── server.ts      # Express server + Copilot SDK
    ├── server.test.ts # Vitest tests
    ├── openapi.yaml   # OpenAPI 3.0 spec
    └── public/        # Static frontend
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (liveness) |
| `/api/ready` | GET | Readiness check |
| `/api/news-stream` | GET | SSE stream for news aggregation |
| `/api/news` | GET | Legacy JSON endpoint |
| `/api/summarize-topic` | POST | Topic summarization |
| `/api/docs` | GET | Swagger UI documentation |

## 📄 License

MIT
