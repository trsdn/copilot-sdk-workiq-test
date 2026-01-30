---
description: Create a new Claude Code rule in this repository
---

# Create New Rule

Create a new modular rule for Claude Code in this repository.

## Instructions

1. Ask the user for the rule name (will become filename)
2. Ask what file patterns this rule should apply to
3. Ask for the conventions/guidelines to include
4. Create the rule file at `.claude/rules/<name>.md`

## Rule Template

Use this structure:

```markdown
---
paths:
  - "pattern1"
  - "pattern2"
---

# <Rule Title>

<Introduction explaining when this applies>

## Guidelines

- Guideline 1
- Guideline 2

## Examples

Show good and bad examples if helpful.
```

## Path Pattern Examples

| Pattern | Matches |
| ------- | ------- |
| `*.ts` | All TypeScript files |
| `src/**/*.tsx` | TSX files in src/ |
| `tests/**/*` | Everything in tests/ |
| `**/*.test.ts` | Test files anywhere |
| `!node_modules/**` | Exclude node_modules |

## Existing Rules

Check `.claude/rules/` for existing rules to avoid overlap:

- `skill-conventions.md` - Skills in `.claude/skills/`
- `agent-conventions.md` - Agents in `.claude/agents/`

The rule name provided is: $ARGUMENTS
