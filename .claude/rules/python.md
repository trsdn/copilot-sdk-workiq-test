---
paths:
  - "**/*.py"
---

# Python Conventions

When working with Python files:

## Style

- Follow PEP 8 style guide
- Use 4 spaces for indentation
- Maximum line length: 88 characters (Black default)
- Use type hints for function signatures

## Naming Conventions

- Classes: PascalCase
- Functions/methods: snake_case
- Variables: snake_case
- Constants: SCREAMING_SNAKE_CASE
- Private: prefix with underscore (`_private`)

## Best Practices

- Use f-strings for string formatting
- Prefer `pathlib.Path` over `os.path`
- Use context managers (`with`) for resources
- Use dataclasses or Pydantic for data structures
- Prefer list/dict comprehensions when readable

## Imports

- Group: stdlib, third-party, local
- Use absolute imports
- Avoid `from module import *`

## Type Hints

```python
def process_items(items: list[str]) -> dict[str, int]:
    ...
```

## Error Handling

- Use specific exception types
- Don't catch bare `except:`
- Use `raise ... from` for exception chaining
