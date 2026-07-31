#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-content-revision-coverage.ts
 *
 * LEARN-MODULE-REVISION-HISTORY-REMEDIATION-PLAN-07312026.md Phase 2 (+
 * Playground-tool follow-up, same design).
 *
 * Checks that a diff touching a Learn module's `content.ts`/`manifest.ts`,
 * or a Playground tool's entry in `workshopRegistry.tsx`, has a matching
 * `revisions.jsonl` entry for that item's id. Self-contained — reads only
 * this repo's own diff, no dependency on the private repo.
 *
 * emit_revision.py's `--module-edit`/`--tool-edit` modes append the
 * matching entry directly into `public/data/revisions.jsonl` (with a
 * placeholder `merge_sha: "pending"` until the containing PR merges) and
 * re-sign in the SAME step, so a compliant edit always carries its entry in
 * the same diff — that's what makes this workable as a BLOCKING gate. A
 * bare content edit with no entry at all is the actual gap this exists to
 * catch — the one that made revisions.jsonl almost empty for organic
 * content work (only apply_approved.py's narrow mechanical-fix path ever
 * wrote a module entry; tools had no writer at all).
 *
 * Covers a committed diff (against `--base`, default `origin/main`),
 * uncommitted working-tree changes, and untracked new files (a brand-new
 * module has no tracked history to diff against).
 *
 * Usage:
 *   npx tsx scripts/audit-content-revision-coverage.ts [--base <ref>] [--json]
 *
 * Exit codes:
 *   0 — every touched module/tool has a matching revisions.jsonl entry (or
 *       nothing was touched at all)
 *   1 — one or more touched modules/tools have no matching entry
 */

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = process.cwd()
const MODULES_DIR = path.resolve(REPO_ROOT, 'src/components/PKILearning/modules')
const MODULES_PREFIX = 'src/components/PKILearning/modules/'
const WORKSHOP_REGISTRY_REL = 'src/components/Playground/workshopRegistry.tsx'
const REVISIONS_REL = 'public/data/revisions.jsonl'

