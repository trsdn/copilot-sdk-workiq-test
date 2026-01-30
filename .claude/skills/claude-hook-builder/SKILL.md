---
name: claude-hook-builder
description: Create and configure hooks for Claude Code. Use this skill when setting up lifecycle automation, validating tool usage, injecting context, or automating workflows with PreToolUse, PostToolUse, and other hook events.
---

# Claude Code Hook Builder

This skill helps you create and configure hooks for Claude Code lifecycle automation.

## When to Use This Skill

- Automating actions before or after tool execution
- Validating commands or file changes
- Injecting context at session start
- Creating custom notifications
- Controlling permissions programmatically

## Hook Configuration Locations

| Scope | Location | Purpose |
| ----- | -------- | ------- |
| User | `~/.claude/settings.json` | Personal hooks (all projects) |
| Project | `.claude/settings.json` | Team hooks (committed) |
| Local | `.claude/settings.local.json` | Personal project hooks (gitignored) |
| Skill | Frontmatter in `SKILL.md` | Skill-scoped hooks |
| Agent | Frontmatter in agent `.md` | Agent-scoped hooks |

## Hook Lifecycle

```text
SessionStart → UserPromptSubmit → PreToolUse → PermissionRequest
     ↓                                              ↓
SessionEnd  ←  Stop  ←  PostToolUse / PostToolUseFailure
```

## Hook Events

| Event | When It Fires | Supports Matchers |
| ----- | ------------- | ----------------- |
| `SessionStart` | Session begins or resumes | Yes (`startup`, `resume`, `clear`, `compact`) |
| `UserPromptSubmit` | User submits a prompt | No |
| `PreToolUse` | Before tool execution | Yes (tool names) |
| `PermissionRequest` | Permission dialog appears | Yes (tool names) |
| `PostToolUse` | After tool succeeds | Yes (tool names) |
| `PostToolUseFailure` | After tool fails | Yes (tool names) |
| `SubagentStart` | Subagent spawns | No |
| `SubagentStop` | Subagent finishes | No |
| `Stop` | Claude finishes responding | No |
| `PreCompact` | Before context compaction | Yes (`manual`, `auto`) |
| `Setup` | With `--init` or `--maintenance` | Yes (`init`, `maintenance`) |
| `SessionEnd` | Session terminates | No |
| `Notification` | Notifications sent | Yes (`permission_prompt`, `idle_prompt`) |

## Configuration Structure

### Basic Hook Format

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns

- Simple string: `Write` matches only the Write tool
- Regex: `Edit|Write` or `Notebook.*`
- Wildcard: `*` or `""` matches all tools
- MCP tools: `mcp__server__tool` or `mcp__memory__.*`

## Hook Types

### Command Hooks

Execute bash commands:

```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lint.sh",
  "timeout": 30
}
```

### Prompt Hooks

Use LLM for context-aware decisions (Stop/SubagentStop only):

```json
{
  "type": "prompt",
  "prompt": "Evaluate if Claude should stop: $ARGUMENTS. Check if all tasks are complete.",
  "timeout": 30
}
```

## Common Tool Matchers

| Matcher | Tools Matched |
| ------- | ------------- |
| `Bash` | Shell commands |
| `Read` | File reading |
| `Write` | File writing |
| `Edit` | File editing |
| `Glob` | File pattern matching |
| `Grep` | Content search |
| `Task` | Subagent tasks |
| `WebFetch` | Web fetching |
| `WebSearch` | Web searching |

## Example Hooks

### Auto-Format on Save

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format.sh"
          }
        ]
      }
    ]
  }
}
```

### Validate Bash Commands

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ]
  }
}
```

### Inject Context at Session Start

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Current branch:' $(git branch --show-current)"
          }
        ]
      }
    ]
  }
}
```

### Notification Alerts

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude needs permission\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

## Hooks in Skills and Agents

### Skill Frontmatter

```yaml
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
          once: true
---
```

### Agent Frontmatter

```yaml
---
name: code-reviewer
description: Review code changes
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

## Hook Input

Hooks receive JSON via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

## Hook Output

### Exit Codes

| Code | Meaning |
| ---- | ------- |
| `0` | Success, continue |
| `2` | Block action, show stderr to Claude |
| Other | Non-blocking error |

### JSON Output (Advanced)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Auto-approved documentation file"
  }
}
```

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `CLAUDE_PROJECT_DIR` | Absolute path to project root |
| `CLAUDE_ENV_FILE` | File for persisting env vars (SessionStart only) |
| `CLAUDE_CODE_REMOTE` | `"true"` if running in web environment |

## Creating Hook Scripts

### Python Validator Example

```python
#!/usr/bin/env python3
import json
import sys

input_data = json.load(sys.stdin)
command = input_data.get("tool_input", {}).get("command", "")

# Block dangerous commands
if "rm -rf /" in command:
    print("Blocked dangerous command", file=sys.stderr)
    sys.exit(2)

sys.exit(0)
```

### Shell Script Example

```bash
#!/bin/bash
set -e

# Read input
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Run linter on changed file
if [[ -n "$FILE_PATH" && -f "$FILE_PATH" ]]; then
  npx eslint --fix "$FILE_PATH" 2>&1 || true
fi

exit 0
```

## Best Practices

1. **Use absolute paths**: Reference scripts with `$CLAUDE_PROJECT_DIR`
2. **Set timeouts**: Prevent hung hooks from blocking Claude
3. **Handle errors gracefully**: Use exit code 0 for non-critical issues
4. **Quote variables**: Always use `"$VAR"` not `$VAR`
5. **Test hooks manually**: Run commands outside Claude first
6. **Keep hooks fast**: Slow hooks degrade the experience

## Security Considerations

- Hooks execute with your user permissions
- Validate and sanitize all input data
- Block path traversal (`..` in file paths)
- Skip sensitive files (`.env`, keys, secrets)
- Review hook configurations before enabling

## Debugging

1. Run `/hooks` to see registered hooks
2. Use `claude --debug` for execution details
3. Test hook commands manually first
4. Check script permissions (`chmod +x`)

## Resources

- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Settings Reference](https://code.claude.com/docs/en/settings)
