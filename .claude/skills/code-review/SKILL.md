---
name: code-review
description: Perform structured code reviews with security, performance, and style checks. Use when reviewing PRs, auditing code changes, or when the user asks for a code review.
---

# Code Review

Perform thorough, structured code reviews focusing on security, performance, maintainability, and correctness.

## Review Process

### 1. Understand the Change

Before reviewing, gather context:

```bash
# View the diff
git diff main...HEAD

# Or for a specific PR
gh pr diff <number>
```

### 2. Review Checklist

#### Security 🔒

- [ ] No hardcoded secrets, API keys, or passwords
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Authentication/authorization checks present
- [ ] Sensitive data not logged
- [ ] Dependencies are up to date (no known CVEs)

#### Performance ⚡

- [ ] No N+1 query patterns
- [ ] Expensive operations not in loops
- [ ] Appropriate caching where needed
- [ ] No memory leaks (event listeners cleaned up)
- [ ] Lazy loading for large data sets
- [ ] Database indexes for queried fields

#### Code Quality 📐

- [ ] Single responsibility principle
- [ ] DRY (Don't Repeat Yourself)
- [ ] Meaningful variable/function names
- [ ] Functions are reasonably sized (< 50 lines)
- [ ] No dead code or commented-out code
- [ ] Error handling is comprehensive

#### Testing 🧪

- [ ] New code has tests
- [ ] Edge cases covered
- [ ] Tests are readable and maintainable
- [ ] Mocks are appropriate (not over-mocked)

#### Documentation 📝

- [ ] Public APIs documented
- [ ] Complex logic has comments
- [ ] README updated if needed
- [ ] Breaking changes documented

### 3. Comment Format

Use this format for review comments:

```text
**[SEVERITY]** Brief description

**Location:** file.ts:42

**Issue:**
Explanation of the problem.

**Suggestion:**
// Recommended fix code here

**Why:**
Explanation of why this matters.
```

Severity levels:

- 🔴 **BLOCKER** — Must fix before merge
- 🟠 **MAJOR** — Should fix, significant issue
- 🟡 **MINOR** — Nice to fix, minor issue
- 🔵 **SUGGESTION** — Optional improvement
- 💚 **PRAISE** — Highlight good code

### 4. Common Patterns to Flag

#### Security Issues

```typescript
// ❌ SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Parameterized
const query = `SELECT * FROM users WHERE id = $1`;
await db.query(query, [userId]);
```

```typescript
// ❌ XSS Vulnerability
element.innerHTML = userInput;

// ✅ Safe
element.textContent = userInput;
```

#### Performance Issues

```typescript
// ❌ N+1 Query
for (const user of users) {
  const orders = await getOrdersForUser(user.id);
}

// ✅ Batch query
const orders = await getOrdersForUsers(users.map(u => u.id));
```

```typescript
// ❌ Expensive in loop
for (const item of items) {
  const config = JSON.parse(fs.readFileSync('config.json'));
}

// ✅ Read once
const config = JSON.parse(fs.readFileSync('config.json'));
for (const item of items) {
  // use config
}
```

#### Code Smells

```typescript
// ❌ Magic numbers
if (status === 3) { ... }

// ✅ Named constants
const STATUS_APPROVED = 3;
if (status === STATUS_APPROVED) { ... }
```

```typescript
// ❌ Deep nesting
if (a) {
  if (b) {
    if (c) {
      doSomething();
    }
  }
}

// ✅ Early returns
if (!a) return;
if (!b) return;
if (!c) return;
doSomething();
```

### 5. Generate Review Summary

After reviewing, provide a summary:

```markdown
## Review Summary

**Overall:** ✅ Approved / ⚠️ Changes Requested / ❌ Needs Work

### Stats
- Files reviewed: X
- Issues found: X (Y blockers, Z major)

### Highlights
- 💚 Good use of TypeScript generics
- 💚 Comprehensive error handling

### Required Changes
1. 🔴 Fix SQL injection in `user.service.ts:42`
2. 🟠 Add input validation in `api.controller.ts:15`

### Suggestions
1. 🔵 Consider extracting utility function
2. 🔵 Add JSDoc comments for public methods
```

## Quick Commands

| Say This | Action |
|----------|--------|
| "review this PR" | Full review of current PR |
| "security review" | Focus on security issues |
| "performance review" | Focus on performance |
| "quick review" | High-level review only |
