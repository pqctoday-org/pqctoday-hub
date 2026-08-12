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
 *   npx tsx scripts/apply-protocol-matrix-updates.ts --apply --items-file=<path>
 *
 * `--items-file=<path>` (WP-1.11, 2026-07-25): names a JSON file holding an
 * array of reviewer-approved {rowId, dimension, approvedStage,
 * expectedEncoded} objects — the admin apply flow's per-item selection. When
 * given, ONLY those (rowId, dimension) pairs are patched, never the whole
 * report; each is re-checked against the live report first (stale-draft
 * guard) and reported separately if it no longer matches what was approved.
 * Without this flag the whole-report behavior is unchanged, for the
 * standalone `npm run apply:protocol-matrix` workflow.
 *
 * Exit codes:
 *   0 — clean (no updates, or apply succeeded)
 *   1 — drift detected (dry-run only — same as --apply but no write)
 *   2 — error (missing report, dirty tree, malformed input)
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { DRAFT_STAGE_LEVEL, type DraftStage } from '../src/data/pqcProtocolMatrix'

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
 * The exact shape THIS script writes into `stageNote` — "<stage words>
 * (datatracker <ISO date>)" — and nothing else.
 *
 * CURATED-NOTE GUARD (2026-08-09, global maintenance audit). The applier
 * replaced `stageNote` unconditionally, and `/stageNote:\s*'[^']*'/` matches
 * across newlines, so a multi-line hand-written note was silently swallowed by
 * a one-line generated one. Measured damage on a real run: it overwrote
 * ike-ipsec:hybridKem's note — whose text is literally a record of this same
 * mistake being made and reverted on 2026-07-27 ("a hand-verified apply
 * incorrectly set this to rfc-published on the strength of RFC 9370 alone")
 * — and re-introduced that exact wrong value, because RFC 9370 is the shared
 * multi-KE enabler both dimensions cite, not the hybrid-KEM mechanism. It did
 * the same to kerberos:pureKem off RFC 9935, an X.509 OID RFC.
 *
 * The script cannot judge whether a ref really evidences a cell — that is the
 * SME review this data depends on. What it CAN do is refuse to destroy the
 * record of that review. So: a cell whose stageNote is anything other than
 * this generator's own output is treated as human-curated and skipped, and
 * reported the same way a downgrade is. Same rank as the downgrade guard,
 * same reason: the failure is silent and the loss is unrecoverable from the
 * file itself.
 */
const GENERATED_NOTE_RE = /^[a-z][a-z ]*(?: \(datatracker \d{4}-\d{2}-\d{2}\))?$/

/**
 * A `stageNote:` field in either quote style.
 *
 * QUOTE-STYLE GUARD (2026-08-12) — and this one is the worst of the set.
 * Everything above read `/stageNote:\s*'([^']*)'/`, single quotes only. A note
 * containing an apostrophe cannot be written in single quotes, so prettier
 * writes it in double. **Ten of the matrix's 76 stageNotes are double-quoted,
 * and every one of them is a hand-written 2026-08-09 correction** — the exact
 * notes the curated-note guard exists to protect were the exact notes it could
 * not see:
 *
 *   tls-1-3::pureKem, x509::hybridKem, smime::hybridKem, cose::pureKem,
 *   cose::hybridKem, est-cmp::hybridKem, kerberos::hybridKem,
 *   dtls-1-3::pureKem, fido-2::pureKem, macsec::pureKem
 *
 * The selection effect is what makes it dangerous: prose careful enough to say
 * "the datatracker's IESG state" earns an apostrophe, so the more considered
 * the note, the more certainly it was invisible.
 *
 * The write path had the same blind spot with a worse consequence. On a
 * double-quoted cell `stageNoteRe.test()` was false, so it took the INSERT
 * branch and added a second `stageNote:` key beside the first — a duplicate
 * key in an object literal, where the last one silently wins.
 */
const STAGE_NOTE_RE = /stageNote:\s*(?:'([^']*)'|"([^"]*)")/

export function isCuratedNote(note: string | undefined): boolean {
  if (note === undefined) return false
  const trimmed = note.trim()
  if (trimmed === '') return false
  return !GENERATED_NOTE_RE.test(trimmed)
}

