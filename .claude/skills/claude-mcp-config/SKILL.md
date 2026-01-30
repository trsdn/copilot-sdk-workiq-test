---
name: claude-mcp-config
description: Configure MCP (Model Context Protocol) servers for Claude Code. Use this skill when setting up external tool integrations, database connections, or API access through MCP.
---

# Claude Code MCP Configuration

This skill helps you configure MCP servers to extend Claude Code with external tools and data sources.

## When to Use This Skill

- Connecting to external APIs (GitHub, Sentry, Notion, etc.)
- Setting up database access
- Adding custom tool integrations
- Configuring team-wide MCP servers

## What is MCP?

MCP (Model Context Protocol) is an open standard that lets Claude Code connect to external tools, databases, and APIs. MCP servers provide:

- **Tools**: Actions Claude can perform (query database, create issue)
- **Resources**: Data Claude can access (files, records)
- **Prompts**: Pre-defined commands

## MCP Server Types

| Type | Transport | Use Case |
| ---- | --------- | -------- |
| **Remote HTTP** | `--transport http` | Cloud services, SaaS APIs |
| **Remote SSE** | `--transport sse` | Legacy (deprecated) |
| **Local stdio** | `--transport stdio` | Local tools, custom scripts |

## Installation Scopes

| Scope | Storage | Availability |
| ----- | ------- | ------------ |
| `local` | `~/.claude.json` | You, this project only (default) |
| `project` | `.mcp.json` | All team members (committed) |
| `user` | `~/.claude.json` | You, all projects |

## Adding MCP Servers

### Remote HTTP Server (Recommended)

```bash
# Basic syntax
claude mcp add --transport http <name> <url>

# Examples
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# With authentication header
claude mcp add --transport http my-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### Local stdio Server

```bash
# Basic syntax
claude mcp add --transport stdio <name> -- <command> [args...]

# Examples
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:pass@localhost:5432/mydb"

claude mcp add --transport stdio airtable \
  --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server

# With scope
claude mcp add --transport stdio --scope user my-tool -- /path/to/tool
```

## Managing Servers

```bash
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get github

# Remove a server
claude mcp remove github

# Check server status (in Claude Code)
/mcp
```

## Popular MCP Servers

### Development

| Server | Command |
| ------ | ------- |
| GitHub | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |
| Sentry | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| Figma | `claude mcp add --transport http figma https://mcp.figma.com/mcp` |

### Databases

```bash
# PostgreSQL
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:pass@host:5432/database"
```

### Productivity

| Server | Command |
| ------ | ------- |
| Notion | `claude mcp add --transport http notion https://mcp.notion.com/mcp` |
| Asana | `claude mcp add --transport sse asana https://mcp.asana.com/sse` |
| Slack | Requires user-specific URL |

## Project-Scoped Configuration

### `.mcp.json` Format

Create `.mcp.json` in your project root for team-shared servers:

```json
{
  "mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL}"],
      "env": {}
    },
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### Environment Variable Expansion

Supported syntax:

- `${VAR}` - Use environment variable
- `${VAR:-default}` - Use default if not set

Expansion works in:

- `command`
- `args`
- `env`
- `url`
- `headers`

## Authentication

### OAuth 2.0 (Remote Servers)

```bash
# 1. Add server
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# 2. Authenticate in Claude Code
/mcp
# Select "Authenticate" and follow browser flow
```

### API Keys (Local Servers)

```bash
claude mcp add --transport stdio my-api \
  --env API_KEY=your-key \
  -- /path/to/server
```

## Plugin MCP Servers

Plugins can bundle MCP servers in `.mcp.json`:

```json
{
  "plugin-api": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": {
      "API_URL": "${API_URL}"
    }
  }
}
```

## Using MCP in Claude Code

### Reference Resources

```text
> Analyze @github:issue://123 and suggest a fix
> Compare @postgres:schema://users with the docs
```

### Execute Prompts

```text
> /mcp__github__list_prs
> /mcp__jira__create_issue "Bug report" high
```

### Tool Search

When you have many MCP tools, Claude automatically uses tool search:

```bash
# Configure threshold (default: auto at 10% context)
ENABLE_TOOL_SEARCH=auto:5 claude  # Trigger at 5%
ENABLE_TOOL_SEARCH=false claude   # Disable entirely
```

## Output Limits

```bash
# Default max: 25,000 tokens, warning at 10,000
# Increase for large outputs
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

## Managed Configuration (Enterprise)

### `managed-mcp.json`

Deploy to system directories for exclusive control:

- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux: `/etc/claude-code/managed-mcp.json`
- Windows: `C:\Program Files\ClaudeCode\managed-mcp.json`

```json
{
  "mcpServers": {
    "company-api": {
      "type": "http",
      "url": "https://internal.company.com/mcp"
    }
  }
}
```

### Allowlists/Denylists

In managed settings:

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverUrl": "https://mcp.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "untrusted-server" }
  ]
}
```

## Troubleshooting

### Server Not Connecting

```bash
# Check server status
/mcp

# Debug mode
claude --debug

# Verify configuration
claude mcp get server-name
```

### Common Issues

1. **"Connection closed"** - Check command path and arguments
2. **OAuth failed** - Clear auth and retry: `/mcp` → "Clear authentication"
3. **Timeout** - Increase with `MCP_TIMEOUT=10000 claude`

## Best Practices

1. **Use project scope** for team-shared servers
2. **Use environment variables** for secrets
3. **Test locally first** before committing `.mcp.json`
4. **Document required env vars** in README
5. **Use HTTP transport** for remote servers (not SSE)

## Resources

- [MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [MCP Servers on GitHub](https://github.com/modelcontextprotocol/servers)
- [MCP SDK](https://modelcontextprotocol.io/quickstart/server)
