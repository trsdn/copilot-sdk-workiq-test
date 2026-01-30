---
name: claude-plugin-builder
description: Create distributable plugins for Claude Code. Use this skill when packaging skills, agents, hooks, and MCP servers into shareable plugins for teams or marketplaces.
---

# Claude Code Plugin Builder

This skill helps you create and distribute plugins for Claude Code.

## When to Use This Skill

- Packaging skills for team distribution
- Creating shareable agent collections
- Building marketplace-ready plugins
- Converting standalone `.claude/` configs to plugins

## Plugins vs Standalone Configuration

| Aspect | Standalone (`.claude/`) | Plugin |
| ------ | ----------------------- | ------ |
| **Scope** | Single project | Shareable across projects |
| **Installation** | Manual copy | `/plugin install` |
| **Skill names** | `/hello` | `/plugin-name:hello` |
| **Distribution** | Git copy | Marketplace |
| **Best for** | Personal workflows | Team/community sharing |

## Plugin Structure

```text
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: manifest
├── commands/                 # User-invokable slash commands
│   └── hello.md
├── skills/                   # Model-invokable skills
│   └── code-review/
│       └── SKILL.md
├── agents/                   # Custom subagents
│   └── reviewer.md
├── hooks/                    # Lifecycle hooks
│   └── hooks.json
├── .mcp.json                 # MCP server configs
├── .lsp.json                 # LSP server configs
└── README.md                 # Documentation
```

## Plugin Manifest

### Required: `.claude-plugin/plugin.json`

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  }
}
```

### Full Manifest Options

```json
{
  "name": "my-plugin",
  "description": "A comprehensive plugin for development workflows",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://github.com/yourusername"
  },
  "homepage": "https://github.com/org/my-plugin",
  "repository": {
    "type": "git",
    "url": "https://github.com/org/my-plugin.git"
  },
  "license": "MIT",
  "keywords": ["development", "workflow", "automation"]
}
```

## Plugin Components

### Commands (User-Invoked)

Commands are explicitly invoked by users with `/plugin-name:command`:

```markdown
<!-- commands/greet.md -->
---
description: Greet the user warmly
---

Greet the user named "$ARGUMENTS" and ask how you can help today.
```

### Skills (Model-Invoked)

Skills are automatically used by Claude based on context:

```markdown
<!-- skills/code-review/SKILL.md -->
---
name: code-review
description: Reviews code for best practices and issues
---

When reviewing code, check for:
1. Code organization and structure
2. Error handling
3. Security concerns
4. Test coverage
```

### Agents

Custom subagents for specialized tasks:

```markdown
<!-- agents/security-auditor.md -->
---
name: security-auditor
description: Analyzes code for security vulnerabilities
model: opus
---

You are a security specialist focused on:
- OWASP Top 10 vulnerabilities
- Input validation
- Authentication flows
- Secrets management
```

### Hooks

Lifecycle automation in `hooks/hooks.json`:

```json
{
  "description": "Plugin hooks for code quality",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/lint.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### MCP Servers

Bundle MCP integrations in `.mcp.json`:

```json
{
  "plugin-api": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
    "args": ["--port", "8080"],
    "env": {
      "API_KEY": "${API_KEY}"
    }
  }
}
```

### LSP Servers

Code intelligence in `.lsp.json`:

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

## Creating a Plugin

### Step 1: Create Structure

```bash
mkdir -p my-plugin/.claude-plugin
mkdir -p my-plugin/commands
mkdir -p my-plugin/skills
mkdir -p my-plugin/agents
```

### Step 2: Create Manifest

```bash
cat > my-plugin/.claude-plugin/plugin.json << 'EOF'
{
  "name": "my-plugin",
  "description": "My awesome plugin",
  "version": "1.0.0"
}
EOF
```

### Step 3: Add Components

Add commands, skills, agents, or hooks as needed.

### Step 4: Test Locally

```bash
claude --plugin-dir ./my-plugin
```

### Step 5: Verify Components

```bash
# List commands
/help

# Check agents
/agents

# Test a command
/my-plugin:hello
```

## Converting Standalone to Plugin

```bash
# 1. Create plugin structure
mkdir -p my-plugin/.claude-plugin

# 2. Create manifest
cat > my-plugin/.claude-plugin/plugin.json << 'EOF'
{
  "name": "my-plugin",
  "description": "Migrated from standalone config",
  "version": "1.0.0"
}
EOF

# 3. Copy existing files
cp -r .claude/commands my-plugin/
cp -r .claude/skills my-plugin/
cp -r .claude/agents my-plugin/

# 4. Migrate hooks (if any)
# Copy hooks object from .claude/settings.json to my-plugin/hooks/hooks.json
```

## Distribution

### Option 1: Git Repository

Push to GitHub/GitLab and share the URL.

### Option 2: Marketplace

Create a `marketplace.json` for team distribution:

```json
{
  "name": "team-plugins",
  "description": "Our team's plugin collection",
  "plugins": [
    {
      "name": "code-quality",
      "description": "Code quality tools",
      "source": {
        "source": "github",
        "repo": "org/code-quality-plugin"
      }
    }
  ]
}
```

### Installing from Marketplace

```bash
# Add marketplace
/plugin marketplace add team-tools --source github --repo org/plugin-marketplace

# Install plugin
/plugin install code-quality@team-tools
```

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to plugin directory |
| `${CLAUDE_PROJECT_DIR}` | Project root directory |

## Best Practices

1. **Clear naming**: Use descriptive plugin and command names
2. **Semantic versioning**: Follow semver for releases
3. **Documentation**: Include a README with usage examples
4. **Minimal permissions**: Only request what you need
5. **Test thoroughly**: Use `--plugin-dir` during development

## Resources

- [Plugins Documentation](https://code.claude.com/docs/en/plugins)
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Discover Plugins](https://code.claude.com/docs/en/discover-plugins)
