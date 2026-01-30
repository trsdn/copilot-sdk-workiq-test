---
name: dev-workflow
description: Complete development workflow from requirements to merged PR. Use when implementing a feature end-to-end, when user says "implement this issue", "work on #123", or wants guidance on the full development cycle.
---

# Development Workflow Skill

Orchestrates the complete journey from requirement to merged code.

## When to Use

- Starting work on a new feature/issue
- User says "implement issue #X"
- Need guidance on development process
- Ensuring nothing is missed in the cycle

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│  1. UNDERSTAND  │  Read issue, clarify requirements         │
│  2. PLAN        │  Break down, identify files, design       │
│  3. BRANCH      │  Create feature branch                    │
│  4. TEST        │  Write failing tests (TDD)                │
│  5. IMPLEMENT   │  Write code to pass tests                 │
│  6. VALIDATE    │  Run all checks locally                   │
│  7. COMMIT      │  Atomic commits with good messages        │
│  8. PR          │  Create PR linking to issue               │
│  9. REVIEW      │  Address feedback                         │
│  10. MERGE      │  Squash and merge                         │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Steps

### Step 1: Understand the Requirement

```bash
# Fetch issue details
gh issue view <issue-number>
```

**Checklist:**

- [ ] Read user story (As a... I want... So that...)
- [ ] Review all acceptance criteria
- [ ] Check linked issues/dependencies
- [ ] Understand what's out of scope
- [ ] Ask clarifying questions if needed

### Step 2: Plan the Implementation

Break down into sub-tasks:

```markdown
## Implementation Plan for #123

### Files to Create
- [ ] `src/auth/mfa.py` - MFA logic
- [ ] `tests/auth/test_mfa.py` - Tests

### Files to Modify
- [ ] `src/auth/login.py` - Add MFA check
- [ ] `src/api/routes.py` - Add MFA endpoints

### Dependencies
- [ ] Install `pyotp` for TOTP generation

### Order of Implementation
1. Write tests for MFA verification
2. Implement MFA verification logic
3. Add MFA to login flow
4. Add API endpoints
```

### Step 3: Create Feature Branch

```bash
# Branch naming: <type>/<issue>-<short-description>
git checkout -b feat/123-add-mfa-support

# Or for bugs:
git checkout -b fix/456-session-timeout
```

**Branch prefixes:**

| Prefix | Use Case |
|--------|----------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `refactor/` | Code improvement |
| `docs/` | Documentation |
| `test/` | Test additions |

### Step 4: Write Tests First (TDD)

Use the `tdd-workflow` skill:

```python
# tests/auth/test_mfa.py
"""Tests for MFA - Issue #123"""

class TestMFAVerification:
    def test_valid_totp_code_passes(self):
        """
        Given: user has MFA enabled with known secret
        When: valid TOTP code is submitted
        Then: verification succeeds
        """
        # Arrange
        secret = "JBSWY3DPEHPK3PXP"
        user = User(mfa_secret=secret)
        valid_code = generate_totp(secret)
        
        # Act
        result = verify_mfa(user, valid_code)
        
        # Assert
        assert result.success is True
```

Run tests (expect RED):

```bash
pytest tests/auth/test_mfa.py -v
```

### Step 5: Implement Code

Write minimal code to pass tests:

```python
# src/auth/mfa.py
import pyotp

def verify_mfa(user, code: str) -> Result:
    """Verify TOTP code for user."""
    totp = pyotp.TOTP(user.mfa_secret)
    if totp.verify(code):
        return Result(success=True)
    return Result(success=False, error="Invalid code")
```

Run tests (expect GREEN):

```bash
pytest tests/auth/test_mfa.py -v
```

### Step 6: Validate Locally

Run full validation before committing:

```bash
# Using Makefile
make validate

# Or manually:
npm run lint        # or: ruff check .
npm run test        # or: pytest
npm run build       # if applicable
```

**Checklist:**

- [ ] All tests pass
- [ ] Linter has no errors
- [ ] Type checks pass (if applicable)
- [ ] Build succeeds (if applicable)

### Step 7: Commit with Good Messages

Use conventional commits:

```bash
# Stage specific files
git add src/auth/mfa.py tests/auth/test_mfa.py

# Commit with conventional format
git commit -m "feat(auth): add MFA verification logic

- Implement TOTP verification using pyotp
- Add tests for valid/invalid codes
- Handle time-drift edge cases

Refs #123"
```

**Commit message format:**

```
<type>(<scope>): <short description>

[optional body with details]

[Refs|Fixes|Closes] #<issue>
```

### Step 8: Create Pull Request

```bash
# Push branch
git push -u origin feat/123-add-mfa-support

# Create PR using GitHub CLI
gh pr create --title "feat(auth): add MFA support" \
             --body "## Summary
Implements MFA verification for user login.

## Changes
- Added TOTP verification logic
- Integrated MFA check into login flow
- Added API endpoints for MFA setup

## Testing
- Unit tests for MFA verification
- Integration tests for login flow

## Checklist
- [x] Tests added
- [x] Lint passes
- [x] Docs updated

Closes #123"
```

**PR Title Format:**

```
<type>(<scope>): <description>
```

Must match conventional commit format for changelog generation.

### Step 9: Address Review Feedback

```bash
# Fetch latest and make changes
git fetch origin
git rebase origin/main

# Make requested changes
# ... edit files ...

# Commit fixes
git commit -m "fix: address review feedback

- Rename variable for clarity
- Add edge case test"

# Push updates
git push
```

### Step 10: Merge

After approval:

```bash
# Squash and merge via GitHub UI
# Or via CLI:
gh pr merge --squash --delete-branch
```

## Traceability Matrix

Maintain links throughout:

| Artifact | Links To | How |
|----------|----------|-----|
| Issue | Requirements doc | Body reference |
| Test | Issue | Docstring `Issue #123` |
| Commit | Issue | `Refs #123` in message |
| PR | Issue | `Closes #123` in body |
| Changelog | PR | Auto-generated |

## Quick Reference Commands

```bash
# Start new feature
git checkout -b feat/123-description
make test                          # Run tests
make lint                          # Check linting
git commit -m "feat: description"  # Commit
git push -u origin HEAD            # Push
gh pr create                       # Create PR

# Check issue
gh issue view 123

# Check PR status
gh pr status
gh pr checks
```

## Automation Helpers

### Pre-push Checklist (lefthook)

Already configured in `lefthook.yml`:

- Pre-commit: lint, format
- Commit-msg: validate conventional format
- Pre-push: run tests

### CI Validation

`.github/workflows/ci.yml` runs:

- Linting
- Tests
- Build (if configured)

## Related Skills

- `requirements-engineer` — Create well-structured issues
- `tdd-workflow` — Test-first development
- `git-create-pr` — PR creation with validation
- `git-workflow` — Git conventions
- `code-review` — Review PRs
