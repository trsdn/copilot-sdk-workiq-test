---
paths:
  - ".claude/agents/*.md"
---

# Subagent File Conventions

When creating or editing subagent files:

## Frontmatter Requirements

- `name` must match the filename (without `.md`)
- `description` should explain the agent's specialization
- Include `skills` array to preload relevant skills

## Content Guidelines

- Define a clear role and expertise area
- Include specific instructions for behavior
- Document the agent's approach to tasks
- Keep focused on a single responsibility

## Naming Pattern

- Lowercase letters, numbers, and hyphens only
- 1-64 characters
- No leading/trailing hyphens
- No consecutive hyphens
