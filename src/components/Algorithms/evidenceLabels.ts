// SPDX-License-Identifier: GPL-3.0-only
//
// Badge labels for the industry-standards `evidence_type` vocabulary.
//
// Lives in its own module, not inside IndustryLandscapeView.tsx, so the
// driftguard can assert vocabulary↔renderer agreement without importing a React
// component into a data test — the same reason landscapeIcons.ts is separate.
//
// WHY THIS GUARD EXISTS (2026-08-15): `guidance` was added to the Python
// validator and to the driftguard's allowed list, but not to the TS union and
// not to this map. Three guidance documents (GSMA PQ.03, NIST CSWP 36A, ATIS
// 5G Quantum) therefore rendered with NO badge — visually identical to a real
// specification, which is precisely what the badge exists to prevent. `tsc`
// could not catch it: the loader cast a raw string, so the Record stayed
// complete against an incomplete union.

import { EVIDENCE_TYPES, type EvidenceType } from '@/data/industryLandscapeData'

/**
 * `null` means "renders with no badge" — and `standard` is the ONLY value
 * entitled to that. Every other value must carry a visible label saying what
 * kind of document it really is.
 */
export const EVIDENCE_LABEL: Record<EvidenceType, string | null> = {
  standard: null,
  research: 'Research',
  'industry-report': 'Industry report',
  courseware: 'Courseware',
  guidance: 'Guidance',
}

/**
 * Total lookup. An unrecognised value must never fall through to the
 * no-badge state, so it gets an explicit label instead. `in` rather than `??`
 * because `EVIDENCE_LABEL.standard` is legitimately `null`.
 */
export function evidenceLabelFor(t: EvidenceType): string | null {
  return t in EVIDENCE_LABEL ? EVIDENCE_LABEL[t] : 'Unverified type'
}

/** Vocabulary values with no label entry — must always be empty. */
export function unlabelledEvidenceTypes(): string[] {
  return (EVIDENCE_TYPES as readonly string[]).filter((t) => !(t in EVIDENCE_LABEL))
}
