---
name: repo-structure
description: Explains and enforces the repository structure for this template. Use when users ask "where should I put this?", "what's the structure?", or need guidance on file placement.
---

# Repository Structure

This template follows a dual-platform structure supporting both Claude Code and GitHub Copilot.

> **Deep Dive**: For comprehensive conventions including testing, documentation, and anti-patterns, see the [structure-conventions](../structure-conventions/SKILL.md) skill.

## Directory Overview

```
.
├── .claude/                    # Claude Code customizations (shared with Copilot)
│   ├── agents/                 # Subagents for specialized tasks
│   ├── commands/               # Custom slash commands
│   ├── rules/                  # Conditional rules (path-based)
│   ├── skills/                 # Agent skills (portable, shared)
│   └── settings.example.json   # Example Claude Code settings
│
├── .github/                    # GitHub-specific configuration
│   ├── agents/                 # Copilot agents (Copilot-only features)
│   ├── prompts/                # Copilot prompt files
│   ├── skills/                 # Copilot-only skills
│   ├── workflows/              # GitHub Actions
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
│
├── CLAUDE.md                   # Project memory for Claude Code
├── README.md                   # Project documentation
├── CONTRIBUTING.md             # Contribution guidelines
├── CHANGELOG.md                # Release history
├── CODE_OF_CONDUCT.md          # Community standards
├── SECURITY.md                 # Security policy
└── QUICKSTART.md               # Getting started guide
```

## File Placement Rules

### Skills

| Type | Location | When to Use |
|------|----------|-------------|
| Shared skills | `.claude/skills/<name>/` | Works with both Claude and Copilot |
| Copilot-only | `.github/skills/<name>/` | Uses Copilot-specific features |

### Agents

| Type | Location | When to Use |
|------|----------|-------------|
| Claude subagents | `.claude/agents/<name>.md` | Claude Code specific |
| Copilot agents | `.github/agents/<name>.agent.md` | Copilot specific |

### Rules (Claude Code only)

Rules go in `.claude/rules/` with path patterns:

```yaml
---
paths:
  - "**/*.ts"
---
```

### Commands (Claude Code only)

Custom commands go in `.claude/commands/<name>.md`.

### Prompts (Copilot only)

Prompt files go in `.github/prompts/<name>.prompt.md`.

## Quick Reference

| "Where do I put..." | Location |
|---------------------|----------|
| A new skill | `.claude/skills/<name>/SKILL.md` |
| A Claude agent | `.claude/agents/<name>.md` |
| A Copilot agent | `.github/agents/<name>.agent.md` |
| A conditional rule | `.claude/rules/<name>.md` |
| A custom command | `.claude/commands/<name>.md` |
| A prompt file | `.github/prompts/<name>.prompt.md` |
| GitHub Actions | `.github/workflows/<name>.yml` |
| Project docs | Root directory (README.md, etc.) |

## Naming Conventions

All skill and agent names must:

- Use lowercase letters, numbers, and hyphens only
- Be 1-64 characters
- Not start or end with hyphens
- Not have consecutive hyphens
- Match the directory/file name

### Skill Prefixes by Domain

| Prefix | Domain |
|--------|--------|
| `claude-` | Claude Code specific features |
| `copilot-` | GitHub Copilot specific features |
| `git-` | Git/GitHub workflows |
| `doc-` | Documentation |
| `web-` | Web development |
