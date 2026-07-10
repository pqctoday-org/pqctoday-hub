#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/apply-protocol-matrix-updates.ts
 *
 * Idempotent applier for protocol-matrix stage/stageNote drift detected
 * by `scripts/enrich-protocol-matrix.py`.
 *
 * Reads:  reports/protocol-matrix-updates.json
 *         (produced by the enrichment script)
 * Writes: src/data/pqcProtocolMatrix.ts  (in-place edit — only with --apply)
 *
 * Behaviour:
 *  - DRY-RUN by default: prints the unified diff that *would* be applied,
 *    then exits 0. Run with `--apply` to actually write the file.
 *  - Only touches `stage:` and `stageNote:` lines on the row+dimension
 *    pair surfaced by the enrichment report. Never touches refs[],
 *    deployment fields, or anything else.
 *  - Bumps PROTOCOL_MATRIX_LAST_UPDATED to today (ISO date) on --apply.
 *  - Refuses to run if the matrix file is dirty in git (uncommitted
 *    changes), to keep the diff narrow and reviewable.
 *
 * Usage:
 *   npx tsx scripts/apply-protocol-matrix-updates.ts           # dry-run
 *   npx tsx scripts/apply-protocol-matrix-updates.ts --apply
 *   npx tsx scripts/apply-protocol-matrix-updates.ts --apply --allow-dirty
 *
 * Exit codes:
 *   0 — clean (no updates, or apply succeeded)
 *   1 — drift detected (dry-run only — same as --apply but no write)
 *   2 — error (missing report, dirty tree, malformed input)
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface StageDelta {
  row_id: string
  dimension: 'pureKem' | 'hybridKem' | 'pureSig' | 'hybridSig'
  ref_id: string
  encoded_stage: string | null
  current_stage: string | null
  current_state_slug: string | null
  last_updated: string | null
  notes: string[]
}

interface EnrichmentReport {
  generated_at: string
  deltas: StageDelta[]
  xref_issues: unknown[]
  llm_proposals: unknown[]
}

const REPO_ROOT = join(import.meta.dirname ?? __dirname, '..')
const MATRIX_FILE = join(REPO_ROOT, 'src', 'data', 'pqcProtocolMatrix.ts')
const REPORT_FILE = join(REPO_ROOT, 'reports', 'protocol-matrix-updates.json')

function isMatrixDirty(): boolean {
  try {
    const out = execSync(`git status --porcelain -- ${MATRIX_FILE}`, { encoding: 'utf-8' })
    return out.trim().length > 0
  } catch {
    return false
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Locate the dimension block of a row and patch its `stage:` and `stageNote:`
 * lines. The matrix file follows a strict shape so a small regex over the
 * file body is sufficient; if shape changes, the audit script will flag it.
 *
 * Returns the new file contents (or the original if no patch applied).
 */
function patchMatrix(source: string, deltas: StageDelta[]): { next: string; applied: number } {
  let next = source
  let applied = 0
  const grouped = new Map<string, StageDelta[]>()
  for (const d of deltas) {
    if (!d.current_stage) continue
    const key = `${d.row_id}::${d.dimension}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(d)
  }

  for (const [key, ds] of grouped) {
    const [rowId, dim] = key.split('::')
    const newStage = ds[0].current_stage!
    const newNote = ds[0].last_updated
      ? `${newStage.replace(/-/g, ' ')} (datatracker ${ds[0].last_updated})`
      : newStage.replace(/-/g, ' ')

    // Find `id: '<rowId>'` and then the `<dim>: {` block beneath it.
    const rowAnchor = new RegExp(`id:\\s*'${rowId}'`)
    const rowIdx = next.search(rowAnchor)
    if (rowIdx < 0) continue
    // From rowIdx, find the next `<dim>: {`
    const dimAnchor = new RegExp(`${dim}:\\s*\\{`)
    const dimRel = next.slice(rowIdx).search(dimAnchor)
    if (dimRel < 0) continue
    const dimStart = rowIdx + dimRel
    // Find the matching closing brace of this dimension block.
    let depth = 0
    let dimEnd = dimStart
    for (let i = dimStart; i < next.length; i++) {
      if (next[i] === '{') depth++
      else if (next[i] === '}') {
        depth--
        if (depth === 0) {
          dimEnd = i
          break
        }
      }
    }
    const block = next.slice(dimStart, dimEnd + 1)

    let nextBlock = block
    const stageRe = /stage:\s*'[^']*'/
    if (stageRe.test(nextBlock)) {
      nextBlock = nextBlock.replace(stageRe, `stage: '${newStage}'`)
    } else {
      // insert after the `value:` line
      nextBlock = nextBlock.replace(/(value:\s*'[^']+',)/, `$1\n        stage: '${newStage}',`)
    }
    const stageNoteRe = /stageNote:\s*'[^']*'/
    if (stageNoteRe.test(nextBlock)) {
      nextBlock = nextBlock.replace(stageNoteRe, `stageNote: '${newNote}'`)
    } else {
      nextBlock = nextBlock.replace(/(stage:\s*'[^']+',)/, `$1\n        stageNote: '${newNote}',`)
    }
    if (nextBlock !== block) {
      next = next.slice(0, dimStart) + nextBlock + next.slice(dimEnd + 1)
      applied += 1
    }
  }

  if (applied > 0) {
    next = next.replace(
      /PROTOCOL_MATRIX_LAST_UPDATED\s*=\s*'[^']+'/,
      `PROTOCOL_MATRIX_LAST_UPDATED = '${todayIso()}'`
    )
  }

  return { next, applied }
}

function main(): void {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply')
  const allowDirty = args.has('--allow-dirty')

  if (!existsSync(REPORT_FILE)) {
    console.error(`ERROR: report not found at ${REPORT_FILE}`)
    console.error('Run scripts/enrich-protocol-matrix.py first.')
    process.exit(2)
  }
  const report = JSON.parse(readFileSync(REPORT_FILE, 'utf-8')) as EnrichmentReport
  if (!report.deltas || report.deltas.length === 0) {
    console.log('No stage drift to apply.')
    process.exit(0)
  }

  const source = readFileSync(MATRIX_FILE, 'utf-8')
  const { next, applied } = patchMatrix(source, report.deltas)

  if (applied === 0) {
    console.log('Patch found no targets to update (matrix already matches).')
    process.exit(0)
  }

  if (!apply) {
    console.log(`DRY-RUN: would patch ${applied} dimension block(s).`)
    console.log('Re-run with --apply to write changes.')
    console.log()
    // print a small contextual preview
    const previewLines = next
      .split('\n')
      .slice(0, 30)
      .map((l, i) => `  ${String(i + 1).padStart(3)} | ${l}`)
      .join('\n')
    console.log('Preview (first 30 lines of patched file):')
    console.log(previewLines)
    process.exit(1)
  }

  if (!allowDirty && isMatrixDirty()) {
    console.error('ERROR: matrix file has uncommitted changes; refusing to overwrite.')
    console.error('Either commit them first, or pass --allow-dirty.')
    process.exit(2)
  }

  writeFileSync(MATRIX_FILE, next)
  console.log(`OK Applied ${applied} stage update(s) to ${MATRIX_FILE}`)
  console.log(`OK Bumped PROTOCOL_MATRIX_LAST_UPDATED to ${todayIso()}`)
}

main()
