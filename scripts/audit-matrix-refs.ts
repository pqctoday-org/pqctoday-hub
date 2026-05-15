#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-matrix-refs.ts
 *
 * Hygiene gate for the PQC Protocol Support matrix
 * (`src/data/pqcProtocolMatrix.ts`).
 *
 * Invariant: no doc-ID references in prose. RFC numbers (e.g. "RFC 9941")
 * and IETF-draft slugs (e.g. "draft-ietf-tls-mlkem-07") must NEVER appear
 * inside a dimension `note`, `deploymentNote`, `noDeploymentReason`,
 * playground `*Note`, or live-deployment `what` field. They belong in the
 * structured `latestRelease[]` / `latestDraft[]` arrays.
 *
 * Usage:
 *   npx tsx scripts/audit-matrix-refs.ts          # human report
 *   npx tsx scripts/audit-matrix-refs.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — clean
 *   1 — violations found
 *
 * Wire into CI via `npm run audit:matrix-refs` (added in package.json).
 */

import { PROTOCOL_MATRIX, type ProtocolMatrixRow } from '../src/data/pqcProtocolMatrix'

const RFC_RE = /\bRFC[\s-]?(\d{4,5})\b/gi
const DRAFT_RE = /\b(draft-[a-z]+(?:-[a-z0-9]+)+(?:-\d+)?)/gi

interface Finding {
  rowId: string
  field: string
  ref: string
  snippet: string
}

function canonicalRfc(num: string): string {
  return `RFC ${num}`
}
function canonicalDraft(slug: string): string {
  return slug.replace(/-\d+$/, '')
}

function extractRefs(text: string | undefined): string[] {
  if (!text) return []
  const refs: string[] = []
  let m: RegExpExecArray | null
  RFC_RE.lastIndex = 0
  DRAFT_RE.lastIndex = 0
  while ((m = RFC_RE.exec(text)) !== null) refs.push(canonicalRfc(m[1]))
  while ((m = DRAFT_RE.exec(text)) !== null) refs.push(canonicalDraft(m[1]))
  return [...new Set(refs)]
}

function gatherTextFields(row: ProtocolMatrixRow): { field: string; text: string }[] {
  const items: { field: string; text: string }[] = []
  for (const dim of ['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const) {
    const s = row.dimensions[dim]
    if (s.note) items.push({ field: `${dim}.note`, text: s.note })
    if (s.deploymentNote) items.push({ field: `${dim}.deploymentNote`, text: s.deploymentNote })
  }
  if (row.noDeploymentReason)
    items.push({ field: 'noDeploymentReason', text: row.noDeploymentReason })
  for (const pg of row.playgrounds ?? []) {
    for (const k of ['pureKemNote', 'hybridKemNote', 'pureSigNote', 'hybridSigNote'] as const) {
      const v = pg[k]
      if (v) items.push({ field: `playground[${pg.toolId}].${k}`, text: v })
    }
  }
  for (const ld of row.liveDeployments ?? []) {
    if (ld.what) items.push({ field: `liveDeployments[${ld.provider}].what`, text: ld.what })
  }
  return items
}

function audit(): Finding[] {
  const findings: Finding[] = []
  for (const row of PROTOCOL_MATRIX) {
    const items = gatherTextFields(row)
    for (const { field, text } of items) {
      const refs = extractRefs(text)
      for (const ref of refs) {
        findings.push({
          rowId: row.id,
          field,
          ref,
          snippet: text.length > 80 ? text.slice(0, 80) + '…' : text,
        })
      }
    }
  }
  return findings
}

function main(): void {
  const wantJson = process.argv.includes('--json')
  const findings = audit()

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.length > 0 ? 1 : 0)
  }

  if (findings.length === 0) {
    console.log('✅ Matrix prose is doc-ID-free.')
    console.log(`   Rows audited: ${PROTOCOL_MATRIX.length}`)
    process.exit(0)
  }

  console.log(`❌ Found ${findings.length} doc-ID mentions in prose fields:`)
  console.log()
  const byRow = new Map<string, Finding[]>()
  for (const f of findings) {
    if (!byRow.has(f.rowId)) byRow.set(f.rowId, [])
    byRow.get(f.rowId)!.push(f)
  }
  for (const [rowId, fs] of byRow) {
    console.log(`── ${rowId} (${fs.length}) ──`)
    for (const f of fs) {
      console.log(`  ${f.ref.padEnd(50)}  in  ${f.field}`)
      console.log(`    "${f.snippet}"`)
    }
    console.log()
  }
  console.log("Fix: move each ref out of the prose field and into the row's")
  console.log('     latestRelease[] or latestDraft[] structured array.')
  process.exit(1)
}

main()
