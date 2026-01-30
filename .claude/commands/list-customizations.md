---
description: List all Claude Code customizations in this repository
---

# List Customizations

Display all Claude Code customizations available in this repository.

## Instructions

List the following from this repository:

### Skills (`.claude/skills/`)

Read each `SKILL.md` and show:

- Skill name
- Description (from frontmatter)

### Subagents (`.claude/agents/`)

Read each `.md` file and show:

- Agent name
- Description
- Preloaded skills

### Rules (`.claude/rules/`)

Read each `.md` file and show:

- Rule name
- Path patterns it applies to

### Commands (`.claude/commands/`)

Read each `.md` file and show:

- Command name
- Description

### Settings

Check if `.claude/settings.json` or `.claude/settings.example.json` exists.

## Output Format

Present as a formatted summary table for each category.
