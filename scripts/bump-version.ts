// SPDX-License-Identifier: GPL-3.0-only
//
// Atomically bumps the package version and promotes the `## [Unreleased]`
// section in CHANGELOG.md to a dated release header. Run via:
//
//   npm run version:patch   # 3.3.9 → 3.3.10
//   npm run version:minor   # 3.3.9 → 3.4.0
//   npm run version:major   # 3.3.9 → 4.0.0
//
// What this does:
//   1. Reads package.json `version` and computes the next semver.
//   2. Replaces the first `## [Unreleased]` header in CHANGELOG.md with
//      `## [<new>] - <today>` and inserts a fresh empty `## [Unreleased]`
//      block above it so future entries have a home.
//   3. Writes the new version back to package.json (preserving formatting).
//   4. Prints the new tag for the caller to commit.
//
// Refuses to run if there is no `## [Unreleased]` section, or if the
// section is empty. This keeps the changelog honest.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const PKG_PATH = resolve(ROOT, 'package.json')
const CHANGELOG_PATH = resolve(ROOT, 'CHANGELOG.md')

type BumpKind = 'patch' | 'minor' | 'major'

function parseArgs(): BumpKind {
  const arg = process.argv[2]
  if (arg === 'patch' || arg === 'minor' || arg === 'major') return arg
  console.error('Usage: tsx scripts/bump-version.ts <patch|minor|major>')
  process.exit(2)
}

function bumpSemver(current: string, kind: BumpKind): string {
  const parts = current.split('.').map((s) => Number(s))
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Cannot bump non-semver version: ${current}`)
  }
  const [major, minor, patch] = parts
  if (kind === 'major') return `${major + 1}.0.0`
  if (kind === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

function todayHumanDate(): string {
  const now = new Date()
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
}

function main(): void {
  const kind = parseArgs()

  const pkgRaw = readFileSync(PKG_PATH, 'utf8')
  const pkg = JSON.parse(pkgRaw) as { version: string }
  const oldVersion = pkg.version
  const newVersion = bumpSemver(oldVersion, kind)

  const changelog = readFileSync(CHANGELOG_PATH, 'utf8')

  // Find the first `## [Unreleased]` header. The body extends from the line
  // after the header up to the next `## [` header (or end of file).
  const unreleasedRegex = /^## \[Unreleased\]\s*$/m
  const unreleasedMatch = unreleasedRegex.exec(changelog)
  if (!unreleasedMatch) {
    console.error(
      'CHANGELOG.md has no `## [Unreleased]` section — refusing to bump version. ' +
        'Add an Unreleased block with the changes for this release first.'
    )
    process.exit(1)
  }

  const unreleasedStart = unreleasedMatch.index
  const headerEnd = unreleasedStart + unreleasedMatch[0].length
  const afterHeader = changelog.slice(headerEnd)
  const nextHeaderMatch = afterHeader.match(/\n## \[/)
  const bodyEnd = nextHeaderMatch ? headerEnd + (nextHeaderMatch.index ?? 0) : changelog.length
  const unreleasedBody = changelog.slice(headerEnd, bodyEnd).trim()

  if (unreleasedBody.length === 0) {
    console.error(
      'CHANGELOG.md `## [Unreleased]` section is empty — refusing to bump version. ' +
        'Add at least one entry under Unreleased before releasing.'
    )
    process.exit(1)
  }

  const newHeader = `## [Unreleased]\n\n## [${newVersion}] - ${todayHumanDate()}`
  const updatedChangelog =
    changelog.slice(0, unreleasedStart) + newHeader + changelog.slice(headerEnd)

  // Update package.json — preserve trailing newline + formatting via regex
  // replace on the version line so prettier doesn't reorder unrelated keys.
  const updatedPkg = pkgRaw.replace(/("version"\s*:\s*")([^"]+)(")/, `$1${newVersion}$3`)
  if (updatedPkg === pkgRaw) {
    throw new Error('Failed to update version in package.json')
  }

  writeFileSync(CHANGELOG_PATH, updatedChangelog, 'utf8')
  writeFileSync(PKG_PATH, updatedPkg, 'utf8')

  console.log(`Bumped ${oldVersion} → ${newVersion}`)
  console.log('Next steps:')
  console.log(`  git add package.json CHANGELOG.md`)
  console.log(`  git commit -m "chore: release v${newVersion}"`)
  console.log(`  git tag v${newVersion}`)
}

main()
