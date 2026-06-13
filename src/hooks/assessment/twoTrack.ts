// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two-Track sequencing — gap-closer #4 (spec §6.2, Assess #4; framework §3.3 p.75).
 *
 * Splits the engine's existing `recommendedActions` and `migrationEffort` into
 * two parallel workstreams:
 *
 *   Track A — Confidentiality / KEM (HNDL-driven): internet-facing key exchange
 *             and data-at-rest first, because harvested ciphertext is decryptable
 *             retroactively the moment a CRQC exists.
 *   Track B — Integrity / Signatures & PKI (HNFL-driven): code- and
 *             firmware-signing, root/intermediate CAs first, because long-lived
 *             trust anchors have the longest replacement lead time.
 *
 * Pure, additive read over the AssessmentResult fields the engine already
 * produces — no new scoring. Reuses `SIGNING_ALGORITHMS` and the HNDL/HNFL
 * windows so the split can never disagree with the rest of the engine.
 *
 * Phase: 3 (Risk Scoring).
 */

import { SIGNING_ALGORITHMS } from '../assessmentData'
import type {
  AssessmentInput,
  AssessmentResult,
  MigrationEffortItem,
  RecommendedAction,
  HNDLRiskWindow,
  HNFLRiskWindow,
} from '../assessmentTypes'

export type TrackId = 'A' | 'B'

/** One sequenced workstream (Track A or Track B). */
export interface MigrationTrack {
  id: TrackId
  /** Track name shown in the UI. */
  label: string
  /** What this track protects, in one phrase. */
  focus: string
  /** Why this ordering — the risk that drives the track. */
  rationale: string
  /** "Start here" — the first surface this track tackles. */
  startWith: string
  /** Migration-effort items whose algorithm belongs to this track. */
  effort: MigrationEffortItem[]
  /** Recommended actions routed to this track. */
  actions: RecommendedAction[]
  /** The relevant risk window for this track, when available. */
  hndlWindow?: HNDLRiskWindow
  hnflWindow?: HNFLRiskWindow
  /** true when this track has at-risk exposure (drives "lead with this track"). */
  isAtRisk: boolean
}

export interface TwoTrackPlan {
  trackA: MigrationTrack
  trackB: MigrationTrack
  /**
   * Which track to lead with. Both run in parallel, but the lead track is the
   * one with at-risk exposure and the shorter window to act. 'A' when HNDL is
   * at risk (default — confidentiality loss is irreversible); 'B' only when
   * HNFL is at risk and HNDL is not.
   */
  leadTrack: TrackId
  /** Plain-language sequencing note for display. */
  summary: string
}

/** Algorithm → track. Signing algos are Track B; everything else (KEM/transport) Track A. */
function trackForAlgorithm(algorithm: string): TrackId {
  return SIGNING_ALGORITHMS.has(algorithm) ? 'B' : 'A'
}

/**
 * Action → track. Heuristic keyword routing over the action text + related
 * module. Signature / PKI / certificate / signing language → Track B; key
 * exchange / TLS / encryption / data-at-rest → Track A. Anything generic
 * (inventory, awareness, governance) is duplicated into BOTH tracks since it
 * underpins each — this keeps every track self-contained for the reader.
 */
function tracksForAction(action: RecommendedAction): TrackId[] {
  const text = action.action.toLowerCase()
  const isSig =
    /sign|signature|certificate|\bpki\b|firmware|code-?sign|root ca|trust anchor|ml-dsa|slh-dsa|\bca\b/.test(
      text
    )
  const isKem =
    /key exchange|key agreement|\bkem\b|\btls\b|https|data-at-rest|data at rest|encrypt|ml-kem|vpn|ipsec/.test(
      text
    )
  if (isSig && !isKem) return ['B']
  if (isKem && !isSig) return ['A']
  // Generic / cross-cutting (inventory, awareness, compliance review): both tracks.
  return ['A', 'B']
}

/**
 * Build the Track-A / Track-B sequenced plan from an assessment result.
 *
 * Requires the comprehensive-path fields (`migrationEffort`); for quick-mode
 * results without them, the tracks still populate from `recommendedActions`
 * alone (effort arrays just come back empty). Returns `undefined` only when the
 * result has neither actions nor effort to split.
 */
export function buildTwoTrackPlan(
  input: AssessmentInput,
  result: Pick<
    AssessmentResult,
    'recommendedActions' | 'migrationEffort' | 'hndlRiskWindow' | 'hnflRiskWindow'
  >
): TwoTrackPlan | undefined {
  const actions = result.recommendedActions ?? []
  const effort = result.migrationEffort ?? []
  if (actions.length === 0 && effort.length === 0) return undefined

  const effortA = effort.filter((e) => trackForAlgorithm(e.algorithm) === 'A')
  const effortB = effort.filter((e) => trackForAlgorithm(e.algorithm) === 'B')

  const actionsA: RecommendedAction[] = []
  const actionsB: RecommendedAction[] = []
  for (const a of actions) {
    const tracks = tracksForAction(a)
    if (tracks.includes('A')) actionsA.push(a)
    if (tracks.includes('B')) actionsB.push(a)
  }

  const hndlAtRisk = !!result.hndlRiskWindow?.isAtRisk
  const hnflAtRisk = !!result.hnflRiskWindow?.isAtRisk

  const trackA: MigrationTrack = {
    id: 'A',
    label: 'Track A — Confidentiality (KEM / HNDL)',
    focus: 'Key exchange & data-at-rest',
    rationale:
      'Harvest-Now-Decrypt-Later: intercepted ciphertext and key-exchange material can be decrypted retroactively once a quantum computer exists, so confidentiality must be protected first.',
    startWith: 'Internet-facing TLS, VPN/IPsec termination, and long-retention data-at-rest.',
    effort: effortA,
    actions: actionsA,
    hndlWindow: result.hndlRiskWindow,
    isAtRisk: hndlAtRisk,
  }

  const trackB: MigrationTrack = {
    id: 'B',
    label: 'Track B — Integrity (Signatures / PKI)',
    focus: 'Code/firmware signing & PKI',
    rationale:
      'Harvest-Now-Forge-Later: signing keys and long-lived trust anchors have the longest replacement lead time, so PKI and code/firmware-signing migration must start early even though forgery risk lags decryption risk.',
    startWith: 'Code- and firmware-signing pipelines, then root/intermediate CA re-issuance.',
    effort: effortB,
    actions: actionsB,
    hnflWindow: result.hnflRiskWindow,
    isAtRisk: hnflAtRisk && (result.hnflRiskWindow?.hasSigningAlgorithms ?? false),
  }

  // Lead with the at-risk track on the shorter horizon. Confidentiality loss is
  // irreversible (data already harvested), so HNDL leads by default when both
  // are at risk; lead with B only when HNFL is at risk and HNDL is not.
  let leadTrack: TrackId = 'A'
  if (trackB.isAtRisk && !trackA.isAtRisk) leadTrack = 'B'

  const summary =
    trackA.isAtRisk && trackB.isAtRisk
      ? 'Both tracks are at risk — run them in parallel, leading with Track A (confidentiality) since harvested data is decryptable retroactively.'
      : trackA.isAtRisk
        ? 'Lead with Track A (confidentiality / HNDL); sequence Track B (signatures / PKI) in parallel on its longer lead time.'
        : trackB.isAtRisk
          ? 'Lead with Track B (signatures / PKI / HNFL); Track A (confidentiality) follows once key-exchange exposure is confirmed.'
          : 'Neither track shows acute at-risk exposure yet — advance both in parallel as crypto-agility and standards mature.'

  return { trackA, trackB, leadTrack, summary }
}
