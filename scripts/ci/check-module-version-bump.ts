#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-module-version-bump.ts — PR CI gate
 *
 * Fails if moduleData.ts changed but any affected module's content.ts
 * version was not bumped relative to origin/main.
 *
 * Module detection: parses moduleIds from the diff of moduleData.ts
 * (looks for changes near WORKSHOP_STEPS or LEARN_SECTIONS entries).
 * For each affected moduleId, scans all content.ts files to find the
 * matching one (by `moduleId: 'id'`) and compares versions.
 *
 * Exit codes:
 *   0 — all affected modules have version bumps (or no moduleData.ts changes)
 *   1 — one or more affected modules missing version bump
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

/** Compare semver. Returns true if b > a */
function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0)
  const [aMaj, aMin, aPat] = parse(a)
  const [bMaj, bMin, bPat] = parse(b)
  if (bMaj !== aMaj) return bMaj > aMaj
  if (bMin !== aMin) return bMin > aMin
  return bPat > aPat
}

/** Extract version from content.ts source using regex */
function parseVersion(src: string): string | null {
  const m = /version:\s*['"]([^'"]+)['"]/.exec(src)
  return m ? m[1] : null
}

/** Extract moduleId from content.ts source */
function parseModuleId(src: string): string | null {
  const m = /moduleId:\s*['"]([^'"]+)['"]/.exec(src)
  return m ? m[1] : null
}

/** Extract moduleIds mentioned in the diff of moduleData.ts */
function extractAffectedModuleIds(diff: string): string[] {
  const ids = new Set<string>()
  // Look for quoted IDs in added/removed lines that are near 'WORKSHOP_STEPS' or 'LEARN_SECTIONS'
  const lines = diff.split('\n')
  let inRelevantSection = false
  for (const line of lines) {
    if (/WORKSHOP_STEPS|LEARN_SECTIONS/.test(line)) inRelevantSection = true
    if (inRelevantSection && /^[+-]/.test(line)) {
      // Extract quoted IDs that look like module IDs (kebab-case)
      const matches = line.matchAll(/['"]([a-z][a-z0-9-]+[a-z0-9])['"]/g)
      for (const m of matches) {
        if (m[1].includes('-')) ids.add(m[1])
      }
    }
    // Reset on blank section
    if (line.trim() === '' && inRelevantSection) inRelevantSection = false
  }
  return Array.from(ids)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const changedFiles = run('git diff --name-only origin/main...HEAD')

const moduleDataChanged = changedFiles.includes('moduleData')

if (!moduleDataChanged) {
  console.log('moduleData.ts unchanged — skipping module version bump check.')
  process.exit(0)
}

// Get diff for moduleData.ts
const moduleDataDiff = run(
  'git diff origin/main...HEAD -- src/components/PKILearning/moduleData.ts'
)

const affectedModuleIds = extractAffectedModuleIds(moduleDataDiff)

if (affectedModuleIds.length === 0) {
  console.log('No module IDs detected in moduleData.ts diff — skipping.')
  process.exit(0)
}

console.log(`Detected affected module IDs: ${affectedModuleIds.join(', ')}`)

// Find all content.ts files
const repoRoot = path.resolve(process.cwd())
const contentFiles = await glob('src/components/PKILearning/modules/**/content.ts', {
  cwd: repoRoot,
  absolute: true,
})

// Build a map: moduleId → content.ts path
const moduleIdToPath = new Map<string, string>()
for (const filePath of contentFiles) {
  const src = fs.readFileSync(filePath, 'utf-8')
  const id = parseModuleId(src)
  if (id) moduleIdToPath.set(id, filePath)
}

const errors: string[] = []

for (const moduleId of affectedModuleIds) {
  const contentPath = moduleIdToPath.get(moduleId)
  if (!contentPath) {
    console.warn(`  ⚠ Module '${moduleId}' mentioned in diff but no content.ts found — skipping.`)
    continue
  }

  const relativePath = path.relative(repoRoot, contentPath)
  const headSrc = fs.readFileSync(contentPath, 'utf-8')
  const headVersion = parseVersion(headSrc)

  const baseSrc = run(`git show origin/main:${relativePath}`)
  const baseVersion = baseSrc ? parseVersion(baseSrc) : null

  if (!headVersion) {
    console.warn(`  ⚠ Module '${moduleId}' content.ts has no version field — skipping.`)
    continue
  }

  if (!baseVersion) {
    // Module is new in this PR
    console.log(`  ✓ Module '${moduleId}' is new (version ${headVersion})`)
    continue
  }

  if (baseVersion === headVersion || !semverGt(baseVersion, headVersion)) {
    errors.push(
      `  ✗ Module '${moduleId}' was affected in moduleData.ts but content.ts version not bumped ` +
        `(still ${headVersion})`
    )
  } else {
    console.log(`  ✓ Module '${moduleId}' version bumped: ${baseVersion} → ${headVersion}`)
  }
}

if (errors.length > 0) {
  console.error('\nModule version bump check FAILED:')
  errors.forEach((e) => console.error(e))
  console.error('\nBump the version field in the affected module content.ts file(s).\n')
  process.exit(1)
}

console.log('Module version bump check passed.')
process.exit(0)
