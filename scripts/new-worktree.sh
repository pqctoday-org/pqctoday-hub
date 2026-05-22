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
#   tooling. node_modules is NOT symlinked — run `npm ci` in the new worktree.
#
# Usage:
#   ./scripts/new-worktree.sh <branch>
#   ./scripts/new-worktree.sh feat/learn-persona-path
#   ./scripts/new-worktree.sh compliance/persona-overwhelm-p0
#
# Slug:
#   The directory suffix is derived from the part after the last `/` in the
#   branch name, lowercased, with non-alphanumerics replaced by `-`. So
#   `feat/learn-persona-path` -> `pqctoday-hub-learn-persona-path`.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <branch-name>" >&2
  echo "Example: $0 feat/learn-persona-path" >&2
  exit 2
fi

BRANCH="$1"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(cd "${SRC}/.." && pwd)"

# Derive a filesystem-safe slug from the part after the last `/`
SLUG="${BRANCH##*/}"
SLUG="$(echo "$SLUG" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')"
TARGET="${PARENT}/pqctoday-hub-${SLUG}"

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

# node_modules is intentionally NOT symlinked — Vite + pnpm/npm can behave
# strangely with shared node_modules across worktrees, and the new worktree
# may target a branch that bumps deps. Run `npm ci` in the new worktree.

cat <<EOF

Worktree ready.

  Branch:    $BRANCH
  Path:      $TARGET

Next steps:
  cd "$TARGET"
  npm ci                         # install deps for this worktree (one-time)
  # ...edit, commit, push as usual — fully isolated from $SRC

To remove this worktree when done:
  git worktree remove "$TARGET"

EOF
