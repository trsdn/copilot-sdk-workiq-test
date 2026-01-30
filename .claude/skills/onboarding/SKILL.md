---
name: onboarding
description: Onboard new users and contributors to this template. Use when someone asks "how do I use this?", "getting started", "what skills are available?", or needs an introduction to the Claude + Copilot workflow.
---

# Onboarding

Welcome to this dual-platform template for Claude Code and GitHub Copilot customizations.

## What Is This Template?

This repository provides a collection of:

- **Skills** — Reusable knowledge and workflows for AI agents
- **Agents** — Specialized roles for complex tasks
- **Rules** — Conditional conventions (Claude Code)
- **Commands** — Custom slash commands (Claude Code)
- **Prompts** — Quick-access prompt files (Copilot)

## Dual-Platform Support

| Platform | Reads From | Invocation |
|----------|------------|------------|
| Claude Code | `.claude/` | `/skill-name` or automatic |
| GitHub Copilot | `.claude/skills/` + `.github/` | `@agent-name` or automatic |

**Key principle:** Skills in `.claude/skills/` work with both platforms. Only platform-specific features go in `.github/skills/` (Copilot) or use Claude-specific frontmatter.

## Getting Started

### 1. Explore Available Skills

```bash
# List all shared skills
ls .claude/skills/

# List Copilot-only skills
ls .github/skills/
```

### 2. Invoke a Skill

**Claude Code:**

```
/skill-name
# or just describe your task - skills load automatically
```

**GitHub Copilot:**

```
@agent-name help me with X
# or describe your task in chat
```

### 3. Run an Agent

**Claude Code:**

```
claude --agent claude-customization-builder "create a new skill"
```

**GitHub Copilot:**

```
@Copilot Customization Builder create a new skill
```

## Skills by Category

### Claude Code Specific (`claude-*`)

| Skill | Purpose |
|-------|---------|
| `claude-project-memory` | Manage CLAUDE.md files |
| `claude-subagent-builder` | Create custom agents |
| `claude-rule-builder` | Create conditional rules |
| `claude-hook-builder` | Create lifecycle hooks |
| `claude-plugin-builder` | Create distributable plugins |
| `claude-mcp-config` | Configure MCP servers |

### Git/GitHub (`git-*`)

| Skill | Purpose |
|-------|---------|
| `git-workflow` | Git best practices |
| `git-create-pr` | Create pull requests |
| `git-issues` | Manage GitHub issues |
| `git-issue-triage` | Triage open issues |
| `git-actions-templates` | GitHub Actions workflows |

### Documentation (`doc-*`)

| Skill | Purpose |
|-------|---------|
| `doc-readme` | Create README files |
| `doc-changelog` | Automate changelogs |
| `doc-adr` | Architecture Decision Records |

### Web Development (`web-*`)

| Skill | Purpose |
|-------|---------|
| `web-research` | Conduct web research |
| `web-app-testing` | Test with Playwright |
| `web-design-reviewer` | Visual design review |
| `web-frontend-design` | Create frontend UIs |

### Meta Skills

| Skill | Purpose |
|-------|---------|
| `skill-builder` | Create new skills |
| `skill-refactorer` | Refactor existing skills |
| `blueprint-sync` | Sync from upstream templates |
| `repo-structure` | Understand repo layout |

## Quick Commands

| Say This | To Do This |
|----------|------------|
| "sync blueprints" | Update from template repos |
| "create a skill for X" | Make a new skill |
| "what's the repo structure?" | Understand file layout |
| "create a PR" | Open a pull request |
| "file an issue" | Create a GitHub issue |

## Contributing

1. Fork this repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## Need Help?

- Check `repo-structure` skill for file placement
- Check `skill-builder` to create new skills
- Check `project-init` to set up a new project
