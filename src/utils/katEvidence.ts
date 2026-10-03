// SPDX-License-Identifier: GPL-3.0-only
/**
 * katEvidence — the evidence class and source of every katRunner test kind,
 * read from the GENERATED per-case evidence records
 * (src/data/validation/case-evidence.kat.generated.json, built by
 * the case-evidence generator from the reviewed vector manifest and the
 * static test registry). ACVP validation remediation plan 2026-09-24, WS-A
 * A-1/A-2 and WS-I ("same case has the same label and source everywhere").
 *
 * Until 2026-09-24 this module classified a kind from its vector file's
 * `_provenance.producer` string, with a hand-pinned override table for the
 * files where that string and the manifest disagreed. It now reads the
 * manifest-derived record for the exact case the kind runs, so the
 * Algorithms tiles, the Learn panels and the Playground workbench show the
 * same class, source, parameters and limitations for the same case.
 *
 * A kind with no registered case gets 'unverified-provenance' and no source
 * — katEvidence.test.ts fails if any KatTestSpec literal in src is in that
 * state, so in practice it never renders.
 */
import {
  EVIDENCE_CLASSES,
  EVIDENCE_CLASS_SHORT,
  type EvidenceClassId,
} from '@/data/validation/evidenceClasses'
import type { CaseEvidenceRecord } from '@/data/validation/caseEvidence'
import { evidenceForKatKind, katVectorFileClass } from '@/data/validation/katCaseEvidence'
import type { KatKind, KatTestSpec } from './katRunner'

/** Evidence classes (plan §2.1) plus the no-record marker. */
export type KatEvidenceClass = EvidenceClassId | 'unverified-provenance'

export interface VectorFileRef {
  /** Path under src/data/, e.g. 'acvp/hmac_test.json'. */
  file: string
}

/** The registered evidence records for the exact case(s) a kind runs. */
export function evidenceRecordsForKind(kind: KatKind): CaseEvidenceRecord[] {
  return evidenceForKatKind(kind as unknown as Record<string, unknown> & { type: string })
}

export function evidenceForKind(kind: KatKind): KatEvidenceClass {
  const recs = evidenceRecordsForKind(kind)
  if (recs.length === 0) return 'unverified-provenance'
  const classes = new Set(recs.map((r) => r.evidenceClass))
  // One kind → one case today; if that ever changes, a mixed kind claims nothing.
  return classes.size === 1 ? recs[0].evidenceClass : 'unverified-provenance'
}

/** Where a kind's expected value comes from (manifest source or the case's recorded source). */
export function sourceForKind(kind: KatKind): CaseEvidenceRecord['source'] | undefined {
  return evidenceRecordsForKind(kind)[0]?.source
}

/** A vector file's manifest class (quarantined / unknown → 'unverified-provenance'). */
export function evidenceForVectorFile(ref: VectorFileRef): KatEvidenceClass {
  const c = katVectorFileClass(ref.file)
  return !c || c === 'unverified' ? 'unverified-provenance' : c
}

export const isAcvpBacked = (kind: KatKind): boolean =>
  evidenceForKind(kind) === 'nist-acvp-reference-sample'

export const KAT_EVIDENCE_META: Record<KatEvidenceClass, { label: string; short: string }> = {
  ...(Object.fromEntries(
    Object.values(EVIDENCE_CLASSES).map((m) => [
      m.id,
      { label: `${m.label} — ${m.meaning}`, short: EVIDENCE_CLASS_SHORT[m.id] },
    ])
  ) as Record<EvidenceClassId, { label: string; short: string }>),
  'unverified-provenance': {
    label: 'No registered evidence record — treat as unverified',
    short: 'Unverified',
  },
}

const ACTION_LABEL: Record<KatEvidenceClass, string> = {
  'nist-acvp-reference-sample': 'Run reference samples',
  'acvts-issued-vector': 'Run issued vectors',
  'published-standard-kat': 'Run standard KATs',
  'independent-oracle': 'Run oracle comparisons',
  'cross-implementation-differential': 'Run differential tests',
  'functional-round-trip': 'Run functional tests',
  'oasis-profile-case': 'Run OASIS profile cases',
  'product-mechanism-probe': 'Run product probes',
  'unverified-provenance': 'Run validation tests',
}

/**
 * Button text for a run that executes `specs`. Evidence-specific only when
 * every spec shares one class; any mix gets the neutral label.
 */
export function katActionLabel(specs: readonly Pick<KatTestSpec, 'kind'>[]): string {
  const classes = new Set(specs.map((s) => evidenceForKind(s.kind)))
  if (classes.size === 1) {
    const [only] = classes
    const label = ACTION_LABEL[only]
    return specs.length === 1 ? label.replace(/s$/, '') : label
  }
  return 'Run validation tests'
}

/** Distinct evidence classes in a spec set, in a stable display order. */
export function evidenceClassesFor(
  specs: readonly Pick<KatTestSpec, 'kind'>[]
): KatEvidenceClass[] {
  const order = Object.keys(KAT_EVIDENCE_META) as KatEvidenceClass[]
  const present = new Set(specs.map((s) => evidenceForKind(s.kind)))
  return order.filter((c) => present.has(c))
}
