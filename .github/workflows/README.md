# GitHub Actions Workflows

This template includes both project-specific and reusable workflows.

## Project Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main | Lint and test (customize for your stack) |
| `validate.yml` | Push/PR | Validate markdown formatting |
| `validate-skills.yml` | Push/PR | Validate skill file structure |
| `release.yml` | Push tag `v*` | Create GitHub release |

## Reusable Workflows

These workflows can be called from other repositories.

### Node.js CI

```yaml
# .github/workflows/ci.yml in your repo
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    uses: trsdn/torstens-repo-template/.github/workflows/reusable-node-ci.yml@main
    with:
      node-version: '20'        # optional, default: '20'
      working-directory: '.'    # optional, default: '.'
      run-lint: true            # optional, default: true
      run-test: true            # optional, default: true
      run-build: false          # optional, default: false
```

### Python CI

```yaml
# .github/workflows/ci.yml in your repo
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    uses: trsdn/torstens-repo-template/.github/workflows/reusable-python-ci.yml@main
    with:
      python-version: '3.12'              # optional, default: '3.12'
      working-directory: '.'              # optional, default: '.'
      run-lint: true                      # optional, default: true
      run-test: true                      # optional, default: true
      install-command: 'pip install -e ".[dev]"'  # optional
```

### Validate Structure

```yaml
# .github/workflows/validate.yml in your repo
name: Validate

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    uses: trsdn/torstens-repo-template/.github/workflows/reusable-validate.yml@main
    with:
      validate-skills: true     # optional, default: true
      validate-markdown: true   # optional, default: true
```

## Customizing ci.yml

The included `ci.yml` has commented sections for different tech stacks. To enable:

1. **Node.js** — Uncomment the Node.js setup and npm commands
2. **Python** — Uncomment the Python setup and ruff/pytest commands
3. **Go** — Uncomment the Go setup and golangci-lint action

Example for a Node.js project:

```yaml
# In ci.yml, uncomment these lines:
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

- name: Install dependencies
  run: npm ci

- name: Run ESLint
  run: npm run lint --if-present
```

## Adding New Workflows

When creating new workflows:

1. Use `@v4` for first-party actions (checkout, setup-node, etc.)
2. Pin third-party actions to a specific version or SHA
3. Add `concurrency` to cancel in-progress runs on new pushes
4. Include descriptive `name:` for each step

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Related Skills

- `.claude/skills/git-actions-templates/` — Workflow creation patterns
- `.github/skills/copilot-customization-selector/` — Copilot automation
