#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
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
 *  D) DOCUMENT PLACEMENT — a published RFC must not sit under `latestDraft`,
 *     and an Internet-Draft must not sit under `latestRelease`.
 *
 *  E) PRODUCT LINKS — every `productId` in `ossLibraries` /
 *     `commercialLibraries` must be an active row of the newest product
 *     catalog (a retired id opens a "not found" page), and its catalog
 *     `license_type` must not contradict the bucket it sits in.
 *
 *  A) also scans each row's `description`, `recommendedReason` and
 *     `implementationAvailability[].what`.
 *
 * Usage:
 *   npx tsx scripts/audit-matrix-refs.ts          # human report
 *   npx tsx scripts/audit-matrix-refs.ts --json   # machine-readable
 *
 * Exit codes:
 *   0 — clean
 *   1 — violations found
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import {
  PROTOCOL_MATRIX,
  type DimensionRef,
  type DimensionStatus,
  type ProtocolMatrixRow,
} from '../src/data/pqcProtocolMatrix'
import { STAGE_VALUE_CONSISTENCY } from '../src/data/pqcProtocolMatrixStageConsistency'
import { latestDatedCsv } from './lib/latestDatedCsv'

export { STAGE_VALUE_CONSISTENCY }

const RFC_RE = /\bRFC[\s-]?(\d{4,5})\b/gi
const DRAFT_RE = /\b(draft-[a-z]+(?:-[a-z0-9]+)+(?:-\d+)?)/gi

