---
paths:
  - "**/*.yml"
  - "**/*.yaml"
---

# YAML Conventions

When working with YAML files:

## Formatting

- Use 2 spaces for indentation
- No tabs
- Use lowercase for keys
- Quote strings with special characters

## Structure

- Put related items together
- Use comments to explain non-obvious settings
- Keep lines under 120 characters
- Use multi-line strings for long values

## Multi-line Strings

```yaml
# Literal block (preserves newlines)
description: |
  This is a multi-line
  description.

# Folded block (joins lines)
description: >
  This is a long description
  that will be joined.
```

## GitHub Actions Specific

- Use pinned versions for actions (`@v4`, not `@main`)
- Define reusable workflows when appropriate
- Use environment variables for repeated values
- Add `timeout-minutes` to jobs

## Common Patterns

```yaml
# Anchors for reuse
defaults: &defaults
  timeout-minutes: 10
  runs-on: ubuntu-latest

job1:
  <<: *defaults
  steps: ...
```
