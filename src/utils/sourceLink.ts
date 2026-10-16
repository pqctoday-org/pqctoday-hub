// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Where to find the exact source code of the build that is running.
 *
 * `__BUILD_COMMIT__` is the git commit the site was built from, recorded by
 * vite.config.ts next to `__APP_VERSION__`. When it is unknown (a build from a
 * tarball without git, a test run), every link falls back to the repository.
 */
export const SOURCE_REPO_URL = 'https://github.com/pqctoday-org/pqctoday-hub'

const FULL_SHA = /^[0-9a-f]{40}$/

/** A full 40-hex commit, or null when the value is missing or malformed. */
export function normalizeCommit(commit: string | null | undefined): string | null {
  const c = (commit ?? '').trim().toLowerCase()
  return FULL_SHA.test(c) ? c : null
}

/** The commit this build was made from, or null when it was not recorded. */
export const BUILD_COMMIT: string | null = normalizeCommit(
  typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : null
)

/** Link to the source tree at `commit`, or to the repository when the commit is unknown. */
export function sourceCodeUrl(commit: string | null | undefined = BUILD_COMMIT): string {
  const c = normalizeCommit(commit)
  return c ? `${SOURCE_REPO_URL}/tree/${c}` : SOURCE_REPO_URL
}

/** Short commit for display ("abc1234"), or null when unknown. */
export function shortCommit(commit: string | null | undefined = BUILD_COMMIT): string | null {
  const c = normalizeCommit(commit)
  return c ? c.slice(0, 7) : null
}
