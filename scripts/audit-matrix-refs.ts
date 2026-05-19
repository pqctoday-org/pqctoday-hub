#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-matrix-refs.ts
 *
 * Hygiene gate for the PQC Protocol Support matrix
 * (`src/data/pqcProtocolMatrix.ts`).
 *
 * Validations performed:
 *
 *  A) PROSE-REF HYGIENE — doc-ID references (RFC numbers, draft slugs) that
 *     appear in a dimension `note`, `stageNote`, `deploymentNote`,
 *     `noDeploymentReason`, playground `*Note`, or live-deployment `what`
 *     field MUST also be present in a structured ref array on the same row
 *     (`refs[]` on any dimension, or row-level `latestRelease[]` /
 *     `latestDraft[]`). Prose mentions without structured backing are
 *     flagged.
 *
 *  B) STAGE / VALUE CONSISTENCY — when `stage` is set, the coarse `value`
 *     must align with it (e.g. `stage='rfc-published'` ⇒ `value='rfc'`,
 *     `stage='na'` ⇒ `value='na'`).
 *
 *  C) REF ID SHAPE — every `refs[].id` must match the canonical IETF /
 *     vendor-spec naming pattern.
 *
 * Usage:
 *   npx tsx scripts/audit-matrix-refs.ts          # human report
 *   npx tsx scripts/audit-matrix-refs.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — clean
 *   1 — violations found
 */

import { fileURLToPath } from 'node:url'
import {
  PROTOCOL_MATRIX,
  type DimensionRef,
  type DimensionStatus,
  type DimensionStatusValue,
  type DraftStage,
  type ProtocolMatrixRow,
} from '../src/data/pqcProtocolMatrix'

const RFC_RE = /\bRFC[\s-]?(\d{4,5})\b/gi
const DRAFT_RE = /\b(draft-[a-z]+(?:-[a-z0-9]+)+(?:-\d+)?)/gi

const REF_ID_RE =
  /^(RFC \d{4,5}|draft-[a-z0-9]+(?:-[a-z0-9]+)+|TCG [A-Za-z0-9. -]+|3GPP T[RS] \d+\.\d+|UEFI \d+\.\d+|IEEE [A-Z0-9.]+(?:-\d+)?)$/

