---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/test/**"
  - "**/tests/**"
  - "**/__tests__/**"
---

# Testing Conventions

When working with test files:

## Test Structure

- Arrange-Act-Assert (AAA) pattern
- One logical assertion per test
- Descriptive test names that explain the scenario
- Group related tests with `describe` blocks

## Naming

- Test files: `*.test.ts`, `*.spec.ts`, or in `__tests__/`
- Test names: "should [expected behavior] when [condition]"

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user when valid data is provided', () => {
      // ...
    });

    it('should throw ValidationError when email is invalid', () => {
      // ...
    });
  });
});
```

## Best Practices

- Test behavior, not implementation
- Keep tests independent (no shared state)
- Use factories/fixtures for test data
- Mock external dependencies, not internal modules
- Avoid testing private methods directly

## Mocking

- Mock at the boundary (APIs, databases, external services)
- Prefer dependency injection over module mocking
- Reset mocks between tests
- Verify mock calls when behavior matters

## Coverage

- Aim for meaningful coverage, not 100%
- Focus on critical paths and edge cases
- Don't test framework/library code

## Test Data

- Use descriptive variable names
- Create factory functions for complex objects
- Keep test data close to tests that use it
