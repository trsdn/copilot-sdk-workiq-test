---
name: project-init
description: Bootstrap a new project from this template. Use when creating a new project, initializing a repository from template, or setting up a fresh codebase.
---

# Project Initialization

Initialize a new project from this template repository.

## Quick Start

```bash
# Clone the template
gh repo create my-project --template trsdn/torstens-repo-template --clone
cd my-project

# Or manually
git clone https://github.com/trsdn/torstens-repo-template.git my-project
cd my-project
rm -rf .git
git init
```

## Initialization Checklist

### 1. Update Project Identity

- [ ] Edit `README.md` with your project name and description
- [ ] Update `CLAUDE.md` with project-specific context
- [ ] Edit `package.json` if applicable (name, description, author)
- [ ] Update `CHANGELOG.md` to start fresh

### 2. Configure Git

```bash
# Set up remote
git remote add origin git@github.com:your-org/your-project.git

# Initial commit
git add .
git commit -m "chore: initialize project from template"
git push -u origin main
```

### 3. Clean Up Template Content

Remove or customize these template-specific files:

- [ ] `QUICKSTART.md` — Adapt or remove
- [ ] `sync-blueprint.sh` — Remove if not syncing from blueprints
- [ ] `.claude/skills/blueprint-sync/` — Remove if not using blueprints

### 4. Customize Skills

Review and remove skills you don't need:

```bash
# List all skills
ls .claude/skills/

# Remove unused skills
rm -rf .claude/skills/skill-you-dont-need/
```

### 5. Set Up CLAUDE.md

Edit `CLAUDE.md` with your project context:

```markdown
# Project Name

Brief description of what this project does.

## Tech Stack
- Language: TypeScript
- Framework: Next.js
- Database: PostgreSQL

## Development Commands
- `npm run dev` — Start development server
- `npm run test` — Run tests
- `npm run build` — Build for production

## Architecture
Key architectural decisions...
```

### 6. Configure GitHub

- [ ] Enable branch protection on `main`
- [ ] Set up required status checks
- [ ] Configure Dependabot settings in `dependabot.yml`
- [ ] Add repository secrets if needed

## Post-Init Verification

Run these checks after initialization:

```bash
# Verify git is clean
git status

# Check for any remaining template references
grep -r "torstens-repo-template" . --exclude-dir=.git

# List your customizations
ls -la .claude/skills/
ls -la .github/agents/
```

## Template Maintenance

To receive updates from the template:

1. Keep the `blueprint-sync` skill
2. Run "sync blueprints" periodically
3. Review and merge changes as needed
