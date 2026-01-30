---
name: claude-project-memory
description: Manage CLAUDE.md project memory files for Claude Code. Use this skill when creating, updating, or organizing project memory, documenting architecture decisions, or setting up Claude Code in a new project.
---

# Claude Code Memory Manager

This skill helps you create and maintain CLAUDE.md project memory files.

## When to Use This Skill

- Setting up Claude Code in a new project
- Documenting architecture decisions
- Recording project conventions
- Adding context that Claude should always know
- Organizing project knowledge

## Memory File Locations

| Scope | Location | Purpose |
| ----- | -------- | ------- |
| Project root | `CLAUDE.md` | Main project memory |
| Subdirectory | `*/CLAUDE.md` | Directory-specific context |
| Personal | `~/.claude/CLAUDE.md` | Your global preferences |
| Enterprise | Org settings | Shared team memory |

## CLAUDE.md Structure

### Recommended Sections

```markdown
# Project Name

## Overview
Brief description of what this project does.

## Architecture
Key architectural patterns and decisions.

## Tech Stack
- Framework: Next.js 14
- Language: TypeScript
- Database: PostgreSQL
- Testing: Vitest

## Directory Structure
Key directories and their purposes.

## Development Commands
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run build` - Production build

## Conventions
Project-specific coding standards.

## Key Files
Important files Claude should know about.
```

## Content Guidelines

### What to Include

✅ **Project Overview**

- What the project does
- Who uses it
- Key features

✅ **Architecture Decisions**

- Why certain patterns were chosen
- Trade-offs considered
- Constraints to respect

✅ **Development Workflow**

- Common commands
- Testing approach
- Deployment process

✅ **Conventions**

- Naming patterns
- File organization
- Code style decisions

✅ **Key Files**

- Entry points
- Configuration files
- Important utilities

### What to Avoid

❌ **Redundant documentation**

- Don't duplicate README content
- Don't repeat what's in code comments

❌ **Volatile information**

- Don't include frequently changing data
- Don't list all dependencies

❌ **Generic rules**

- Use rules/ for conditional conventions
- Use skills/ for reusable knowledge

## Example CLAUDE.md

```markdown
# E-commerce Platform

## Overview

Full-stack e-commerce platform built with Next.js and Stripe.

## Architecture

### Frontend
- Next.js App Router for SSR/SSG
- React Server Components for data fetching
- Tailwind CSS for styling

### Backend
- Next.js API routes
- Prisma ORM with PostgreSQL
- Redis for caching

### Key Patterns
- Repository pattern for data access
- Server Actions for mutations
- Optimistic updates for UX

## Commands

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Development server |
| `npm run db:push` | Push schema changes |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run test suite |

## Directory Structure

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Shared utilities
- `prisma/` - Database schema
- `tests/` - Test files

## Conventions

- Use Server Components by default
- Client components only for interactivity
- Colocate tests with source files
- Use absolute imports from `@/`

## Environment

Required environment variables in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection
- `STRIPE_SECRET_KEY` - Stripe API key
- `NEXT_PUBLIC_STRIPE_KEY` - Public Stripe key
```

## Directory-Specific Memory

Create CLAUDE.md in subdirectories for localized context:

```markdown
# components/CLAUDE.md

## Component Guidelines

This directory contains React components.

### Structure
Each component folder contains:
- `index.tsx` - Component implementation
- `styles.ts` - Styled components
- `types.ts` - TypeScript interfaces
- `Component.test.tsx` - Tests

### Naming
- PascalCase for component names
- Match folder name to component name
```

## Memory Hierarchy

Claude Code reads memory in this order:

1. `~/.claude/CLAUDE.md` (personal preferences)
2. `CLAUDE.md` (project root)
3. `*/CLAUDE.md` (parent directories)
4. `./CLAUDE.md` (current directory)

Later files add to, don't replace, earlier context.

## Integration with Rules

**CLAUDE.md** = Core project context (always loaded)

**.claude/rules/** = Conditional conventions (path-based)

Use CLAUDE.md for:

- Project overview
- Architecture decisions
- Key commands

Use rules for:

- Language-specific conventions
- Directory-specific guidelines
- File pattern rules

## Best Practices

1. **Keep it focused**: Only essential, stable context
2. **Update regularly**: Reflect current architecture
3. **Avoid duplication**: Don't repeat README/docs
4. **Think "what would confuse Claude?"**: Add that context
5. **Use sections**: Make content scannable
6. **Link to details**: Reference files for more info

## Resources

- [CLAUDE.md Documentation](https://code.claude.com/docs/en/claude-md)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [Rules vs Memory Guide](https://code.claude.com/docs/en/rules)
