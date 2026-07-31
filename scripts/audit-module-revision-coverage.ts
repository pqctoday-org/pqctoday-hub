#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-module-revision-coverage.ts
 *
 * LEARN-MODULE-REVISION-HISTORY-REMEDIATION-PLAN-07312026.md Phase 2.
 *
 * Checks that a diff touching a Learn module's `content.ts`/`manifest.ts`
 * has SOME revision-tracking record for that module's id — either a real
 * `domain: "module"` entry newly added to `public/data/revisions.jsonl`, or
 * an un-promoted `module-edit-*` draft in the private repo's
 * `maintenance/runs/` (emit_revision.py --module-edit). The draft case
 * matters because of how that writer is deliberately designed: a real
 * revisions.jsonl entry can't exist until the PR containing this very edit
 * has actually merged (its merge_sha isn't known before then — see
 * emit_revision.py's docstring), so at commit time a draft is the honest,
 * complete signal that "this edit will get a real entry once merged." A
 * bare content edit with NEITHER is the actual gap this exists to catch —
 * the one that made revisions.jsonl almost empty for organic Learn-module
 * work (only `apply_approved.py`'s narrow mechanical-fix path ever wrote
 * one).
 *
 * Covers a committed diff (against `--base`, default `origin/main`),
 * uncommitted working-tree changes, AND untracked new files (a brand-new
 * module has no tracked history to diff against) — so it's useful before a
 * commit even exists, not just in CI.
 *
 * Usage:
 *   npx tsx scripts/audit-module-revision-coverage.ts [--base <ref>] [--priv-runs <path>] [--json]
 *
 * --priv-runs defaults to ../pqctoday-priv/maintenance/runs relative to this
 * repo (the standard sibling-checkout layout this project uses). Pass an
 * explicit path if your priv checkout lives elsewhere; pass an empty/missing
 * path and the draft check is silently skipped (revisions.jsonl-only mode).
 *
 * Exit codes:
 *   0 — every touched module has a matching revisions.jsonl entry or a
 *       pending module-edit draft (or no module files were touched at all)
 *   1 — one or more touched modules have neither
 *
 * NOT wired into CI (yet) — this is a standalone check, run manually or by
 * a session before committing a Learn-module content change. See Decision 1
 * in the plan above for whether/how to wire it in as a CI gate.
 */

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = process.cwd()
const MODULES_DIR = path.resolve(REPO_ROOT, 'src/components/PKILearning/modules')
const MODULES_PREFIX = 'src/components/PKILearning/modules/'
const REVISIONS_REL = 'public/data/revisions.jsonl'

interface Finding {
  dirName: string
  moduleId: string | null
  detail: string
}

function resolveBase(preferred?: string): string {
  if (preferred) return preferred
  for (const candidate of ['origin/main', 'main']) {
    try {
      execFileSync('git', ['rev-parse', '--verify', candidate], { cwd: REPO_ROOT, stdio: 'ignore' })
      return candidate
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    'Could not resolve a base ref (tried origin/main, main) — pass --base explicitly.'
  )
}

function diffNameOnly(range: string): string[] {
  const out = execFileSync('git', ['diff', '--name-only', range], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  })
  return out.split('\n').filter(Boolean)
}

/** New, never-yet-committed files — `git diff` (any range) never lists
 * these, so a brand-new module directory would otherwise be invisible. */
function untrackedFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
  })
  return out.split('\n').filter(Boolean)
}

function diffContent(range: string, relPath: string): string {
  try {
    return execFileSync('git', ['diff', range, '--', relPath], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    })
  } catch {
    return ''
  }
}

function moduleIdForDir(dirName: string): string | null {
  const manifestPath = path.join(MODULES_DIR, dirName, 'manifest.ts')
  if (!fs.existsSync(manifestPath)) return null
  const text = fs.readFileSync(manifestPath, 'utf-8')
  const m = text.match(/^\s*id:\s*['"]([^'"]+)['"]/m)
  return m ? m[1] : null
}

/** Module ids covered by newly ADDED lines (domain="module" entries) across
 * both the committed diff and uncommitted working-tree changes. */
