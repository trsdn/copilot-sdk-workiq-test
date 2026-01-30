---
name: skill-builder
description: Create and maintain Agent Skills for Claude Code and GitHub Copilot. Use this skill when setting up new skills, skill directories, or SKILL.md files. Works with both platforms using the shared skill format.
---

# Skill Builder

This skill helps you create, organize, and maintain Agent Skills following the [Agent Skills specification](https://agentskills.io/specification). Skills work across both Claude Code and GitHub Copilot.

## When to Use This Skill

- Creating a new skill
- Setting up a skill directory structure
- Writing SKILL.md files with proper frontmatter
- Adding supporting files (scripts, references, assets)

## Skill Locations

### Shared Skills (recommended)

Place skills in `.claude/skills/` — readable by **both** Claude Code and GitHub Copilot:

| Scope | Location | Availability |
|-------|----------|--------------|
| Project | `.claude/skills/<skill-name>/SKILL.md` | This project, both platforms |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | All your projects, Claude Code |

### Platform-Specific Locations

Only use these for skills with platform-specific features:

| Platform | Project Path | Personal Path |
|----------|--------------|---------------|
| Copilot-only | `.github/skills/<skill-name>/` | `~/.copilot/skills/<skill-name>/` |
| Claude-only | `.claude/skills/<skill-name>/` | `~/.claude/skills/<skill-name>/` |

> **Principle:** Put shared skills in `.claude/skills/` (readable by both platforms). Only use `.github/skills/` for Copilot-specific features (like `gh agent-task` commands). Use Claude-specific frontmatter in the shared location for Claude-only features.

## SKILL.md Format

### Required Frontmatter (Both Platforms)

```yaml
---
name: skill-name
description: What this skill does and when to use it (max 1024 chars)
---
```

### Claude Code-Specific Frontmatter

These fields work only in Claude Code:

```yaml
---
name: skill-name
description: What this skill does and when to use it
license: Apache-2.0
disable-model-invocation: true  # Only manual /skill-name invocation
user-invocable: false           # Only Claude can invoke
allowed-tools: Read, Grep, Glob, Bash
model: sonnet                   # sonnet, opus, haiku, or inherit
context: fork                   # Run in subagent
agent: Explore                  # Which subagent to use
---
```

### Name Requirements

- 1-64 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens
- Must match parent directory name

## Directory Structure

```
skill-name/
├── SKILL.md           # Required: main instructions
├── scripts/           # Optional: executable code
│   └── helper.py
├── references/        # Optional: documentation
│   └── REFERENCE.md
└── assets/            # Optional: templates, resources
    └── template.md
```

## Skill Content Types

### Reference Content (Guidelines)

For background knowledge Claude applies to work:

```yaml
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

### Task Content (Workflows)

For step-by-step actions:

```yaml
---
name: deploy
description: Deploy the application to production
context: fork                    # Claude-only: runs in subagent
disable-model-invocation: true   # Claude-only: manual invocation
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

## Claude Code Advanced Features

### Dynamic Context Injection

Use `!`command`` syntax to inject shell output (Claude Code only):

```markdown
## Current State
- Git status: !`git status --short`
- Branch: !`git branch --show-current`
```

### Subagent Execution

Add `context: fork` to run in isolated subagent (Claude Code only):

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---
```

### Preloaded Skills in Subagents

Reference skills in subagent `skills:` field (Claude Code only):

```yaml
# In .claude/agents/api-developer.md
---
name: api-developer
description: Implement API endpoints
skills:
  - api-conventions
  - error-handling-patterns
---
```

## Best Practices

### Writing Effective Descriptions

The description determines when the agent loads your skill. Be specific:

✅ Good: "Debug GitHub Actions workflows by analyzing logs, identifying common failures, and suggesting fixes"

❌ Bad: "Help with GitHub Actions"

### Keeping Skills Focused

- One skill = one capability or workflow
- Avoid kitchen-sink skills that try to do everything
- Compose multiple focused skills for complex workflows

### Managing Skill Size

1. **Keep SKILL.md under 500 lines** - Move detailed reference to separate files
2. **Use progressive disclosure** - Only load content when needed
3. **Reference files from SKILL.md** - So the agent knows what's available

### Security Considerations

- Review shared skills before using them
- Be cautious with skills that run shell commands
- Use tool controls for script execution

## Example: Create a New Skill

```bash
# Create skill directory (shared location)
mkdir -p .claude/skills/my-skill

# Create SKILL.md
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Description of what this skill does and when to use it
---

# My Skill

## Instructions
Step-by-step guidance for the agent to follow...

## Examples
Concrete examples of using this skill...
EOF
```

## Resources

- [Agent Skills Specification](https://agentskills.io/specification)
- [Agent Skills in VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Claude Code Skills Guide](https://code.claude.com/docs/en/skills)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
