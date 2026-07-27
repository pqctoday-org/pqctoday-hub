#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-tool-version-bump.ts — PR CI gate
 *
 * Fails if workshopRegistry.tsx changed but any modified tool's version
 * was not bumped relative to origin/main.
 *
 * Also checks individual tool component TSX files under src/components/Playground/
 * (heuristic: file change → the tool with matching id needs a version bump).
 *
 * Outputs BUMPED_TOOLS_JSON to stdout (currently unconsumed — its former
 * reader, append-revision.ts, was deleted 2026-07-26; see
 * pqctoday-priv/maintenance/TRUST-ENGINE-RETIREMENT-PLAN-07262026.md).
 *
 * Exit codes:
 *   0 — all modified tools have version bumps (or no registry change)
 *   1 — one or more modified tools missing version bump
 */

import { execSync } from 'child_process'

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

/** Compare semver strings. Returns true if b > a */
function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0)
  const [aMaj, aMin, aPat] = parse(a)
  const [bMaj, bMin, bPat] = parse(b)
  if (bMaj !== aMaj) return bMaj > aMaj
  if (bMin !== aMin) return bMin > aMin
  return bPat > aPat
}

interface ToolEntry {
  id: string
  pt_id: string
  version: string
}

/** Extract tool entries (id, pt_id, version) from registry source text */
function parseToolEntries(src: string): ToolEntry[] {
  const tools: ToolEntry[] = []
  // Match each tool object block: find id, pt_id, version lines within proximity
  const toolBlockRe = /\{[^{}]*?id:\s*['"]([^'"]+)['"][^{}]*?\}/gs
  let blockMatch: RegExpExecArray | null
  while ((blockMatch = toolBlockRe.exec(src)) !== null) {
    const block = blockMatch[0]
    const idMatch = /\bid:\s*['"]([^'"]+)['"]/.exec(block)
    const ptMatch = /pt_id:\s*['"]([^'"]+)['"]/.exec(block)
    const verMatch = /version:\s*['"]([^'"]+)['"]/.exec(block)
    if (idMatch && ptMatch && verMatch) {
      tools.push({ id: idMatch[1], pt_id: ptMatch[1], version: verMatch[1] })
    }
  }
  return tools
}

// ── Main ─────────────────────────────────────────────────────────────────────

const changedFiles = run('git diff --name-only origin/main...HEAD')

const registryChanged = changedFiles.includes('workshopRegistry')

if (!registryChanged) {
  console.log('workshopRegistry.tsx unchanged — skipping tool version bump check.')
  console.log('BUMPED_TOOLS_JSON=[]')
  process.exit(0)
}

// Get base (origin/main) registry source
const baseContent = run('git show origin/main:src/components/Playground/workshopRegistry.tsx')
const headContent = run('git show HEAD:src/components/Playground/workshopRegistry.tsx')

if (!baseContent || !headContent) {
  console.log('Could not read registry from git — skipping version bump check.')
  process.exit(0)
}

const baseTools = parseToolEntries(baseContent)
const headTools = parseToolEntries(headContent)

const baseMap = new Map(baseTools.map((t) => [t.id, t]))
const headMap = new Map(headTools.map((t) => [t.id, t]))

// Changed (+/-) lines of the registry diff. A tool counts as "modified" only if
// its own id appears here. The previous raw-block regex couldn't span nested
// braces and mis-attributed blocks when other tools shifted position, so it
// flagged untouched tools whenever the registry changed at all (the A1 manifest
// cut-over churns this file heavily). Anchoring on the real diff is precise.
const registryChangedLines = run(
  'git diff origin/main...HEAD -- src/components/Playground/workshopRegistry.tsx'
)
  .split('\n')
  .filter((l) => /^[+-]/.test(l) && !/^[+-]{3}/.test(l))
  .join('\n')

const errors: string[] = []
const bumpedTools: { tool_id: string; old_version: string; new_version: string }[] = []

for (const [id, headTool] of headMap) {
  const baseTool = baseMap.get(id)
  if (!baseTool) {
    // New tool — no version bump required (first version is fine)
    continue
  }

  // A tool needs a version bump only if its own definition changed. Detect that
  // from the real diff (its id on a changed line) or a pt_id change — robust to
  // the cut-over churn that the old raw-block regex mis-attributed.
  const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const toolModified =
    baseTool.pt_id !== headTool.pt_id ||
    new RegExp(`['"\`]${escId}['"\`]`).test(registryChangedLines)

  if (!toolModified) continue

  if (!semverGt(baseTool.version, headTool.version)) {
    errors.push(
      `  ✗ Tool '${id}' (${headTool.pt_id}) was modified but version not bumped ` +
        `(still ${headTool.version})`
    )
  } else {
    bumpedTools.push({
      tool_id: id,
      old_version: baseTool.version,
      new_version: headTool.version,
    })
  }
}

// Output bumped tools JSON for downstream CI steps
console.log(`BUMPED_TOOLS_JSON=${JSON.stringify(bumpedTools)}`)

if (errors.length > 0) {
  console.error('\nTool version bump check FAILED:')
  errors.forEach((e) => console.error(e))
  console.error(
    '\nBump the version field (semver) for each modified tool in workshopRegistry.tsx.\n'
  )
  process.exit(1)
}

console.log(`Tool version bump check passed. ${bumpedTools.length} tool(s) bumped.`)
process.exit(0)