function addedRevisionModuleIds(base: string): Set<string> {
  const ids = new Set<string>()
  for (const range of [`${base}...HEAD`, 'HEAD']) {
    const diff = diffContent(range, REVISIONS_REL)
    for (const line of diff.split('\n')) {
      if (!line.startsWith('+') || line.startsWith('+++')) continue
      let entry: { domain?: string; module_id?: string | null; record_ids?: string[] }
      try {
        entry = JSON.parse(line.slice(1))
      } catch {
        continue // diff hunk header / partial line, not a full JSON record
      }
      if (entry.domain !== 'module') continue
      if (entry.module_id) ids.add(entry.module_id)
      for (const id of entry.record_ids ?? []) ids.add(id)
    }
  }
  return ids
}

/** Module ids covered by an un-promoted `module-edit-*` draft under the
 * private repo's `maintenance/runs/` (emit_revision.py --module-edit). Never
 * throws — a missing/absent priv checkout just means this signal is
 * unavailable, not an error (revisions.jsonl-only mode). */
function draftedModuleIds(privRunsDir: string): Set<string> {
  const ids = new Set<string>()
  if (!privRunsDir || !fs.existsSync(privRunsDir)) return ids
  for (const entry of fs.readdirSync(privRunsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('module-edit-')) continue
    const draftPath = path.join(privRunsDir, entry.name, 'revision-draft.json')
    if (!fs.existsSync(draftPath)) continue
    try {
      const payload = JSON.parse(fs.readFileSync(draftPath, 'utf-8'))
      for (const d of payload.drafts ?? []) {
        if (d.promoted) continue // already landed in revisions.jsonl for real — covered via that path instead
        for (const id of d.record_ids ?? []) ids.add(id)
        if (d.module_id) ids.add(d.module_id)
      }
    } catch {
      // malformed/partial draft file — skip rather than crash the audit
    }
  }
  return ids
}

function main(): void {
  const args = process.argv.slice(2)
  const wantJson = args.includes('--json')
  const baseIdx = args.indexOf('--base')
  const explicitBase = baseIdx >= 0 ? args[baseIdx + 1] : undefined
  const base = resolveBase(explicitBase)
  const privRunsIdx = args.indexOf('--priv-runs')
  const privRunsDir =
    privRunsIdx >= 0
      ? args[privRunsIdx + 1]
      : path.resolve(REPO_ROOT, '../pqctoday-priv/maintenance/runs')

  const files = new Set([
    ...diffNameOnly(`${base}...HEAD`),
    ...diffNameOnly('HEAD'),
    ...untrackedFiles(),
  ])

  const modulesTouchedDirs = new Set<string>()
  for (const f of files) {
    if (!f.startsWith(MODULES_PREFIX)) continue
    if (!(f.endsWith('/content.ts') || f.endsWith('/manifest.ts'))) continue
    const dirName = f.slice(MODULES_PREFIX.length).split('/')[0]
    if (dirName) modulesTouchedDirs.add(dirName)
  }

  if (modulesTouchedDirs.size === 0) {
    if (wantJson) {
      process.stdout.write(JSON.stringify({ findings: [] }, null, 2) + '\n')
    } else {
      console.log('PASS No Learn-module content.ts/manifest.ts changes in this diff.')
    }
    process.exit(0)
  }

  const coveredIds = files.has(REVISIONS_REL) ? addedRevisionModuleIds(base) : new Set<string>()
  const draftIds = draftedModuleIds(privRunsDir)

  const findings: Finding[] = []
  for (const dirName of modulesTouchedDirs) {
    const moduleId = moduleIdForDir(dirName)
    if (moduleId && (coveredIds.has(moduleId) || draftIds.has(moduleId))) continue
    findings.push({
      dirName,
      moduleId,
      detail: moduleId
        ? `content.ts/manifest.ts changed under ${dirName}/ but no matching revisions.jsonl ` +
          `entry or pending module-edit draft (covering id '${moduleId}') found`
        : `content.ts/manifest.ts changed under ${dirName}/ but its manifest.ts has no resolvable id`,
    })
  }

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }

  if (findings.length === 0) {
    console.log(
      `PASS ${modulesTouchedDirs.size} touched module(s) all have a matching revisions.jsonl ` +
        `entry or pending module-edit draft.`
    )
    process.exit(0)
  }

  console.log(
    `FAIL ${findings.length} module(s) changed without a matching revisions.jsonl entry:\n`
  )
  for (const f of findings) {
    console.log(`  [${f.dirName}] ${f.detail}`)
  }
  console.log(
    '\nRun (from pqctoday-priv/maintenance/):\n' +
      '  python3 emit_revision.py --module-edit --modules <id[,id...]> --hub-root <this hub worktree>\n' +
      'before committing, then re-run this check.'
  )
  process.exit(1)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
