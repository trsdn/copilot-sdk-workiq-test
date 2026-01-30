---
name: tdd-workflow
description: Test-Driven Development workflow - write tests before implementation. Use when implementing features with acceptance criteria, when user says "TDD", "test first", "write tests for this issue", or when starting implementation of a user story.
---

# TDD Workflow Skill

Write failing tests first, then implement code to make them pass.

## When to Use

- Implementing a user story with acceptance criteria
- User explicitly asks for TDD approach
- Building new features with clear requirements
- Refactoring with safety net

## When NOT to Use

- Exploratory prototyping
- UI/visual changes (use visual testing instead)
- One-off scripts
- Documentation changes

## The TDD Cycle

```
┌─────────────────────────────────────────────┐
│  1. RED    │  Write a failing test          │
├─────────────────────────────────────────────┤
│  2. GREEN  │  Write minimal code to pass    │
├─────────────────────────────────────────────┤
│  3. REFACTOR │  Improve code, keep tests green │
└─────────────────────────────────────────────┘
         ↑                                    │
         └────────────────────────────────────┘
```

## Workflow Steps

### Step 1: Parse Acceptance Criteria

Convert each Given/When/Then into a test case:

```markdown
## Acceptance Criteria
- [ ] **Given** user is logged in, **when** they click logout, **then** session is destroyed
```

Becomes:

```python
def test_logout_destroys_session():
    # Given: user is logged in
    user = create_logged_in_user()
    assert user.session is not None
    
    # When: they click logout
    response = client.post('/logout')
    
    # Then: session is destroyed
    assert response.status_code == 200
    assert user.session is None
```

### Step 2: Write Test File First

Create test file before implementation:

```
# For feature in src/auth/logout.py
# Create tests/auth/test_logout.py FIRST
```

**Test file naming conventions:**

| Language | Pattern | Example |
|----------|---------|---------|
| Python | `test_<module>.py` | `test_logout.py` |
| JavaScript | `<module>.test.js` | `logout.test.js` |
| TypeScript | `<module>.spec.ts` | `logout.spec.ts` |
| Go | `<module>_test.go` | `logout_test.go` |

### Step 3: Run Test (Expect Failure)

```bash
# Python
pytest tests/auth/test_logout.py -v

# JavaScript
npm test -- --testPathPattern=logout

# Go
go test ./auth/... -run TestLogout -v
```

**Expected output:** RED (failing test, likely import error or missing function)

### Step 4: Implement Minimum Code

Write just enough to make the test pass:

```python
# src/auth/logout.py
def logout(user):
    user.session = None
    return {"status": "ok"}
```

### Step 5: Run Test (Expect Pass)

```bash
pytest tests/auth/test_logout.py -v
```

**Expected output:** GREEN (all tests pass)

### Step 6: Refactor

Improve code quality while keeping tests green:

- Extract helper functions
- Improve naming
- Remove duplication
- Add type hints

### Step 7: Repeat for Next Criterion

Move to next acceptance criterion, repeat cycle.

## Test Structure Template

### Python (pytest)

```python
"""Tests for [feature] - Issue #XXX"""
import pytest
from src.module import function_under_test


class TestFeatureName:
    """Tests for [acceptance criteria group]"""
    
    @pytest.fixture
    def setup_data(self):
        """Given: [precondition]"""
        return create_test_data()
    
    def test_when_action_then_result(self, setup_data):
        """
        Given: [precondition]
        When: [action]
        Then: [expected result]
        """
        # Arrange (Given)
        data = setup_data
        
        # Act (When)
        result = function_under_test(data)
        
        # Assert (Then)
        assert result == expected_value
    
    def test_edge_case(self, setup_data):
        """Edge case: [description]"""
        pass
```

### JavaScript/TypeScript (Jest)

```typescript
/**
 * Tests for [feature] - Issue #XXX
 */
import { functionUnderTest } from '../src/module';

describe('FeatureName', () => {
  describe('when [action]', () => {
    it('should [expected result] given [precondition]', () => {
      // Given
      const input = setupTestData();
      
      // When
      const result = functionUnderTest(input);
      
      // Then
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Go

```go
// feature_test.go
package auth

import (
    "testing"
)

func TestFeatureName(t *testing.T) {
    t.Run("should [result] when [action] given [precondition]", func(t *testing.T) {
        // Given
        input := setupTestData()
        
        // When
        result := FunctionUnderTest(input)
        
        // Then
        if result != expected {
            t.Errorf("got %v, want %v", result, expected)
        }
    })
}
```

## Traceability

Link tests to issues:

```python
# tests/auth/test_logout.py

"""
Tests for logout functionality.

Related Issues:
- Implements: #123 (User Story: Session Management)
- Fixes: #456 (Bug: Session not cleared on logout)
"""

@pytest.mark.issue(123)  # if using pytest-markers
def test_logout_clears_session():
    pass
```

## Common Patterns

### Testing Errors

```python
def test_logout_without_session_raises_error():
    """Given user has no session, when logout called, then raise error"""
    user = User(session=None)
    
    with pytest.raises(NoSessionError):
        logout(user)
```

### Testing Async Code

```python
@pytest.mark.asyncio
async def test_async_logout():
    user = await create_async_user()
    result = await async_logout(user)
    assert result.success
```

### Testing API Endpoints

```python
def test_logout_endpoint(client):
    # Given: logged in user
    client.login(test_user)
    
    # When: POST /logout
    response = client.post('/logout')
    
    # Then: 200 OK and session cookie cleared
    assert response.status_code == 200
    assert 'session' not in response.cookies
```

## Checklist Before Implementation

- [ ] All acceptance criteria have corresponding tests
- [ ] Tests are in correct location (`tests/` mirror of `src/`)
- [ ] Test file created before implementation file
- [ ] Tests run and fail for the right reason
- [ ] Edge cases identified and have tests

## Related Skills

- `requirements-engineer` — Create well-structured acceptance criteria
- `dev-workflow` — Full development workflow
- `testing-conventions` — Test file organization
