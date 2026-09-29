#!/usr/bin/env bash
# scripts/new-worktree.sh — create an isolated parallel-session worktree
#
# Why this exists:
#   Git keeps ONE working tree per repository. Two Claude Code sessions opened
#   in the same `pqctoday-hub` directory share both the disk and the HEAD
#   pointer — when one session runs `git checkout`, every other session's
#   files swap with it and their next `git commit` can land on the wrong
#   branch. Different *pages* don't help; different *physical directories* do.
#
# What this does:
#   Creates a sibling worktree at `${PARENT}/pqctoday-hub-${slug}` pointing at
#   the requested branch (creating the branch off `origin/main` if it doesn't
#   exist yet). Symlinks the gitignored project-config files (CLAUDE.md,
#   .claude/, .cursorrules, sync-private.sh, tasks/) into the new worktree so
#   a fresh Claude Code session opened there inherits the same rules and
#   tooling. By default node_modules is NOT symlinked — run `npm ci` in the new
#   worktree (its `prepare` step installs the pre-push hook).
#
#   With --link-deps, node_modules is symlinked from the source tree instead
#   (fast, no install) AND the pre-push hook is installed here, because a
#   symlinked node_modules never ran `prepare`: without `.husky/_/pre-push`,
#   `git push` runs NO hook and gives no warning (found 2026-09-27: 15 of 36
#   worktrees had this gap). The script fails loudly if the hook is missing.
#
# Usage:
#   ./scripts/new-worktree.sh <branch> [--link-deps]
#   ./scripts/new-worktree.sh feat/learn-persona-path
#   ./scripts/new-worktree.sh compliance/persona-overwhelm-p0 --link-deps
#
# Slug:
#   The directory suffix is derived from the part after the last `/` in the
#   branch name, lowercased, with non-alphanumerics replaced by `-`. So
#   `feat/learn-persona-path` -> `pqctoday-hub-learn-persona-path`.

set -euo pipefail

LINK_DEPS=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --link-deps) LINK_DEPS=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done

if [[ ${#ARGS[@]} -ne 1 ]]; then
  echo "Usage: $0 <branch-name> [--link-deps]" >&2
  echo "Example: $0 feat/learn-persona-path --link-deps" >&2
  exit 2
fi

BRANCH="${ARGS[0]}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(cd "${SRC}/.." && pwd)"

# Derive a filesystem-safe slug from the part after the last `/`
SLUG="${BRANCH##*/}"
SLUG="$(echo "$SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')"
TARGET="${PARENT}/pqctoday-hub-${SLUG}"

if [[ "$LINK_DEPS" -eq 1 && ! -d "${SRC}/node_modules" ]]; then
  echo "--link-deps: ${SRC}/node_modules not found — run \`npm ci\` there first." >&2
  exit 1
fi

if [[ -e "$TARGET" ]]; then
  echo "Target already exists: $TARGET" >&2
  echo "If this is the worktree you want, just \`cd $TARGET\` and continue." >&2
  exit 1
fi

cd "$SRC"

# Fetch so we can branch off the freshest origin/main if the branch is new
git fetch --quiet origin || true

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Branch $BRANCH exists locally — checking it out in the new worktree."
  git worktree add "$TARGET" "$BRANCH"
elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  echo "Branch $BRANCH exists on origin — checking out a local copy in the new worktree."
  git worktree add -b "$BRANCH" "$TARGET" "origin/$BRANCH"
else
  echo "Branch $BRANCH does not exist — creating it from origin/main in the new worktree."
  git worktree add -b "$BRANCH" "$TARGET" "origin/main"
fi

# Symlink gitignored project-config files so the new worktree behaves like
# the main one for Claude Code sessions and the private-sync workflow.
# We use symlinks (not copies) so updates propagate without rsync.
link_if_present() {
  local name="$1"
  if [[ -e "${SRC}/${name}" && ! -e "${TARGET}/${name}" ]]; then
    ln -s "${SRC}/${name}" "${TARGET}/${name}"
    echo "  linked ${name}"
  fi
}

echo "Linking private project-config files into ${TARGET}:"
link_if_present "CLAUDE.md"
link_if_present ".claude"
link_if_present ".cursorrules"
link_if_present "sync-private.sh"
link_if_present "tasks"

# node_modules is NOT symlinked by default — Vite + pnpm/npm can behave
# strangely with shared node_modules across worktrees, and the new worktree
# may target a branch that bumps deps. Run `npm ci` in the new worktree.
#
# --link-deps opts in to the shared install, and must then install the hook
# itself (see header). Only use it when the branch does not change dependencies.
if [[ "$LINK_DEPS" -eq 1 ]]; then
  ln -s "${SRC}/node_modules" "${TARGET}/node_modules"
  echo "  linked node_modules"
  (cd "$TARGET" && npx --no-install husky)
  if [[ ! -e "${TARGET}/.husky/_/pre-push" ]]; then
    echo "ERROR: pre-push hook was not installed in ${TARGET} — pushes would run no checks." >&2
    exit 1
  fi
  echo "  installed pre-push hook (.husky/_/pre-push)"
fi

if [[ "$LINK_DEPS" -eq 1 ]]; then
  DEPS_STEP="# deps linked and pre-push hook installed — nothing to install"
else
  DEPS_STEP="npm ci                         # install deps + pre-push hook for this worktree (one-time)"
fi

cat <<EOF

Worktree ready.

  Branch:    $BRANCH
  Path:      $TARGET

Next steps:
  cd "$TARGET"
  $DEPS_STEP
  # ...edit, commit, push as usual — fully isolated from $SRC
  # Pushes run the full local gate; if a push prints no hook output, the hook is
  # missing — check that .husky/_/pre-push exists before trusting it.

To remove this worktree when done:
  git worktree remove "$TARGET"

EOF
