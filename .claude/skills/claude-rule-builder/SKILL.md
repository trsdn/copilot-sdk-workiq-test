---
name: claude-rule-builder
description: Create modular rules for Claude Code. Use this skill when setting up .claude/rules/ files, defining conditional rules with path patterns, or organizing project conventions.
---

# Claude Code Rule Builder

This skill helps you create and organize modular rules for Claude Code projects.

## When to Use This Skill

- Creating conditional rules for specific file patterns
- Organizing project conventions into modular files
- Setting up per-directory or per-language guidelines
- Breaking down a large CLAUDE.md into maintainable pieces

## Rule Locations

| Scope | Location | Availability |
| ----- | -------- | ------------ |
| Project | `.claude/rules/*.md` | This project only |
| Personal | `~/.claude/rules/*.md` | All your projects |

## Rule Format

### Basic Rule (Always Active)

```markdown
# Code Style Rules

All code in this project should:
- Use 2-space indentation
- Follow PascalCase for components
- Include JSDoc comments for public APIs
```

### Conditional Rule (Path-Based)

```yaml
---
paths:
  - "*.ts"
  - "src/**/*.tsx"
---

# TypeScript Rules

- Enable strict mode
- Avoid `any` type
- Use interfaces over type aliases for objects
```

## Path Pattern Syntax

Rules use glob patterns to match files:

| Pattern | Matches |
| ------- | ------- |
| `*.ts` | All TypeScript files |
| `src/**/*.tsx` | TSX files in src/ |
| `tests/**/*` | Everything in tests/ |
| `**/*.test.ts` | Test files anywhere |
| `!node_modules/**` | Exclude node_modules |

## Rules vs CLAUDE.md

| Aspect | CLAUDE.md | .claude/rules/ |
| ------ | --------- | -------------- |
| **Scope** | Always loaded | Conditional or always |
| **Organization** | Single file | Multiple files |
| **Purpose** | Project memory | Modular conventions |
| **Best for** | Core context | Conditional rules |

## Directory Structure

```text
.claude/
└── rules/
    ├── code-style.md          # Always active
    ├── typescript.md          # TypeScript files only
    ├── testing.md             # Test files only
    └── api-conventions.md     # API routes only
```

## Example Rules

### TypeScript Conventions

```yaml
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Conventions

## Type Definitions

- Use interfaces for object shapes
- Use type aliases for unions and intersections
- Export types alongside their implementations

## Strict Patterns

- No `any` unless explicitly documented why
- Enable strict null checks
- Use readonly for immutable data
```

### React Component Rules

```yaml
---
paths:
  - "src/components/**/*.tsx"
---

# React Component Rules

## File Structure

Each component file should contain:
1. Imports
2. Type definitions
3. Component function
4. Styled components (if using)

## Naming

- PascalCase for component names
- Match filename to component name
- Use .tsx extension for JSX
```

### API Route Rules

```yaml
---
paths:
  - "src/api/**/*"
  - "pages/api/**/*"
---

# API Route Rules

## Response Format

All API responses must include:
- `success: boolean`
- `data` or `error` field
- `timestamp: string`

## Error Handling

- Return appropriate HTTP status codes
- Include error codes for client parsing
- Log errors with request context
```

### Test File Rules

```yaml
---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# Testing Rules

## Structure

- Use `describe` for grouping
- Use `it` for individual tests
- Follow Arrange-Act-Assert pattern

## Naming

- Describe behavior, not implementation
- Start test names with "should"
- Group by feature or function
```

## Creating Rules from CLAUDE.md

Break down a large CLAUDE.md into rules:

```bash
# Create rules directory
mkdir -p .claude/rules

# Move TypeScript rules
cat > .claude/rules/typescript.md << 'EOF'
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Rules
(content from CLAUDE.md TypeScript section)
EOF

# Keep core context in CLAUDE.md
# - Project overview
# - Architecture decisions
# - Key dependencies
```

## Best Practices

1. **Single Responsibility**: Each rule file should cover one topic
2. **Clear Path Patterns**: Use specific patterns to avoid over-matching
3. **Keep Core in CLAUDE.md**: Project overview stays in main memory
4. **Document the Why**: Explain reasoning, not just rules
5. **Test Pattern Matches**: Verify rules apply to intended files

## Resources

- [Claude Code Rules Documentation](https://code.claude.com/docs/en/rules)
- [Glob Pattern Reference](https://en.wikipedia.org/wiki/Glob_(programming))
- [CLAUDE.md Guide](https://code.claude.com/docs/en/claude-md)
