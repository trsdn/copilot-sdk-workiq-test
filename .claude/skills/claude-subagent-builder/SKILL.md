---
name: claude-subagent-builder
description: Create custom subagents for Claude Code. Use this skill when setting up new subagents in .claude/agents/, defining specialized agent roles, or configuring agent capabilities with preloaded skills.
---

# Claude Code Subagent Builder

This skill helps you create and configure custom subagents for Claude Code.

## When to Use This Skill

- Creating a specialized agent for a specific task
- Configuring agent capabilities and preloaded skills
- Setting up agent roles for team workflows
- Extending the built-in agent system

## Subagent Locations

| Scope | Location | Availability |
| ----- | -------- | ------------ |
| Project | `.claude/agents/<name>.md` | This project only |
| Personal | `~/.claude/agents/<name>.md` | All your projects |

## Subagent Format

### Basic Structure

```yaml
---
name: agent-name
description: What this agent specializes in
---

# Agent Instructions

Detailed instructions for this agent's behavior...
```

### Full Frontmatter Options

```yaml
---
name: api-developer
description: Specialized agent for API development
skills:
  - api-conventions
  - error-handling
model: opus          # sonnet (default), opus, haiku
allowed-tools: Read, Write, Bash, Grep, Glob
---
```

## Name Requirements

- 1-64 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens
- Must match the filename (without `.md`)

## Built-in Subagents

Claude Code includes these default subagents:

| Agent | Purpose |
| ----- | ------- |
| `Plan` | Research and outline multi-step plans |
| `Explore` | Deep research into codebases |
| `Review` | Code review and feedback |

## Creating Custom Subagents

### Example: Frontend Developer

```markdown
---
name: frontend-developer
description: Specialized in React, TypeScript, and modern CSS
skills:
  - react-patterns
  - accessibility-guidelines
---

# Frontend Developer Agent

You are a frontend development specialist focusing on:

## Expertise Areas

- React component architecture
- TypeScript best practices
- CSS-in-JS and modern styling
- Accessibility (WCAG compliance)
- Performance optimization

## Approach

1. **Component Design**: Create reusable, composable components
2. **Type Safety**: Use TypeScript strictly, avoid `any`
3. **Accessibility**: Include ARIA labels, keyboard navigation
4. **Testing**: Write component tests with Testing Library
```

### Example: Security Auditor

```markdown
---
name: security-auditor
description: Reviews code for security vulnerabilities
model: opus
context: fork
---

# Security Auditor Agent

Analyze code for security vulnerabilities and provide remediation guidance.

## Security Checklist

- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Authentication/authorization
- [ ] Secrets management
- [ ] Dependency vulnerabilities

## Analysis Process

1. Identify attack surfaces
2. Check for common vulnerabilities (OWASP Top 10)
3. Review authentication flows
4. Verify input sanitization
5. Assess dependency security
6. Document findings with severity ratings
```

## Preloading Skills

Use the `skills:` field to preload skills into the agent's context:

```yaml
---
name: api-developer
description: Backend API development specialist
skills:
  - api-conventions
  - database-patterns
  - error-handling
---
```

Skills are loaded when the agent starts, providing immediate context.

## Invoking Subagents

### From Claude Code

```
Use the api-developer agent to implement the new endpoint
```

### From Skills

```yaml
---
name: deploy
context: fork
agent: devops
---
```

## Best Practices

1. **Single Responsibility**: Each agent should have one clear focus
2. **Clear Instructions**: Write detailed, specific guidance
3. **Preload Relevant Skills**: Include skills that support the agent's role
4. **Use Appropriate Model**: Choose model tier based on task complexity
5. **Consider Context**: Use `context: fork` for isolated research tasks

## Example: Create a New Subagent

```bash
# Create agent file
cat > .claude/agents/code-reviewer.md << 'EOF'
---
name: code-reviewer
description: Reviews pull requests and provides constructive feedback
skills:
  - code-style-guidelines
---

# Code Review Agent

You are a thorough but constructive code reviewer.

## Review Focus

- Code correctness and logic
- Performance implications
- Security considerations
- Code style and readability
- Test coverage

## Feedback Style

- Be specific and actionable
- Explain the "why" behind suggestions
- Acknowledge good patterns
- Prioritize critical issues
EOF
```

## Resources

- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/agents)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Claude Model Selection Guide](https://docs.anthropic.com/en/docs/models)