export interface Finding {
  rowId: string
  field: string
  ref?: string
  expected?: string
  detail: string
  severity: 'error' | 'warn'
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
    if (s.stageNote) items.push({ field: `${dim}.stageNote`, text: s.stageNote })
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

/** Collect the set of structured refs known to a row (id only, normalized). */
function structuredRefIds(row: ProtocolMatrixRow): Set<string> {
  const ids = new Set<string>()
  for (const dim of ['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const) {
    for (const r of row.dimensions[dim].refs ?? []) {
      ids.add(normalizeRefId(r.id))
    }
  }
  for (const d of row.latestRelease) ids.add(normalizeRefId(d.id))
  for (const d of row.latestDraft) ids.add(normalizeRefId(d.id))
  return ids
}

/** Match prose-extracted ids (e.g. "RFC 9370", "draft-foo") with structured ids
 *  (e.g. "RFC-9370", "draft-foo-12"). */
function normalizeRefId(id: string): string {
  // Drop version suffix on drafts (e.g. -07) and collapse dashes/spaces between "RFC" and the number.
  const draftNoVer = id.replace(/-\d+$/, '')
  return draftNoVer.replace(/^RFC[-\s]?/, 'RFC ')
}

/** Stage ↔ value consistency table. Exported for unit-test KATs. */
export const STAGE_VALUE_CONSISTENCY: Record<DraftStage, DimensionStatusValue[]> = {
  none: ['na', 'none'],
  na: ['na'],
  identified: ['experimental', 'none'],
  experimental: ['experimental'],
  'individual-draft': ['draft', 'experimental'],
  'wg-document': ['draft'],
  'wg-last-call': ['draft'],
  'iesg-submitted': ['draft'],
  'ietf-last-call': ['draft'],
  'rfc-editor-queue': ['draft', 'rfc'],
  'rfc-published': ['rfc'],
}

export function auditStageValueConsistency(
  rowId: string,
  dim: string,
  status: DimensionStatus
): Finding[] {
  if (!status.stage) return []
  const expected = STAGE_VALUE_CONSISTENCY[status.stage]
  if (!expected.includes(status.value)) {
    return [
      {
        rowId,
        field: `${dim}.stage⇄value`,
        detail: `stage='${status.stage}' is incompatible with value='${status.value}' (expected one of: ${expected.join(', ')})`,
        severity: 'error',
      },
    ]
  }
  return []
}

export function auditRefIdShape(
  rowId: string,
  dim: string,
  refs: DimensionRef[] | undefined
): Finding[] {
  if (!refs) return []
  const findings: Finding[] = []
  for (const r of refs) {
    if (!REF_ID_RE.test(r.id)) {
      findings.push({
        rowId,
        field: `${dim}.refs[${r.id}]`,
        ref: r.id,
        detail: `ref id "${r.id}" does not match the canonical pattern (RFC NNNN / draft-* / TCG * / 3GPP TR|TS NN.NN / UEFI N.N / IEEE 802.*)`,
        severity: 'error',
      })
    }
  }
  return findings
}

export function auditProseHygiene(row: ProtocolMatrixRow): Finding[] {
  const findings: Finding[] = []
  const known = structuredRefIds(row)
  const items = gatherTextFields(row)
  for (const { field, text } of items) {
    const refs = extractRefs(text)
    for (const ref of refs) {
      const normalized = normalizeRefId(ref)
      if (!known.has(normalized)) {
        findings.push({
          rowId: row.id,
          field,
          ref,
          detail: `doc-ID "${ref}" mentioned in prose but absent from refs[] / latestRelease / latestDraft on this row`,
          severity: 'error',
        })
      }
    }
  }
  return findings
}

function audit(): Finding[] {
  const findings: Finding[] = []
  for (const row of PROTOCOL_MATRIX) {
    findings.push(...auditProseHygiene(row))
    for (const dim of ['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const) {
      const s = row.dimensions[dim]
      findings.push(...auditStageValueConsistency(row.id, dim, s))
      findings.push(...auditRefIdShape(row.id, dim, s.refs))
    }
  }
  return findings
}

function main(): void {
  const wantJson = process.argv.includes('--json')
  const findings = audit()

  if (wantJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n')
    process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0)
  }

  const errors = findings.filter((f) => f.severity === 'error')
  const warns = findings.filter((f) => f.severity === 'warn')

  if (errors.length === 0 && warns.length === 0) {
    console.log('PASS Matrix audit clean.')
    console.log(`     Rows audited: ${PROTOCOL_MATRIX.length}`)
    process.exit(0)
  }

  if (errors.length > 0) {
    console.log(`FAIL ${errors.length} matrix audit error(s):`)
    console.log()
    const byRow = new Map<string, Finding[]>()
    for (const f of errors) {
      if (!byRow.has(f.rowId)) byRow.set(f.rowId, [])
      byRow.get(f.rowId)!.push(f)
    }
    for (const [rowId, fs] of byRow) {
      console.log(`-- ${rowId} (${fs.length}) --`)
      for (const f of fs) {
        console.log(`   [${f.field}] ${f.detail}`)
      }
      console.log()
    }
  }
  if (warns.length > 0) {
    console.log(`WARN ${warns.length} matrix audit warning(s):`)
    for (const f of warns) {
      console.log(`   ${f.rowId} [${f.field}] ${f.detail}`)
    }
  }
  process.exit(errors.length > 0 ? 1 : 0)
}

// Only execute when invoked directly via tsx (npm run audit:matrix-refs).
// On test imports we expose the audit functions for synthetic-fixture KATs
// without running the CLI entry point.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
