---
name: structure-conventions
description: Comprehensive conventions for repository structure including skills, agents, tests, documentation, and source code organization. Use when setting up new projects, reviewing structure, or answering "where should this go?"
---

# Repository Structure Conventions

This is the **master reference** for project structure decisions. Use this when:

- Setting up a new project from this template
- Deciding where to put new files
- Reviewing project organization
- Onboarding new contributors

---

## Philosophy

This template follows these principles:

1. **Language/Framework Agnostic**: Works for TypeScript, Python, Go, Rust, or any stack
2. **Dual-platform AI Support**: Compatible with Claude Code and GitHub Copilot
3. **Self-documenting Layout**: Directory names convey purpose
4. **Minimal Nesting**: Prefer flat over deep hierarchies (max 3-4 levels)
5. **Convention over Configuration**: Consistent patterns reduce cognitive load
6. **Portability**: Components (skills, agents) can be copied between projects

---

## Template Project Structure

This is the canonical structure for projects using this template:

```
.
├── .claude/                    # Claude Code customizations
│   ├── agents/                 # Subagent definitions
│   ├── hooks/                  # Lifecycle hooks
│   ├── rules/                  # Conditional rules
│   ├── skills/                 # Reusable knowledge
│   └── settings.json           # Claude Code settings
├── .github/                    # GitHub + Copilot configuration
│   ├── agents/                 # Copilot agents
│   ├── prompts/                # Quick-access prompts
│   ├── skills/                 # Copilot-only skills
│   ├── workflows/              # CI/CD automation
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── copilot-instructions.md # Global Copilot rules
├── .collections/               # Curated skill bundles
├── .devcontainer/              # Dev container config
├── src/                        # Source code
├── tests/                      # Test suites
├── scripts/                    # Utility scripts
├── docs/                       # Extended documentation
├── CLAUDE.md                   # Project memory (Claude Code)
├── README.md                   # Project overview
├── QUICKSTART.md               # Getting started
├── CONTRIBUTING.md             # Contribution guide
├── CHANGELOG.md                # Version history
├── CODE_OF_CONDUCT.md          # Community standards
├── SECURITY.md                 # Security policy
└── <manifest>                  # package.json, pyproject.toml, etc.
```

---

## Skills Structure

### Standard Skill Layout

```
.claude/skills/<skill-name>/
├── SKILL.md                    # Required: Main skill definition
├── reference.md                # Optional: Extended documentation
├── examples.md                 # Optional: Usage examples
├── scripts/                    # Optional: Executable scripts
│   ├── helper.py
│   └── util.js
├── assets/                     # Optional: Images, fonts, templates
│   ├── fonts/
│   └── templates/
└── tests/                      # Optional: Skill-specific tests
    └── test_skill.py
```

### Skill File Conventions

| File | Purpose | Required |
|------|---------|----------|
| `SKILL.md` | Main skill with frontmatter | ✅ Yes |
| `reference.md` | Deep-dive documentation | No |
| `examples.md` | Usage examples and patterns | No |
| `scripts/` | Executable code the skill uses | No |
| `assets/` | Static resources (images, fonts) | No |
| `tests/` | Skill-specific test cases | No |

### Skill Naming Conventions

Use domain prefixes for discoverability:

| Prefix | Domain | Examples |
|--------|--------|----------|
| `git-` | Git/GitHub operations | `git-create-pr`, `git-release` |
| `doc-` | Documentation | `doc-readme`, `doc-adr`, `doc-changelog` |
| `web-` | Web development | `web-frontend-design`, `web-app-testing` |
| `claude-` | Claude Code specific | `claude-rule-builder`, `claude-mcp-config` |
| `copilot-` | GitHub Copilot specific | `copilot-setup-audit` |
| (none) | General/cross-domain | `pdf`, `xlsx`, `pptx` |

---

## Agents Structure

### Agent Placement

