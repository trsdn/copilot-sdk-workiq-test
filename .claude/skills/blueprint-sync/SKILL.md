---
name: blueprint-sync
description: Sync customizations from blueprint repositories (trsdn/claude-code-agent and trsdn/github-copilot-agent). Use when the user asks to update, sync, fetch, or pull changes from the blueprint repos, or wants to get the latest skills, agents, prompts, or instructions from the upstream templates.
---

# Blueprint Sync Skill

Fetches and syncs customizations from two blueprint repositories:

- **Claude Code**: `trsdn/claude-code-agent` — Claude Code skills, agents, rules, commands
- **GitHub Copilot**: `trsdn/github-copilot-agent` — Copilot agents, prompts, instructions, skills

## Sync Workflow

### 1. Determine What to Sync

Ask the user which blueprints to sync (or both):

| Source | Contents | Local Path |
|--------|----------|------------|
| `claude-code-agent` | Skills, agents, rules, commands | `.claude/` |
| `github-copilot-agent` | Agents, prompts, instructions, skills | `.github/` |

### 2. Use GitHub MCP Tools to Fetch Content

For each repository, use the GitHub MCP tools to retrieve file contents:

```
mcp_github_get_file_contents → fetch directory listing
mcp_github_get_file_contents → fetch individual files
```

### 3. Sync from claude-code-agent

Fetch and sync these paths from `trsdn/claude-code-agent`:

| Remote Path | Local Path | Type |
|-------------|------------|------|
| `.claude/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` | Skills |
| `.claude/agents/*.md` | `.claude/agents/*.md` | Subagents |
| `.claude/commands/*.md` | `.claude/commands/*.md` | Commands |
| `.claude/rules/*.md` | `.claude/rules/*.md` | Rules |
| `.claude/settings.example.json` | `.claude/settings.example.json` | Settings template |

**Key skills to sync:**

- `claude-skill-builder` → now merged into `skill-builder`
- `claude-subagent-builder` — Create custom subagents
- `claude-rule-builder` — Create modular rules
- `claude-hook-builder` — Create lifecycle hooks
- `claude-plugin-builder` — Create distributable plugins
- `claude-mcp-config` — Configure MCP server integrations
- `claude-memory-manager` → now renamed to `claude-project-memory`

**Key rules to sync:**

- `agent-conventions.md` — Rules for `.claude/agents/*.md` files
- `skill-conventions.md` — Rules for `.claude/skills/**/*.md` files

### 4. Sync from github-copilot-agent

Fetch and sync these paths from `trsdn/github-copilot-agent`:

| Remote Path | Local Path | Type |
|-------------|------------|------|
| `.github/agents/*.agent.md` | `.github/agents/*.agent.md` | Agents |
| `.github/prompts/*.prompt.md` | `.github/prompts/*.prompt.md` | Prompts |
| `.github/skills/*/SKILL.md` | `.github/skills/*/SKILL.md` | Skills |

**Key files to sync:**

- `copilot-customization-builder.agent.md` — Main Copilot agent
- `new-prompt-file.prompt.md` — Prompt template creator
- `new-custom-agent.prompt.md` — Agent template creator
- `new-instructions-file.prompt.md` — Instructions creator

### 5. Execution Steps

```bash
# Step 1: Activate file management tools
activate_file_management_tools

# Step 2: List directories in source repos
mcp_github_get_file_contents owner=trsdn repo=claude-code-agent path=.claude/skills
mcp_github_get_file_contents owner=trsdn repo=github-copilot-agent path=.github/agents

# Step 3: Fetch each file and create locally
# Use create_file tool to write fetched content
```

### 6. Conflict Resolution

When syncing:

1. **New files**: Create directly
2. **Existing files**: Show diff and ask user before overwriting
3. **Local-only files**: Preserve (don't delete)

### 7. Post-Sync Actions

After syncing:

1. Report what was added/updated
2. Suggest reviewing changes: `git diff`
3. Suggest committing: `git add . && git commit -m "chore: sync from blueprint repos"`

## Quick Commands

| User Says | Action |
|-----------|--------|
| "sync blueprints" | Sync both repos |
| "sync claude blueprints" | Sync only claude-code-agent |
| "sync copilot blueprints" | Sync only github-copilot-agent |
| "update skills" | Sync skill directories from both repos |
| "fetch latest agents" | Sync agent files from both repos |

## Example Interaction

```
User: sync blueprints

Agent: I'll sync customizations from both blueprint repositories.

Fetching from trsdn/claude-code-agent...
- Skills: claude-skill-builder, claude-subagent-builder, ...
- Agents: claude-customization-builder.md

Fetching from trsdn/github-copilot-agent...
- Agents: copilot-customization-builder.agent.md
- Prompts: new-prompt-file.prompt.md, new-custom-agent.prompt.md, ...

✓ Synced 12 files

Review changes: git diff
Commit: git commit -am "chore: sync from blueprint repos"
```

## Notes

- Always use MCP GitHub tools rather than shell scripts for reliability
- Prefer fetching specific files over cloning entire repos
- Preserve local customizations that don't exist in blueprints
- The user's local changes in existing files should be preserved unless explicitly requested to overwrite

## Post-Sync: Merge Duplicate Skills

After syncing from both blueprints, check for skills that exist in both locations with only minor differences (usually just paths). These should be **merged into a single shared skill** in `.claude/skills/`.

### Merge Criteria

A skill should be merged if the only differences are:

- File paths (`.claude/` vs `.github/`, `~/.claude/` vs `~/.copilot/`)
- Platform-specific frontmatter (which can coexist in one file)
- Minor wording differences

### How to Merge

1. **Create unified skill** in `.claude/skills/<skill-name>/`
2. **Document both paths** with a "Skill Locations" table
3. **Mark Claude-specific features** clearly (e.g., "Claude Code only")
4. **Delete platform-specific versions** from `.github/skills/`
5. **Update references** in agents and prompts

### Skills That Should NOT Be Merged

Keep separate if the skill:

- Uses platform-specific tools (`gh agent-task`, VS Code APIs)
- Has fundamentally different workflows per platform
- Requires Copilot-only features with no Claude equivalent

### Example Merges

| Was | Merged Into |
|-----|-------------|
| `claude-skill-builder` + `copilot-skill-builder` | `skill-builder` |
| `claude-memory-manager` + `copilot-memory-manager` | `memory-manager` (if both exist) |

> **Principle:** `.claude/skills/` = shared skills (both platforms). `.github/skills/` = Copilot-only features.
