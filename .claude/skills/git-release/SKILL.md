---
name: git-release
description: Manage releases including version bumps, changelog generation, and GitHub releases. Use when creating releases, tagging versions, or publishing new versions.
---

# Release Management

Create and manage releases with proper versioning, changelogs, and GitHub releases.

## Release Process

### 1. Pre-Release Checklist

- [ ] All tests passing
- [ ] CHANGELOG.md updated
- [ ] No uncommitted changes
- [ ] On main/release branch

```bash
# Verify clean state
git status
npm test  # or your test command
```

### 2. Determine Version Bump

Follow [Semantic Versioning](https://semver.org/):

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | MAJOR | 1.0.0 → 2.0.0 |
| New features (backward compatible) | MINOR | 1.0.0 → 1.1.0 |
| Bug fixes | PATCH | 1.0.0 → 1.0.1 |

### 3. Update Version

#### For npm projects

```bash
# Patch release
npm version patch

# Minor release
npm version minor

# Major release
npm version major
```

#### For other projects

```bash
# Update version file manually
echo "1.2.0" > VERSION

# Or update in code
sed -i '' 's/version = ".*"/version = "1.2.0"/' pyproject.toml
```

### 4. Update CHANGELOG

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.0] - 2024-01-15

### Added
- New feature X (#123)

### Changed
- Improved performance of Y (#124)

### Fixed
- Bug in Z component (#125)

### Security
- Updated dependency with CVE fix (#126)
```

### 5. Create Git Tag

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0"

# Push tag
git push origin v1.2.0

# Push all tags
git push --tags
```

### 6. Create GitHub Release

```bash
# Create release from tag
gh release create v1.2.0 --title "v1.2.0" --notes-file RELEASE_NOTES.md

# Or generate notes automatically
gh release create v1.2.0 --generate-notes

# Create draft release for review
gh release create v1.2.0 --draft --generate-notes
```

### 7. Generate Release Notes

Extract from CHANGELOG for the release:

```bash
# Get section for specific version
sed -n '/^## \[1.2.0\]/,/^## \[/p' CHANGELOG.md | head -n -1 > RELEASE_NOTES.md
```

## Automated Release Flow

### Using the existing release.yml workflow

The repo includes `.github/workflows/release.yml`. Trigger it by:

1. Push a version tag: `git push origin v1.2.0`
2. The workflow will create a GitHub release automatically

### Manual Release Script

```bash
#!/bin/bash
set -e

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version>"
  exit 1
fi

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid version format. Use: X.Y.Z"
  exit 1
fi

echo "Releasing v$VERSION..."

# Update version in package.json (if exists)
if [ -f package.json ]; then
  npm version $VERSION --no-git-tag-version
fi

# Commit version bump
git add -A
git commit -m "chore: release v$VERSION"

# Create tag
git tag -a "v$VERSION" -m "Release v$VERSION"

# Push
git push origin main
git push origin "v$VERSION"

echo "✅ Released v$VERSION"
```

## Quick Commands

| Say This | Action |
|----------|--------|
| "release patch" | Create patch release |
| "release minor" | Create minor release |
| "release major" | Create major release |
| "release 1.2.0" | Create specific version |
| "draft release" | Create draft for review |
| "list releases" | Show recent releases |

## Version Locations

Common places to update version:

| File | Format |
|------|--------|
| `package.json` | `"version": "1.2.0"` |
| `pyproject.toml` | `version = "1.2.0"` |
| `Cargo.toml` | `version = "1.2.0"` |
| `VERSION` | `1.2.0` |
| `version.go` | `const Version = "1.2.0"` |
