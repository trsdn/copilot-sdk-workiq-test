---
name: requirements-engineer
description: Help gather, structure, and create GitHub issues from requirements. Use when users describe a feature idea, want to write a user story, or need help formulating acceptance criteria. Triggers on "create a user story", "write requirements", "I need a feature for...", or "help me define acceptance criteria".
---

# Requirements Engineer Skill

Transform vague feature ideas into well-structured, testable user stories with proper acceptance criteria.

## When to Use

- User describes a feature idea informally
- Creating user story issues from requirements docs
- Need help writing acceptance criteria
- Converting meeting notes to trackable issues
- Breaking down epics into stories

## When NOT to Use

- Bug reports (use bug_report template)
- Pure technical tasks without user value
- Already well-defined issues

## Workflow

### 1. Gather Context

Ask clarifying questions to understand:

```
1. WHO is the user? (role, persona, skill level)
2. WHAT do they want to do? (the capability)
3. WHY do they need it? (the business value)
4. HOW will we know it works? (success criteria)
```

### 2. Structure the User Story

Format as:

```markdown
As a **[specific user role]**,
I want **[clear, specific capability]**,
So that **[measurable benefit/value]**.
```

**Good Example:**

```markdown
As a **project maintainer**,
I want **automatic PR title validation**,
So that **all PRs follow conventional commit format for changelog generation**.
```

**Bad Example:**

```markdown
As a user, I want better UX, so that things are easier.
```

### 3. Write Acceptance Criteria

Use Given/When/Then (Gherkin) format for testability:

```markdown
- [ ] **Given** [precondition/context],
      **when** [action/trigger],
      **then** [observable outcome].
```

**Tips:**

- Each criterion should be independently testable
- Include both happy path and edge cases
- Be specific about expected behavior
- Aim for 3-7 criteria per story

**Example:**

```markdown
- [ ] **Given** a PR is opened with title "fix bug",
      **when** the CI runs,
      **then** the check fails with message "Title must follow conventional commit format".

- [ ] **Given** a PR is opened with title "fix: resolve login issue",
      **when** the CI runs,
      **then** the check passes.

- [ ] **Given** a PR title check fails,
      **when** the contributor views the check details,
      **then** they see a link to the commit convention docs.
```

### 4. Identify Dependencies & Scope

Ask about:

- What's explicitly OUT of scope?
- Any blockers or dependencies?
- Related issues to link?

### 5. Create the Issue

Use the MCP GitHub tools:

```
mcp_github_create_issue with:
- owner: <repo-owner>
- repo: <repo-name>
- title: "[Story] <concise description>"
- body: <formatted user story>
- labels: ["user-story", "needs-refinement"]
```

## Issue Body Template

```markdown
## User Story

As a **[user role]**,
I want **[capability]**,
So that **[benefit]**.

## Acceptance Criteria

- [ ] **Given** [context], **when** [action], **then** [result]
- [ ] **Given** [context], **when** [action], **then** [result]
- [ ] **Given** [context], **when** [action], **then** [result]

## Technical Notes

- [Implementation hints]
- [API/DB considerations]
- [Performance requirements]

## Out of Scope

- [What this story does NOT include]

## Dependencies

- Blocked by: #XX
- Related: #YY

---

### Definition of Ready
- [x] Acceptance criteria are testable
- [x] Story fits in one sprint
- [ ] Dependencies identified
- [ ] Technical approach agreed
```

## INVEST Criteria Checklist

Validate stories against INVEST:

| Criterion | Question | ✓ |
|-----------|----------|---|
| **I**ndependent | Can be developed without other stories? | |
| **N**egotiable | Details can be discussed? | |
| **V**aluable | Delivers user/business value? | |
| **E**stimable | Team can estimate effort? | |
| **S**mall | Fits in one sprint? | |
| **T**estable | Clear pass/fail criteria? | |

## Splitting Large Stories

If story is too big (XL), split by:

1. **Workflow steps** — Login → Profile → Settings
2. **Data variations** — One payment method → All payment methods
3. **Operations** — Create → Read → Update → Delete
4. **Platforms** — Web → Mobile → API
5. **User roles** — Admin → Regular user → Guest

## Example Conversation

**User:** "We need to add dark mode to the app"

**Agent Response:**

Let me help structure this as a user story. A few questions:

1. **Who** primarily benefits? (all users, users with visual sensitivities, night workers?)
2. **Where** does dark mode apply? (entire app, specific pages, system preference?)
3. **How** is it toggled? (manual switch, follows OS setting, both?)

Based on typical requirements:

```markdown
## User Story

As a **user with light sensitivity or who works in low-light environments**,
I want **a dark mode theme option**,
So that **I can use the app comfortably without eye strain**.

## Acceptance Criteria

- [ ] **Given** dark mode is enabled, **when** viewing any page, **then** background is dark (#1a1a1a) and text is light (#f0f0f0)
- [ ] **Given** system preference is set to dark, **when** user opens app for first time, **then** dark mode is auto-enabled
- [ ] **Given** user toggles theme in settings, **when** preference is saved, **then** it persists across sessions
- [ ] **Given** dark mode is active, **when** viewing images, **then** they display correctly without inverted colors
```

Shall I create this issue?

## Related Skills

- `git-issues` — Create/manage GitHub issues
- `tdd-workflow` — Write tests from acceptance criteria
- `dev-workflow` — Full requirements-to-implementation cycle