| Platform | Location | File Extension |
|----------|----------|----------------|
| Claude Code | `.claude/agents/` | `<name>.md` |
| GitHub Copilot | `.github/agents/` | `<name>.agent.md` |

### Agent File Structure

Agents should be single files, NOT directories:

```
.claude/agents/
├── code-reviewer.md            # Simple agent
├── release-manager.md
└── researcher.md

.github/agents/
├── code-reviewer.agent.md      # Copilot equivalent
└── researcher.agent.md
```

### When to Create an Agent vs a Skill

| Use Agent When | Use Skill When |
|----------------|----------------|
| Defining a persona/role | Defining reusable knowledge |
| Orchestrating multiple skills | Teaching a specific technique |
| Specialized subagent behavior | Cross-agent capability |
| Platform-specific workflow | Portable documentation |

---

## Rules Structure (Claude Code)

```
.claude/rules/
├── agent-conventions.md        # Agent behavior rules
├── skill-conventions.md        # Skill authoring rules
├── typescript.md               # TypeScript coding standards
├── python.md                   # Python coding standards
├── testing.md                  # Testing requirements
└── <domain>.md                 # Domain-specific rules
```

### Rule File Pattern

```yaml
---
paths:
  - "**/*.ts"                   # Apply to TypeScript files
  - "**/*.tsx"
---

# Rule content here
```

---

## Documentation Structure

### Root-Level Docs

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Project overview, badges, links | Everyone |
| `QUICKSTART.md` | 5-minute getting started | New users |
| `CONTRIBUTING.md` | How to contribute | Contributors |
| `CHANGELOG.md` | Version history | Users/Devs |
| `SECURITY.md` | Security policy | Security researchers |
| `CODE_OF_CONDUCT.md` | Community standards | Community |
| `CLAUDE.md` | Project memory for Claude | Claude Code |

### Extended Documentation

For complex projects, use a `docs/` directory:

```
docs/
├── README.md                   # Docs index
├── architecture/               # System design
│   ├── overview.md
│   └── decisions/              # ADRs
│       ├── 001-use-typescript.md
│       └── 002-skill-structure.md
├── guides/                     # How-to guides
│   ├── creating-skills.md
│   └── testing-workflows.md
├── api/                        # API documentation
│   └── reference.md
└── tutorials/                  # Step-by-step tutorials
    └── first-skill.md
```

---

## Source Code Structure (`src/`)

The `src/` directory contains your project's source code. Structure depends on your stack:

### TypeScript/JavaScript

```
src/
├── index.ts                    # Entry point
├── lib/                        # Core library code
│   ├── utils/                  # Utility functions
│   └── helpers/                # Helper modules
├── commands/                   # CLI commands (if CLI app)
├── components/                 # UI components (if frontend)
├── services/                   # Business logic / services
├── types/                      # Type definitions
│   └── index.d.ts
└── __tests__/                  # Co-located tests (optional)
```

### Python

```
src/
├── <package_name>/             # Main package
│   ├── __init__.py
│   ├── main.py                 # Entry point
│   ├── cli.py                  # CLI interface
│   ├── core/                   # Core business logic
│   │   ├── __init__.py
│   │   └── engine.py
│   ├── utils/                  # Utility modules
│   │   ├── __init__.py
│   │   └── helpers.py
│   └── models/                 # Data models
│       ├── __init__.py
│       └── schemas.py
└── py.typed                    # PEP 561 marker
```

### Go

```
src/                            # Or use root for Go
├── cmd/                        # CLI entry points
│   └── myapp/
│       └── main.go
├── internal/                   # Private packages
│   ├── config/
│   └── service/
├── pkg/                        # Public packages
│   └── api/
└── go.mod
```

### Multi-Language Projects

For monorepos or polyglot projects:

```
src/
├── backend/                    # Python/Go backend
│   └── ...
├── frontend/                   # TypeScript frontend
│   └── ...
├── shared/                     # Shared types/protos
│   └── ...
└── services/                   # Microservices
    ├── auth/
    └── api/
```

