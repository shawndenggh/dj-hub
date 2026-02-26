# Contributing to DJ Hub

Thank you for your interest in contributing to DJ Hub! Please read this guide before submitting any changes.

## Table of Contents

- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Format](#commit-message-format)
- [Pull Request Workflow](#pull-request-workflow)
- [CI/CD Requirements](#cicd-requirements)
- [Development Setup](#development-setup)

---

## Branch Naming Conventions

All branches must follow the pattern `<type>/<short-description>` using lowercase kebab-case.

| Type | Pattern | Purpose |
|------|---------|---------|
| Feature | `feature/<description>` | New features or enhancements |
| Bug Fix | `bugfix/<description>` | Non-critical bug fixes |
| Hot Fix | `hotfix/<description>` | Critical production fixes (branches from `master`) |
| Release | `release/<version>` | Release preparation branches |
| Chore | `chore/<description>` | Maintenance tasks (deps, config, tooling) |
| Docs | `docs/<description>` | Documentation-only changes |

**Examples:**
```
feature/dj-profile-page
bugfix/fix-track-upload-error
hotfix/patch-payment-webhook
release/v1.2.0
chore/upgrade-nextjs-15
docs/update-api-reference
```

---

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Structure

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting changes (no logic change) |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process or tooling changes |
| `ci` | CI/CD configuration changes |
| `revert` | Revert a previous commit |

### Scopes (optional)

Use the area of the codebase affected: `auth`, `profile`, `tracks`, `payments`, `api`, `db`, `ui`, `e2e`, `config`.

### Rules

- Use the **imperative mood** in the summary: "add feature" not "added feature"
- Do **not** end the summary with a period
- Keep the summary under **72 characters**
- Reference issues in the footer: `Closes #123` or `Refs #456`
- Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer

### Examples

```
feat(profile): add DJ bio and social links section

fix(auth): resolve OAuth redirect loop on mobile Safari

docs: update README with Docker setup instructions

feat(payments)!: migrate Stripe billing to subscription model

BREAKING CHANGE: existing one-time payment records are incompatible.
Run migration script before deploying.
Closes #88
```

---

## Pull Request Workflow

### Standard Flow

```
feature/* ──► develop ──► master (production)
bugfix/*  ──►
```

1. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-new-feature
   ```

2. **Develop and commit** following the conventions above.

3. **Keep your branch up to date**:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

4. **Push and open a PR** targeting `develop`:
   ```bash
   git push origin feature/my-new-feature
   ```
   Then open a PR from `feature/my-new-feature` → `develop`.

5. **PR Review**: At least **1 approval** is required. Address all review comments.

6. **Merge to develop**: Once approved and all checks pass, squash-merge into `develop`.

7. **Promote to master**: When `develop` is stable and ready for release, open a PR from `develop` → `master`. This triggers the full test suite and deployment pipeline.

### Hotfix Flow

For critical production issues that cannot wait for the normal release cycle:

```
master ──► hotfix/* ──► master
                   └──► develop (back-port)
```

1. Branch from `master`: `git checkout -b hotfix/critical-fix master`
2. Apply the fix with tests.
3. Open PRs to **both** `master` and `develop`.
4. After merging to `master`, tag the release: `git tag v1.2.1`.

---

## CI/CD Requirements

All PRs **must pass** every GitHub Actions check before merging:

| Check | Workflow | Requirement |
|-------|----------|-------------|
| Lint & Type Check | `ci.yml` | Zero ESLint errors, zero TypeScript errors |
| Unit & Integration Tests | `test.yml` | All tests pass |
| Coverage Gate | `test.yml` | ≥ 95% statements, branches, functions, lines |
| E2E Tests | `test.yml` | All Playwright tests pass |
| Build | `ci.yml` | Next.js build succeeds |

> **Note:** The coverage gate enforces a **95% minimum** on every metric. Tests that lower coverage below this threshold will block the PR from merging.

### Running Checks Locally

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## Development Setup

```bash
# Clone and install
git clone https://github.com/<org>/dj-hub.git
cd dj-hub
npm install

# Configure environment
cp .env.example .env.local
# Fill in required values in .env.local

# Set up database
npm run db:push

# Start development server
npm run dev
```

See [README.md](../README.md) for full setup instructions.
