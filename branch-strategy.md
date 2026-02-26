# DJ Hub — Git Branch Strategy

## Overview

DJ Hub follows a **Gitflow-inspired** branching model with three long-lived branches and short-lived topic branches. The goal is to keep `master` always deployable and to give the team a stable integration point (`develop`) before shipping to production.

```
master  ◄── develop  ◄── feature/*
  ▲                  ◄── bugfix/*
  └────────────────────── hotfix/*
```

---

## Long-Lived Branches

| Branch | Environment | Protected | Direct Push |
|--------|-------------|-----------|-------------|
| `master` | Production | ✅ Yes | ❌ No |
| `develop` | Staging / Pre-release | ✅ Yes | ❌ No |

### `master`

- Represents the **production** state of the application.
- Every commit on `master` is (or has been) deployed to production via the `deploy.yml` workflow.
- Only merges from `develop` (via PR) or `hotfix/*` branches are allowed.
- Branch protection requires:
  - At least **1 approving review**
  - All CI status checks passing (lint, type check, build, unit tests, **95% coverage gate**, E2E)
  - No force-pushes or direct commits

### `develop`

- The **integration branch** where features and bug fixes accumulate before a release.
- Reflects the latest development state; deployed to a staging environment if configured.
- Branch protection requires:
  - At least **1 approving review**
  - Lint, type check, build, unit tests, and coverage gate (≥ 95%) passing

---

## Short-Lived Branches

| Pattern | Base branch | Merges into |
|---------|-------------|-------------|
| `feature/<description>` | `develop` | `develop` |
| `bugfix/<description>` | `develop` | `develop` |
| `hotfix/<description>` | `master` | `master` + `develop` |
| `release/<version>` | `develop` | `master` + `develop` |
| `chore/<description>` | `develop` | `develop` |
| `docs/<description>` | `develop` | `develop` |

### `feature/*`

Used for all new features and enhancements.

```bash
git checkout develop && git pull
git checkout -b feature/dj-booking-calendar
# … develop, commit …
git push origin feature/dj-booking-calendar
# Open PR: feature/dj-booking-calendar → develop
```

### `bugfix/*`

Used for non-critical bug fixes discovered during development or staging.

```bash
git checkout develop && git pull
git checkout -b bugfix/fix-avatar-upload-size
```

### `hotfix/*`

Used for **critical production bugs** that must bypass the normal develop cycle.

```bash
git checkout master && git pull
git checkout -b hotfix/patch-stripe-webhook-signature
# Fix the issue with tests
git push origin hotfix/patch-stripe-webhook-signature
# Open TWO PRs:
#   1. hotfix/... → master   (emergency fix)
#   2. hotfix/... → develop  (back-port to keep branches in sync)
```

After merging into `master`, tag the release:

```bash
git tag -a v1.2.1 -m "fix(payments): patch Stripe webhook signature validation"
git push origin v1.2.1
```

### `release/*`

Used to freeze a release candidate and perform final QA before promoting to production.

```bash
git checkout develop && git pull
git checkout -b release/v2.0.0
# Version bump, changelog, last-minute fixes only
git push origin release/v2.0.0
# Open PR: release/v2.0.0 → master
# After merge, also merge back: release/v2.0.0 → develop
```

---

## Merge Strategy

| Direction | Merge Strategy |
|-----------|----------------|
| `feature/*` → `develop` | **Squash merge** (keeps history clean) |
| `bugfix/*` → `develop` | **Squash merge** |
| `develop` → `master` | **Merge commit** (preserves release boundary) |
| `hotfix/*` → `master` | **Merge commit** |
| `hotfix/*` → `develop` | **Cherry-pick** or merge commit |
| `release/*` → `master` | **Merge commit** |

---

## Release Process

1. Ensure `develop` is stable: all CI checks green, manual QA complete.
2. Create a `release/vX.Y.Z` branch from `develop`.
3. Bump version in `package.json`, update `CHANGELOG.md`.
4. Open PR: `release/vX.Y.Z` → `master`.
5. All CI checks must pass (including E2E and 95% coverage gate).
6. Obtain at least **1 approving review**.
7. Merge into `master` → triggers automatic Vercel production deployment via `deploy.yml`.
8. Tag the merge commit: `git tag -a vX.Y.Z -m "release: vX.Y.Z"`.
9. Merge `release/vX.Y.Z` back into `develop` to capture any release-only commits.
10. Delete the release branch.

---

## CI/CD Summary

| Event | Workflow | Actions |
|-------|----------|---------|
| PR → `develop` | `ci.yml`, `test.yml` | Lint, type-check, build, unit tests, coverage ≥ 95% |
| PR → `master` | `ci.yml`, `test.yml` | All above + E2E tests |
| Push `develop` | `ci.yml`, `test.yml` | Lint, type-check, build, unit tests |
| Push `master` | `ci.yml`, `test.yml`, `deploy.yml` | Full suite + Docker build + Vercel production deploy |
| Manual dispatch | `branch-protection.yml` | Apply GitHub branch protection rules |

---

## Quick Reference

```bash
# Start a feature
git checkout develop && git pull && git checkout -b feature/my-feature

# Sync with develop during development
git fetch origin && git rebase origin/develop

# Prepare PR
git push origin feature/my-feature
gh pr create --base develop --title "feat: my feature"

# Emergency hotfix
git checkout master && git pull && git checkout -b hotfix/critical-bug
# … fix …
git push origin hotfix/critical-bug
gh pr create --base master --title "fix: critical bug"
gh pr create --base develop --title "fix: critical bug (back-port)"
```
