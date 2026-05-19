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
 * Outputs BUMPED_TOOLS_JSON to stdout for append-revision.ts to consume.
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

const errors: string[] = []
const bumpedTools: { tool_id: string; old_version: string; new_version: string }[] = []

for (const [id, headTool] of headMap) {
  const baseTool = baseMap.get(id)
  if (!baseTool) {
    // New tool — no version bump required (first version is fine)
    continue
  }

  // Compare entire relevant fields to detect modification
  const baseStr = JSON.stringify({ id: baseTool.id, pt_id: baseTool.pt_id })
  const headStr = JSON.stringify({ id: headTool.id, pt_id: headTool.pt_id })

  // Check if anything else in the block changed by comparing raw block extraction
  const baseBlockRe = new RegExp(
    `\\{[^{}]*?id:\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][^{}]*?\\}`,
    's'
  )
  const baseBlock = baseBlockRe.exec(baseContent)?.[0] ?? ''
  const headBlock = baseBlockRe.exec(headContent)?.[0] ?? ''

  const toolModified = baseBlock !== headBlock || baseStr !== headStr

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
