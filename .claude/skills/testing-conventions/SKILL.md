---
name: testing-conventions
description: Conventions for testing skills, agents, and repository structure. Use when setting up tests, asking about test location, or validating customizations.
---

# Testing Conventions

## Philosophy

1. **Tests live with code**: Skill tests go in the skill directory
2. **Validate in CI**: Use GitHub Actions for automated validation
3. **Fast feedback**: Unit tests should run in seconds
4. **Evidence over assertions**: Verify before claiming success

---

## Test Locations

| What to Test | Where Tests Go | Test Type |
|--------------|----------------|-----------|
| Skill scripts | `.claude/skills/<name>/tests/` | Unit |
| Skill structure | `.github/workflows/validate-skills.yml` | CI |
| Cross-skill workflows | `tests/integration/` | Integration |
| Full workflows | `tests/e2e/` | End-to-end |
| Repository structure | `.github/workflows/validate.yml` | CI |

---

## Skill Testing

### Skills with Scripts

If a skill has executable scripts, test them:

```
.claude/skills/pdf/
├── SKILL.md
├── scripts/
│   ├── fill_form.py
│   └── extract_text.py
└── tests/
    ├── conftest.py           # Shared fixtures
    ├── test_fill_form.py
    ├── test_extract_text.py
    └── fixtures/
        ├── sample.pdf
        └── expected_output.txt
```

### Test File Template

```python
"""Tests for pdf skill scripts."""
import pytest
from pathlib import Path

# Import the script (adjust path as needed)
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from fill_form import fill_pdf_form


class TestFillForm:
    """Tests for fill_form.py."""

    def test_fills_text_field(self, sample_pdf, tmp_path):
        """Should fill a text field correctly."""
        output = tmp_path / "output.pdf"
        result = fill_pdf_form(sample_pdf, {"name": "Test"}, output)
        assert output.exists()
        assert result["fields_filled"] == 1

    def test_handles_missing_field(self, sample_pdf, tmp_path):
        """Should handle missing field gracefully."""
        output = tmp_path / "output.pdf"
        with pytest.raises(ValueError, match="Field 'nonexistent' not found"):
            fill_pdf_form(sample_pdf, {"nonexistent": "value"}, output)


@pytest.fixture
def sample_pdf():
    """Path to test PDF fixture."""
    return Path(__file__).parent / "fixtures" / "sample.pdf"
```

---

## CI Validation

### Skill Validation Workflow

```yaml
# .github/workflows/validate-skills.yml
name: Validate Skills

on:
  push:
    paths:
      - '.claude/skills/**'
      - '.github/skills/**'
  pull_request:
    paths:
      - '.claude/skills/**'
      - '.github/skills/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check skill structure
        run: |
          for skill_dir in .claude/skills/*/; do
            if [ ! -f "${skill_dir}SKILL.md" ]; then
              echo "ERROR: Missing SKILL.md in $skill_dir"
              exit 1
            fi
          done

      - name: Validate frontmatter
        run: |
          for skill in .claude/skills/*/SKILL.md; do
            if ! head -1 "$skill" | grep -q "^---$"; then
              echo "ERROR: Missing frontmatter in $skill"
              exit 1
            fi
          done

      - name: Check for name field
        run: |
          for skill in .claude/skills/*/SKILL.md; do
            if ! grep -q "^name:" "$skill"; then
              echo "ERROR: Missing 'name' in frontmatter: $skill"
              exit 1
            fi
          done
```

### Structure Validation Workflow

```yaml
# .github/workflows/validate.yml
name: Validate Repository

on: [push, pull_request]

jobs:
  markdown:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DavidAnson/markdownlint-cli2-action@v14
        with:
          globs: '**/*.md'

  yaml:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate YAML
        run: |
          pip install yamllint
          yamllint .github/workflows/*.yml
          yamllint .collections/*.yml
```

---

## Running Tests Locally

### Python Tests

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=.claude/skills --cov-report=html

# Run specific skill tests
pytest .claude/skills/pdf/tests/

# Run with verbose output
pytest -v
```

### JavaScript Tests

```bash
# Install test dependencies
npm install --save-dev jest

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## What to Test

### Always Test

1. **Scripts that transform data**: PDF filling, document conversion
2. **Scripts with complex logic**: Parsers, validators
3. **Scripts used in CI**: Validation scripts

### Usually Skip

1. **Pure documentation skills**: Just SKILL.md with no scripts
2. **Simple wrappers**: Thin shells around external tools
3. **One-time scripts**: Setup scripts run once

---

## Test Fixtures

### Location

```
.claude/skills/<name>/tests/fixtures/
```

### Conventions

1. **Small files**: Keep fixtures under 100KB when possible
2. **Descriptive names**: `valid_form.pdf`, `malformed_input.json`
3. **Version in git**: Fixtures are part of the test suite
4. **Document purpose**: Comment or README explaining each fixture

---

## Integration Testing

For testing cross-skill workflows:

```
tests/integration/
├── conftest.py
├── test_document_workflow.py    # PDF → DOCX → review
└── test_release_workflow.py     # changelog → PR → release
```

### Example Integration Test

```python
"""Test document processing workflow."""
import subprocess
from pathlib import Path


def test_pdf_to_docx_workflow(tmp_path):
    """Test converting PDF to DOCX and back."""
    # This tests that pdf and docx skills work together
    pdf_input = Path("fixtures/sample.pdf")
    docx_output = tmp_path / "output.docx"
    
    # Step 1: Extract text from PDF
    result = subprocess.run(
        ["python", "-m", "markitdown", str(pdf_input)],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    
    # Step 2: Create DOCX from extracted text
    # ... additional steps
```

---

## Verification Before Completion

Before claiming tests pass:

```bash
# Run the actual tests
pytest

# Check the output - don't assume success
echo "Exit code: $?"

# Show any failures
pytest --tb=short
```

See the [verification-before-completion](../verification-before-completion/SKILL.md) skill for the full verification protocol.