/**
 * The exact character span of one `<dim>: { … }` block inside one row, bounded
 * by brace matching. `undefined` when the row or the dimension is absent.
 *
 * SIBLING-NOTE GUARD (2026-08-12). The write path always brace-matched, but the
 * curated-note READ path took a flat 4,000-character window from the start of
 * the dimension block and matched the first `stageNote:` inside it. For a cell
 * that has no note of its own, that window runs straight past its closing brace
 * into the next dimensions — so the cell is blocked on a note that belongs to a
 * sibling. Measured on the 2026-08-11 run: fido-2::hybridKem and fido-2::pureSig
 * were both blocked quoting fido-2::hybridSig's note about JOSE composite
 * signatures, which has nothing to do with either. Two of ten blocks were wrong,
 * and hybridKem was a legitimate RFC 10024 upgrade that had to be applied by
 * hand instead.
 *
 * The failure direction matters: this only ever over-blocks, never overwrites,
 * because the write path was already correct. But an over-block is not free —
 * it is indistinguishable in the output from a real SME decision, so the cells
 * it hides get treated as reviewed when nobody reviewed them.
 */
export function dimensionSpan(
  source: string,
  rowId: string,
  dim: string
): { start: number; end: number } | undefined {
  const rIdx = source.search(new RegExp(`id:\\s*'${rowId}'`))
  if (rIdx < 0) return undefined
  const dRel = source.slice(rIdx).search(new RegExp(`${dim}:\\s*\\{`))
  if (dRel < 0) return undefined
  const start = rIdx + dRel
  let depth = 0
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return { start, end: i }
    }
  }
  return undefined
}

/**
 * Locate the dimension block of a row and patch its `stage:` and `stageNote:`
 * lines. The matrix file follows a strict shape so a small regex over the
 * file body is sufficient; if shape changes, the audit script will flag it.
 *
 * Returns the new file contents (or the original if no patch applied).
 */