### When NOT to Use `src/`

- **Simple scripts**: Put in `scripts/` instead
- **CLI-only tools**: Can use root-level files
- **Library packages**: May use root with package manifest

---

## Tests Structure (`tests/`)

### Test Location Strategy

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Unit tests | `tests/unit/` | Fast, isolated function tests |
| Integration tests | `tests/integration/` | Cross-component tests |
| E2E tests | `tests/e2e/` | Full system tests |
| Fixtures | `tests/fixtures/` | Test data and mocks |
| Skill tests | `.claude/skills/<name>/tests/` | Skill-specific scripts |

### Standard Test Layout

```
tests/
├── conftest.py                 # Shared fixtures (pytest)
├── setup.ts                    # Test setup (vitest/jest)
├── unit/                       # Fast, isolated tests
│   ├── test_utils.py
│   ├── utils.test.ts
│   └── helpers_test.go
├── integration/                # Cross-component tests
│   ├── test_api.py
│   └── database.test.ts
├── e2e/                        # End-to-end tests
│   ├── test_full_workflow.py
│   └── user_journey.test.ts
└── fixtures/                   # Test data
    ├── sample_data.json
    ├── mock_responses/
    └── test_files/
        ├── sample.pdf
        └── test.xlsx
```

### Test File Naming

| Language | Convention | Example |
|----------|------------|---------|
| Python | `test_*.py` or `*_test.py` | `test_utils.py` |
| TypeScript/JS | `*.test.ts` or `*.spec.ts` | `utils.test.ts` |
| Go | `*_test.go` | `utils_test.go` |
| Rust | In `src/` with `#[cfg(test)]` | Module-level tests |

### Co-located vs Separate Tests

**Separate tests (`tests/`)** - Recommended for this template:

- Clear separation of concerns
- Easy to exclude from production builds
- Works with all languages

**Co-located tests** - Alternative for some projects:

```
src/
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts         # Test next to source
```

---

## Scripts Structure (`scripts/`)

The `scripts/` directory contains utility scripts that support development:

```
scripts/
├── README.md                   # Scripts documentation
├── setup/                      # Setup and installation
│   ├── install-deps.sh         # Install dependencies
│   ├── setup-dev.sh            # Dev environment setup
│   └── bootstrap.sh            # First-time project setup
├── build/                      # Build utilities
│   ├── build.sh                # Build script
│   └── bundle.sh               # Bundle for production
├── ci/                         # CI/CD helpers
│   ├── run-tests.sh            # Test runner
│   ├── lint.sh                 # Linting
│   └── release.sh              # Release automation
├── dev/                        # Development utilities
│   ├── seed-db.sh              # Seed development database
│   ├── generate-types.sh       # Generate types from schema
│   └── mock-server.sh          # Start mock server
└── common/                     # Shared utilities (skill scripts)
    ├── xml_utils.py            # Used by multiple skills
    └── file_helpers.js
```

### Script Guidelines

1. **Use descriptive names**: `install-deps.sh` not `install.sh`
2. **Include shebang**: `#!/bin/bash` or `#!/usr/bin/env python3`
3. **Add help flags**: Support `--help` for complex scripts
4. **Document in README**: List all scripts with descriptions
5. **Keep portable**: Avoid OS-specific commands when possible

### Skill Scripts vs Project Scripts

| Location | Purpose | Example |
|----------|---------|---------|
| `scripts/` | Project-wide utilities | `scripts/setup/install-deps.sh` |
| `.claude/skills/<name>/scripts/` | Skill-specific | `.claude/skills/pdf/scripts/fill_form.py` |
| `scripts/common/` | Shared by multiple skills | `scripts/common/xml_utils.py` |

---

## Collections Structure

```
.collections/
├── README.md                   # Collections overview
├── TEMPLATE.collection.yml     # Template for new collections
├── web-development.collection.yml
├── documentation.collection.yml
└── code-quality.collection.yml
```

---

