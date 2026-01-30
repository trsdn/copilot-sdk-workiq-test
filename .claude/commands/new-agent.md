---
description: Create a new Claude Code subagent in this repository
---

# Create New Subagent

Create a new subagent for Claude Code in this repository.

## Instructions

1. Ask the user for the agent name (lowercase with hyphens)
2. Ask for a description of what the agent specializes in
3. Ask which skills should be preloaded (from existing skills in `.claude/skills/`)
4. Create the agent file at `.claude/agents/<name>.md`
5. Add the agent to the README.md agents table

## Agent Template

Use this structure:

```markdown
---
name: <agent-name>
description: <what this agent specializes in>
skills:
  - skill-1
  - skill-2
---

# <Agent Title>

You are an expert in...

## Your Capabilities

Describe what this agent can help with.

## Approach

How this agent approaches tasks:

1. Step one
2. Step two
3. Step three

## Guidelines

- Specific guidelines for behavior
```

## Optional Frontmatter

```yaml
---
name: agent-name
description: Description
skills:
  - skill-name
model: opus          # sonnet (default), opus, haiku
allowed-tools: Read, Write, Bash, Grep, Glob
context: fork        # Run in isolated subagent
---
```

## Naming Requirements

- 1-64 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens
- Must match filename (without `.md`)

The agent name provided is: $ARGUMENTS
