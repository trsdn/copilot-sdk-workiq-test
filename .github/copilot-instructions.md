---
applyTo: '**'
---

# Copilot Instructions for This Repository

This is a template repository for Claude Code and GitHub Copilot customizations.

## Repository Context

This repo provides:
- **Skills** in `.claude/skills/` — Reusable knowledge for AI agents (shared by both Claude and Copilot)
- **Agents** in `.claude/agents/` and `.github/agents/` — Specialized roles
- **Rules** in `.claude/rules/` — Conditional conventions (Claude Code)
- **Prompts** in `.github/prompts/` — Quick-access prompts (Copilot)

## Coding Conventions

### Skill Files

When creating or editing skills:

- Place shared skills in `.claude/skills/<name>/SKILL.md`
- Place Copilot-only skills in `.github/skills/<name>/SKILL.md`
- Use lowercase names with hyphens (e.g., `code-review`, `git-workflow`)
- Include `name` and `description` in YAML frontmatter
- Keep SKILL.md under 500 lines

### Naming Prefixes

Use domain prefixes for organization:

| Prefix | Domain |
|--------|--------|
| `claude-` | Claude Code specific |
| `copilot-` | GitHub Copilot specific |
| `git-` | Git/GitHub operations |
| `doc-` | Documentation |
| `web-` | Web development |

### Frontmatter Format

```yaml
---
name: skill-name
description: Brief description of when to use this skill
---
```

## What NOT to Do

- Don't put secrets or credentials in any files
- Don't create skills with generic names like "helper" or "utils"
- Don't mix Claude-specific frontmatter in Copilot-only skills
- Don't create duplicate skills — check existing ones first

## Preferred Patterns

- Use relative paths when referencing files within a skill
- Include practical examples in skills
- Write descriptions that help agents decide when to load the skill
- Document "When to Use" and "When NOT to Use" sections

## Tech Stack

- Markdown for documentation and skills
- YAML frontmatter for metadata
- JSON for configuration files
- Shell scripts for automation
