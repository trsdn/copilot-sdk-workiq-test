---
description: Create a new Claude Code skill in this repository
---

# Create New Skill

Create a new skill for Claude Code in this repository.

## Instructions

1. Ask the user for the skill name (lowercase with hyphens)
2. Ask for a brief description of what the skill does
3. Create the skill directory at `.claude/skills/<name>/`
4. Create the `SKILL.md` file with proper frontmatter
5. Add the skill to the README.md skills table
6. Update the `claude-customization-builder` agent to include the new skill

## Skill Template

Use this structure:

```markdown
---
name: <skill-name>
description: <description - max 1024 chars, include when to use>
---

# <Skill Title>

This skill helps you...

## When to Use This Skill

- Bullet points of use cases

## Key Concepts

Explain the main ideas...

## Examples

Show practical examples...

## Best Practices

1. Numbered best practices

## Resources

- [Link](url)
```

## Naming Requirements

- 1-64 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens
- Must match parent directory name

The skill name provided is: $ARGUMENTS