const PT_ID_VERSION_RE =
  /pt_id:\s*['"](PT-[A-Za-z0-9-]+)['"],\s*\n\s*version:\s*['"](\d+\.\d+\.\d+)['"]/g

interface Finding {
  kind: 'module' | 'tool'
  name: string
  id: string | null
  detail: string
}

function resolveBase(preferred?: string): string {
  if (preferred) return preferred
  // $GITHUB_BASE_REF is GitHub Actions' own answer to "what's this PR's base
  // branch" on pull_request events — prefer it over guessing, since a fork PR
  // or a differently-named default branch would make the origin/main/main
  // guesses below silently wrong instead of just unavailable.
  const candidates = process.env.GITHUB_BASE_REF
    ? [`origin/${process.env.GITHUB_BASE_REF}`, 'origin/main', 'main']
    : ['origin/main', 'main']
  for (const candidate of candidates) {
    try {
      execFileSync('git', ['rev-parse', '--verify', candidate], { cwd: REPO_ROOT, stdio: 'ignore' })
      return candidate
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    `Could not resolve a base ref (tried ${candidates.join(', ')}) — pass --base explicitly.`
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

function fileAtRef(ref: string, relPath: string): string | null {
  try {
    return execFileSync('git', ['show', `${ref}:${relPath}`], { cwd: REPO_ROOT, encoding: 'utf-8' })
  } catch {
    return null // file didn't exist at that ref, or ref doesn't resolve
  }
}

function moduleIdForDir(dirName: string): string | null {
  const manifestPath = path.join(MODULES_DIR, dirName, 'manifest.ts')
  if (!fs.existsSync(manifestPath)) return null
  const text = fs.readFileSync(manifestPath, 'utf-8')
  const m = text.match(/^\s*id:\s*['"]([^'"]+)['"]/m)
  return m ? m[1] : null
}

function ptIdVersions(text: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of text.matchAll(PT_ID_VERSION_RE)) out.set(m[1], m[2])
  return out
}

/** pt_ids whose `version` differs between two workshopRegistry.tsx texts —
 * a semantic diff (compare parsed id->version maps) rather than a line diff,
 * so it's correct regardless of how many unrelated tools sit between them
 * in the file or how the surrounding diff hunks are chunked. */
function changedToolIds(oldText: string | null, newText: string): Set<string> {
  const oldMap = oldText ? ptIdVersions(oldText) : new Map<string, string>()
  const newMap = ptIdVersions(newText)
  const changed = new Set<string>()
  for (const [id, version] of newMap) {
    if (oldMap.get(id) !== version) changed.add(id)
  }
  return changed
}

/** Ids covered by newly ADDED `domain: "module"` / `domain: "tool"` lines,
 * across both the committed diff and uncommitted working-tree changes. */
function addedRevisionIds(base: string): { modules: Set<string>; tools: Set<string> } {
  const modules = new Set<string>()
  const tools = new Set<string>()
  for (const range of [`${base}...HEAD`, 'HEAD']) {
    const diff = diffContent(range, REVISIONS_REL)
    for (const line of diff.split('\n')) {
      if (!line.startsWith('+') || line.startsWith('+++')) continue
      let entry: {
        domain?: string
        module_id?: string | null
        tool_id?: string | null
        record_ids?: string[]
      }
      try {
        entry = JSON.parse(line.slice(1))
      } catch {
        continue // diff hunk header / partial line, not a full JSON record
      }
      if (entry.domain === 'module') {
        if (entry.module_id) modules.add(entry.module_id)
        for (const id of entry.record_ids ?? []) modules.add(id)
      } else if (entry.domain === 'tool') {
        if (entry.tool_id) tools.add(entry.tool_id)
      }
    }
  }
  return { modules, tools }
}

function main(): void {
  const args = process.argv.slice(2)
  const wantJson = args.includes('--json')
  const baseIdx = args.indexOf('--base')
  const explicitBase = baseIdx >= 0 ? args[baseIdx + 1] : undefined
  const base = resolveBase(explicitBase)

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

  let toolsTouched = new Set<string>()
  if (files.has(WORKSHOP_REGISTRY_REL)) {
    const currentText = fs.readFileSync(path.resolve(REPO_ROOT, WORKSHOP_REGISTRY_REL), 'utf-8')
    const baseText = fileAtRef(base, WORKSHOP_REGISTRY_REL)
    toolsTouched = changedToolIds(baseText, currentText)
  }

  if (modulesTouchedDirs.size === 0 && toolsTouched.size === 0) {
    if (wantJson) {
      process.stdout.write(JSON.stringify({ findings: [] }, null, 2) + '\n')
    } else {
      console.log('PASS No Learn-module or Playground-tool content changes in this diff.')
    }
    process.exit(0)
  }

  const coveredIds = files.has(REVISIONS_REL)
    ? addedRevisionIds(base)
    : { modules: new Set<string>(), tools: new Set<string>() }

  const findings: Finding[] = []
  for (const dirName of modulesTouchedDirs) {
    const moduleId = moduleIdForDir(dirName)
    if (moduleId && coveredIds.modules.has(moduleId)) continue
    findings.push({
      kind: 'module',
      name: dirName,
      id: moduleId,
      detail: moduleId
        ? `content.ts/manifest.ts changed under ${dirName}/ but no matching revisions.jsonl ` +
          `entry (domain="module", covering id '${moduleId}') found in this diff`
        : `content.ts/manifest.ts changed under ${dirName}/ but its manifest.ts has no resolvable id`,
    })
  }
  for (const ptId of toolsTouched) {
    if (coveredIds.tools.has(ptId)) continue
    findings.push({
      kind: 'tool',
      name: ptId,
      id: ptId,
      detail:
        `${ptId}'s version changed in ${WORKSHOP_REGISTRY_REL} but no matching revisions.jsonl ` +
        `entry (domain="tool", tool_id='${ptId}') found in this diff`,
    })
  }

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }

  const touchedCount = modulesTouchedDirs.size + toolsTouched.size
  if (findings.length === 0) {
    console.log(`PASS ${touchedCount} touched item(s) all have a matching revisions.jsonl entry.`)
    process.exit(0)
  }

  console.log(`FAIL ${findings.length} item(s) changed without a matching revisions.jsonl entry:\n`)
  for (const f of findings) {
    console.log(`  [${f.kind}:${f.name}] ${f.detail}`)
  }
  console.log(
    '\nRun (from pqctoday-priv/maintenance/):\n' +
      '  python3 emit_revision.py --module-edit --modules <id[,id...]> --hub-root <this hub worktree>\n' +
      '  python3 emit_revision.py --tool-edit --tools <PT-id[,PT-id...]> --hub-root <this hub worktree>\n' +
      'before committing, then re-run this check.'
  )
  process.exit(1)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