// NOTE: "OS" (OASIS Standard) has no trailing digit — unlike CS/CSD/WD
// (Committee Specification / Draft, Working Draft), there is only ever one
// canonical OS per spec version, so its digit group is optional (fixed
// 2026-07-09 when PKCS#11 v3.2 reached OASIS Standard).
const REF_ID_RE =
  /^(RFC \d{4,5}|draft-[a-z0-9]+(?:-[a-z0-9]+)+|TCG [A-Za-z0-9. -]+|3GPP T[RS] \d+\.\d+|UEFI \d+\.\d+|IEEE [A-Z0-9.]+(?:-\d+)?|INCITS \d+(?:-\d{4})?|PKCS#11 v\d+\.\d+ (?:CSD\d+|CS\d+|OS\d*|WD\d+)|KMIP \d+\.\d+ (?:CSD\d+|CS\d+|OS\d*|WD\d+)|Signal [A-Za-z0-9 -]+|Rosenpass [A-Za-z0-9 -]+|sigstore\/[a-z-]+)$/

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
  if (row.description) items.push({ field: 'description', text: row.description })
  if (row.recommendedReason) items.push({ field: 'recommendedReason', text: row.recommendedReason })
  for (const ia of row.implementationAvailability ?? []) {
    if (ia.what)
      items.push({ field: `implementationAvailability[${ia.provider}].what`, text: ia.what })
  }
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
  // Drop version suffix on DRAFTS ONLY (e.g. -07). Bug fixed 2026-07-09: this
  // used to strip trailing "-\d+" unconditionally, which also ate the RFC
  // number itself off hyphenated ids like "RFC-9420" (→ "RFC" with no number),
  // silently breaking prose-hygiene matching for any RFC cited only via a
  // hyphenated latestRelease/latestDraft id (not a space-form dimension ref).
  const draftNoVer = id.startsWith('draft-') ? id.replace(/-\d+$/, '') : id
  return draftNoVer.replace(/^RFC[-\s]?/, 'RFC ')
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
        detail: `ref id "${r.id}" does not match the canonical pattern (RFC NNNN / draft-* / TCG * / 3GPP TR|TS NN.NN / UEFI N.N / IEEE 802.* / INCITS NNN[-YYYY])`,
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

// ---------------------------------------------------------------------------
// D) document placement
// ---------------------------------------------------------------------------

const RFC_DOC_ID_RE = /^RFC[\s-]?\d{3,5}(?:-|$)/i
const DRAFT_DOC_ID_RE = /^draft-/i

/** A published RFC under `latestDraft`, or an Internet-Draft under
 *  `latestRelease`, is listed under the wrong heading. */
export function auditDocPlacement(row: ProtocolMatrixRow): Finding[] {
  const findings: Finding[] = []
  for (const d of row.latestDraft) {
    if (RFC_DOC_ID_RE.test(d.id)) {
      findings.push({
        rowId: row.id,
        field: `latestDraft[${d.id}]`,
        ref: d.id,
        detail: `"${d.id}" is a published RFC but is listed under latestDraft — move it to latestRelease`,
        severity: 'error',
      })
    }
  }
  for (const d of row.latestRelease) {
    if (DRAFT_DOC_ID_RE.test(d.id)) {
      findings.push({
        rowId: row.id,
        field: `latestRelease[${d.id}]`,
        ref: d.id,
        detail: `"${d.id}" is an Internet-Draft but is listed under latestRelease — move it to latestDraft`,
        severity: 'error',
      })
    }
  }
  return findings
}

// ---------------------------------------------------------------------------
// E) product links
// ---------------------------------------------------------------------------

export interface CatalogProduct {
  licenseType: string
  /** 'active' or the retired state; a row with no state counts as active. */
  status: string
  deprecatedReason: string
}

export type LicenceClass = 'open' | 'commercial' | 'mixed' | 'unknown'

/** Reads a catalog `license_type` into the three meanings a bucket can contradict. */
export function licenceClass(licenseType: string): LicenceClass {
  const t = (licenseType || '').toLowerCase().trim()
  if (!t) return 'unknown'
  const open = /open source|public domain|free\/open|cc0/.test(t)
  const commercial = /commercial|proprietary|freemium/.test(t)
  if (/dual|mixed/.test(t) || (open && commercial)) return 'mixed'
  if (open) return 'open'
  if (commercial) return 'commercial'
  return 'unknown'
}

/** Every product id in a row's library lists must be an active catalog row whose
 *  licence does not contradict the list it sits in. */
export function auditProductRefs(
  row: ProtocolMatrixRow,
  catalog: ReadonlyMap<string, CatalogProduct>
): Finding[] {
  const findings: Finding[] = []
  const lists = [
    ['ossLibraries', row.ossLibraries],
    ['commercialLibraries', row.commercialLibraries],
  ] as const
  for (const [bucket, libs] of lists) {
    for (const lib of libs) {
      const field = `${bucket}[${lib.productId}]`
      const product = catalog.get(lib.productId)
      if (!product) {
        findings.push({
          rowId: row.id,
          field,
          ref: lib.productId,
          detail: `productId "${lib.productId}" is not in the product catalog`,
          severity: 'error',
        })
        continue
      }
      if (product.status && product.status !== 'active') {
        findings.push({
          rowId: row.id,
          field,
          ref: lib.productId,
          detail: `productId "${lib.productId}" is ${product.status} in the product catalog${
            product.deprecatedReason ? ` (${product.deprecatedReason})` : ''
          } — point at its active record`,
          severity: 'error',
        })
        continue
      }
      const cls = licenceClass(product.licenseType)
      if (bucket === 'ossLibraries' && cls === 'commercial') {
        findings.push({
          rowId: row.id,
          field,
          ref: lib.productId,
          detail: `"${lib.productId}" is listed as open source but the catalog licence is "${product.licenseType}" — move it to commercialLibraries`,
          severity: 'error',
        })
      }
      if (bucket === 'commercialLibraries' && cls === 'open') {
        findings.push({
          rowId: row.id,
          field,
          ref: lib.productId,
          detail: `"${lib.productId}" is listed as commercial but the catalog licence is "${product.licenseType}" — move it to ossLibraries`,
          severity: 'error',
        })
      }
    }
  }
  return findings
}

const PRODUCT_CATALOG_RE = /^pqc_product_catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

/** The newest product catalog, keyed by product_id. */
export function loadProductCatalog(
  // Run from the repository root (npm run audit:matrix-refs, vitest).
  dataDir = join(process.cwd(), 'src', 'data')
): Map<string, CatalogProduct> {
  const file = latestDatedCsv(dataDir, PRODUCT_CATALOG_RE)
  if (!file) throw new Error(`no pqc_product_catalog_*.csv under ${dataDir}`)
  const parsed = Papa.parse<Record<string, string>>(readFileSync(file, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  })
  const catalog = new Map<string, CatalogProduct>()
  for (const r of parsed.data) {
    if (!r.product_id) continue
    catalog.set(r.product_id, {
      licenseType: r.license_type ?? '',
      status: r.status ?? '',
      deprecatedReason: r.deprecated_reason ?? '',
    })
  }
  return catalog
}

export function audit(): Finding[] {
  const findings: Finding[] = []
  const catalog = loadProductCatalog()
  for (const row of PROTOCOL_MATRIX) {
    findings.push(...auditProseHygiene(row))
    findings.push(...auditDocPlacement(row))
    findings.push(...auditProductRefs(row, catalog))
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
