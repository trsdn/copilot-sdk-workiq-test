---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Conventions

When working with TypeScript files:

## Type Safety

- Use explicit types for function parameters and return values
- Avoid `any` — use `unknown` if type is truly unknown
- Prefer interfaces over type aliases for object shapes
- Use type guards for runtime type checking

## Naming Conventions

- Interfaces: PascalCase, no "I" prefix (e.g., `User`, not `IUser`)
- Types: PascalCase (e.g., `UserRole`)
- Enums: PascalCase with PascalCase members
- Constants: SCREAMING_SNAKE_CASE for true constants
- Functions/variables: camelCase

## Best Practices

- Use `readonly` for immutable properties
- Prefer `const` over `let`, avoid `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Export types/interfaces that are part of public API
- Keep files focused — one main export per file

## Error Handling

- Use typed errors with `Error` subclasses
- Always handle Promise rejections
- Use `Result<T, E>` pattern for expected failures

## Imports

- Use named imports, avoid default exports
- Group imports: external, internal, types
- Use path aliases (`@/`) for internal imports