## Workflows Structure

```
.github/workflows/
├── ci.yml                      # Main CI pipeline
├── validate.yml                # Validate markdown/yaml
├── validate-skills.yml         # Skill-specific validation
├── release.yml                 # Release automation
└── dependabot.yml              # Dependency updates
```

---

## Anti-Patterns to Avoid

### ❌ Deep Nesting

```
# BAD: Too deep
.claude/skills/category/subcategory/skill-name/version/SKILL.md

# GOOD: Flat with prefixes
.claude/skills/category-skill-name/SKILL.md
```

### ❌ Duplicate Agents

```
# BAD: Same agent in both locations
.claude/agents/reviewer.md
.github/agents/reviewer.agent.md   # Duplicated content!

# GOOD: Shared skill, platform-specific agents
.claude/skills/code-review/SKILL.md         # Shared knowledge
.claude/agents/reviewer.md                   # Claude wrapper
.github/agents/reviewer.agent.md             # Copilot wrapper
```

### ❌ Tests in Wrong Place

```
# BAD: Tests for skills in root tests/
tests/test_pdf_skill.py

# GOOD: Tests with their skill
.claude/skills/pdf/tests/test_pdf_skill.py
```

### ❌ Orphaned Scripts

```
# BAD: Scripts with no clear owner
scripts/random_helper.py

# GOOD: Scripts belong to skills
.claude/skills/pdf/scripts/fill_form.py
```

---

## Quick Reference

### File Placement

| "Where should I put..." | Location |
|-------------------------|----------|
| **Source Code** | |
| Application code | `src/` |
| Entry point | `src/index.ts`, `src/main.py`, `src/cmd/main.go` |
| Library code | `src/lib/` or `src/<package>/` |
| Type definitions | `src/types/` |
| **Tests** | |
| Unit tests | `tests/unit/` |
| Integration tests | `tests/integration/` |
| E2E tests | `tests/e2e/` |
| Test fixtures | `tests/fixtures/` |
| Skill-specific tests | `.claude/skills/<name>/tests/` |
| **Scripts** | |
| Setup scripts | `scripts/setup/` |
| Build scripts | `scripts/build/` |
| CI scripts | `scripts/ci/` |
| Dev utilities | `scripts/dev/` |
| Shared skill scripts | `scripts/common/` |
| **Documentation** | |
| Project docs | `docs/` |
| Architecture decisions | `docs/architecture/decisions/` |
| How-to guides | `docs/guides/` |
| API reference | `docs/api/` |
| Tutorials | `docs/tutorials/` |
| **AI Customizations** | |
| Skills (shared) | `.claude/skills/<prefix-name>/SKILL.md` |
| Skill scripts | `.claude/skills/<name>/scripts/` |
| Claude agents | `.claude/agents/<name>.md` |
| Copilot agents | `.github/agents/<name>.agent.md` |
| Claude rules | `.claude/rules/<name>.md` |
| Copilot prompts | `.github/prompts/<name>.prompt.md` |
| Skill collections | `.collections/<name>.collection.yml` |
| **GitHub** | |
| CI workflows | `.github/workflows/` |
| Issue templates | `.github/ISSUE_TEMPLATE/` |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` |

### Root-Level Files

| File | Purpose | Required |
|------|---------|----------|
| `README.md` | Project overview | ✅ Yes |
| `CLAUDE.md` | Claude project memory | ✅ Yes |
| `QUICKSTART.md` | Getting started guide | Recommended |
| `CONTRIBUTING.md` | Contribution guide | Recommended |
| `CHANGELOG.md` | Version history | Recommended |
| `CODE_OF_CONDUCT.md` | Community standards | Optional |
| `SECURITY.md` | Security policy | Optional |
| `LICENSE` | License file | Recommended |
| `package.json` / `pyproject.toml` | Project manifest | If applicable |
| `.gitignore` | Git ignore rules | ✅ Yes |
| `.editorconfig` | Editor settings | Optional |