export function patchMatrix(
  source: string,
  deltas: StageDelta[]
): {
  next: string
  applied: number
  appliedKeys: string[]
  downgrades: string[]
  curatedNotes: string[]
  statelessCells: string[]
} {
  let next = source
  let applied = 0
  const appliedKeys: string[] = []
  const grouped = new Map<string, StageDelta[]>()
  for (const d of deltas) {
    if (!d.current_stage) continue
    const key = `${d.row_id}::${d.dimension}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(d)
  }

  const downgrades: string[] = []
  const curatedNotes: string[] = []
  const statelessCells: string[] = []

  for (const [key, ds] of grouped) {
    const [rowId, dim] = key.split('::')
    const newStage = ds[0].current_stage!
    const oldStage = ds[0].encoded_stage

    // DOWNGRADE GUARD (2026-07-25, deferred finding F8 from the 07-23 E2E
    // validation). This applier wrote current_stage unconditionally. The
    // IETF datatracker query can legitimately return a LOWER stage than
    // what's encoded — a draft that supersedes a published RFC, a query
    // resolving to the wrong document, a transient API answer — and the
    // result would have been the matrix silently showing a published RFC as
    // un-published. That is the single worst thing this file can say.
    //
    // Ranking comes from DRAFT_STAGE_LEVEL, the same map that drives the
    // heatmap palette, rather than a second ordering invented here. Note it
    // is deliberately non-injective (wg-document and wg-last-call are both
    // 4; iesg-submitted and rfc-editor-queue are both 6) — so this only
    // blocks a STRICT decrease, and same-rank moves still apply.
    //
    // A downgrade is reported, never silently skipped: a real regression
    // needs a human to look at it, not to be swallowed.
    if (oldStage && newStage) {
      const oldLevel = DRAFT_STAGE_LEVEL[oldStage as DraftStage]
      const newLevel = DRAFT_STAGE_LEVEL[newStage as DraftStage]
      if (oldLevel !== undefined && newLevel !== undefined && newLevel < oldLevel) {
        downgrades.push(
          `${rowId}::${dim}: ${oldStage} (level ${oldLevel}) -> ${newStage} (level ${newLevel})`
        )
        continue
      }
    }
    // STAGELESS-CELL GUARD (2026-08-12).
    //
    // A cell with no `stage:` is not an unfilled field. It is a cell whose PQC
    // story is not one tracked document, so no point on the IETF ladder is the
    // honest answer — rpki-bgpsec::pureSig and kerberos::pureSig both list only
    // carrier documents (RFC 5280, RFC 6488, the CMS profile), and none of them
    // says anything about when PQC signing lands there.
    //
    // This guard exists because of a real near-miss on 2026-08-12. Those two
    // cells were being blocked by the curated-note check reading a SIBLING
    // dimension's note — accidental protection, for entirely the wrong reason.
    // Fixing that bug removed the accident and left the applier ready to write
    // stage: 'rfc-published' into rpki-bgpsec::pureSig on the strength of
    // RFC 5280, published 2008, about classical X.509. That is the same failure
    // ike-ipsec::hybridKem's note was written to record.
    //
    // Creating a stage is a stronger claim than advancing one: it asserts the
    // cell belongs on the ladder at all. The deltas are still reported, so a
    // human can add the stage deliberately if the cell really has a mechanism
    // document now.
    // Decided from the FILE, not from the report's `encoded_stage`. Those two
    // can disagree — a report can be stale, or carry '' for a cell that does
    // have a stage — and the file is the thing being changed. The pre-existing
    // "applies normally when no stage is encoded yet" test is exactly that
    // disagreement, and it still passes because its fixture cell really does
    // have a stage.
    const probe = dimensionSpan(next, rowId, dim)
    if (probe && !/stage:\s*'[^']*'/.test(next.slice(probe.start, probe.end + 1))) {
      statelessCells.push(
        `${rowId}::${dim}: (no stage encoded) -> ${newStage} via ${ds.map((d) => d.ref_id).join(', ')}`
      )
      continue
    }
    // CURATED-NOTE GUARD — see isCuratedNote above. Checked AFTER the
    // downgrade guard so a cell that is both reports as the downgrade it is.
    const existingNoteMatch = (() => {
      const span = dimensionSpan(next, rowId, dim)
      if (!span) return undefined
      const nm = next.slice(span.start, span.end + 1).match(STAGE_NOTE_RE)
      return nm ? (nm[1] ?? nm[2]) : undefined
    })()
    if (isCuratedNote(existingNoteMatch)) {
      curatedNotes.push(
        `${rowId}::${dim}: ${oldStage ?? '(none)'} -> ${newStage} — stageNote is human-curated: ` +
          `"${(existingNoteMatch ?? '').slice(0, 90)}${(existingNoteMatch ?? '').length > 90 ? '…' : ''}"`
      )
      continue
    }
    const newNote = ds[0].last_updated
      ? `${newStage.replace(/-/g, ' ')} (datatracker ${ds[0].last_updated})`
      : newStage.replace(/-/g, ' ')

    // The same brace-matched span the curated-note read uses above, so the
    // block this writes into and the block that was checked for a note are by
    // construction the same characters.
    const span = dimensionSpan(next, rowId, dim)
    if (!span) continue
    const { start: dimStart, end: dimEnd } = span
    const block = next.slice(dimStart, dimEnd + 1)

    let nextBlock = block
    const stageRe = /stage:\s*'[^']*'/
    if (stageRe.test(nextBlock)) {
      nextBlock = nextBlock.replace(stageRe, `stage: '${newStage}'`)
    } else {
      // insert after the `value:` line
      nextBlock = nextBlock.replace(/(value:\s*'[^']+',)/, `$1\n        stage: '${newStage}',`)
    }
    // Both quote styles — see STAGE_NOTE_RE. Missing the double-quoted case
    // here did not merely skip the write, it took the insert branch below and
    // added a SECOND stageNote key beside the existing one.
    if (STAGE_NOTE_RE.test(nextBlock)) {
      nextBlock = nextBlock.replace(STAGE_NOTE_RE, `stageNote: '${newNote}'`)
    } else {
      nextBlock = nextBlock.replace(/(stage:\s*'[^']+',)/, `$1\n        stageNote: '${newNote}',`)
    }
    if (nextBlock !== block) {
      next = next.slice(0, dimStart) + nextBlock + next.slice(dimEnd + 1)
      applied += 1
      appliedKeys.push(key)
    }
  }

  if (applied > 0) {
    next = next.replace(
      /PROTOCOL_MATRIX_LAST_UPDATED\s*=\s*'[^']+'/,
      `PROTOCOL_MATRIX_LAST_UPDATED = '${todayIso()}'`
    )
  }

  return { next, applied, appliedKeys, downgrades, curatedNotes, statelessCells }
}

/** One reviewer-approved item, as the admin apply flow writes it (WP-1.11,
 * 2026-07-25) — `--items-file=<path>` names a JSON file holding an array of
 * these. `approvedStage` is `resolution.value` (falls back to the finding's
 * own `expected` when a reviewer approved as-is without editing); `
 * expectedEncoded` is the finding's `current` — the encoded stage the
 * reviewer actually saw. Both are cross-checked against the LIVE report
 * below, same "stale-draft guard" shape as every Python-side field-
 * correction applier: the report can be regenerated between approval and
 * apply, and a mismatch there must skip loudly, not silently patch the
 * wrong value. */
export interface ApprovedItem {
  rowId: string
  dimension: string
  approvedStage: string
  expectedEncoded: string | null
}

function loadItemsFilter(): ApprovedItem[] | null {
  const arg = process.argv.slice(2).find((a) => a.startsWith('--items-file='))
  if (!arg) return null
  const path = arg.slice('--items-file='.length)
  return JSON.parse(readFileSync(path, 'utf-8')) as ApprovedItem[]
}

/**
 * Narrows `report.deltas` down to exactly the reviewer-approved (rowId,
 * dimension) pairs, applying the stale-draft guard. This is the fix for
 * the whole-file/per-item mismatch (WP-1.11): before this, ANY approved
 * protocol-matrix item caused the ENTIRE report to be patched — approving
 * one delta and rejecting another had no effect, because nothing told this
 * script which ones were actually reviewed. `deltas` returned here carry
 * the delta AS RECORDED IN THE LIVE REPORT (not the reviewer's stale copy)
 * — the reviewer only chose WHICH pair to write, never a value that
 * overrides the deterministic datatracker source of truth.
 */
export interface StaleItem {
  key: string
  reason: string
}

export function narrowToApprovedItems(
  deltas: StageDelta[],
  items: ApprovedItem[]
): { narrowed: StageDelta[]; stale: StaleItem[] } {
  const byKey = new Map<string, StageDelta>()
  for (const d of deltas) byKey.set(`${d.row_id}::${d.dimension}`, d)
  const narrowed: StageDelta[] = []
  const stale: StaleItem[] = []
  for (const item of items) {
    const key = `${item.rowId}::${item.dimension}`
    const live = byKey.get(key)
    if (!live) {
      stale.push({
        key,
        reason: 'no longer in the report (already applied, or the drift resolved itself)',
      })
      continue
    }
    if (item.expectedEncoded != null && live.encoded_stage !== item.expectedEncoded) {
      stale.push({
        key,
        reason:
          `encoded stage is now ${live.encoded_stage ?? 'null'}, not the ` +
          `${item.expectedEncoded} this approval was based on`,
      })
      continue
    }
    if (live.current_stage !== item.approvedStage) {
      stale.push({
        key,
        reason:
          `datatracker now reports ${live.current_stage ?? 'null'}, not the ` +
          `${item.approvedStage} that was approved`,
      })
      continue
    }
    narrowed.push(live)
  }
  return { narrowed, stale }
}

function printResultJson(appliedKeys: string[], stale: StaleItem[], downgrades: string[]): void {
  // One machine-parseable line, additive to the human-readable output above
  // it — only ever printed in --items-file mode, so the standalone `npm run
  // apply:protocol-matrix` CLI workflow's output is byte-for-byte unchanged.
  // Bare keys are derived HERE, once, by the code that built the formatted
  // strings in the first place — never re-parsed downstream (a Python
  // process splitting "rowId::dim: reason" on ':' would trip over the '::'
  // inside the key itself).
  const staleKeys = stale.map((s) => s.key)
  const blockedKeys = downgrades.map((d) => d.split(': ')[0])
  console.log(
    'RESULT-JSON: ' +
      JSON.stringify({
        appliedKeys,
        staleKeys,
        blockedKeys,
        staleReasons: stale.map((s) => `${s.key}: ${s.reason}`),
        blockedReasons: downgrades,
      })
  )
}

function main(): void {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply')
  const allowDirty = args.has('--allow-dirty')
  const itemsFilter = loadItemsFilter()

  if (!existsSync(REPORT_FILE)) {
    console.error(`ERROR: report not found at ${REPORT_FILE}`)
    console.error('Run scripts/enrich-protocol-matrix.py first.')
    process.exit(2)
  }
  const report = JSON.parse(readFileSync(REPORT_FILE, 'utf-8')) as EnrichmentReport
  if (!report.deltas || report.deltas.length === 0) {
    if (itemsFilter) {
      printResultJson(
        [],
        itemsFilter.map((i) => ({
          key: `${i.rowId}::${i.dimension}`,
          reason: 'report has no deltas at all',
        })),
        []
      )
    }
    console.log('No stage drift to apply.')
    process.exit(0)
  }

  let deltasToPatch = report.deltas
  let staleItems: StaleItem[] = []
  if (itemsFilter) {
    const r = narrowToApprovedItems(report.deltas, itemsFilter)
    deltasToPatch = r.narrowed
    staleItems = r.stale
    if (staleItems.length > 0) {
      console.error(`STALE ${staleItems.length} approved item(s) — not applied:`)
      for (const s of staleItems) console.error(`  ${s.key}: ${s.reason}`)
      console.error('')
    }
  }

  const source = readFileSync(MATRIX_FILE, 'utf-8')
  const { next, applied, appliedKeys, downgrades, curatedNotes, statelessCells } = patchMatrix(
    source,
    deltasToPatch
  )

  // Reported before anything else, and on stderr, because a downgrade is not
  // routine: it means the feed disagreed with the matrix in the one direction
  // that would make published work look unpublished. Blocked, never silently
  // dropped — a real regression needs a human, and a spurious one needs the
  // query fixed.
  if (downgrades.length > 0) {
    console.error(`BLOCKED ${downgrades.length} stage DOWNGRADE(s) — not applied:`)
    for (const d of downgrades) console.error(`  ${d}`)
    console.error('A lower stage than the one encoded usually means the datatracker')
    console.error('query resolved to the wrong document, not that work regressed.')
    console.error('Verify against the datatracker by hand before changing anything.')
    console.error('')
  }

  if (curatedNotes.length > 0) {
    console.error(
      `BLOCKED ${curatedNotes.length} cell(s) with a HUMAN-CURATED stageNote — not applied:`
    )
    for (const c of curatedNotes) console.error(`  ${c}`)
    console.error('These notes record an SME decision about whether a ref actually')
    console.error('evidences this cell — exactly what this script cannot judge. Applying')
    console.error('would overwrite the decision with a generated one-liner. Update the')
    console.error('cell by hand, or clear the note first if it is genuinely obsolete.')
    console.error('')
  }

  if (statelessCells.length > 0) {
    console.error(`BLOCKED ${statelessCells.length} cell(s) with NO ENCODED STAGE — not applied:`)
    for (const s of statelessCells) console.error(`  ${s}`)
    console.error('A cell with no stage is not an unfilled field: its PQC story is not')
    console.error('one tracked document, so no rung on the ladder is the honest answer.')
    console.error('Every ref these cells list is a carrier or algorithm-identifier RFC')
    console.error('that says nothing about when PQC lands in the protocol. Adding a')
    console.error('stage is a claim about the cell, not an update to it — make it by hand.')
    console.error('')
  }

  if (applied === 0) {
    if (itemsFilter) printResultJson([], staleItems, downgrades)
    if (downgrades.length > 0 || curatedNotes.length > 0 || statelessCells.length > 0) {
      // Exit 1 = "drift detected, nothing applied" (the documented meaning),
      // NOT 0. Reporting "matrix already matches" here would be false: the
      // feed disagreed, we refused to act on it, and that needs attention.
      console.error('No forward drift to apply; only blocked downgrades/curated/stageless cells.')
      process.exit(1)
    }
    console.log('Patch found no targets to update (matrix already matches).')
    process.exit(0)
  }

  if (!apply) {
    if (itemsFilter) printResultJson(appliedKeys, staleItems, downgrades)
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
    if (itemsFilter) printResultJson([], staleItems, downgrades)
    console.error('ERROR: matrix file has uncommitted changes; refusing to overwrite.')
    console.error('Either commit them first, or pass --allow-dirty.')
    process.exit(2)
  }

  writeFileSync(MATRIX_FILE, next)
  if (itemsFilter) printResultJson(appliedKeys, staleItems, downgrades)
  console.log(`OK Applied ${applied} stage update(s) to ${MATRIX_FILE}`)
  console.log(`OK Bumped PROTOCOL_MATRIX_LAST_UPDATED to ${todayIso()}`)
}

// Run only when invoked as a script, not when imported. Without this guard
// `import { patchMatrix }` executes the whole CLI — including its
// process.exit() calls — which is what made the pure patch function
// untestable in the first place (2026-07-25).
const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href

if (invokedDirectly) {
  main()
}
