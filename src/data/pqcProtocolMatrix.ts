/**
 * PQC Protocol Support Matrix — 30 protocol rows (IETF, TCG, OASIS, 3GPP, IEEE,
 * ANSI/INCITS, UEFI, and vendor-published specs) × release / draft / 4 PQC
 * dimensions / OSS libs / playground.
 *
 * Snapshot date: see PROTOCOL_MATRIX_LAST_UPDATED below — this header comment
 * is not kept in sync automatically; treat the constant as authoritative.
 *
 * The 4 dimensions reflect the published external PQC-readiness heatmap:
 *  - pureKem   = pure post-quantum KEM (e.g. ML-KEM-only, no classical fallback)
 *  - hybridKem = PQ + classical KEM concatenation (ML-KEM component encoded
 *                FIRST per composite-kem §4.1; TLS named groups use their own
 *                wire order, e.g. X25519MLKEM768)
 *  - pureSig   = pure PQ signature/auth (e.g. ML-DSA-only, SLH-DSA-only)
 *  - hybridSig = PQ + classical composite signature (ML-DSA component encoded
 *                FIRST per composite-sigs §4.3, raw concatenation, no ASN.1 wrapper)
 *
 * Dimension status values (coarse — kept for backwards compatibility and as
 * the heatmap fallback when `stage` is absent):
 *  - 'rfc'          published RFC / TCG release / ITU-T edition
 *  - 'draft'        active IETF / TCG draft
 *  - 'experimental' non-IETF or expired draft / vendor pre-standard
 *  - 'none'         not specified, not pursued
 *  - 'na'           not applicable for this protocol family
 *
 * DraftStage — finer 0–7 scale aligned with the OFFICIAL IETF progression
 * (earliest → latest). The 8-shade heatmap makes two adjacent pairs share a
 * colour tier (WG-doc/WG-LC, and IESG/RFC-Ed-queue); the per-cell IETF-stage
 * tooltip spells out all seven official steps distinctly.
 *  - 'none'              0  no plan / no work
 *  - 'identified'        1  problem flagged, not yet on the standards track
 *  - 'experimental'      2  off-track: expired draft / non-IETF / vendor pre-standard
 *  - 'individual-draft'  3  step 1 — individual Internet-Draft
 *  - 'wg-document'       4  step 2 — WG-adopted document
 *  - 'wg-last-call'      4  step 3 — WG Last Call
 *  - 'ietf-last-call'    5  step 4 — IETF Last Call (community-wide review)
 *  - 'iesg-submitted'    6  step 5 — IESG review / telechat (AFTER IETF Last Call)
 *  - 'rfc-editor-queue'  6  step 6 — Approved; in the RFC Editor publication queue
 *  - 'rfc-published'     7  step 7 — published RFC / final spec
 *  - 'na'                0  not applicable for this dimension
 *
 * When `stage` is populated, the matrix renders a graduated heatmap (PQCC-style)
 * instead of the 5-bucket coarse coloring. The coarse `value` must remain
 * consistent with the finer `stage` (validated by scripts/audit-matrix-refs.ts).
 *
 * Playground testability values (per existing tool in /playground):
 *  - 'full'    user can select / exercise this dimension in the tool
 *  - 'partial' supported via backend / URL param but not exposed in UI
 *  - 'none'    not supported by the tool
 *  - 'na'      dimension not applicable to this protocol
 */

import type { Freshness } from './contentFreshness'

/** ISO date of the last manual update to PROTOCOL_MATRIX below. */
export const PROTOCOL_MATRIX_LAST_UPDATED = '2026-08-17'

/**
 * Structured freshness for the content-freshness manifest — pairs the snapshot
 * date above with the live source to re-verify the matrix's RFC/draft stages and
 * vendor GA dates against (the IETF datatracker the enrichment job already uses).
 */
export const PROTOCOL_MATRIX_FRESHNESS: Freshness = {
  asOf: PROTOCOL_MATRIX_LAST_UPDATED,
  recheck: 'https://datatracker.ietf.org/',
}

export type DimensionStatusValue = 'rfc' | 'draft' | 'experimental' | 'none' | 'na'

/**
 * Finer-grained IETF progression label (0–7 numeric semantics encoded in
 * `DRAFT_STAGE_LEVEL`). Optional — when present, drives the graduated
 * heatmap; when absent, the coarse `value` palette is used as a fallback.
 */
export type DraftStage =
  | 'none'
  | 'identified'
  | 'experimental'
  | 'individual-draft'
  | 'wg-document'
  | 'wg-last-call'
  | 'iesg-submitted'
  | 'ietf-last-call'
  | 'rfc-editor-queue'
  | 'rfc-published'
  | 'na'

/** Numeric level (0–7) for each DraftStage; drives the graduated heatmap palette. */
export const DRAFT_STAGE_LEVEL: Record<DraftStage, number> = {
  none: 0,
  na: 0,
  identified: 1,
  experimental: 2,
  'individual-draft': 3,
  'wg-document': 4,
  'wg-last-call': 4,
  'ietf-last-call': 5,
  'iesg-submitted': 6,
  'rfc-editor-queue': 6,
  'rfc-published': 7,
}

import type { PersonaId } from './learningPersonas'

/** Persona granularity tiers for the Protocol Support heatmap palette.
 *  - `binary`  collapses to {RFC | everything else} — executive/ops/curious
 *  - `ternary` collapses to {RFC | WG+ | early} — developer/architect
 *  - `full`    keeps the graduated 0–7 palette — researcher (current behaviour)
 */
export type PersonaStageGranularity = 'binary' | 'ternary' | 'full'

/** Effective tier rendered by `dimensionStageTone()`. The full set (0..7) is
 *  used only for researcher / no-persona; binary and ternary personas land on
 *  a strict subset of {0, 1, 4, 7}. */
export type StageTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const PERSONA_STAGE_GRANULARITY: Record<PersonaId, PersonaStageGranularity> = {
  executive: 'binary',
  ops: 'binary',
  curious: 'binary',
  developer: 'ternary',
  architect: 'ternary',
  researcher: 'full',
}

/**
 * Collapse a raw `DraftStage` into the tier appropriate for the given
 * granularity. `na` always returns 0 (muted) to avoid mis-colouring
 * non-applicable cells.
 *
 * Tier mapping per granularity:
 *   binary  → {0, 7}                    RFC vs everything else
 *   ternary → {0, 1, 4, 7}              early / WG+ / RFC
 *   full    → DRAFT_STAGE_LEVEL[stage]  graduated 0..7 (current behaviour)
 */
export function stageCollapseAt(
  stage: DraftStage,
  granularity: PersonaStageGranularity
): StageTier {
  if (stage === 'na') return 0
  // eslint-disable-next-line security/detect-object-injection
  const raw = DRAFT_STAGE_LEVEL[stage]
  if (granularity === 'full') return raw as StageTier
  if (granularity === 'ternary') {
    if (raw >= 7) return 7
    if (raw >= 4) return 4
    if (raw === 0) return 0
    return 1
  }
  return raw === 7 ? 7 : 0
}

/** Resolve the persona's effective granularity (full when no persona). */
export function granularityForPersona(persona: PersonaId | null): PersonaStageGranularity {
  if (!persona) return 'full'
  // eslint-disable-next-line security/detect-object-injection
  return PERSONA_STAGE_GRANULARITY[persona]
}

/** Persona-keyed convenience wrapper for `stageCollapseAt`. */
export function stageCollapse(stage: DraftStage, persona: PersonaId | null): StageTier {
  return stageCollapseAt(stage, granularityForPersona(persona))
}

/** Short label for the stage chip (e.g. "WG LC", "IETF LC", "RFC"). */
export const DRAFT_STAGE_SHORT: Record<DraftStage, string> = {
  none: 'None',
  na: 'N/A',
  identified: 'Identified',
  experimental: 'Experimental',
  'individual-draft': 'I-D',
  'wg-document': 'WG Doc',
  'wg-last-call': 'WG LC',
  'iesg-submitted': 'IESG',
  'ietf-last-call': 'IETF LC',
  'rfc-editor-queue': 'RFC Ed Queue',
  'rfc-published': 'RFC',
}

/**
 * Per-cell standards reference (RFC or Internet-Draft) attached to a
 * DimensionStatus. Drives the per-cell chips users requested under each of
 * the 4 cases (Pure/Hybrid KEM/Sig).
 */
export interface DimensionRef {
  kind: 'rfc' | 'draft' | 'spec'
  /** Canonical id, e.g. 'RFC 9935' or 'draft-ietf-tls-mlkem'. */
  id: string
  title?: string
  url?: string
  /** ISO date or 'YYYY-MM' string. */
  publishedOn?: string
}

/**
 * Deployment posture is independent of the standardization status. A dimension
 * can sit in `draft` but already be in production — X25519MLKEM768 ran at
 * Cloudflare/Google/AWS from 2024, roughly two years before the spec became
 * RFC 10024 in August 2026. Marks where deployment outpaces the spec.
 */
export type DeploymentPosture = 'production' | 'pilot' | 'experimental'

export interface DimensionStatus {
  value: DimensionStatusValue
  /** Finer-grained progression label; when set, drives graduated heatmap. */
  stage?: DraftStage
  /** Free-text caption shown next to the stage chip (e.g. "IETF LC Jan 2026"). */
  stageNote?: string
  /** Per-cell RFC/draft references — list under each of the 4 dimension cells. */
  refs?: DimensionRef[]
  note?: string
  deploymentPosture?: DeploymentPosture
  deploymentNote?: string
  /**
   * ISO date this cell was last checked against its `refs`/IETF datatracker
   * — NOT a cited document's own publish date (see DimensionRef.publishedOn
   * for that). Missing or older than 180 days flags this cell as
   * stale-refresh in the maintenance pipeline (deferred-items plan
   * Finding E). Stamped by a human re-verifying the cell, never
   * machine-drafted.
   */
  lastReviewed?: string
}

export interface ProtocolDoc {
  id: string
  title: string
  url: string
  date: string
  localFile?: string
}

export interface OssLibrary {
  productId: string
  name: string
  versionNote?: string
}

/**
 * Known production / live deployment of a PQC profile by a named provider.
 * Citation-grounded: every entry MUST set `referenceUrl` to an authoritative
 * blog post / announcement / docs page that was verified to resolve (HTTP 200).
 *
 * For offline proofing, `scripts/download-deployment-proofs.ts` mirrors each
 * `referenceUrl` to `.deployment-proofs/` (gitignored, NOT shipped to
 * production). The production bundle only ships the URL — proofs are an
 * audit-side artifact for the trust-engine, not user-facing.
 */
export interface LiveDeployment {
  /** Provider / vendor display name (e.g. "Cloudflare", "AWS", "Google Chrome"). */
  provider: string
  /** Short description of what is deployed (algorithm + profile + scope). */
  what: string
  /** ISO date or year string of go-live (optional). */
  since?: string
  /** Authoritative announcement / docs URL — required for the chip's link. Must resolve (200). */
  referenceUrl: string
}

export type TestabilityValue = 'full' | 'partial' | 'none' | 'na'

/**
 * Row-level "Sources & further reading" citation. Use for authoritative
 * references that back the row's freshness (WG document indexes, release-notes
 * pages, standards trackers) but are NOT already surfaced per-cell via
 * `refs` / `latestRelease` / `latestDraft` / `liveDeployments`. The detail
 * modal renders these DEDUPED against every other URL already shown, so an
 * entry whose `url` already appears elsewhere in the row is silently skipped —
 * only genuinely-missing sources are displayed.
 */
export interface RowSource {
  label: string
  url: string
  note?: string
}

export interface PlaygroundTool {
  toolId: string
  toolName: string
  /** Override the link target. Defaults to `/playground/${toolId}` when omitted. */
  url?: string
  testability: {
    pureKem: TestabilityValue
    hybridKem: TestabilityValue
    pureSig: TestabilityValue
    hybridSig: TestabilityValue
  }
  /**
   * Optional caveats surfaced as tooltips next to the testability label.
   * Use sparingly — reserved for educational/experimental constructs that
   * earn a 'partial' rating but warrant explicit disclosure (e.g. TPM
   * Labeled-KEM hybrid is not standardized by TCG v1.85).
   */
  pureKemNote?: string
  hybridKemNote?: string
  pureSigNote?: string
  hybridSigNote?: string
}

export interface ProtocolMatrixRow {
  id: string
  name: string
  description: string
  latestRelease: ProtocolDoc[]
  latestDraft: ProtocolDoc[]
  dimensions: {
    pureKem: DimensionStatus
    hybridKem: DimensionStatus
    pureSig: DimensionStatus
    hybridSig: DimensionStatus
  }
  ossLibraries: OssLibrary[]
  commercialLibraries: OssLibrary[]
  /**
   * One or more playground tools. First entry is the primary (drives the
   * row's testability badges); additional entries surface as secondary chips.
   * Empty array = no playground for this protocol.
   */
  playgrounds: PlaygroundTool[]
  /**
   * Known production deployments of this protocol's PQC profile (e.g.
   * Cloudflare, AWS, Google Chrome). Inheritance rows can leave this empty
   * and rely on the parent's deployments — the modal surfaces them via the
   * inheritance link.
   */
  liveDeployments?: LiveDeployment[]
  /**
   * If `liveDeployments` is empty, an explanation of *why* (e.g. "standards
   * too fresh", "market migrated to a sibling protocol", "intentionally out
   * of scope"). Surfaced in the modal's deployment empty state so users
   * understand the structural gap rather than reading the absence as our
   * miss.
   */
  noDeploymentReason?: string
  /**
   * Names of protocols whose PQC posture is identical to this row's by
   * specification reuse (e.g. DTLS 1.3 inherits TLS 1.3's PQC standardization).
   * Surfaced as a small chip on the parent row.
   */
  inheritedBy?: string[]
  /**
   * If this row is itself an inheritance row, points to the parent protocol
   * `id` for display purposes (an "inherits from X" chip, visually muted
   * styling). NOTE: the row's own `dimensions` are still hand-authored,
   * stage-less copies — nothing re-reads the parent's badges at render time.
   * When the parent's stage changes, every inheritance row must be updated
   * by hand or it silently drifts out of sync (see dtls-1-3, fido-2, macsec,
   * uefi).
   */
  inheritsFromProtocolId?: string
  /**
   * This protocol has NO post-quantum path of its own — every dimension is
   * `na`/`none` — and `supersededByProtocolId` names the row the migration goes
   * to instead (WS12, 2026-08-15).
   *
   * WHY THIS EXISTS: a row of four `na` cells was unreadable. `na` is also the
   * value for dimensions that are genuinely not applicable, so "TLS 1.2 has no
   * PQC track at all, move to TLS 1.3" rendered identically to "this question
   * doesn't apply here" — the single most important state in a migration matrix
   * was its least legible one.
   *
   * Distinct from `inheritsFromProtocolId`, which means "same PQC posture by
   * specification reuse". This means the opposite: a dead end and its way out.
   * The two compose — `dtls-1-2` inherits from `tls-1-2` AND is superseded by
   * `dtls-1-3`.
   *
   * INVARIANT (pinned by audit-matrix-refs.ts and the driftguard): a row
   * carrying this must have every dimension `na`/`none`, and its target must
   * have at least one dimension that is not. Authoring the edge backwards is
   * therefore impossible rather than merely discouraged.
   */
  supersededByProtocolId?: string
  /**
   * Reverse of `supersededByProtocolId` — the deprecated protocols this row
   * replaces. Ids, NOT display names: `inheritedBy` stores names ('DTLS 1.2')
   * and therefore cannot be FK-checked, a weakness deliberately not copied here.
   */
  supersedes?: string[]
  /**
   * Deprecated protocol retained only as a migration SOURCE — it will never
   * gain a PQC dimension, and its refs are frozen by definition.
   *
   * Consequences, all enforced elsewhere: hidden by default behind the "show
   * deprecated protocols" toggle so it cannot swamp the readiness heatmap;
   * excluded from the completeness metric (counting frozen rows would inflate
   * "N/N cells have an explicit value" while meaning less); excluded from the
   * IETF datatracker poll in enrich-protocol-matrix.py, where re-resolving a
   * frozen ref is pure churn; never `recommended`.
   */
  historical?: boolean
  /**
   * Editorial flag: this protocol is ready for production PQC deployment today.
   * Criteria: at least one dimension at RFC or RFC-editor-queue stage with known
   * production deployments. Drives the star chip in heatmap view, the
   * recommendations panel in detailed view, and the ?highlight=recommended param.
   */
  recommended?: boolean
  /** One-sentence rationale for `recommended: true`, shown in the panel and modal. */
  recommendedReason?: string
  /**
   * Authoritative "Sources & further reading" links that back this row's
   * freshness but are not already surfaced per-cell. Rendered DEDUPED against
   * every other URL shown in the modal — entries already linked elsewhere are
   * skipped. Omit when every citation already has a per-cell home.
   */
  sources?: RowSource[]
}

/** Transport-layer blockers tracked by PQCC heatmap (April 2026). */
export interface TransportIssue {
  id: string
  name: string
  affectedProtocolIds: string[]
  description: string
  referenceUrl?: string
}

export const TRANSPORT_ISSUES: TransportIssue[] = [
  {
    id: 'tcp-initial-congestion-window',
    name: 'TCP Initial Congestion Window',
    affectedProtocolIds: ['tls-1-2', 'tls-1-3'],
    description:
      'PQ certificate chains and ServerHello + Certificate flights commonly exceed the default 10×MSS initial congestion window, forcing extra RTTs. ML-DSA-65 leaf + ML-DSA-87 issuer is already > 14 KB.',
    referenceUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-cert-abridge/',
  },
  {
    id: 'quic-amplification-protection',
    name: 'QUIC Amplification Protection',
    affectedProtocolIds: ['tls-1-3'],
    description:
      'QUIC limits the server to 3× the bytes received from a client until address validation. Large PQ certificates can exceed this budget, stalling the handshake. Mitigation: certificate compression (RFC 8879) and abridged certs (draft-ietf-tls-cert-abridge).',
    referenceUrl: 'https://datatracker.ietf.org/doc/html/rfc9000#section-8',
  },
  {
    id: 'merkle-tree-certs',
    name: 'Merkle Tree Certs',
    affectedProtocolIds: ['tls-1-3', 'x509'],
    description:
      'PLANTS WG draft (draft-ietf-plants-merkle-tree-certs) defines a new X.509 cert form with integrated Certificate-Transparency-style logging, designed to reduce overhead for short-lived certs and large PQ signatures. Optional signatureless mode avoids signatures entirely when relying parties have current transparency state.',
    referenceUrl: 'https://datatracker.ietf.org/doc/draft-ietf-plants-merkle-tree-certs/',
  },
  {
    id: 'eap-large-cert-fragmentation',
    name: 'EAP Certificate Fragmentation Limits',
    affectedProtocolIds: ['eap-radius'],
    description:
      'EAP fragments messages into ~1020–1500-octet chunks and many authenticators cap round trips at 40–50; RFC 9191 (2022) explicitly anticipated PQ certificate chains blowing past both limits ("lattice-based cryptography would have public keys of approximately 1000 bytes and signatures of approximately 2000 bytes"). draft-ietf-emu-pqc-eap-tls is the EMU WG\'s direct follow-on addressing this.',
    referenceUrl: 'https://datatracker.ietf.org/doc/html/rfc9191',
  },
  {
    id: 'rpki-repository-bulk-validation',
    name: 'RPKI Repository Bulk-Validation Cost',
    affectedProtocolIds: ['rpki-bgpsec'],
    description:
      'Every RPKI relying party downloads and re-validates the ENTIRE global repository, not one cert chain. A SIDN Labs thesis (2025) measured the RSA-2048 baseline at ~838 MB / ~14.5s download / ~13 CPU-s verify, growing to ~3.0 GB / ~51s / ~34 CPU-s at ML-DSA-44, and 6.7–14.0 GB / 1,376–3,729 CPU-s at SLH-DSA — the last judged impractical. Not a hard protocol ceiling like DNS UDP fragmentation, but a real, independently quantified bulk-validation scaling problem.',
    referenceUrl: 'https://labs.ripe.net/author/dirk/pqc-for-the-rpki/',
  },
]

export const PROTOCOL_MATRIX: ProtocolMatrixRow[] = [
  {
    id: 'ssh',
    name: 'SSH',
    description: 'Secure Shell — transport-layer security for remote login and tunneling.',
    latestRelease: [
      {
        id: 'RFC-4253',
        title: 'RFC 4253 — SSH Transport Layer Protocol',
        url: 'https://datatracker.ietf.org/doc/html/rfc4253',
        date: '2006-01',
        localFile: '/library/IETF_RFC_4253.html',
      },
      {
        id: 'RFC-9941',
        title: 'RFC 9941 — Streamlined NTRU Prime sntrup761 Key Exchange for SSH',
        url: 'https://datatracker.ietf.org/doc/html/rfc9941',
        date: '2026-04',
        localFile: '/library/RFC_9941.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-sshm-mlkem-hybrid-kex-10',
        title: 'draft-ietf-sshm-mlkem-hybrid-kex-10 — ML-KEM Hybrid KEX for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-sshm-mlkem-hybrid-kex/',
        date: '2026-02-26',
        localFile: '/library/draft-ietf-sshm-mlkem-hybrid-kex-10.html',
      },
      {
        id: 'draft-harrison-sshm-mlkem',
        title: 'draft-harrison-sshm-mlkem — Pure ML-KEM KEX for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-harrison-sshm-mlkem/',
        date: '2026-02',
      },
      {
        id: 'draft-sfluhrer-ssh-mldsa',
        title: 'draft-sfluhrer-ssh-mldsa — ML-DSA Authentication for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-sfluhrer-ssh-mldsa/',
        date: '2026-01',
      },
      {
        id: 'draft-josefsson-ssh-sphincs',
        title: 'draft-josefsson-ssh-sphincs — SLH-DSA Authentication for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-josefsson-ssh-sphincs/',
        date: '2025-11',
      },
      {
        id: 'draft-ietf-sshm-composite-sigs',
        title:
          'draft-ietf-sshm-composite-sigs — Post-Quantum Composite Signatures in SSH (WG-adopted; was draft-miller-sshm-composite-sigs)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-sshm-composite-sigs/',
        date: '2026-08-21',
      },
      {
        id: 'draft-becker-cnsa2-ssh-profile-05',
        title: 'draft-becker-cnsa2-ssh-profile-05 — CNSA 2.0 Profile for SSH (In IESG Review)',
        url: 'https://datatracker.ietf.org/doc/draft-becker-cnsa2-ssh-profile/',
        date: '2026-05-08',
        localFile: '/library/draft-becker-cnsa2-ssh-profile-05.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'individual-draft',
        stageNote: 'Internet-Draft',
        note: 'ML-KEM-1024 required by CNSA 2.0 SSH profile from 2027 (Independent Submission track).',
        refs: [
          {
            kind: 'draft',
            id: 'draft-harrison-sshm-mlkem',
            title: 'Pure ML-KEM KEX for SSH',
            url: 'https://datatracker.ietf.org/doc/draft-harrison-sshm-mlkem/',
            publishedOn: '2026-02',
          },
        ],
      },
      hybridKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'RFC 9941 published 2026-04; follow-on ML-KEM hybrid draft (draft-ietf-sshm-mlkem-hybrid-kex) now in RFC Editor Queue (EDIT)',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9941',
            title:
              'Streamlined NTRU Prime sntrup761 Key Exchange for SSH (was draft-ietf-sshm-ntruprime-ssh)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9941',
            publishedOn: '2026-04',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-sshm-mlkem-hybrid-kex',
            title: 'ML-KEM Hybrid KEX for SSH',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-sshm-mlkem-hybrid-kex/',
            publishedOn: '2026-02-26',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'individual-draft',
        stageNote: 'Internet-Drafts (individual)',
        refs: [
          {
            kind: 'draft',
            id: 'draft-sfluhrer-ssh-mldsa',
            title: 'ML-DSA Authentication for SSH',
            url: 'https://datatracker.ietf.org/doc/draft-sfluhrer-ssh-mldsa/',
            publishedOn: '2026-01',
          },
          {
            kind: 'draft',
            id: 'draft-josefsson-ssh-sphincs',
            title: 'SLH-DSA Authentication for SSH',
            url: 'https://datatracker.ietf.org/doc/draft-josefsson-ssh-sphincs/',
            publishedOn: '2025-11',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'wg-document',
        stageNote:
          'Verified live 2026-09-01: the individual submission was adopted by the SSHM working group and replaced by draft-ietf-sshm-composite-sigs (WG document, IESG state "I-D Exists"). Was individual-draft.',
        note: 'Composite ML-DSA+Ed25519 host-key authentication track; the CNSA 2.0 SSH profile (Independent Submission) also touches composite-sig host-key semantics. OpenSSH 10.4 (2026-07-06) shipped the first implementation — experimental, opt-in support for mldsa44-ed25519 host keys and user auth (ssh-keygen -t mldsa44-ed25519; not enabled by default).',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-sshm-composite-sigs',
            title:
              'Post-Quantum Composite Signatures in SSH (WG document; was draft-miller-sshm-composite-sigs)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-sshm-composite-sigs/',
            publishedOn: '2026-08-21',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'openssh',
        name: 'OpenSSH',
        versionNote:
          '10.0+ (mlkem768x25519 default KEX); 10.4 (2026-07-06) adds experimental opt-in composite ML-DSA-44+Ed25519 signatures',
      },
    ],
    commercialLibraries: [
      { productId: 'wolfssh', name: 'wolfSSH', versionNote: 'Commercial dual-license' },
      { productId: 'bitvise-ssh-server', name: 'Bitvise SSH Server' },
      { productId: 'aws-transfer-family', name: 'AWS Transfer Family' },
      { productId: 'github-ssh-pqc', name: 'GitHub SSH (PQC)' },
    ],
    playgrounds: [
      {
        toolId: 'pqc-ssh-sim',
        toolName: 'PQC SSH Simulation',
        testability: {
          pureKem: 'full',
          hybridKem: 'full',
          pureSig: 'full',
          hybridSig: 'none',
        },
      },
    ],
    liveDeployments: [
      {
        provider: 'OpenSSH',
        what: 'mlkem768x25519-sha256 default key exchange since OpenSSH 10.0 (added in 9.9); 10.1+ warns on non-PQ KEX',
        since: '2025-04',
        referenceUrl: 'https://www.openssh.com/pq.html',
      },
      {
        provider: 'GitHub SSH',
        what: 'sntrup761x25519-sha512 on github.com and GHEC (from 2025-09-17); US data-residency region excluded for FIPS compliance',
        since: '2025-09',
        referenceUrl:
          'https://github.blog/engineering/platform-security/post-quantum-security-for-ssh-access-on-github/',
      },
      {
        provider: 'AWS Transfer Family',
        what: 'ML-KEM SSH KEX policies for SFTP (TransferSecurityPolicy-2025-03)',
        since: '2025-05',
        referenceUrl:
          'https://aws.amazon.com/blogs/security/post-quantum-hybrid-sftp-file-transfers-using-aws-transfer-family/',
      },
    ],
    recommended: true,
    recommendedReason:
      'RFC 9941 published (April 2026) standardizes sntrup761x25519 — the hybrid GitHub SSH runs; mlkem768x25519 ships by default in OpenSSH 10.0 and is offered by AWS Transfer Family — the most deployment-ready PQC protocol today.',
    sources: [
      {
        label: 'OpenSSH release notes',
        url: 'https://www.openssh.com/releasenotes.html',
        note: 'mlkem768x25519 default since 10.0 (Apr 2025); 10.4 (2026-07-06) adds experimental composite ML-DSA-44+Ed25519 signatures (opt-in)',
      },
      {
        label: 'IETF SSHM working group documents',
        url: 'https://datatracker.ietf.org/wg/sshm/documents/',
      },
    ],
  },
  {
    id: 'tls-1-2',
    name: 'TLS 1.2',
    description: 'Legacy transport-layer security — no PQC standardization path.',
    latestRelease: [
      {
        id: 'RFC-5246',
        title: 'RFC 5246 — TLS 1.2',
        url: 'https://datatracker.ietf.org/doc/html/rfc5246',
        date: '2008-08',
        localFile: '/library/RFC_5246.html',
      },
      {
        id: 'RFC-9325',
        title: 'RFC 9325 / BCP 195 — Recommendations for Secure Use of TLS and DTLS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9325',
        date: '2022-11',
        localFile: '/library/RFC_9325.html',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'No PQC track for TLS 1.2',
        note: 'IETF TLS WG has scoped all PQC work to TLS 1.3 only.',
      },
      hybridKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'No PQC track for TLS 1.2',
        note: 'No IETF draft proposes hybrid PQC for TLS 1.2.',
      },
      pureSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'No PQC track for TLS 1.2',
        note: 'No PQC signature support planned for TLS 1.2.',
      },
      hybridSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'No PQC track for TLS 1.2',
        note: 'No PQC signature support planned for TLS 1.2.',
      },
    },
    ossLibraries: [
      { productId: 'openssl', name: 'OpenSSL', versionNote: 'TLS 1.2 transport — no PQC' },
      { productId: 'boringssl', name: 'BoringSSL', versionNote: 'TLS 1.2 transport — no PQC' },
    ],
    commercialLibraries: [
      { productId: 'wolfssl', name: 'wolfSSL', versionNote: 'TLS 1.2 transport — no PQC' },
      { productId: 'safelogic-cryptocomply', name: 'SafeLogic CryptoComply' },
      { productId: 'venafi-tls-protect', name: 'Venafi TLS Protect' },
    ],
    playgrounds: [],
    noDeploymentReason:
      'By design — the IETF TLS WG scoped all PQC work to TLS 1.3 only (TLS 1.2 BCP recommends migrating off TLS 1.2). Operators must migrate to TLS 1.3 to obtain any PQ posture; no path exists to retrofit PQ key exchange or signatures into TLS 1.2 transport.',
    inheritedBy: ['DTLS 1.2', 'FIDO'],
    supersededByProtocolId: 'tls-1-3',
  },
  {
    id: 'tls-1-3',
    name: 'TLS 1.3',
    description:
      'Modern transport-layer security with hybrid + pure PQC key exchange and PQ signatures.',
    latestRelease: [
      {
        id: 'RFC-9846',
        title: 'RFC 9846 — TLS 1.3 (obsoletes RFC 8446)',
        url: 'https://datatracker.ietf.org/doc/html/rfc9846',
        date: '2026-07',
        localFile: '/library/RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-tls-ecdhe-mlkem-05',
        title:
          'draft-ietf-tls-ecdhe-mlkem-05 — Hybrid X25519MLKEM768 / SecP256r1MLKEM768 (published 2026-08-10 as RFC 10024)',
        url: 'https://www.rfc-editor.org/rfc/rfc10024.html',
        date: '2026-08-10',
        localFile: '/library/draft-ietf-tls-ecdhe-mlkem-05.html',
      },
      {
        id: 'draft-ietf-tls-mlkem-08',
        title: 'draft-ietf-tls-mlkem-08 — Standalone ML-KEM groups for TLS (In WG Last Call)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
        date: '2026-06-24',
      },
      {
        id: 'draft-ietf-tls-mldsa-05',
        title: 'draft-ietf-tls-mldsa-05 — ML-DSA in TLS 1.3 (Approved — AD Followup)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/',
        date: '2026-07-06',
        localFile: '/library/draft-ietf-tls-mldsa-04.html',
      },
      {
        // PUBLISHED 2026-08-22 correction. Was labelled "(RFC Ed Queue)" at -16, dated
        // 2025-09-07. It left that queue in July 2026: the datatracker reads
        // "Hybrid Key Exchange in TLS 1.3 RFC 9954 ... Document Type RFC - Informational
        // (July 2026) ... Was draft-ietf-tls-hybrid-design (tls WG)". The local capture
        // The RFC itself is now cached (library row RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3,
        // added 2026-08-22), so localFile points at it rather than at the superseded draft.
        id: 'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
        title:
          'RFC 9954 — Hybrid Key Exchange in TLS 1.3 (Informational; was draft-ietf-tls-hybrid-design)',
        url: 'https://www.rfc-editor.org/rfc/rfc9954.html',
        date: '2026-07',
        localFile: '/library/RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3.html',
      },
      {
        id: 'draft-yusef-tls-pqt-dual-certs',
        title: 'draft-yusef-tls-pqt-dual-certs — Dual-certificate PQ/T negotiation for TLS 1.3',
        url: 'https://datatracker.ietf.org/doc/draft-yusef-tls-pqt-dual-certs/',
        date: '2026-04',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote:
          "Verified live 2026-09-01: Last Call closed 2026-08-13 (SECDIR review 2026-08-12 'Ready', GENART review 2026-08-07 'Ready w/nits'); draft-ietf-tls-mlkem-09 is now in IESG Evaluation, on the 2026-09-03 telechat agenda, 'has enough positions to pass'. Corrects the 2026-08-09 note's premise — iesg-submitted is step 5 (AFTER ietf-last-call) per this file's own DraftStage definition, not a pre-Last-Call WG handoff state.",
        deploymentPosture: 'pilot',
        deploymentNote:
          'Standalone ML-KEM groups gated behind feature flags in BoringSSL / Chromium experimental builds.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mlkem',
            title: 'Standalone ML-KEM groups for TLS',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
            publishedOn: '2026-06-24',
          },
        ],
      },
      hybridKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'Published as RFC 10024 on 2026-08-10 — draft-ietf-tls-ecdhe-mlkem-05 is the revision that became the RFC, so the earlier "RFC Editor queue" note is superseded rather than contradicted. Verified against the datatracker: the draft carries state slug `rfc` and IESG state `pub`, and relateddocument records `became_rfc -> rfc10024`.',
        note: 'X25519MLKEM768 hybrid group (IANA codepoint 4588) — deployed in production since 2024, and standards-track as of 2026-08-10.',
        deploymentPosture: 'production',
        deploymentNote:
          'X25519MLKEM768 enabled by default in Cloudflare edge, Google services, AWS, BoringSSL, OpenSSL 3.5 since 2024–2025 — production deployment preceded publication by roughly two years.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 10024',
            title: 'Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3',
            url: 'https://www.rfc-editor.org/rfc/rfc10024.html',
            publishedOn: '2026-08-10',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote:
          'Approved by IESG at the 2026-07-02 telechat — AD Followup ahead of RFC Editor queue (draft-ietf-tls-mldsa-05)',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mldsa',
            title: 'ML-DSA in TLS 1.3',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/',
            publishedOn: '2026-05-06',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote: 'rfc editor queue (datatracker 2026-06-02)',
        note: 'Three approaches to composite/hybrid signatures for TLS 1.3: dual-certificate negotiation in TLS WG (Internet-Draft), composite signatures from LAMPS that TLS will profile after publication, and an individual draft proposing composite ML-DSA directly in the TLS handshake. TLS profiling pending LAMPS RFC publication.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-yusef-tls-pqt-dual-certs',
            title: 'Dual-certificate PQ/T negotiation for TLS 1.3',
            url: 'https://datatracker.ietf.org/doc/draft-yusef-tls-pqt-dual-certs/',
            publishedOn: '2026-04',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title:
              'Composite ML-DSA signatures (cross-WG; X.509-layer composite to be profiled into TLS)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
          {
            kind: 'draft',
            id: 'draft-reddy-tls-composite-mldsa',
            title:
              'Composite ML-DSA authentication for TLS 1.3 (individual draft; not yet TLS WG-adopted)',
            url: 'https://datatracker.ietf.org/doc/draft-reddy-tls-composite-mldsa/',
            publishedOn: '2026-05-14',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'openssl-3-5-0',
        name: 'OpenSSL 3.5.0',
        versionNote: 'Native ML-KEM via X25519MLKEM768 group',
      },
      { productId: 'aws-lc', name: 'AWS-LC', versionNote: 'ML-KEM + ML-DSA' },
      { productId: 'boringssl', name: 'BoringSSL', versionNote: 'X25519MLKEM768 production' },
      { productId: 'rustls', name: 'rustls', versionNote: 'via rustls-post-quantum crate' },
      { productId: 'oqs-provider', name: 'oqs-provider', versionNote: 'OpenSSL 3.x plugin' },
      {
        productId: 'JEP-527-Post-Quantum-Hybrid-Key-Exchange',
        name: 'JEP 527: Post-Quantum Hybrid Key Exchange for TLS 1.3',
        versionNote: 'X25519MLKEM768 default, SecP256r1MLKEM768, SecP384r1MLKEM1024 (JDK 27)',
      },
    ],
    commercialLibraries: [
      { productId: 'wolfssl', name: 'wolfSSL', versionNote: 'ML-KEM + ML-DSA + FALCON' },
      {
        productId: 'cloudflare-edge-network',
        name: 'Cloudflare Edge Network',
        versionNote: 'X25519MLKEM768 in production',
      },
      { productId: 'akamai-pqc-edge', name: 'Akamai PQC Edge' },
      { productId: 'venafi-tls-protect', name: 'Venafi TLS Protect' },
    ],
    playgrounds: [
      {
        toolId: 'tls-simulator',
        toolName: 'TLS 1.3 Simulator',
        testability: { pureKem: 'full', hybridKem: 'full', pureSig: 'full', hybridSig: 'partial' },
        hybridSigNote:
          'Composite-sig cert IDs are exposed in the dropdown but currently substitute the closest pre-baked ML-DSA PEM. True composite cert generation is delegated to OpenSSL Studio "Custom".',
      },
      {
        toolId: 'openssl-studio',
        toolName: 'OpenSSL Studio',
        testability: { pureKem: 'na', hybridKem: 'na', pureSig: 'na', hybridSig: 'na' },
      },
    ],
    liveDeployments: [
      {
        provider: 'Cloudflare',
        what: 'X25519MLKEM768 default at the edge for all TLS 1.3 connections',
        since: '2024-10',
        referenceUrl: 'https://blog.cloudflare.com/pq-2025/',
      },
      {
        provider: 'Google Chrome',
        what: 'X25519MLKEM768 default for TLS 1.3 and QUIC in Chrome 131 (Chrome 124, Apr 2024, shipped the earlier X25519Kyber768Draft00 pre-standard group, not ML-KEM)',
        since: '2024-11',
        referenceUrl: 'https://chromestatus.com/feature/5257822742249472',
      },
      {
        provider: 'AWS',
        what: 'ML-KEM hybrid TLS supported in AWS KMS, ACM, and Secrets Manager; Kyber support runs alongside ML-KEM, with removal slated for 2026',
        since: '2025-04',
        referenceUrl:
          'https://aws.amazon.com/blogs/security/ml-kem-post-quantum-tls-now-supported-in-aws-kms-acm-and-secrets-manager/',
      },
      {
        provider: 'AWS Application/Network Load Balancer',
        what: 'Opt-in PQ-TLS security policies (SecP256r1MLKEM768, SecP384r1MLKEM1024, X25519MLKEM768) for ALB/NLB listeners — the actual internet-facing TLS termination products, distinct from the KMS/ACM/Secrets Manager entry above',
        since: '2025-11',
        referenceUrl:
          'https://aws.amazon.com/about-aws/whats-new/2025/11/network-load-balancers-post-quantum-key-exchange-tls/',
      },
      {
        provider: 'Akamai',
        what: 'Hybrid ML-KEM + X25519 key exchange for browser-to-edge connections on Ion / Dynamic Site Accelerator (Enhanced TLS), limited availability opt-in',
        since: '2025-09',
        referenceUrl:
          'https://www.akamai.com/blog/security/akamai-enables-post-quantum-cryptography-edge',
      },
      {
        provider: 'Fastly',
        what: 'ML-KEM post-quantum key exchange rolling out across the global CDN fleet',
        since: '2025-04',
        referenceUrl:
          'https://www.fastly.com/blog/future-proofing-tls-encryption-against-quantum-threats',
      },
      {
        provider: 'Apple iOS / macOS',
        what: 'X25519MLKEM768 advertised in TLS 1.3 from iOS 26 / macOS 26 (shipped 2025-09-15)',
        since: '2025-09',
        referenceUrl: 'https://support.apple.com/en-us/122756',
      },
      {
        provider: 'Microsoft (Windows / Server / .NET)',
        what: 'SymCrypt ships ML-KEM + ML-DSA GA via CNG/certificate APIs on Windows 11 (24H2/25H2), Windows Server 2025, and .NET 10; Azure service-level PQC (e.g. Key Vault) is rolling out separately through 2026–27, not GA alongside this release',
        since: '2025-11',
        referenceUrl:
          'https://techcommunity.microsoft.com/blog/microsoft-security-blog/post-quantum-cryptography-apis-now-generally-available-on-microsoft-platforms/4469093',
      },
      {
        provider: 'OpenSSL 3.5+',
        what: 'Default TLS keyshares offer X25519MLKEM768 (3.5 LTS)',
        since: '2025-04',
        referenceUrl: 'https://openssl-library.org/news/openssl-3.5-notes/',
      },
      {
        provider: 'F5 BIG-IP',
        what: 'X25519_ML-KEM-768 hybrid in TLS 1.3 (named group requires TMOS 17.5.1+; 17.5.0 shipped an earlier Kyber hybrid)',
        since: '2025',
        referenceUrl:
          'https://community.f5.com/kb/technicalarticles/future-proofing-your-network-enabling-quantum-ciphers-on-f5-big-ip-tmos-17-5-1/342586',
      },
      {
        provider: 'Symantec SWG (Broadcom)',
        what: 'X25519MLKEM768 hybrid KEX as first-to-market SWG PQ capability',
        since: '2025',
        referenceUrl: 'https://www.security.com/product-insights/post-quantum-security-edge',
      },
      {
        provider: 'Mozilla Firefox',
        what: 'mlkem768x25519 (X25519MLKEM768) default for TLS 1.3 HTTPS since Firefox 132 (via NSS 3.105)',
        since: '2024-10',
        referenceUrl: 'https://bugzilla.mozilla.org/show_bug.cgi?id=1919097',
      },
      {
        provider: 'Google Android',
        what: 'Android 17 adds ML-DSA to Keystore and Verified Boot; announced/beta Mar 2026, stable rollout (Pixel) 2026-06-16',
        since: '2026-06',
        referenceUrl:
          'https://security.googleblog.com/2026/03/post-quantum-cryptography-in-android.html',
      },
    ],
    inheritedBy: ['DTLS 1.3', 'FIDO 2', 'MACsec', 'QUIC'],
    supersedes: ['tls-1-2', 'tls-1-0-1-1', 'ssl-3-0'],
    recommended: true,
    recommendedReason:
      'X25519MLKEM768 hybrid group already in production at Cloudflare, Google, and AWS; spec is in the RFC Editor queue (EDIT) — the de-facto standard for TLS PQC migration today.',
    sources: [
      {
        label: 'IETF TLS working group documents',
        url: 'https://datatracker.ietf.org/wg/tls/documents/',
      },
    ],
  },
  {
    id: 'x509',
    name: 'X.509',
    description:
      'PKI certificate format — algorithm OIDs for ML-DSA / ML-KEM / SLH-DSA + composite (hybrid) variants.',
    latestRelease: [
      {
        id: 'RFC-5280',
        title: 'RFC 5280 — X.509 PKI Certificate and CRL Profile',
        url: 'https://datatracker.ietf.org/doc/html/rfc5280',
        date: '2008-05',
        localFile: '/library/RFC_5280.html',
      },
      {
        id: 'RFC-9881',
        title: 'RFC 9881 — X.509 Algorithm Identifiers for ML-DSA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9881',
        date: '2025-10',
        localFile: '/library/RFC_9881.html',
      },
      {
        id: 'RFC-9935',
        title: 'RFC 9935 — X.509 Algorithm Identifiers for ML-KEM',
        url: 'https://datatracker.ietf.org/doc/html/rfc9935',
        date: '2026-03',
        localFile: '/library/RFC-9935.html',
      },
      {
        id: 'RFC-9909',
        title: 'RFC 9909 — X.509 Algorithm Identifiers for SLH-DSA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9909',
        date: '2025-12',
        localFile: '/library/RFC_9909.html',
      },
      {
        // Added 2026-08-17: a published X.509 hybrid mechanism the row omitted.
        // Related Certificates pair a classical and a PQC certificate via a
        // binding hash — distinct from composite (single OID, both-must-verify).
        id: 'RFC-9763',
        title: 'RFC 9763 — Related Certificates for Multiple Authentications',
        url: 'https://datatracker.ietf.org/doc/html/rfc9763',
        date: '2025-06',
        localFile: '/library/RFC-9763.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-lamps-pq-composite-sigs-19',
        title: 'draft-ietf-lamps-pq-composite-sigs-19 — Composite ML-DSA in X.509',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
        date: '2026-04-21',
        localFile: '/library/draft-ietf-lamps-pq-composite-sigs-19.html',
      },
      {
        id: 'draft-ietf-lamps-pq-composite-kem-19',
        title: 'draft-ietf-lamps-pq-composite-kem-19 — Composite ML-KEM in X.509 (IESG Evaluation)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
        date: '2026-08-14',
        localFile: '/library/draft-ietf-lamps-pq-composite-kem-19.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9935 published 2026-03',
        note: 'Constraint: KEM certs are encryption-only — cannot self-sign, must be issued under a signature cert.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9935',
            title:
              'X.509 Algorithm Identifiers for ML-KEM (formerly the lamps-kyber-certificates work item)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9935',
            publishedOn: '2026-03',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote:
          "Corrects the 2026-08-17 note, which claimed 'this scale has no iesg-evaluation member' — it does: iesg-submitted is step 5 (AFTER ietf-last-call) per this file's own DraftStage definition (see the type doc comment above). draft-ietf-lamps-pq-composite-kem-19 has been in IESG Evaluation since 2026-08-13, on the 2026-09-03 telechat agenda. Re-verified live 2026-09-01.",
        note: 'Composite mode pairs ML-KEM with RSA-OAEP / ECDH / X25519 / X448 classical KEMs.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-kem',
            title: 'Composite ML-KEM in X.509',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
            publishedOn: '2026-03-27',
          },
        ],
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9909 (SLH-DSA, Dec 2025) + RFC 9881 (ML-DSA, Oct 2025)',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9881',
            title:
              'X.509 Algorithm Identifiers for ML-DSA (was draft-ietf-lamps-dilithium-certificates)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9881',
            publishedOn: '2025-10',
          },
          {
            kind: 'rfc',
            id: 'RFC 9909',
            title: 'X.509 Algorithm Identifiers for SLH-DSA (was draft-ietf-lamps-x509-slhdsa)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9909',
            publishedOn: '2025-12',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote: 'RFC Ed Queue (EDIT) — draft-ietf-lamps-pq-composite-sigs-19',
        note: 'Composite mode pairs ML-DSA with ECDSA / RSA / Ed25519 / EdDSA classical signatures.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title: 'Composite ML-DSA in X.509',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'openssl-3-5-0',
        name: 'OpenSSL 3.5.0',
        versionNote: 'ML-DSA / ML-KEM cert ops',
      },
      {
        productId: 'bouncy-castle-java',
        name: 'Bouncy Castle Java',
        versionNote: '1.78+ PQC suite',
      },
      {
        productId: 'oqs-provider',
        name: 'oqs-provider',
        versionNote: 'OpenSSL plugin for cert ops',
      },
      { productId: 'aws-lc', name: 'AWS-LC', versionNote: 'PQ cert verification' },
    ],
    commercialLibraries: [
      { productId: 'entrust-pki', name: 'Entrust PKI' },
      { productId: 'entrust-nshield', name: 'Entrust nShield' },
      { productId: 'entrust-keycontrol', name: 'Entrust KeyControl' },
      { productId: 'keyfactor-ejbca', name: 'Keyfactor EJBCA' },
      { productId: 'venafi-trust-protection-platform', name: 'Venafi Trust Protection Platform' },
      { productId: 'microsoft-ad-cs', name: 'Microsoft AD CS' },
    ],
    playgrounds: [
      {
        toolId: 'hybrid-certs',
        toolName: 'Hybrid Certificate Workshop',
        testability: { pureKem: 'full', hybridKem: 'full', pureSig: 'full', hybridSig: 'full' },
      },
      {
        toolId: 'openssl-studio',
        toolName: 'OpenSSL Studio',
        testability: { pureKem: 'na', hybridKem: 'na', pureSig: 'na', hybridSig: 'na' },
      },
      {
        toolId: 'cert-capacity',
        toolName: 'Cert Capacity Calculator',
        testability: { pureKem: 'na', hybridKem: 'na', pureSig: 'na', hybridSig: 'na' },
      },
    ],
    liveDeployments: [
      {
        provider: 'X9 Financial PKI (operated by DigiCert)',
        what: 'Managed PKI for financial services; offers legacy + PQC algorithms for transition',
        since: '2025-02',
        referenceUrl:
          'https://www.digicert.com/news/digicert-selected-by-asc-x9-to-provide-managed-pki-service-infrastructure',
      },
      {
        provider: 'AWS Private CA',
        what: 'ML-DSA X.509 certificate issuance for quantum-resistant code signing roots of trust',
        since: '2025',
        referenceUrl:
          'https://aws.amazon.com/blogs/security/post-quantum-ml-dsa-code-signing-with-aws-private-ca-and-aws-kms/',
      },
      {
        provider: 'Microsoft AD CS',
        what: 'ML-DSA certificate issuance GA on Windows Server 2025 Active Directory Certificate Services',
        since: '2026-05',
        referenceUrl:
          'https://learn.microsoft.com/en-us/windows-server/identity/ad-cs/ml-dsa-overview',
      },
      {
        provider: 'Cloudflare',
        what: 'Accepts ML-DSA (FIPS 204) origin certificates via Authenticated Origin Pulls + Custom Origin Trust Store',
        since: '2026-06',
        referenceUrl:
          'https://developers.cloudflare.com/changelog/post/2026-06-17-pqc-mldsa-aop-cots/',
      },
    ],
    inheritedBy: ['UEFI'],
    sources: [
      {
        label: 'IETF LAMPS working group documents',
        url: 'https://datatracker.ietf.org/wg/lamps/documents/',
      },
    ],
  },
  {
    id: 'smime',
    name: 'S/MIME (CMS)',
    description: 'Cryptographic Message Syntax for signed/encrypted email and S/MIME messages.',
    latestRelease: [
      {
        id: 'RFC-8551',
        title: 'RFC 8551 — S/MIME v4.0',
        url: 'https://datatracker.ietf.org/doc/html/rfc8551',
        date: '2019-04',
        localFile: '/library/RFC_8551.html',
      },
      {
        id: 'RFC-5652',
        title: 'RFC 5652 — Cryptographic Message Syntax (CMS)',
        url: 'https://datatracker.ietf.org/doc/html/rfc5652',
        date: '2009-09',
        localFile: '/library/RFC_5652.html',
      },
      {
        id: 'RFC-9936',
        title: 'RFC 9936 — Use of ML-KEM in CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9936',
        date: '2026-03',
        localFile: '/library/RFC-9936.html',
      },
      {
        id: 'RFC-9882',
        title: 'RFC 9882 — Use of ML-DSA in CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9882',
        date: '2025-10',
        localFile: '/library/RFC_9882.html',
      },
      {
        id: 'RFC-9814',
        title: 'RFC 9814 — Use of SLH-DSA in CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9814',
        date: '2025-07',
        localFile: '/library/RFC_9814.html',
      },
      {
        id: 'RFC-9629',
        title: 'RFC 9629 — KEMRecipientInfo for CMS',
        url: 'https://datatracker.ietf.org/doc/html/rfc9629',
        date: '2024-08',
        localFile: '/library/RFC_9629.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-lamps-cms-composite-kem-01',
        title: 'draft-ietf-lamps-cms-composite-kem-01 — Composite ML-KEM for CMS',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-composite-kem/',
        date: '2026-05-06',
      },
      {
        id: 'draft-ietf-lamps-cms-composite-sigs-05',
        title: 'draft-ietf-lamps-cms-composite-sigs-05 — Composite ML-DSA for CMS (RFC Ed Queue)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-composite-sigs/',
        date: '2026-04',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9936 published 2026-03',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9936',
            title: 'Use of ML-KEM in CMS (formerly the lamps-cms-kyber work item)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9936',
            publishedOn: '2026-03',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'ietf-last-call',
        stageNote:
          "Verified live 2026-09-01: Last Call closed 2026-08-18 (SECDIR review 2026-08-18 'Ready'); IESG state is 'Waiting for AD Go-Ahead', no ballot open, no telechat scheduled. Stage correctly stays at ietf-last-call — the last completed milestone — since IESG evaluation has not actually started yet (contrast the TLS 1.3/X.509/EST-CMP rows' composite-kem refs, which ARE on an active 2026-09-03 telechat and correctly read iesg-submitted). Corrects this note's prior premise, which wrongly described iesg-submitted as a pre-Last-Call state; iesg-submitted is step 5, AFTER ietf-last-call, per this file's own DraftStage definition.",
        note: 'Uses the CMS KEMRecipientInfo structure; pairs ML-KEM with RSA-OAEP / ECDH / X25519 / X448 classical KEMs.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-cms-composite-kem',
            title: 'Composite ML-KEM for CMS',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-composite-kem/',
            publishedOn: '2026-05-06',
          },
        ],
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9882 published 2025-10',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9882',
            title: 'Use of ML-DSA in CMS (formerly the lamps-cms-ml-dsa work item)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9882',
            publishedOn: '2025-10',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote:
          'IETF Last Call completed (directorate reviews Apr 2026) — now in RFC Editor queue (draft-05)',
        note: 'Composite ML-DSA SignerInfo construction mirrors the X.509 composite-sigs row.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-cms-composite-sigs',
            title: 'Composite ML-DSA for CMS',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-composite-sigs/',
            publishedOn: '2026-02',
          },
        ],
      },
    },
    ossLibraries: [
      { productId: 'bouncy-castle-java', name: 'Bouncy Castle Java', versionNote: 'PQC CMS' },
      { productId: 'nss-mozilla', name: 'NSS (Mozilla)', versionNote: 'CMS PQ in progress' },
      { productId: 'openssl-3-5-0', name: 'OpenSSL 3.5.0', versionNote: 'PQ CMS via oqs-provider' },
    ],
    commercialLibraries: [
      { productId: 'zscaler-zero-trust-exchange', name: 'Zscaler Zero Trust Exchange' },
    ],
    playgrounds: [
      {
        toolId: 'email-signing',
        toolName: 'S/MIME & CMS Workshop (Email Signing)',
        testability: { pureKem: 'full', hybridKem: 'none', pureSig: 'full', hybridSig: 'partial' },
        pureSigNote:
          'ML-DSA-44/65/87 and SLH-DSA-SHA2-128s sign+verify via real OpenSSL 3.6 WASM CMS SignedData; toggle routes signing key through softhsmv3 PKCS#11 HSM — private key never enters the openssl process address space.',
        pureKemNote:
          'ML-KEM-512/768/1024 encrypt+decrypt via CMS AuthEnvelopedData with KEMRecipientInfo; CA-issued cert flow for KEM-only keys. X25519 also exercised.',
        hybridSigNote:
          'LAMPS composite ML-DSA+ECDSA OIDs (draft-19) implemented via pkcs11-provider composite.c — exercised through the algorithm dropdown when HSM mode is on.',
        hybridKemNote:
          'Composite ML-KEM (draft-ietf-lamps-cms-composite-kem) deferred — awaiting composite-KEM OID support in pkcs11-provider.',
      },
    ],
    noDeploymentReason:
      'S/MIME PQ standards are very fresh (ML-DSA Oct 2025, SLH-DSA Jul 2025, ML-KEM Mar 2026) — typical standards-to-ship gap is 12–24 months. The quantum-safe consumer-email market migrated to OpenPGP (Proton Mail) and proprietary protocols (Tuta / TutaCrypt) rather than S/MIME; mainstream providers (Gmail / Outlook / Apple Mail) rely on TLS-in-transit + at-rest encryption and do not drive S/MIME at all. The procurement-cycle slots that will force S/MIME PQ deployment — CNSA 2.0 S/MIME profile (still draft) and X9 Financial PKI consumers — have not yet shipped a product. Building blocks (OpenSSL 3.5 `cms`, Bouncy Castle 1.79+ CMS API) exist and IETF Hackathon runs cross-vendor interop tests, but no end-user product deployment.',
    sources: [
      {
        label: 'IETF LAMPS working group documents',
        url: 'https://datatracker.ietf.org/wg/lamps/documents/',
      },
    ],
  },
  {
    id: 'cose',
    name: 'COSE',
    description:
      'CBOR Object Signing and Encryption — IoT-oriented peer to S/MIME; ML-DSA and FN-DSA algorithm identifiers in active drafts.',
    latestRelease: [
      {
        id: 'RFC-9052',
        title: 'RFC 9052 — COSE: Structures and Process',
        url: 'https://datatracker.ietf.org/doc/html/rfc9052',
        date: '2022-08',
        localFile: '/library/RFC_9052.html',
      },
      {
        id: 'RFC-9053',
        title: 'RFC 9053 — COSE: Initial Algorithms',
        url: 'https://datatracker.ietf.org/doc/html/rfc9053',
        date: '2022-08',
        localFile: '/library/RFC_9053.html',
      },
      {
        id: 'RFC-9964',
        title: 'RFC 9964 — ML-DSA for JOSE and COSE',
        url: 'https://www.rfc-editor.org/rfc/rfc9964.html',
        date: '2026-05',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-cose-falcon-04',
        title: 'draft-ietf-cose-falcon-04 — FN-DSA for JOSE and COSE',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-falcon/',
        date: '2026-03-25',
        localFile: '/library/draft-ietf-cose-falcon-04.html',
      },
      {
        id: 'draft-ietf-cose-hpke-25',
        title: 'draft-ietf-cose-hpke-25 — HPKE with COSE (IESG AD evaluation)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-hpke/',
        date: '2026-04-07',
      },
      {
        id: 'draft-ietf-jose-hpke-pq-pqt-01',
        title:
          'draft-ietf-jose-hpke-pq-pqt-01 — JOSE HPKE PQ & PQ/T Algorithm Registrations (adopted from draft-reddy-cose-jose-pqc-hybrid-hpke-11)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-pq-pqt/',
        date: '2026-07-06',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          "Re-derived 2026-08-09 from the datatracker's IESG state. The encoded 'iesg-submitted' came from a state that occurs BEFORE IETF Last Call, which this scale defines as level 6 / after Last Call — enrich-protocol-matrix.py's state map has been corrected so this class cannot recur. draft-ietf-cose-hpke-26 is in 'AD Evaluation' — with the IESG but before IETF Last Call. This scale has no rung for that, so wg-last-call is the closest honest label below ietf-last-call.",
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-cose-hpke',
            title: 'Use of Hybrid Public-Key Encryption (HPKE) with COSE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-hpke/',
            publishedOn: '2026-04-07',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-jose-hpke-pq-pqt',
            title:
              'JOSE HPKE PQ & PQ/T Algorithm Registrations (WG document; adopted from draft-reddy-cose-jose-pqc-hybrid-hpke)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-pq-pqt/',
            publishedOn: '2026-07-06',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          "Re-derived 2026-08-09 from the datatracker's IESG state. The encoded 'iesg-submitted' came from a state that occurs BEFORE IETF Last Call, which this scale defines as level 6 / after Last Call — enrich-protocol-matrix.py's state map has been corrected so this class cannot recur. Same document as pure KEM: draft-ietf-cose-hpke-26 in 'AD Evaluation', pre-Last-Call.",
        note: 'Same HPKE construction covers both pure and hybrid KEM modes.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-cose-hpke',
            title: 'Use of Hybrid Public-Key Encryption (HPKE) with COSE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-hpke/',
            publishedOn: '2026-04-07',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-jose-hpke-pq-pqt',
            title:
              'JOSE HPKE PQ & PQ/T Algorithm Registrations (WG document; adopted from draft-reddy-cose-jose-pqc-hybrid-hpke)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-pq-pqt/',
            publishedOn: '2026-07-06',
          },
        ],
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'RFC 9964 published May 2026 — ML-DSA-44/65/87; FN-DSA (draft-ietf-cose-falcon) still WG-doc',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9964',
            title: 'ML-DSA for JOSE and COSE',
            url: 'https://www.rfc-editor.org/rfc/rfc9964.html',
            publishedOn: '2026-05',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-cose-falcon',
            title: 'FN-DSA for JOSE and COSE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-falcon/',
            publishedOn: '2026-03-25',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'wg-document',
        stageNote:
          'WG document (datatracker 2026-02-27) — same status as the JOSE row; ENISA "Hybridization Standardisation Status" (30 Apr 2026) independently confirms WG Draft',
        note: 'Composite signatures are specified at the JOSE layer — see JOSE row.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-jose-pq-composite-sigs',
            title: 'PQ/T Composite Sigs for JOSE/COSE (cross-WG)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
            publishedOn: '2025-01',
          },
        ],
      },
    },
    ossLibraries: [
      { productId: 'bouncy-castle-java', name: 'Bouncy Castle Java', versionNote: '1.79+ COSE PQ' },
    ],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'COSE PQ standards are still in WG draft and the consumer/IoT products that would consume COSE-PQ signatures (passkeys / WebAuthn / constrained-device firmware) are themselves pre-deployment. IANA registered COSE alg IDs for ML-DSA in April 2025, but no commercial COSE-PQ product has shipped.',
  },
  {
    id: 'jose',
    name: 'JOSE',
    description:
      'JSON Object Signing and Encryption (JWS/JWE/JWT) — ML-KEM in JWE and ML-DSA/composite signatures in JWS via active drafts.',
    latestRelease: [
      {
        id: 'RFC-7515',
        title: 'RFC 7515 — JSON Web Signature (JWS)',
        url: 'https://datatracker.ietf.org/doc/html/rfc7515',
        date: '2015-05',
        localFile: '/library/RFC_7515.html',
      },
      {
        id: 'RFC-7516',
        title: 'RFC 7516 — JSON Web Encryption (JWE)',
        url: 'https://datatracker.ietf.org/doc/html/rfc7516',
        date: '2015-05',
        localFile: '/library/RFC_7516.html',
      },
      {
        id: 'RFC-7519',
        title: 'RFC 7519 — JSON Web Token (JWT)',
        url: 'https://datatracker.ietf.org/doc/html/rfc7519',
        date: '2015-05',
        localFile: '/library/RFC_7519.html',
      },
      {
        id: 'RFC-9964',
        title: 'RFC 9964 — ML-DSA for JOSE and COSE',
        url: 'https://www.rfc-editor.org/rfc/rfc9964.html',
        date: '2026-05',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-jose-pqc-kem',
        title: 'draft-ietf-jose-pqc-kem — ML-KEM for JOSE/JWE',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pqc-kem/',
        date: '2025-11',
        localFile: '/library/draft-ietf-jose-pqc-kem.html',
      },
      {
        id: 'draft-ietf-jose-pq-composite-sigs',
        title: 'draft-ietf-jose-pq-composite-sigs — PQ/T Composite Sigs for JOSE/COSE',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
        date: '2026-02-27',
        localFile: '/library/draft-ietf-jose-pq-composite-sigs.html',
      },
      {
        id: 'draft-ietf-jose-hpke-encrypt-22',
        // Verified live 2026-08-22: latest revision -22, last updated 2026-08-03, WG state
        // "Submitted to IESG for Publication" with SECDIR/IETF Last Call reviews recorded.
        // The previous label "IESG-approved, AD Followup" overstated it — that WG-stream
        // string is the handoff TO the IESG, not an approval by it.
        title:
          'draft-ietf-jose-hpke-encrypt-22 — HPKE with JOSE (Submitted to IESG for Publication)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-encrypt/',
        date: '2026-08-03',
      },
      {
        id: 'draft-ietf-jose-hpke-pq-pqt-01',
        title:
          'draft-ietf-jose-hpke-pq-pqt-01 — JOSE HPKE PQ & PQ/T Algorithm Registrations (adopted from draft-reddy-cose-jose-pqc-hybrid-hpke-11)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-pq-pqt/',
        date: '2026-07-06',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'wg-document',
        stageNote:
          'JOSE WG document, "I-D Exists" (draft-06, 2026-07-06) — not yet in WG Last Call',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-jose-pqc-kem',
            title: 'ML-KEM for JOSE/JWE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pqc-kem/',
            publishedOn: '2025-11',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'ietf-last-call',
        stageNote:
          'UPDATED 2026-07-27, verified live: draft-ietf-jose-hpke-encrypt is genuinely "In Last Call (ends 2026-08-03)" — a real regression from the earlier AD-Followup state (revised text triggered a fresh Last Call), not a bad datatracker match. Concrete hybrid KEM algorithm profile (draft-reddy: MLKEM768+P256/X25519, MLKEM1024+P384) remains an individual draft with no IETF standing.',
        note: 'Same HPKE construction covers both pure and hybrid KEM modes.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-jose-hpke-encrypt',
            title: 'Use of Hybrid Public Key Encryption (HPKE) with JOSE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-encrypt/',
            publishedOn: '2026-06-15',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-jose-hpke-pq-pqt',
            title:
              'JOSE HPKE PQ & PQ/T Algorithm Registrations (WG document; adopted from draft-reddy-cose-jose-pqc-hybrid-hpke)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-hpke-pq-pqt/',
            publishedOn: '2026-07-06',
          },
        ],
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9964 published May 2026 — ML-DSA-44/65/87 for JWS',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9964',
            title: 'ML-DSA for JOSE and COSE',
            url: 'https://www.rfc-editor.org/rfc/rfc9964.html',
            publishedOn: '2026-05',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'wg-document',
        stageNote: 'wg document (datatracker 2026-02-27)',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-jose-pq-composite-sigs',
            title: 'PQ/T Composite Sigs for JOSE/COSE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
            publishedOn: '2025-01',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'nimbus-jose-jwt',
        name: 'Nimbus JOSE+JWT',
        versionNote: 'draft-ietf-jose-pqc-kem (contributed)',
      },
      {
        productId: 'bouncy-castle-java',
        name: 'Bouncy Castle Java',
        versionNote: 'JCA provider for PQ JWS',
      },
      { productId: 'jose4j', name: 'jose4j', versionNote: 'Classical only; PQ via BC provider' },
      { productId: 'go-jose-v4', name: 'go-jose v4', versionNote: 'Classical only' },
      { productId: 'pyjwt', name: 'PyJWT', versionNote: 'Classical only' },
    ],
    commercialLibraries: [
      { productId: 'okta-workforce-identity', name: 'Okta Workforce Identity' },
      { productId: 'keycloak', name: 'Keycloak' },
    ],
    playgrounds: [
      {
        toolId: 'api-security-jwt',
        toolName: 'API Security & JWT Workshop',
        url: '/learn/api-security-jwt?tab=workshop',
        testability: { pureKem: 'full', hybridKem: 'na', pureSig: 'full', hybridSig: 'full' },
        hybridKemNote: 'No HPKE tool yet — only direct ML-KEM-768 JWE encap/decap is covered.',
        pureSigNote:
          'ML-DSA-44/65/87 and SLH-DSA-SHA2-128s/192s/256s; RFC 9964 KAT vectors verified in-browser.',
        hybridSigNote:
          // -01 is NOT stale here and must not be bumped: this describes what the SANDBOX
          // pinned and verified, not which revision is current. The spec has since moved to
          // -03 (APISecurityJWT/constants.ts already cites -03 Table 2 for its sizes), so the
          // revision is named explicitly rather than left to read as 'the current draft'.
          'MLDSA65-Ed25519 composite per draft-ietf-jose-pq-composite-sigs-01 §4; pinned KAT snapshot verified against that revision. The draft is now at -03.',
      },
    ],
    liveDeployments: [
      {
        provider: 'AWS KMS',
        what: 'ML-DSA signing GA for JWT/JWS (and CMS, COSE, UEFI); launched in US West (N. California) and Europe (Milan), with remaining commercial regions following within days',
        since: '2025-06',
        referenceUrl:
          'https://aws.amazon.com/blogs/security/how-to-create-post-quantum-signatures-using-aws-kms-and-ml-dsa/',
      },
    ],
  },
  {
    id: 'est-cmp',
    name: 'EST / CMP',
    description:
      'PKI enrollment protocols — RFC 7030 (EST) and RFC 9810 (CMP, KEM update) carry composite ML-DSA/ML-KEM requests for PQ cert issuance.',
    latestRelease: [
      {
        id: 'RFC-7030',
        title: 'RFC 7030 — Enrollment over Secure Transport (EST)',
        url: 'https://datatracker.ietf.org/doc/html/rfc7030',
        date: '2013-10',
        localFile: '/library/IETF-RFC-7030-EST.html',
      },
      {
        id: 'RFC-9810',
        title: 'RFC 9810 — CMP Updates for KEM',
        url: 'https://datatracker.ietf.org/doc/html/rfc9810',
        date: '2025-07',
        localFile: '/library/RFC_9810.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-lamps-pq-composite-kem-19',
        title:
          'draft-ietf-lamps-pq-composite-kem-19 — Composite ML-KEM (enrollment payload, IESG Evaluation)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
        date: '2026-08-14',
        localFile: '/library/draft-ietf-lamps-pq-composite-kem-19.html',
      },
      {
        id: 'draft-ietf-lamps-pq-composite-sigs-19',
        title: 'draft-ietf-lamps-pq-composite-sigs-19 — Composite ML-DSA (enrollment payload)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
        date: '2026-04-21',
        localFile: '/library/draft-ietf-lamps-pq-composite-sigs-19.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9810 (CMP KEM support, Jul 2025) + RFC 9935 (X.509 ML-KEM OIDs, Mar 2026)',
        note: 'ML-KEM X.509 OIDs apply from the X.509 row; CMP adds KEM key-transport semantics on top.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9810',
            title: 'CMP Updates for KEM',
            url: 'https://datatracker.ietf.org/doc/html/rfc9810',
            publishedOn: '2025-07',
          },
          {
            kind: 'rfc',
            id: 'RFC 9935',
            title: 'X.509 ML-KEM Algorithm Identifiers (inherited)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9935',
            publishedOn: '2026-03',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote:
          "Corrects the 2026-08-17 note, which claimed 'this scale has no iesg-evaluation member' — it does: iesg-submitted is step 5 (AFTER ietf-last-call) per this file's own DraftStage definition. Inherits draft-ietf-lamps-pq-composite-kem-19: IESG Evaluation since 2026-08-13, on the 2026-09-03 telechat agenda. Re-verified live 2026-09-01.",
        note: 'Composite enrollment uses PKCS#10 / CMP wrappers — see X.509 row for the composite KEM construction.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-kem',
            title: 'Composite ML-KEM (enrollment payload)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
            publishedOn: '2026-03-27',
          },
        ],
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 7030 (EST, 2013) + RFC 9881 (X.509 ML-DSA OIDs, Oct 2025)',
        note: 'ML-DSA enrollment uses X.509 ML-DSA OIDs (see X.509 row); CSR and CMP response flows defined.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 7030',
            title: 'Enrollment over Secure Transport (EST)',
            url: 'https://datatracker.ietf.org/doc/html/rfc7030',
            publishedOn: '2013-10',
          },
          {
            kind: 'rfc',
            id: 'RFC 9881',
            title: 'X.509 ML-DSA Algorithm Identifiers (inherited)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9881',
            publishedOn: '2025-10',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote:
          'Inherited from X.509 row — draft-ietf-lamps-pq-composite-sigs-19 in RFC Editor queue',
        note: 'Composite-sig CSR / issuance flows wrap the X.509 composite-sigs construction — see X.509 row.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title: 'Composite ML-DSA (enrollment payload)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
        ],
      },
    },
    ossLibraries: [
      { productId: 'bouncy-castle-java', name: 'Bouncy Castle Java', versionNote: 'EST + CMP PQ' },
      { productId: 'openssl-3-5-0', name: 'OpenSSL 3.5.0', versionNote: 'cmp app + EST client' },
      {
        productId: 'signserver',
        name: 'SignServer',
        versionNote: 'ML-DSA enrollment via Keyfactor',
      },
      { productId: 'smallstep-certificate-authority', name: 'smallstep step-ca' },
    ],
    commercialLibraries: [
      { productId: 'entrust-pki', name: 'Entrust PKI' },
      { productId: 'keyfactor-ejbca', name: 'Keyfactor EJBCA' },
      { productId: 'microsoft-ad-cs', name: 'Microsoft AD CS' },
    ],
    playgrounds: [
      {
        toolId: 'pki-enrollment',
        toolName: 'PKI Enrollment Workshop (EST + CMP)',
        testability: { pureKem: 'partial', hybridKem: 'none', pureSig: 'full', hybridSig: 'none' },
        pureSigNote:
          'ML-DSA-65 enrollment exercised end-to-end: keygen → CMP IR (in-WASM mock CA) → cert issued → chain verified.',
        pureKemNote:
          'ML-KEM-768 key generation + encapsulation/decapsulation drives the RFC 9810 encrCert POP round-trip; full CMP KUR PKIMessage wrap is illustrative.',
        hybridKemNote:
          'Composite KEM (draft-ietf-lamps-pq-composite-kem) deferred — awaiting composite provider support; stock OpenSSL 3.6.3 registers no composite algorithms (verified 2026-08-17).',
        hybridSigNote:
          'Composite sigs (draft-ietf-lamps-pq-composite-sigs) deferred — awaiting composite provider support; stock OpenSSL 3.6.3 registers no composite algorithms (verified 2026-08-17).',
      },
    ],
    liveDeployments: [
      {
        provider: 'EJBCA (Keyfactor)',
        what: 'ML-DSA via CMP (RA Verified POP) + ML-KEM via CMP (encrCert POP) cert enrollment since EJBCA 9.1',
        since: '2024',
        referenceUrl:
          'https://docs.keyfactor.com/ejbca/latest/post-quantum-cryptography-keys-and-signatures',
      },
    ],
  },
  {
    id: 'kerberos',
    name: 'Kerberos',
    description:
      'Network authentication protocol (AS/TGS exchanges) — the core protocol is symmetric-key by design and already quantum-safe by construction. PKINIT, the optional public-key preauthentication extension, is the only asymmetric-crypto surface and has no chartered PQC work — only individual (non-WG) drafts.',
    latestRelease: [
      {
        id: 'RFC-4120',
        title: 'RFC 4120 — The Kerberos Network Authentication Service (V5)',
        url: 'https://datatracker.ietf.org/doc/html/rfc4120',
        date: '2005-07',
      },
      {
        id: 'RFC-4556',
        title: 'RFC 4556 — PKINIT (Public Key Cryptography for Initial Authentication in Kerberos)',
        url: 'https://datatracker.ietf.org/doc/html/rfc4556',
        date: '2006-06',
      },
      {
        id: 'RFC-8636',
        title: 'RFC 8636 — PKINIT Algorithm Agility',
        url: 'https://datatracker.ietf.org/doc/html/rfc8636',
        date: '2019-07',
      },
      {
        id: 'RFC-3961',
        title: 'RFC 3961 — Encryption and Checksum Specifications for Kerberos 5',
        url: 'https://datatracker.ietf.org/doc/html/rfc3961',
        date: '2005-02',
      },
    ],
    latestDraft: [
      {
        id: 'draft-bokovoy-kitten-pkinit-pqc-01',
        title:
          'draft-bokovoy-kitten-pkinit-pqc-01 — Post-Quantum ML-KEM for PKINIT (individual, not WG-adopted)',
        url: 'https://datatracker.ietf.org/doc/html/draft-bokovoy-kitten-pkinit-pqc-01',
        date: '2026-06-26',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'individual-draft',
        stageNote:
          'Individual submission (draft-bokovoy-kitten-pkinit-pqc-01, 2026-06-26) — not adopted by the KITTEN working group',
        note: "Core Kerberos (AS-REQ/AS-REP/TGS-REQ/TGS-REP without PKINIT) uses only symmetric long-term/session keys (RFC 3961 framework) — no KEM applies, and NIST/academic consensus treats symmetric crypto as already quantum-resistant (Grover gives only a quadratic speedup, already covered by AES-256/SHA-384+). PKINIT's key establishment is classical Diffie-Hellman with no PQC-safe path via existing agility mechanisms — this draft adds a new KDCKEMInfo structure carrying ML-KEM (RFC 9935 X.509 OIDs) alongside the existing DH fields. Red Hat is prototyping this under the EU-funded QARC consortium (2026–2028) against MIT krb5 + FreeIPA; no public code yet.",
        refs: [
          {
            kind: 'draft',
            id: 'draft-bokovoy-kitten-pkinit-pqc',
            title: 'Post-Quantum ML-KEM for PKINIT',
            url: 'https://datatracker.ietf.org/doc/html/draft-bokovoy-kitten-pkinit-pqc-01',
            publishedOn: '2026-06-26',
          },
          {
            kind: 'rfc',
            id: 'RFC 9935',
            title: 'X.509 Algorithm Identifiers for ML-KEM (dependency for KDCKEMInfo)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9935',
            publishedOn: '2026-03',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'individual-draft',
        stageNote:
          "Re-derived 2026-08-09 from the datatracker's IESG state. The encoded 'iesg-submitted' came from a state that occurs BEFORE IETF Last Call, which this scale defines as level 6 / after Last Call — enrich-protocol-matrix.py's state map has been corrected so this class cannot recur. The only hybrid-KEM mechanism for PKINIT is draft-bokovoy-kitten-pkinit-pqc-01 — stream None, IESG state 'I-D Exists', never WG-adopted, no formal standing in the IETF process.",
        note: 'Same draft as Pure KEM; hybrid mode composes with draft-ietf-lamps-pq-composite-kem, itself still pre-RFC at the X.509 layer (IESG Evaluation) (see X.509 row).',
        refs: [
          {
            kind: 'draft',
            id: 'draft-bokovoy-kitten-pkinit-pqc',
            title: 'Post-Quantum ML-KEM for PKINIT',
            url: 'https://datatracker.ietf.org/doc/html/draft-bokovoy-kitten-pkinit-pqc-01',
            publishedOn: '2026-06-26',
          },
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-kem',
            title: 'Composite ML-KEM in X.509 (optional composite mode, inherited via X.509 row)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
            publishedOn: '2026-03-27',
          },
        ],
      },
      pureSig: {
        value: 'experimental',
        note: 'PKINIT already has signature/digest algorithm agility (RFC 8636, 2019), so a KDC/client could in principle present ML-DSA certificates (RFC 9881 X.509 OIDs, RFC 9882 CMS) without a new PKINIT-specific spec — but no implementation has been confirmed to do this. Microsoft AD CS (Windows Server 2025) can issue ML-DSA certificates generally (GA, May 2026) but this is NOT confirmed to be wired into Kerberos/PKINIT specifically.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9881',
            title: 'X.509 Algorithm Identifiers for ML-DSA (usable via PKINIT algorithm agility)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9881',
            publishedOn: '2025-10',
          },
          {
            kind: 'rfc',
            id: 'RFC 9882',
            title: "Use of ML-DSA in CMS (PKINIT's PA-PK-AS-REQ/REP payloads are CMS SignedData)",
            url: 'https://datatracker.ietf.org/doc/html/rfc9882',
            publishedOn: '2025-10',
          },
        ],
      },
      hybridSig: {
        value: 'experimental',
        stage: 'individual-draft',
        stageNote:
          'Individual draft active (draft-bokovoy-kitten-pkinit-pqc, datatracker 2026-07-18)',
        note: 'Same agility-based path as Pure Signature; draft-bokovoy-kitten-pkinit-pqc optionally mentions composite ML-DSA per the LAMPS composite-sigs draft, but this is unadopted and unimplemented.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-bokovoy-kitten-pkinit-pqc',
            title: 'Post-Quantum ML-KEM for PKINIT (mentions optional composite ML-DSA)',
            url: 'https://datatracker.ietf.org/doc/html/draft-bokovoy-kitten-pkinit-pqc-01',
            publishedOn: '2026-06-26',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [],
    noDeploymentReason:
      'No shipping implementation exists. MIT krb5 has no public PQC roadmap item or commit. Red Hat is prototyping PKINIT+ML-KEM under the EU Horizon-funded QARC consortium (2026–2028, targeting MIT krb5 + FreeIPA) — the same engineers behind the one individual IETF draft above — but no public code has landed yet. Microsoft has GA\'d general ML-DSA certificate issuance (AD CS, Windows Server 2025) and lists "Kerberos" in one generic future-roadmap sentence, but has made no concrete, verified announcement of PQC support inside the Kerberos/PKINIT authentication path itself.',
    sources: [
      {
        label: 'Red Hat Research — the post-quantum cryptography transition (QARC pilot)',
        url: 'https://research.redhat.com/blog/article/the-post-quantum-cryptography-transition-researching-a-quantum-safe-future/',
      },
      {
        label: 'IETF KITTEN working group documents',
        url: 'https://datatracker.ietf.org/group/kitten/documents/',
      },
    ],
  },
  {
    id: '5g-suci',
    name: '5G SUCI (3GPP)',
    description:
      '3GPP 5G Subscription Concealed Identifier — protects the subscriber IMSI/SUPI in transit. No 3GPP TR or TS currently defines a PQC concealment profile; ML-KEM-based SUCI schemes exist only as vendor research.',
    latestRelease: [
      {
        id: '3GPP-TS-33.501',
        title: '3GPP TS 33.501 — Security Architecture and Procedures for 5G',
        url: 'https://www.3gpp.org/dynareport/33501.htm',
        date: '2025-12',
        localFile: '/library/3GPP_TS_33.501.html',
      },
    ],
    latestDraft: [
      {
        id: '3GPP-TR-33.938',
        title: '3GPP TR 33.938 — 3GPP Cryptographic Inventory',
        url: 'https://www.3gpp.org/dynareport/33938.htm',
        date: '2026-01',
        localFile: '/library/3GPP-PQC-Study-2025.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'experimental',
        note: 'No chartered 3GPP study or work item defines a PQC SUCI concealment profile. TR 33.938 ("3GPP Cryptographic Inventory", latest V19.2.0) surveys existing algorithm usage across 3GPP specs and does not specify ML-KEM-based SUCI concealment or any "Profile C". ML-KEM-based SUCI schemes exist only in vendor whitepapers (e.g. Ericsson, Nokia) ahead of any 3GPP normative process.',
        refs: [
          {
            kind: 'spec',
            id: '3GPP TR 33.938',
            title: '3GPP Cryptographic Inventory (does not define PQC SUCI concealment)',
            url: 'https://www.3gpp.org/dynareport/33938.htm',
            publishedOn: '2026-01',
          },
        ],
      },
      hybridKem: {
        value: 'experimental',
        note: 'Same gap as Pure KEM — no 3GPP TR or TS defines a hybrid X25519+ML-KEM-768 SUCI construction. Vendor whitepapers discuss such combiners informally; no 3GPP normative or study text has been found to confirm it.',
        refs: [
          {
            kind: 'spec',
            id: '3GPP TR 33.938',
            title: '3GPP Cryptographic Inventory (does not define PQC SUCI concealment)',
            url: 'https://www.3gpp.org/dynareport/33938.htm',
            publishedOn: '2026-01',
          },
        ],
      },
      pureSig: {
        value: 'na',
        note: 'SUCI concealment is a KEM-based privacy mechanism; no signatures.',
      },
      hybridSig: {
        value: 'na',
        note: 'SUCI concealment is a KEM-based privacy mechanism; no signatures.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [
      { productId: 'ericsson-quantum-safe-5g', name: 'Ericsson Quantum-Safe 5G' },
      { productId: 'nokia-quantum-safe-networks', name: 'Nokia Quantum-Safe Networks' },
      { productId: 'samsung-networks-5g-core', name: 'Samsung Networks 5G Core' },
      { productId: 'mavenir-cloud-ran', name: 'Mavenir Cloud RAN' },
      { productId: 'nec-5g-core', name: 'NEC 5G Core' },
    ],
    playgrounds: [
      {
        toolId: 'suci-flow',
        toolName: '5G SUCI Construction',
        testability: { pureKem: 'partial', hybridKem: 'partial', pureSig: 'na', hybridSig: 'na' },
        pureKemNote:
          'SUCI tool demonstrates a vendor-proposed ML-KEM-768 concealment scheme in illustrative, pre-standard form — no 3GPP TR or TS defines this profile today.',
        hybridKemNote:
          'Hybrid X25519 + ML-KEM-768 mode is illustrative only — no 3GPP specification defines this construction.',
      },
    ],
    liveDeployments: [
      {
        provider: 'SK Telecom + Thales',
        what: 'Crystals-Kyber (ML-KEM) lab trial on a 5G SA network with 5G SIM cards to protect subscriber identity — a trial, not a commercial deployment',
        since: '2023-12',
        referenceUrl: 'https://news.sktelecom.com/en/628',
      },
    ],
  },
  {
    id: 'openpgp',
    name: 'OpenPGP',
    description:
      'OpenPGP message format — composite ML-KEM+ECDH encryption and ML-DSA+ECDSA signatures, plus standalone SLH-DSA.',
    latestRelease: [
      {
        id: 'RFC-9580',
        title: 'RFC 9580 — OpenPGP (crypto refresh)',
        url: 'https://datatracker.ietf.org/doc/html/rfc9580',
        date: '2024-07',
        localFile: '/library/RFC_9580.html',
      },
      {
        id: 'RFC-9581',
        title: 'RFC 9581 — Persistent Symmetric Keys in OpenPGP',
        url: 'https://datatracker.ietf.org/doc/html/rfc9581',
        date: '2024-07',
        localFile: '/library/RFC_9581.html',
      },
      {
        id: 'RFC-9980',
        title: 'RFC 9980 — Post-Quantum Cryptography in OpenPGP',
        url: 'https://www.rfc-editor.org/rfc/rfc9980.html',
        date: '2026-06',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-openpgp-nist-bp-comp-04',
        title: 'draft-ietf-openpgp-nist-bp-comp-04 — NIST + Brainpool composites (In WG Last Call)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-nist-bp-comp/',
        date: '2026-01-08',
        localFile: '/library/draft-ietf-openpgp-nist-bp-comp-04.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'experimental',
        stage: 'experimental',
        stageNote: 'No pure ML-KEM track; OpenPGP-PQC ships composite only',
        note: 'OpenPGP-PQC ships composite KEM only; pure ML-KEM mode is chartered but not yet specified.',
      },
      hybridKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'RFC 9980 published Jun 2026 (formerly the OpenPGP-PQC draft) — covers Hybrid KEM + Pure/Hybrid Sig',
        note: 'Composite mode pairs ML-KEM-768/1024 with ECDH P-256 / P-384 / X25519 / X448. RFC 9980 covers Pure Sig and Hybrid Sig in the same document.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9980',
            title: 'Post-Quantum Cryptography in OpenPGP (covers hybrid KEM + pure/hybrid sig)',
            url: 'https://www.rfc-editor.org/rfc/rfc9980.html',
            publishedOn: '2026-06',
          },
        ],
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9980 published Jun 2026 — same document as Hybrid KEM',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9980',
            title: 'Post-Quantum Cryptography in OpenPGP (covers hybrid KEM + pure/hybrid sig)',
            url: 'https://www.rfc-editor.org/rfc/rfc9980.html',
            publishedOn: '2026-06',
          },
        ],
      },
      hybridSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'RFC 9980 published Jun 2026 — same document as Hybrid KEM',
        note: 'Composite mode pairs ML-DSA with ECDSA / EdDSA classical signatures.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9980',
            title: 'Post-Quantum Cryptography in OpenPGP (covers hybrid KEM + pure/hybrid sig)',
            url: 'https://www.rfc-editor.org/rfc/rfc9980.html',
            publishedOn: '2026-06',
          },
        ],
      },
    },
    ossLibraries: [
      { productId: 'gnupg', name: 'GnuPG', versionNote: 'PQC branch tracking RFC 9980' },
      { productId: 'sequoia-pgp-pqc', name: 'Sequoia-PGP PQC' },
      { productId: 'openpgp-js', name: 'OpenPGP.js', versionNote: 'PQC PR series' },
    ],
    commercialLibraries: [
      {
        productId: 'proton-mail-pqc-openpgp',
        name: 'Proton Mail PQC OpenPGP',
        versionNote: 'Open Source / Commercial',
      },
    ],
    playgrounds: [],
    liveDeployments: [
      {
        provider: 'Proton Mail',
        what: 'Hybrid ML-KEM (OpenPGP v6) encryption available to all plans incl. free — opt-in, gradual rollout, applies to new messages only',
        since: '2026-05',
        referenceUrl: 'https://proton.me/blog/introducing-post-quantum-encryption',
      },
    ],
    sources: [
      {
        label: 'RFC 9980 — PQC in OpenPGP (published Jun 2026)',
        url: 'https://www.rfc-editor.org/rfc/rfc9980.html',
      },
      {
        label: 'IETF OpenPGP working group documents',
        url: 'https://datatracker.ietf.org/wg/openpgp/documents/',
      },
    ],
  },
  {
    id: 'ike-ipsec',
    name: 'IKE / IPsec',
    description:
      'Internet Key Exchange v2 and IPsec — ML-KEM as additional key exchange and ML-DSA / SLH-DSA for authentication.',
    latestRelease: [
      {
        id: 'RFC-7296',
        title: 'RFC 7296 — IKEv2',
        url: 'https://datatracker.ietf.org/doc/html/rfc7296',
        date: '2014-10',
        localFile: '/library/IETF_RFC_7296.html',
      },
      {
        id: 'RFC-8784',
        title: 'RFC 8784 — Mixing Preshared Keys in IKEv2 for PQ Security',
        url: 'https://datatracker.ietf.org/doc/html/rfc8784',
        date: '2020-06',
        localFile: '/library/RFC_8784.html',
      },
      {
        id: 'RFC-9370',
        title: 'RFC 9370 — Multiple Key Exchanges in IKEv2',
        url: 'https://datatracker.ietf.org/doc/html/rfc9370',
        date: '2023-05',
        localFile: '/library/RFC_9370.html',
      },
      {
        id: 'RFC-9867',
        title: 'RFC 9867 — PSK Mixing in IKE_INTERMEDIATE / CREATE_CHILD_SA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9867',
        date: '2025',
        localFile: '/library/RFC_9867.html',
      },
      {
        id: 'RFC-9242',
        title: 'RFC 9242 — IKE_INTERMEDIATE Exchange',
        url: 'https://datatracker.ietf.org/doc/html/rfc9242',
        date: '2022-05',
        localFile: '/library/IETF_RFC_9242.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-ipsecme-ikev2-mlkem-09',
        title:
          'draft-ietf-ipsecme-ikev2-mlkem-09 — ML-KEM in IKEv2 (DISCUSS cleared, RFC Ed Queue)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/',
        date: '2026-07-05',
      },
      {
        id: 'draft-ietf-ipsecme-ikev2-pqc-auth-12',
        title:
          'draft-ietf-ipsecme-ikev2-pqc-auth-12 — PQ Authentication in IKEv2 (Submitted to IESG for Publication)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-pqc-auth/',
        date: '2026-08-20',
        localFile: '/library/draft-ietf-ipsecme-ikev2-pqc-auth-12.html',
      },
      {
        id: 'draft-hu-ipsecme-pqt-hybrid-auth',
        title: 'draft-hu-ipsecme-pqt-hybrid-auth — PQ/T Hybrid Authentication for IKEv2',
        url: 'https://datatracker.ietf.org/doc/draft-hu-ipsecme-pqt-hybrid-auth/',
        date: '2026-04',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote:
          'DISCUSS cleared after the 2026-07-02 telechat — now in RFC Editor queue (draft-09); same draft covers Pure + Hybrid KEM',
        note: 'IKEv2 multi-KE framework (RFC 9370) carries either pure or hybrid ML-KEM. There is NO RFC for IKEv2 hybrid KEM yet — both modes ride the same draft.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-ipsecme-ikev2-mlkem',
            title: 'ML-KEM in IKEv2 (covers Pure + Hybrid KEM)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/',
            publishedOn: '2026-03-14',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote:
          'REVERTED 2026-07-27: a hand-verified apply incorrectly set this to rfc-published on the strength of RFC 9370 alone — but RFC 9370 is the shared multi-KE enabler framework both dimensions cite, not the hybrid-KEM-specific mechanism. See the note below, which already documented this exact mistake before this revert.',
        note: 'Same draft as Pure KEM. No standalone RFC for hybrid KEM in IKEv2 (corrects an earlier mis-encoding to "rfc"). RFC 9370 multi-KE framework + draft-ietf-ipsecme-ikev2-mlkem together define the hybrid binding; the binding draft itself is still in the RFC Editor queue, matching Pure KEM.',
        deploymentPosture: 'production',
        deploymentNote:
          'Cisco, Fortinet, Cloudflare, Palo Alto have shipped hybrid IKEv2 with multi-KE + ML-KEM in production while the binding draft is at IESG.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-ipsecme-ikev2-mlkem',
            title: 'ML-KEM in IKEv2 (covers Pure + Hybrid KEM)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/',
            publishedOn: '2026-03-14',
          },
          {
            kind: 'rfc',
            id: 'RFC 9370',
            title: 'Multiple Key Exchanges in IKEv2 (enabler framework)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9370',
            publishedOn: '2023-05',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        stageNote:
          'Verified live 2026-09-01: draft-ietf-ipsecme-ikev2-pqc-auth has cleared IESG evaluation and is now in the RFC Editor queue, "Awaiting Editor Assignment" (revision -12, last updated 2026-08-31; OPSDIR review of -10 on 2026-08-04, SECDIR review of -10 on 2026-07-26, both clean). Supersedes the 2026-08-22 reading of "Submitted to IESG for Publication".',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-ipsecme-ikev2-pqc-auth',
            title: 'PQ Authentication in IKEv2',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-pqc-auth/',
            publishedOn: '2026-04-14',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'individual-draft',
        stageNote: 'Internet-Draft (individual)',
        note: 'PQ/T composite authentication for IKEv2 (individual submission). Replaces the prior "experimental" coarse value once the draft was filed.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-hu-ipsecme-pqt-hybrid-auth',
            title: 'PQ/T Hybrid Authentication for IKEv2',
            url: 'https://datatracker.ietf.org/doc/draft-hu-ipsecme-pqt-hybrid-auth/',
            publishedOn: '2026-04',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'strongswan',
        name: 'strongSwan',
        versionNote: '6.0.1+ (ML-KEM + ML-DSA via plugin)',
      },
      { productId: 'libreswan', name: 'Libreswan' },
    ],
    commercialLibraries: [
      { productId: 'cisco-ios-xe-pqc', name: 'Cisco IOS XE PQC' },
      { productId: 'juniper-junos-os', name: 'Juniper Junos OS' },
      { productId: 'palo-alto-pan-os', name: 'Palo Alto PAN-OS' },
      { productId: 'fortinet-fortios', name: 'Fortinet FortiOS' },
      { productId: 'check-point-quantum', name: 'Check Point Quantum' },
      { productId: 'expressvpn-lightway', name: 'ExpressVPN Lightway' },
    ],
    playgrounds: [
      {
        toolId: 'vpn-sim',
        toolName: 'PQC IKEv2/IPsec Workshop',
        testability: { pureKem: 'full', hybridKem: 'full', pureSig: 'full', hybridSig: 'none' },
      },
    ],
    liveDeployments: [
      {
        provider: 'Cloudflare WARP',
        what: 'WARP client uses post-quantum hybrid key agreement',
        since: '2024',
        referenceUrl: 'https://blog.cloudflare.com/post-quantum-warp/',
      },
      {
        provider: 'Cloudflare IPsec',
        what: 'PQ IPsec GA at Cloudflare; interop with Cisco / Fortinet',
        since: '2026',
        referenceUrl: 'https://blog.cloudflare.com/post-quantum-ipsec/',
      },
      {
        provider: 'ExpressVPN Lightway',
        what: 'Lightway upgraded to ML-KEM (Level 5) via wolfSSL',
        since: '2025-01',
        referenceUrl: 'https://www.expressvpn.com/blog/ml-kem-lightway-upgrade/',
      },
      {
        provider: 'Cisco Secure Firewall',
        what: 'Hybrid IKEv2 (IKE_INTERMEDIATE + multi-KE RFCs) live on ASA 9.19+; ML-KEM support in FTD 10.5 / ASA 9.25 is ROADMAP, targeted for late 2026 — not yet shipped',
        since: '2024',
        referenceUrl:
          'https://blogs.cisco.com/security/preparing-for-post-quantum-cryptography-the-secure-firewall-roadmap',
      },
      {
        provider: 'Palo Alto Networks PAN-OS',
        what: 'PQC Site-to-Site VPN with hybrid IKEv2; PAN-OS 11.2 uses pre-standard KEMs (Kyber/BIKE/FrodoKEM/HQC) — ML-KEM itself arrived only in PAN-OS 12.1+',
        since: '2025',
        referenceUrl:
          'https://docs.paloaltonetworks.com/network-security/quantum-security/administration/quantum-security-concepts/support-for-quantum-features',
      },
    ],
    sources: [
      {
        label: 'IETF IPSECME working group documents',
        url: 'https://datatracker.ietf.org/wg/ipsecme/documents/',
      },
    ],
    supersedes: ['ikev1'],
  },
  {
    id: 'wireguard',
    name: 'WireGuard',
    description:
      'Modern kernel-level VPN tunnel protocol — no IETF/formal PQC standardization track. PQ protection is added by injecting a post-quantum KEM-derived secret into the existing pre-shared-key (PSK) mechanism (e.g. the Rosenpass protocol), not by changing the wire protocol itself.',
    latestRelease: [
      {
        id: 'Rosenpass-Protocol',
        title: 'Rosenpass: Formally Verified Post-Quantum Protocol for WireGuard',
        url: 'https://rosenpass.eu/whitepaper.pdf',
        date: '2024-06',
        localFile: '/library/Rosenpass-Protocol.pdf',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        note: "WireGuard's Noise-based handshake has no pure-PQ-only mode — PQ protection rides on the existing PSK mechanism (see Hybrid KEM).",
      },
      hybridKem: {
        value: 'experimental',
        stageNote:
          'Vendor/community technique (Rosenpass whitepaper, formally verified with ProVerif) — not an IETF or WireGuard-project standard',
        note: "Rosenpass runs a separate ML-KEM-768 + Classic McEliece handshake and injects the combined shared secret into WireGuard's existing pre-shared-key (PSK) slot — an out-of-band combiner, not a change to the WireGuard wire protocol. Several VPN vendors ship equivalent WireGuard + ML-KEM hybrid combiners.",
        deploymentPosture: 'production',
        deploymentNote:
          'Mullvad ships this by default on all desktop platforms since Jan 2025; NordVPN, Surfshark, Windscribe, and IVPN ship comparable WireGuard + ML-KEM hybrid combiners.',
      },
      pureSig: {
        value: 'na',
        note: 'WireGuard authenticates peers with static Curve25519 keys, not certificates or signatures — no PQ signature dimension applies.',
      },
      hybridSig: {
        value: 'na',
        note: 'Same as Pure Signature — WireGuard has no signature dimension to hybridize.',
      },
    },
    ossLibraries: [
      { productId: 'wireguard', name: 'WireGuard', versionNote: 'Upstream — no native PQC' },
      {
        productId: 'wireguard-go',
        name: 'wireguard-go',
        versionNote: 'Partial — PQC via pre-shared-key injection',
      },
      {
        productId: 'rosenpass',
        name: 'Rosenpass',
        versionNote: 'Rust daemon — ML-KEM + Classic McEliece PSK injection',
      },
    ],
    commercialLibraries: [
      { productId: 'mullvad-vpn-app', name: 'Mullvad VPN App' },
      { productId: 'nordvpn', name: 'NordVPN' },
      { productId: 'surfshark', name: 'Surfshark' },
      { productId: 'windscribe', name: 'Windscribe' },
      { productId: 'ivpn', name: 'IVPN' },
    ],
    playgrounds: [],
    liveDeployments: [
      {
        provider: 'Mullvad VPN',
        what: 'Quantum-resistant WireGuard default on all desktop platforms — PQ KEM-negotiated PSK (Rosenpass-style) injected into the WireGuard handshake',
        since: '2025-01',
        referenceUrl:
          'https://mullvad.net/en/blog/quantum-resistant-tunnels-are-now-the-default-on-desktop',
      },
    ],
    sources: [
      {
        label: 'Rosenpass project',
        url: 'https://rosenpass.eu/',
      },
    ],
  },
  {
    id: 'mls',
    name: 'MLS',
    description:
      'Messaging Layer Security — group messaging with forward-secure ratcheting; PQ cipher suites and combiners in WG Last Call.',
    latestRelease: [
      {
        id: 'RFC-9420',
        title: 'RFC 9420 — The Messaging Layer Security (MLS) Protocol',
        url: 'https://datatracker.ietf.org/doc/html/rfc9420',
        date: '2023-07',
        localFile: '/library/RFC_9420.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-mls-pq-ciphersuites-06',
        title:
          'draft-ietf-mls-pq-ciphersuites-06 — PQ Cipher Suites for MLS (Waiting for WG Chair Go-Ahead)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
        date: '2026-07-02',
        localFile: '/library/draft-ietf-mls-pq-ciphersuites-06.html',
      },
      {
        id: 'draft-ietf-mls-combiner-02',
        // Status added 2026-08-22: the sibling entries carry one and this did not,
        // so a reader saw a bare draft with no hint it had stopped moving. The
        // datatracker reads "Expired Internet-Draft (mls WG) Expired & archived".
        title:
          'draft-ietf-mls-combiner-02 — Traditional + PQ MLS combiner (EXPIRED & archived; WGLC revival pending)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-combiner/',
        date: '2025-10-22',
        localFile: '/library/draft-ietf-mls-combiner-02.html',
      },
      {
        id: 'draft-ietf-mls-extensions-10',
        title:
          'draft-ietf-mls-extensions-10 — MLS Extensions framework (Waiting for Implementation; Revised I-D needed after WGLC)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-extensions/',
        date: '2026-03-02',
        localFile: '/library/draft-ietf-mls-extensions-10.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          'Waiting for WG Chair Go-Ahead (draft-05, 2026-07-02); revised I-D needed after WGLC feedback. Single draft covers all 4 cases',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-07-02',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          'Waiting for WG Chair Go-Ahead (draft-05, 2026-07-02); revised I-D needed after WGLC feedback; same draft as Pure KEM',
        note: 'Combiner seeds PQ guarantees into the traditional ciphersuite via the exporter secret.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-07-02',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          'Waiting for WG Chair Go-Ahead (draft-05, 2026-07-02); revised I-D needed after WGLC feedback; same draft as Pure KEM',
        note: 'Cipher suites bundle ML-DSA with the PQ KEM as a paired choice.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-07-02',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          'Waiting for WG Chair Go-Ahead (draft-05, 2026-07-02); revised I-D needed after WGLC feedback; same draft as Pure KEM',
        note: 'Hybrid sig path is via session combination; cert-layer composite-sigs lives in the X.509 row.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-07-02',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'openmls',
        name: 'OpenMLS',
        versionNote: 'Rust — PQ branch tracking ciphersuites draft',
      },
      { productId: 'mls-rs', name: 'mls-rs', versionNote: 'AWS Rust SDK' },
      { productId: 'mlspp', name: 'mlspp', versionNote: 'C++ reference impl' },
    ],
    commercialLibraries: [],
    playgrounds: [
      {
        toolId: 'mls-group-messaging',
        toolName: 'MLS Group Messaging',
        testability: { pureKem: 'partial', hybridKem: 'none', pureSig: 'none', hybridSig: 'none' },
      },
    ],
    liveDeployments: [],
    noDeploymentReason:
      'No product ships PQ-MLS (RFC 9420 + draft-ietf-mls-pq-ciphersuites) today — the draft is still awaiting WG Chair Go-Ahead after WG Last Call. Apple iMessage PQ3 and Signal’s PQXDH are genuine production PQ messaging deployments, but they are proprietary ratchet protocols, NOT MLS — see the Signal (PQXDH) row for that deployment; iMessage PQ3 has no dedicated row since it is Apple-internal and unpublished as a formal spec.',
    sources: [
      {
        label: 'IETF MLS working group documents',
        url: 'https://datatracker.ietf.org/wg/mls/documents/',
      },
    ],
  },
  {
    id: 'tpm',
    name: 'TPM',
    description:
      'Trusted Platform Module — TPM 2.0 Library v1.85 (PUBLISHED 2026-03-12) adds ML-DSA, ML-KEM, Labeled KEM, EdDSA.',
    latestRelease: [
      {
        id: 'TCG-TPM-2.0-Library-v1.85-Part3-Published',
        title: 'TCG TPM 2.0 Library v1.85 Part 3: Commands (Published 2026-03-12)',
        url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
        date: '2026-03-12',
        // Not independently cached — TCG's site returns 403 for this URL (persisted
        // in scripts/download-library.js's skip-list). The in-app Library link
        // already redirects this citation to the Errata entry below (see
        // SPEC_ALIASES in libraryRef.ts); point the raw asset the same way.
        localFile: '/library/TCG-TPM-2.0-Library-v1.85-Errata.html',
      },
      {
        id: 'TCG-PC-Client-Platform-TPM-Profile-v1.07',
        title:
          'TCG PC Client Specific Platform TPM Profile v1.07 (Published) — mandates ML-KEM + ML-DSA support',
        url: 'https://trustedcomputinggroup.org/resource/pc-client-platform-tpm-profile-ptp-specification/',
        date: '2026-03-23',
        localFile: '/library/TCG-PC-Client-Platform-TPM-Profile-v1.07.html',
      },
      {
        id: 'TCG-EK-Credential-Profile-v2.7',
        title: 'TCG EK Credential Profile for TPM 2.0, Level 0, v2.7 (Published)',
        url: 'https://trustedcomputinggroup.org/resource/tcg-ek-credential-profile-for-tpm-family-2-0/',
        date: '2026-03-19',
        localFile: '/library/TCG-EK-Credential-Profile-v2.7.html',
      },
      {
        id: 'TCG-TPM-2.0-Library-v1.85-Errata',
        title: 'TCG TPM 2.0 Library v1.85 — Errata',
        url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
        date: '2026-03-12',
        localFile: '/library/TCG-TPM-2.0-Library-v1.85-Errata.html',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'TPM 2.0 Library v1.85 (Mar 2026) adds ML-KEM as an OPTIONAL algorithm; PC Client Platform TPM Profile v1.07 (2026-03-23) makes it mandatory',
        note: 'TPM 2.0 Library v1.85 defines ML-KEM-512/768/1024 as an optional algorithm (TPMA_ML_PARAMETER_SET capability bits) — the Library spec itself contains no SHALL-support text. The requirement to support ML-KEM-768 or ML-KEM-1024 comes from PC Client Platform TPM Profile v1.07, which governs PC-class TPMs, not the Library spec.',
        refs: [
          {
            kind: 'spec',
            id: 'TCG TPM 2.0 v1.85',
            title: 'TCG TPM 2.0 Library v1.85 — ML-KEM commands (optional)',
            url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
            publishedOn: '2026-03-12',
          },
          {
            kind: 'spec',
            id: 'TCG PC Client PTP v1.07',
            title: 'PC Client Platform TPM Profile v1.07 — mandates ML-KEM-768 or ML-KEM-1024',
            url: 'https://trustedcomputinggroup.org/resource/pc-client-platform-tpm-profile-ptp-specification/',
            publishedOn: '2026-03-23',
          },
        ],
      },
      hybridKem: {
        value: 'experimental',
        stage: 'experimental',
        stageNote: 'Labeled-KEM construct, not a TCG-standardized hybrid',
        note: 'TPM 2.0 Labeled KEM abstraction can mix algorithms; not standardized as "hybrid".',
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'TPM 2.0 Library v1.85 (Mar 2026) adds ML-DSA as an OPTIONAL algorithm; PC Client Platform TPM Profile v1.07 (2026-03-23) makes it mandatory',
        note: 'TPM 2.0 Library v1.85 defines ML-DSA-44/65/87 (incl. HashML-DSA) as optional — no SHALL-support text in the Library spec itself. The requirement to support ML-DSA-65 or ML-DSA-87 comes from PC Client Platform TPM Profile v1.07.',
        refs: [
          {
            kind: 'spec',
            id: 'TCG TPM 2.0 v1.85',
            title: 'TCG TPM 2.0 Library v1.85 — ML-DSA + HashML-DSA commands (optional)',
            url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
            publishedOn: '2026-03-12',
          },
          {
            kind: 'spec',
            id: 'TCG PC Client PTP v1.07',
            title: 'PC Client Platform TPM Profile v1.07 — mandates ML-DSA-65 or ML-DSA-87',
            url: 'https://trustedcomputinggroup.org/resource/pc-client-platform-tpm-profile-ptp-specification/',
            publishedOn: '2026-03-23',
          },
        ],
      },
      hybridSig: {
        value: 'experimental',
        stage: 'experimental',
        stageNote: 'Composite sig not in TCG scope; experimental dual-key constructs only',
        note: 'TPM signatures are atomic per-key; TCG v1.85 does not standardize a hybrid signature mode. Experimental dual-key constructs sit outside the TCG profile.',
      },
    },
    ossLibraries: [
      {
        productId: 'libtpms',
        name: 'libtpms',
        versionNote: 'Tracks v1.83 upstream; published v1.85 PQ commands via pqctoday-tpm fork',
      },
      {
        productId: 'swtpm',
        name: 'swtpm',
        versionNote: 'Tracks v1.83 upstream; PQ via pqctoday-tpm fork',
      },
      {
        productId: 'pqctoday-tpm',
        name: 'pqctoday-tpm',
        versionNote: 'Our fork — Published TPM 2.0 v1.85 PQ commands',
      },
      { productId: 'wolftpm-pqc', name: 'wolfTPM PQC' },
    ],
    commercialLibraries: [
      {
        productId: 'wolftpm-pqc',
        name: 'wolfTPM PQC',
        versionNote: 'Open Source / Commercial dual',
      },
      { productId: 'infineon-tegrion-slc27-pqc', name: 'Infineon TEGRION SLC27 PQC' },
      { productId: 'infineon-optiga-tpm-slb-9672', name: 'Infineon OPTIGA TPM SLB 9672' },
      { productId: 'sealsq-quantum-shield', name: 'SEALSQ Quantum Shield' },
      { productId: 'sealsq-qvault-tpm', name: 'SEALSQ QVault TPM' },
    ],
    playgrounds: [
      {
        toolId: 'tpm-playground',
        toolName: 'PQC TPM Workshop',
        testability: { pureKem: 'full', hybridKem: 'partial', pureSig: 'full', hybridSig: 'na' },
        hybridKemNote:
          'Educational Labeled-KEM construct (ML-KEM via softhsmv3 + classical ECDH via Web Crypto, combined with HKDF-SHA256). TCG v1.85 does not standardize hybrid.',
      },
      {
        toolId: 'firmware-signing',
        toolName: 'Firmware Signing (ML-DSA-87 UEFI)',
        testability: { pureKem: 'na', hybridKem: 'na', pureSig: 'na', hybridSig: 'na' },
      },
    ],
    liveDeployments: [
      {
        provider: 'wolfTPM',
        what: 'wolfTPM ships initial TPM 2.0 v1.85 PQ commands (ML-DSA + ML-KEM)',
        since: '2026',
        referenceUrl: 'https://www.wolfssl.com/wolftpm-add-tpm-2-0-v1-85-pqc-post-quantum-support/',
      },
    ],
  },
  {
    id: 'dnssec',
    name: 'DNSSEC',
    description:
      'DNS Security Extensions — sig-only protocol; PQ adoption blocked by signature size vs DNS MTU.',
    latestRelease: [
      {
        id: 'RFC-4034',
        title: 'RFC 4034 — Resource Records for the DNS Security Extensions',
        url: 'https://datatracker.ietf.org/doc/html/rfc4034',
        date: '2005-03',
        localFile: '/library/RFC_4034.html',
      },
      {
        id: 'RFC-9364',
        title: 'RFC 9364 / BCP 237 — DNS Security Extensions (DNSSEC)',
        url: 'https://datatracker.ietf.org/doc/html/rfc9364',
        date: '2023-02',
        localFile: '/library/RFC_9364.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-fregly-dnsop-slh-dsa-mtl-dnssec-06',
        title: 'draft-fregly-dnsop-slh-dsa-mtl-dnssec-06 — SLH-DSA Merkle Tree Ladder mode',
        url: 'https://datatracker.ietf.org/doc/draft-fregly-dnsop-slh-dsa-mtl-dnssec/',
        date: '2026-03-30',
        localFile: '/library/draft-fregly-dnsop-slh-dsa-mtl-dnssec-06.html',
      },
      {
        id: 'draft-sheth-pqc-dnssec-strategy-01',
        title: 'draft-sheth-pqc-dnssec-strategy-01 — PQC Strategy for DNSSEC',
        url: 'https://datatracker.ietf.org/doc/draft-sheth-pqc-dnssec-strategy/',
        date: '2026-04-17',
        localFile: '/library/draft-sheth-pqc-dnssec-strategy-01.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'na',
        stage: 'na',
        stageNote: 'DNSSEC is signature-only',
        note: 'DNSSEC is a signature-only protocol; no KEM dimension.',
      },
      hybridKem: {
        value: 'na',
        stage: 'na',
        stageNote: 'DNSSEC is signature-only',
        note: 'DNSSEC is a signature-only protocol; no KEM dimension.',
      },
      pureSig: {
        value: 'experimental',
        stage: 'individual-draft',
        stageNote:
          'Individual drafts active (draft-fregly-dnsop-slh-dsa-mtl-dnssec, draft-sheth-pqc-dnssec-strategy) — still no WG-chartered work',
        note: 'No IANA DNSKEY code point assigned yet. Constraint: ML-DSA (2.4–4.6 KB) and SLH-DSA (7.8–49.8 KB) signatures exceed the ~1232-byte DNS UDP limit — forces TCP fallback. No IETF WG currently addresses the IP fragmentation issue.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-fregly-dnsop-slh-dsa-mtl-dnssec',
            title: 'SLH-DSA Merkle Tree Ladder mode (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-fregly-dnsop-slh-dsa-mtl-dnssec/',
            publishedOn: '2026-03-30',
          },
          {
            kind: 'draft',
            id: 'draft-sheth-pqc-dnssec-strategy',
            title: 'PQC Strategy for DNSSEC (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-sheth-pqc-dnssec-strategy/',
            publishedOn: '2026-04-17',
          },
        ],
      },
      hybridSig: {
        value: 'experimental',
        stage: 'individual-draft',
        stageNote:
          'Individual draft active (draft-sheth-pqc-dnssec-strategy) — still no WG-chartered work',
        note: 'Strategy draft enumerates candidates; no concrete hybrid mode. Same UDP fragmentation barrier as pure sig.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-sheth-pqc-dnssec-strategy',
            title: 'PQC Strategy for DNSSEC (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-sheth-pqc-dnssec-strategy/',
            publishedOn: '2026-04-17',
          },
        ],
      },
    },
    ossLibraries: [
      { productId: 'coredns-pqc-dnssec', name: 'CoreDNS PQC DNSSEC', versionNote: 'Experimental' },
      {
        productId: 'powerdns-pqc-dnssec',
        name: 'PowerDNS PQC DNSSEC',
        versionNote: 'Experimental',
      },
      { productId: 'isc-bind-9-21', name: 'ISC BIND 9.21', versionNote: 'Classical DNSSEC only' },
    ],
    commercialLibraries: [
      { productId: 'adguard-dns', name: 'AdGuard DNS', versionNote: 'Commercial / Free' },
    ],
    playgrounds: [],
    noDeploymentReason:
      "No IANA DNSKEY algorithm code point has been assigned for any PQ scheme — definitionally cannot be in operational production. Signature sizes (ML-DSA 2.4–4.6 KB, SLH-DSA 7.8–49.8 KB) blow past the ~1232-byte DNS UDP limit, forcing TCP fallback. Resolver compatibility studies (SIDN Labs on .nl/.se/.nu zones) find roughly half of Internet resolvers fail when zones carry unknown algorithms. Verisign's Merkle Tree Ladder (MTL) mode draft and IETF 123/124 Hackathon work (BIND, NSD, CoreDNS extensions) are all lab/R&D — no live DNSSEC zone has been signed with PQ today. Verisign estimates the next root-zone algorithm rollover (mid-2030s) is the realistic deployment window.",
  },
  {
    id: 'rpki-bgpsec',
    name: 'RPKI / BGPsec',
    description:
      'Resource Public Key Infrastructure (RPKI certs + ROAs) and BGPsec (per-AS-hop path signatures) — signature-only PKI mechanisms for routing security. RPKI has one very early individual (non-WG) PQC draft; BGPsec has none at all, and itself remains almost entirely undeployed.',
    latestRelease: [
      {
        id: 'RFC-6480',
        title: 'RFC 6480 — An Infrastructure to Support Secure Internet Routing (RPKI)',
        url: 'https://datatracker.ietf.org/doc/html/rfc6480',
        date: '2012-02',
      },
      {
        id: 'RFC-8205',
        title: 'RFC 8205 — BGPsec Protocol Specification',
        url: 'https://datatracker.ietf.org/doc/html/rfc8205',
        date: '2017-09',
      },
      {
        id: 'RFC-8608',
        title: 'RFC 8608 — BGPsec Algorithms, Key Formats, and Signature Formats',
        url: 'https://www.rfc-editor.org/rfc/rfc8608',
        date: '2019-06',
      },
    ],
    latestDraft: [
      {
        id: 'draft-yoshikawa-sidrops-pqc-rpki-02',
        title:
          'draft-yoshikawa-sidrops-pqc-rpki-02 — Post-Quantum Signature Profile for RPKI (individual, not WG-adopted)',
        url: 'https://datatracker.ietf.org/doc/draft-yoshikawa-sidrops-pqc-rpki/',
        date: '2026-08',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'na',
        note: 'RPKI and BGPsec are signature-only PKI mechanisms; no key exchange.',
      },
      hybridKem: {
        value: 'na',
        note: 'RPKI and BGPsec are signature-only PKI mechanisms; no key exchange.',
      },
      pureSig: {
        value: 'experimental',
        note: 'RPKI certs/ROAs are ordinary X.509 (RFC 5280) + CMS (RFC 6488) objects, so they could technically reuse the generic ML-DSA/SLH-DSA X.509 OIDs (RFC 9881/9909) — but no RPKI-specific draft proposes a pure-PQ profile; the one real draft targets composite only (see Hybrid). The real blocker is repository-scale bulk validation, not the certificate format: every relying party fetches and re-validates the ENTIRE global repository, and a SIDN Labs thesis measured this growing from ~838 MB (RSA-2048) to 3+ GB at ML-DSA-44 and 6.7–14 GB (judged impractical) at SLH-DSA.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 5280',
            title: 'Internet X.509 PKI Certificate and CRL Profile (RPKI cert base format)',
            url: 'https://datatracker.ietf.org/doc/html/rfc5280',
            publishedOn: '2008-05',
          },
          {
            kind: 'rfc',
            id: 'RFC 6488',
            title: 'Signed Object Template for the RPKI (CMS profile for ROAs/manifests)',
            url: 'https://datatracker.ietf.org/doc/html/rfc6488',
            publishedOn: '2012-02',
          },
          {
            kind: 'rfc',
            id: 'RFC 9881',
            title:
              'X.509 Algorithm Identifiers for ML-DSA (generically reusable, not RPKI-specific)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9881',
            publishedOn: '2025-10',
          },
          {
            kind: 'rfc',
            id: 'RFC 9909',
            title:
              'X.509 Algorithm Identifiers for SLH-DSA (generically reusable, not RPKI-specific)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9909',
            publishedOn: '2025-12',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'individual-draft',
        stageNote:
          'Individual submission (draft-yoshikawa-sidrops-pqc-rpki-01, posted 2026-07-04) — not adopted by the SIDROPS working group, no IESG standing',
        note: 'Proposes Composite ML-DSA-65 + ECDSA-P256 for RPKI certificates. Explicitly flags open questions: HSM readiness, untested RRDP snapshot/delta size impact, no Krill/relying-party integration yet. BGPsec path signatures have NO PQC work of any kind, chartered or individual — and BGPsec itself remains almost entirely undeployed in production networks (unlike RPKI ROA validation, which covers ~50%+ of routes), which independent sources cite as the reason nobody is prioritizing BGPsec-specific PQC engineering.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-yoshikawa-sidrops-pqc-rpki',
            title: 'Post-Quantum Signature Profile for RPKI (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-yoshikawa-sidrops-pqc-rpki/',
            publishedOn: '2026-07-04',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [],
    noDeploymentReason:
      "No RIR (RIPE NCC, ARIN, APNIC) or router vendor (Cisco, Juniper) has announced a PQC-RPKI or PQC-BGPsec pilot. The only PQC-RPKI work anywhere is a single researcher's (SIDN Labs) proof-of-concept patch to Routinator + Krill, published as an MSc thesis — not a production or RIR-run pilot — plus the one five-day-old individual IETF draft above. BGPsec-specific PQC work does not exist at all, consistent with BGPsec's own near-zero real-world deployment despite being standardized since 2017.",
    sources: [
      {
        label: 'SIDN Labs — Post-Quantum Cryptography for the RPKI',
        url: 'https://labs.ripe.net/author/dirk/pqc-for-the-rpki/',
      },
      {
        label: 'APNIC Blog — How can RPKI be made quantum-safe?',
        url: 'https://blog.apnic.net/2025/07/22/how-can-rpki-can-be-made-quantum-safe/',
      },
      {
        label: 'IETF SIDROPS working group documents',
        url: 'https://datatracker.ietf.org/wg/sidrops/documents/',
      },
    ],
  },
  {
    id: 'dtls-1-2',
    name: 'DTLS 1.2',
    description: 'Datagram TLS 1.2 — inherits TLS 1.2 PQC posture (none).',
    latestRelease: [
      {
        id: 'RFC-6347',
        title: 'RFC 6347 — DTLS 1.2',
        url: 'https://datatracker.ietf.org/doc/html/rfc6347',
        date: '2012-01',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        note: 'Inherits TLS 1.2 — no PQC.',
      },
      hybridKem: {
        value: 'na',
        note: 'Inherits TLS 1.2 — no PQC.',
      },
      pureSig: {
        value: 'na',
        note: 'Inherits TLS 1.2 — no PQC.',
      },
      hybridSig: {
        value: 'na',
        note: 'Inherits TLS 1.2 — no PQC.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'Inherits TLS 1.2 — same scope decision. No PQC migration path for DTLS 1.2; users should move to DTLS 1.3 / TLS 1.3.',
    inheritsFromProtocolId: 'tls-1-2',
    supersededByProtocolId: 'dtls-1-3',
  },
  {
    id: 'dtls-1-3',
    name: 'DTLS 1.3',
    description:
      'Datagram TLS 1.3 — inherits TLS 1.3 PQC posture; same hybrid/pure KEM + signature groups.',
    latestRelease: [
      {
        id: 'RFC-9147',
        title: 'RFC 9147 — DTLS 1.3',
        url: 'https://datatracker.ietf.org/doc/html/rfc9147',
        date: '2022-04',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote:
          "Verified live 2026-09-01: Last Call closed 2026-08-13; draft-ietf-tls-mlkem-09 is now in IESG Evaluation, on the 2026-09-03 telechat agenda, 'has enough positions to pass' (inherited from the TLS 1.3 row). Corrects the 2026-08-09 note's premise — iesg-submitted is step 5 (AFTER ietf-last-call) per this file's own DraftStage definition, not a pre-Last-Call WG handoff state.",
        note: 'Inherits TLS 1.3 — pure ML-KEM groups.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mlkem',
            title: 'Standalone ML-KEM groups for TLS (inherited from TLS 1.3)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
            publishedOn: '2026-02-12',
          },
        ],
      },
      hybridKem: {
        value: 'rfc',
        stage: 'rfc-published',
        note: 'Inherits TLS 1.3 — X25519MLKEM768 hybrid group, published as RFC 10024 on 2026-08-10.',
        deploymentPosture: 'pilot',
        deploymentNote:
          'DTLS 1.3 ML-KEM hybrid follows TLS 1.3 implementations; production rollout lags TLS by ~6–12 mo.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 10024',
            title: 'PQ/T Hybrid Key Agreement Mechanisms for TLS 1.3 (inherited from TLS 1.3)',
            url: 'https://www.rfc-editor.org/rfc/rfc10024.html',
            publishedOn: '2026-08-10',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        note: 'Inherits TLS 1.3 — ML-DSA SignatureScheme values.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mldsa',
            title: 'ML-DSA in TLS 1.3 (inherited)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/',
            publishedOn: '2026-05-06',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        note: 'Inherits TLS 1.3 — composite via X.509.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title: 'Composite ML-DSA in X.509 (inherited via TLS 1.3 / X.509 row)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    inheritsFromProtocolId: 'tls-1-3',
    supersedes: ['dtls-1-2', 'dtls-1-0'],
  },
  {
    id: 'fido',
    name: 'FIDO',
    description:
      'FIDO authenticators (U2F) — channel security inherits TLS 1.2; no separate PQC track.',
    historical: true,
    latestRelease: [
      {
        id: 'CTAP-2.1',
        title:
          'FIDO Client to Authenticator Protocol (CTAP) v2.1 — supersedes the U2F specifications',
        url: 'https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-20210615.html',
        date: '2021-06',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: { value: 'na', note: 'Inherits TLS 1.2 — no PQC.' },
      hybridKem: { value: 'na', note: 'Inherits TLS 1.2 — no PQC.' },
      pureSig: {
        value: 'na',
        note: 'FIDO U2F uses classical ECDSA on device; no PQ migration spec.',
      },
      hybridSig: { value: 'na', note: 'No FIDO Alliance hybrid-signature track.' },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'FIDO U2F has no PQC migration profile from the FIDO Alliance. Authenticators using the legacy U2F protocol will be replaced by FIDO 2 / passkeys + TLS 1.3 hybrid KEX rather than getting a PQ upgrade in place.',
    inheritsFromProtocolId: 'tls-1-2',
    supersededByProtocolId: 'fido-2',
  },
  {
    id: 'fido-2',
    name: 'FIDO 2',
    description:
      'FIDO2 / WebAuthn / passkeys — channel security inherits TLS 1.3; WebAuthn signature algorithms register PQ via COSE.',
    latestRelease: [],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote:
          "Verified live 2026-09-01: Last Call closed 2026-08-13; draft-ietf-tls-mlkem-09 is now in IESG Evaluation, on the 2026-09-03 telechat agenda, 'has enough positions to pass' (inherited from the TLS 1.3 row). Corrects the 2026-08-09 note's premise — iesg-submitted is step 5 (AFTER ietf-last-call) per this file's own DraftStage definition, not a pre-Last-Call WG handoff state.",
        note: 'Inherits TLS 1.3 — pure ML-KEM groups.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mlkem',
            title: 'Standalone ML-KEM groups for TLS (inherited)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
            publishedOn: '2026-02-12',
          },
        ],
      },
      hybridKem: {
        value: 'rfc',
        stage: 'rfc-published',
        note: 'Inherits TLS 1.3 — X25519MLKEM768 hybrid group, published as RFC 10024 on 2026-08-10.',
        deploymentPosture: 'production',
        deploymentNote:
          'WebAuthn / passkey traffic over Chromium + Cloudflare edge benefits from TLS 1.3 hybrid KEM in production.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 10024',
            title: 'PQ/T Hybrid Key Agreement Mechanisms for TLS 1.3 (inherited from TLS 1.3)',
            url: 'https://www.rfc-editor.org/rfc/rfc10024.html',
            publishedOn: '2026-08-10',
          },
        ],
      },
      pureSig: {
        value: 'experimental',
        stage: 'experimental',
        stageNote:
          "RFC 9964 is published, but this cell tracks FIDO adoption rather than the RFC's status: the algorithm IDs are inherited from the COSE row and no FIDO Alliance profile exists. Authenticator-side ML-DSA private keys (~5–7 KB) strain secure-element storage budgets, so 'experimental' is a judgement about deployability, not a stale reading of the datatracker.",
        note: 'Algorithm IDs sourced from the COSE row. Constraint: authenticator-side ML-DSA private key (~5–7 KB) strains secure-element storage budgets.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9964',
            title: 'ML-DSA for JOSE and COSE (inherited via WebAuthn COSE alg IDs)',
            url: 'https://www.rfc-editor.org/rfc/rfc9964.html',
            publishedOn: '2026-05',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'wg-document',
        stageNote:
          'Inherited JOSE composite path is now a WG document (draft-ietf-jose-pq-composite-sigs, datatracker 2026-07-20)',
        note: 'Composite path inherits from the JOSE row; no FIDO Alliance profile yet.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-jose-pq-composite-sigs',
            title: 'PQ/T Composite Sigs for JOSE/COSE (inherited)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-jose-pq-composite-sigs/',
            publishedOn: '2025-01',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    inheritsFromProtocolId: 'tls-1-3',
    supersedes: ['fido'],
  },
  {
    id: 'macsec',
    name: 'MACsec',
    description:
      'IEEE 802.1AE link-layer encryption — key agreement via MKA inherits TLS 1.3 for EAP-TLS bootstrapping.',
    latestRelease: [
      {
        id: 'IEEE-802.1AE-2018',
        title: 'IEEE 802.1AE-2018 — MAC Security',
        url: 'https://standards.ieee.org/ieee/802.1AE/7154/',
        date: '2018-12',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote:
          "Verified live 2026-09-01: Last Call closed 2026-08-13; draft-ietf-tls-mlkem-09 is now in IESG Evaluation, on the 2026-09-03 telechat agenda, 'has enough positions to pass' (inherited from the TLS 1.3 row). Corrects the 2026-08-09 note's premise — iesg-submitted is step 5 (AFTER ietf-last-call) per this file's own DraftStage definition, not a pre-Last-Call WG handoff state.",
        note: 'Inherits TLS 1.3 (EAP-TLS bootstrap) — pure ML-KEM via TLS 1.3 KEX.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mlkem',
            title: 'Standalone ML-KEM groups for TLS (inherited via EAP-TLS bootstrap)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
            publishedOn: '2026-02-12',
          },
        ],
      },
      hybridKem: {
        value: 'rfc',
        stage: 'rfc-published',
        note: 'Inherits TLS 1.3 (EAP-TLS bootstrap) — X25519MLKEM768 hybrid, published as RFC 10024 on 2026-08-10.',
        deploymentPosture: 'pilot',
        deploymentNote: 'Cisco / Juniper MACsec stacks pilot PQ EAP-TLS bootstrap in 2025–2026.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 10024',
            title: 'PQ/T Hybrid Key Agreement Mechanisms for TLS 1.3 (inherited)',
            url: 'https://www.rfc-editor.org/rfc/rfc10024.html',
            publishedOn: '2026-08-10',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        note: 'Inherits TLS 1.3 — ML-DSA via certificate-based EAP-TLS auth.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mldsa',
            title: 'ML-DSA in TLS 1.3 (inherited)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/',
            publishedOn: '2026-05-06',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        note: 'Inherits TLS 1.3 — composite via X.509.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title: 'Composite ML-DSA in X.509 (inherited via TLS 1.3)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [
      {
        provider: 'Turkcell + Juniper + ID Quantique',
        what: 'Quantum-safe MACsec validated on Juniper SRX/MX/ACX for 5G mobile backhaul (QKD-based key delivery) — a proof-of-concept validation, not a commercial rollout',
        since: '2025-06',
        referenceUrl:
          'https://www.juniper.net/gb/en/company/press-releases/2025/pr-2025-06-26-00-00.html',
      },
    ],
    inheritsFromProtocolId: 'tls-1-3',
  },
  {
    id: 'eap-radius',
    name: 'EAP / RADIUS',
    description:
      'Extensible Authentication Protocol (802.1X) + RADIUS AAA transport. TLS-tunneled EAP methods (EAP-TLS/TTLS/PEAP/TEAP) inherit TLS 1.3’s PQC posture; EAP-AKA’ (no TLS tunnel) has its own bespoke ML-KEM work; RadSec inherits TLS/DTLS; legacy RADIUS/UDP has no PQC path at all.',
    latestRelease: [
      {
        id: 'RFC-2865',
        title: 'RFC 2865 — Remote Authentication Dial In User Service (RADIUS)',
        url: 'https://datatracker.ietf.org/doc/html/rfc2865',
        date: '2000-06',
      },
      {
        id: 'RFC-3748',
        title: 'RFC 3748 — Extensible Authentication Protocol (EAP)',
        url: 'https://datatracker.ietf.org/doc/html/rfc3748',
        date: '2004-06',
      },
      {
        id: 'RFC-9048',
        title: 'RFC 9048 — Improved EAP-AKA’',
        url: 'https://datatracker.ietf.org/doc/html/rfc9048',
        date: '2021-06',
      },
      {
        id: 'RFC-9190',
        title: 'RFC 9190 — EAP-TLS 1.3',
        url: 'https://datatracker.ietf.org/doc/html/rfc9190',
        date: '2022-02',
      },
      {
        id: 'RFC-9191',
        title:
          'RFC 9191 — Handling Large Certificates and Long Certificate Chains in TLS-Based EAP Methods',
        url: 'https://datatracker.ietf.org/doc/html/rfc9191',
        date: '2022-02',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-emu-pqc-eap-tls-00',
        title: 'draft-ietf-emu-pqc-eap-tls-00 — Post-Quantum Enhancements to TLS-Based EAP Methods',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-emu-pqc-eap-tls/',
        date: '2026-05-13',
      },
      {
        id: 'draft-ietf-emu-pqc-eapaka-02',
        title: 'draft-ietf-emu-pqc-eapaka-02 — Post-Quantum ML-KEM for EAP-AKA’ (WG Last Call)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-emu-pqc-eapaka/',
        date: '2026-06-19',
      },
      {
        id: 'draft-ietf-emu-hybrid-pqc-eapaka-01',
        title: 'draft-ietf-emu-hybrid-pqc-eapaka-01 — Hybrid PQC for EAP-AKA’ (WG Last Call)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-emu-hybrid-pqc-eapaka/',
        date: '2026-02-26',
      },
      {
        id: 'draft-ietf-radext-review-radius-02',
        title:
          'draft-ietf-radext-review-radius-02 — RADIUS security review (legacy RADIUS/UDP deprecation)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-radext-review-radius/',
        date: '2026-08-10',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          'EAP-AKA’ bespoke ML-KEM (draft-ietf-emu-pqc-eapaka-02) in WG Last Call — new AT_PUB_KEM/AT_KEM_CT attributes',
        note: 'TLS-tunneled EAP methods (EAP-TLS/TTLS/PEAP/TEAP) inherit ML-KEM directly from TLS 1.3 (see that row) — no new crypto is defined here, only cert-size/fragmentation mitigation (RFC 9191, draft-ietf-emu-pqc-eap-tls). EAP-AKA’ does not tunnel TLS, so it needs its own KEM carriage: new AT_PUB_KEM / AT_KEM_CT attributes plus attribute-level fragmentation for oversized ML-KEM keys/ciphertexts.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-emu-pqc-eapaka',
            title: 'Post-Quantum ML-KEM for EAP-AKA’',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-emu-pqc-eapaka/',
            publishedOn: '2026-06-19',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote:
          'EAP-AKA’ bespoke hybrid (draft-ietf-emu-hybrid-pqc-eapaka-01) in WG Last Call — ML-KEM-768 + P-256/X25519 via AT_PUB_HYBRID + HPKE',
        note: 'TLS-tunneled EAP methods already benefit from TLS 1.3’s X25519MLKEM768 hybrid group in production wherever the underlying TLS stack supports it (see TLS 1.3 row) — no EAP-specific extension needed. EAP-AKA’ defines its own AT_PUB_HYBRID + HPKE construction since it has no TLS layer to inherit from.',
        deploymentPosture: 'pilot',
        deploymentNote:
          'A University of Tübingen testbed (FreeRADIUS + hostapd, arXiv:2601.22892, Jan 2026) measured real 802.1X/WPA-Enterprise latency for ML-DSA-65 + ML-KEM hybrid combinations — a research testbed, not a shipped vendor feature.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-emu-hybrid-pqc-eapaka',
            title: 'Hybrid PQC for EAP-AKA’',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-emu-hybrid-pqc-eapaka/',
            publishedOn: '2026-02-26',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'wg-document',
        note: 'EAP-TLS/TTLS/PEAP/TEAP inherit ML-DSA/SLH-DSA certificates via TLS 1.3 + X.509 (see those rows). The resulting oversized certificate chains are exactly the problem RFC 9191 anticipated (“lattice-based cryptography would have public keys of approximately 1000 bytes and signatures of approximately 2000 bytes”) and draft-ietf-emu-pqc-eap-tls now addresses directly. EAP-AKA’ is a symmetric SIM-credential method with no signature dimension — N/A for that variant.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-emu-pqc-eap-tls',
            title: 'Post-Quantum Enhancements to TLS-Based EAP Methods (cert-size mitigation)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-emu-pqc-eap-tls/',
            publishedOn: '2026-05-13',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        note: 'Same inheritance as Pure Signature — composite ML-DSA certificate chains flow through TLS 1.3 / X.509 (see those rows); EAP-AKA’ is N/A (no signature dimension).',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title: 'Composite ML-DSA in X.509 (inherited via TLS 1.3 / X.509 row)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [],
    noDeploymentReason:
      'No vendor (Cisco ISE, Aruba ClearPass, FreeRADIUS) has announced PQC support for EAP-TLS or RadSec specifically. The one real-world PQC 802.1X measurement is a University of Tübingen research testbed (FreeRADIUS + hostapd, arXiv:2601.22892) — not a shipped product. Legacy RADIUS/UDP (RFC 2865) has no PQC path at all: its MD5-keyed obfuscation is already broken for classical reasons, and draft-ietf-radext-review-radius explicitly states “all new cryptographic work in RADIUS [itself] is forbidden” — the sanctioned exit is full migration to RadSec (TLS/DTLS transport), not an in-place upgrade.',
    sources: [
      {
        label: 'IETF EMU working group documents',
        url: 'https://datatracker.ietf.org/wg/emu/documents/',
      },
      {
        label: 'RADEXT: deprecating classic RADIUS',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-radext-deprecating-radius/',
      },
    ],
  },
  {
    id: 'uefi',
    name: 'UEFI Secure Boot',
    description:
      'UEFI Secure Boot — image verification inherits X.509 PKI; PQ migration tracks X.509 algorithm OIDs.',
    latestRelease: [
      {
        id: 'UEFI-2.11',
        title:
          'UEFI Specification 2.11 (Nov 2024) — adds no PQC content; PQ readiness tracks X.509 OIDs only',
        url: 'https://uefi.org/specs/UEFI/2.11/',
        date: '2024-11',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        note: 'Secure Boot is signature-only — no KEM.',
      },
      hybridKem: {
        value: 'na',
        note: 'Secure Boot is signature-only — no KEM.',
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        note: 'Inherits X.509 ML-DSA / SLH-DSA OIDs in PE/COFF Authenticode. Constraint: ML-DSA-65 signatures (~3 KB) inflate Authenticode blocks vs. ~256 B RSA-2048.',
        deploymentPosture: 'pilot',
        deploymentNote:
          'Microsoft + Intel announced ML-DSA secure-boot pilots Q4 2025; first SLH-DSA UEFI signatures in vendor firmware Q1 2026.',
        refs: [
          {
            kind: 'rfc',
            id: 'RFC 9881',
            title: 'X.509 ML-DSA Algorithm Identifiers (inherited)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9881',
            publishedOn: '2025-10',
          },
          {
            kind: 'rfc',
            id: 'RFC 9909',
            title: 'X.509 SLH-DSA Algorithm Identifiers (inherited)',
            url: 'https://datatracker.ietf.org/doc/html/rfc9909',
            publishedOn: '2025-12',
          },
          {
            kind: 'spec',
            id: 'UEFI 2.11',
            title: 'UEFI Specification 2.11 (PE/COFF Authenticode chain consumes X.509 PQ OIDs)',
            url: 'https://uefi.org/specs/UEFI/2.11/',
            publishedOn: '2024-11',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'rfc-editor-queue',
        note: 'Inherits X.509 composite-sigs for dual-cert dual-algorithm boot — see X.509 row.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-lamps-pq-composite-sigs',
            title: 'Composite ML-DSA in X.509 (inherited)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/',
            publishedOn: '2026-04-21',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'openssl-3-5-0',
        name: 'OpenSSL 3.5.0',
        versionNote: 'sbsigntool / pesign chain',
      },
    ],
    commercialLibraries: [{ productId: 'microsoft-ad-cs', name: 'Microsoft AD CS' }],
    playgrounds: [
      {
        toolId: 'firmware-signing',
        toolName: 'Firmware Signing (ML-DSA-87 UEFI)',
        testability: { pureKem: 'na', hybridKem: 'na', pureSig: 'full', hybridSig: 'partial' },
        hybridSigNote:
          'Composite UEFI signatures demonstrated via dual-cert chain; not yet a TCG/UEFI profile.',
      },
    ],
    liveDeployments: [
      {
        provider: 'Dell 2026 commercial PCs',
        what: 'LMS-based quantum-resistant code signing for EC + BIOS in 2026 commercial PC portfolio',
        since: '2026',
        referenceUrl: 'https://www.dell.com/en-us/blog/quantum-resilience-built-in/',
      },
    ],
    inheritsFromProtocolId: 'x509',
  },
  // ── Key-management & supply-chain standards (non-IETF: OASIS / Signal / CNCF) ──
  // These do not sit on the IETF 0–7 ladder, so `stage` is omitted and the coarse
  // `value` + `stageNote` carry the OASIS/vendor status. PKCS#11 + KMIP are wired
  // to our own in-browser implementations (SoftHSM v3 / pqctoday-kmip).
  {
    id: 'pkcs11',
    name: 'PKCS#11',
    description:
      'OASIS PKCS#11 v3.2 — the HSM / crypto-token API, now a full OASIS Standard. v3.2 adds ML-KEM, ML-DSA and SLH-DSA mechanisms (CKM_ML_KEM, CKM_ML_DSA, CKM_SLH_DSA) plus C_EncapsulateKey / C_DecapsulateKey.',
    latestRelease: [
      {
        id: 'PKCS11-v3.2-OS',
        title: 'PKCS#11 Specification v3.2 — OASIS Standard',
        url: 'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/pkcs11-spec-v3.2-os.pdf',
        date: '2026-06-03',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'PKCS#11 v3.2 reached full OASIS Standard 2026-06-03; ML-KEM mechanisms (CKM_ML_KEM)',
        note: 'ML-KEM-512/768/1024 via CKM_ML_KEM + C_EncapsulateKey / C_DecapsulateKey.',
        deploymentPosture: 'production',
        refs: [
          {
            kind: 'spec',
            id: 'PKCS#11 v3.2 OS',
            title: 'PKCS#11 v3.2 — ML-KEM mechanisms (OASIS Standard)',
            url: 'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/pkcs11-spec-v3.2-os.pdf',
            publishedOn: '2026-06-03',
          },
        ],
      },
      hybridKem: {
        value: 'na',
        note: 'PKCS#11 is a mechanism-level token API; hybrid/composite KEMs are composed by callers, not defined by the spec.',
      },
      pureSig: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote:
          'PKCS#11 v3.2 reached full OASIS Standard 2026-06-03; ML-DSA + SLH-DSA mechanisms (CKM_ML_DSA, CKM_SLH_DSA)',
        note: 'ML-DSA-44/65/87 (incl. HashML-DSA) + SLH-DSA via CKM_ML_DSA / CKM_SLH_DSA.',
        deploymentPosture: 'production',
        refs: [
          {
            kind: 'spec',
            id: 'PKCS#11 v3.2 OS',
            title: 'PKCS#11 v3.2 — ML-DSA / SLH-DSA mechanisms (OASIS Standard)',
            url: 'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/pkcs11-spec-v3.2-os.pdf',
            publishedOn: '2026-06-03',
          },
        ],
      },
      hybridSig: {
        value: 'na',
        note: 'No native composite-signature mechanism; callers combine atomic per-key signatures above the API.',
      },
    },
    ossLibraries: [
      {
        productId: 'pqctoday-hsm-softhsmv3',
        name: 'SoftHSM v3 (pqctoday)',
        versionNote: 'Our fork — PKCS#11 v3.2 ML-KEM + ML-DSA on an OpenSSL 3.5 backend',
      },
      {
        productId: 'openssl',
        name: 'OpenSSL pkcs11-provider',
        versionNote: 'bridges OpenSSL 3.x to PKCS#11 v3.2 tokens',
      },
    ],
    commercialLibraries: [
      {
        productId: 'cryptsoft',
        name: 'Cryptsoft PKCS#11 SDK',
        versionNote: 'PKCS#11 v3.2 SDK — “first PQC-ready” (Mar 2025); ML-KEM / ML-DSA / SLH-DSA',
      },
      {
        productId: 'thales-luna-t-series-hsm',
        name: 'Thales Luna T-Series HSM',
        versionNote: 'fw 7.15.0 — standards-compliant ML-KEM + ML-DSA via PKCS#11',
      },
      {
        productId: 'entrust-nshield',
        name: 'Entrust nShield',
        versionNote: 'firmware (2025) — ML-KEM + ML-DSA via PKCS#11 / CNG / JCE',
      },
      {
        productId: 'utimaco-utrust-hsm',
        name: 'Utimaco uTrust HSM',
        versionNote:
          'Quantum Protect application package (u.trust GP HSM Se-Series, announced 2025-04-02) — ML-KEM / ML-DSA / LMS / XMSS via PKCS#11',
      },
    ],
    playgrounds: [
      {
        toolId: 'hsm',
        toolName: 'PKCS#11 HSM',
        url: '/playground/hsm',
        testability: { pureKem: 'full', hybridKem: 'na', pureSig: 'full', hybridSig: 'na' },
      },
    ],
    liveDeployments: [
      {
        provider: 'pqctoday SoftHSM v3',
        what: 'PKCS#11 v3.2 ML-KEM + ML-DSA software HSM (WASM) — runnable in the in-browser HSM playground',
        since: '2026',
        referenceUrl: 'https://github.com/pqctoday-org/pqctoday-hsm',
      },
    ],
    recommended: true,
    recommendedReason:
      'PKCS#11 v3.2 (full OASIS Standard) fully supports ML-KEM + ML-DSA and is already implemented (our SoftHSM v3 + vendor HSMs); exercisable live in the HSM playground.',
  },
  {
    id: 'kmip',
    name: 'KMIP',
    description:
      'OASIS Key Management Interoperability Protocol v3.0 — key lifecycle over the wire. CSD02 defines ML-KEM and ML-DSA managed-object algorithm enumerations AND the Encapsulate/Decapsulate operations natively; our own server (pqctoday-kmip) implements the full published set — no extensions needed for the PQC KEM/signature core.',
    latestRelease: [],
    latestDraft: [
      {
        id: 'KMIP-v3.0-CSD02',
        title: 'KMIP Specification v3.0 — Committee Specification Draft 02',
        url: 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/',
        date: '2026-05-07',
      },
      {
        id: 'KMIP-Profiles-v3.0-CSD02',
        title: 'KMIP Profiles v3.0 — Committee Specification Draft 02',
        url: 'https://docs.oasis-open.org/kmip/kmip-profiles/v3.0/',
        date: '2026-05-21',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stageNote:
          'OASIS Committee Specification Draft CSD02 (2026-05-07) — ML-KEM algorithm enumerations + native Encapsulate/Decapsulate operations',
        note: 'ML-KEM-512/768/1024 managed-object algorithm enumerations and the Encapsulate/Decapsulate operations are both defined natively in CSD02 (§6.1.15/§6.1.22, §11.12) — pqctoday-kmip implements the published set directly, no extension needed.',
        deploymentPosture: 'pilot',
        refs: [
          {
            kind: 'spec',
            id: 'KMIP 3.0 CSD02',
            title: 'KMIP v3.0 — PQC objects + Encapsulate/Decapsulate (ML-KEM)',
            url: 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/',
            publishedOn: '2026-05-07',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stageNote:
          'OASIS Committee Specification Draft CSD02 (2026-05-07) — first-class hybrid KEM algorithm values',
        note: 'X25519MLKEM768 (0x5C) and SecP256r1MLKEM768 (0x5D) are first-class CryptographicAlgorithm values in CSD02 §11.12 — one managed object per hybrid pair, ordinary Encapsulate/Decapsulate, combiner runs inside the engine. Profiles CSD02 §3.3.3 separately mandates a third group, SecP384r1MLKEM1024, as a required TLS key-exchange group for the KMIP transport itself — the Specification still assigns it no managed-object codepoint, so the two documents are currently out of step on that one algorithm.',
        deploymentPosture: 'pilot',
        refs: [
          {
            kind: 'spec',
            id: 'KMIP 3.0 CSD02',
            title: 'KMIP v3.0 §11.12 — Cryptographic Algorithm Enumeration (hybrid KEMs)',
            url: 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/',
            publishedOn: '2026-05-07',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stageNote:
          'OASIS CSD02 (2026-05-07) — ML-DSA algorithm enumeration used by KMIP’s existing Sign / SignatureVerify operations',
        note: 'ML-DSA-44/65/87 managed objects use the pre-existing KMIP Sign / SignatureVerify operations once the ML-DSA algorithm enum value is present — CSD02 adds the enum (plus 15 pre-hash Hash-ML-DSA-*/Hash-SLH-DSA-* variants, §11.12 Table 552), not new operations.',
        deploymentPosture: 'pilot',
        refs: [
          {
            kind: 'spec',
            id: 'KMIP 3.0 CSD02',
            title: 'KMIP v3.0 — PQC objects (ML-DSA)',
            url: 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/',
            publishedOn: '2026-05-07',
          },
        ],
      },
      hybridSig: {
        value: 'na',
        note: 'No native composite-signature object; hybrids are composed above the protocol.',
      },
    },
    ossLibraries: [
      {
        productId: 'pqctoday-kmip',
        name: 'pqctoday-kmip',
        versionNote:
          'Our Rust KMIP 3.0 server (MIT) on softhsmrustv3 — full ML-KEM + ML-DSA + crypto-agility policy',
      },
    ],
    commercialLibraries: [],
    playgrounds: [
      {
        toolId: 'cacp-kmip',
        toolName: 'KMIP Control Plane',
        url: '/playground/cacp',
        testability: { pureKem: 'full', hybridKem: 'full', pureSig: 'full', hybridSig: 'na' },
      },
    ],
    liveDeployments: [
      {
        provider: 'pqctoday-kmip (CACP)',
        what: 'KMIP 3.0 control plane with ML-KEM + ML-DSA and crypto-agility policy — runnable in the in-browser CACP playground',
        since: '2026',
        referenceUrl: 'https://github.com/pqctoday-org/pqctoday-hsm',
      },
    ],
    recommended: true,
    recommendedReason:
      'KMIP 3.0 fully supports ML-KEM + ML-DSA; we ship a working Rust KMIP 3.0 control plane (pqctoday-kmip) exercisable live in the CACP playground.',
  },
  {
    id: 'signal-pqxdh',
    name: 'Signal (PQXDH)',
    description:
      'Signal’s post-quantum extended Diffie–Hellman (PQXDH) — the initial key agreement for secure messaging. Hybrid X25519/X448 + ML-KEM (CRYSTALS-Kyber). Deployed in Signal Messenger.',
    latestRelease: [
      {
        id: 'Signal-PQXDH-Rev3',
        title: 'The PQXDH Key Agreement Protocol (Revision 3)',
        url: 'https://signal.org/docs/specifications/pqxdh/',
        date: '2024-01-23',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        note: 'PQXDH is hybrid by construction (classical + PQ KEM); there is no pure-PQ-only mode.',
      },
      hybridKem: {
        value: 'experimental',
        stageNote:
          'Signal Foundation specification (Rev 3, 2023; updated 2024-01) — not an IETF/OASIS standard, but live in production',
        note: 'X25519/X448 ECDH combined with ML-KEM / CRYSTALS-Kyber; mutual auth via classical XEdDSA-signed prekeys.',
        deploymentPosture: 'production',
        refs: [
          {
            kind: 'spec',
            id: 'Signal PQXDH',
            title: 'The PQXDH Key Agreement Protocol',
            url: 'https://signal.org/docs/specifications/pqxdh/',
            publishedOn: '2024-01-23',
          },
        ],
      },
      pureSig: {
        value: 'na',
        note: 'PQXDH is key agreement only; prekeys are authenticated with classical XEdDSA, not a PQ signature.',
      },
      hybridSig: {
        value: 'na',
        note: 'No signature dimension — PQXDH establishes a shared secret.',
      },
    },
    ossLibraries: [
      {
        productId: 'signal',
        name: 'libsignal',
        versionNote: 'Signal’s client library — ships PQXDH',
      },
    ],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [
      {
        provider: 'Signal Messenger',
        what: 'PQXDH (X25519 + ML-KEM/Kyber) as the default initial key agreement for all conversations',
        since: '2023',
        referenceUrl: 'https://signal.org/blog/pqxdh/',
      },
      {
        provider: 'Signal Messenger (SPQR / Triple Ratchet)',
        what: 'Sparse Post-Quantum Ratchet (ML-KEM-768) adds PQ to the continuous ratchet, not just the handshake — rolling out to clients',
        since: '2025-10',
        referenceUrl: 'https://signal.org/blog/spqr/',
      },
    ],
    recommendedReason:
      'One of the first at-scale production PQC deployments — but a Signal-specific spec, not a cross-vendor standard.',
  },
  {
    id: 'sigstore',
    name: 'Sigstore',
    description:
      'Sigstore — keyless software-supply-chain signing (cosign + Fulcio CA + Rekor transparency log). PQC is experimental: cosign forks can sign with ML-DSA, but the public Fulcio CA still issues classical certs.',
    latestRelease: [],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        note: 'Sigstore is a signing system; no key-encapsulation dimension.',
      },
      hybridKem: { value: 'na', note: 'No KEM dimension.' },
      pureSig: {
        value: 'experimental',
        stageNote:
          'CNCF/OpenSSF project — ML-DSA signing experimental in cosign forks; public CA still classical',
        note: 'cosign can sign artifacts with ML-DSA in experimental/forked builds; Fulcio (CA) + Rekor (log) PQC support is not yet shipped.',
        refs: [
          {
            kind: 'spec',
            id: 'sigstore/cosign',
            title: 'Sigstore cosign — artifact signing',
            url: 'https://github.com/sigstore/cosign',
            publishedOn: '2026-01-01',
          },
        ],
      },
      hybridSig: {
        value: 'none',
        note: 'No composite/hybrid signing track in Sigstore yet.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [],
    noDeploymentReason:
      'The public Sigstore (Fulcio CA + Rekor log) issues and logs classical (ECDSA) signatures only. PQC ML-DSA signing exists in experimental cosign forks but there is no production PQC Sigstore deployment yet.',
  },
  {
    id: 'ieee-802-11bt',
    name: 'IEEE 802.11bt (Wi-Fi PQC)',
    description:
      'IEEE 802.11 amendment adding post-quantum AKM suites, PQC key-establishment/signature algorithms, and a PQC password-authenticated key exchange (PAKE) to the WLAN MAC layer (SAE, OWE, FILS, PASN). PAR approved Sep 2025 — pre-draft study-group stage, no technical draft text published yet.',
    latestRelease: [],
    latestDraft: [
      {
        id: 'IEEE-P802.11bt-PAR',
        title:
          'IEEE P802.11bt — PAR: Amendment to IEEE Std 802.11-2024 (Enhancements for Post-Quantum Cryptography)',
        url: 'https://standards.ieee.org/ieee/802.11bt/12187/',
        date: '2025-09',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stageNote: 'IEEE P802.11bt PAR approved Sep 10, 2025 — pre-draft study-group stage',
        note: 'PAR scope covers PQC AKM suites and PQC key-establishment algorithms across SAE/OWE/FILS/PASN; no draft text published as of Jul 2026, so no specific KEM (pure vs. hybrid) has been named.',
        refs: [
          {
            kind: 'spec',
            id: 'IEEE P802.11BT',
            title: 'PAR — Enhancements for Post-Quantum Cryptography',
            url: 'https://standards.ieee.org/ieee/802.11bt/12187/',
            publishedOn: '2025-09',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stageNote: 'IEEE P802.11bt PAR approved Sep 10, 2025 — pre-draft study-group stage',
        note: 'Same PAR scope as pure KEM — AKM suites and key-establishment algorithms are not yet differentiated into pure vs. hybrid constructs.',
        refs: [
          {
            kind: 'spec',
            id: 'IEEE P802.11BT',
            title: 'PAR — Enhancements for Post-Quantum Cryptography',
            url: 'https://standards.ieee.org/ieee/802.11bt/12187/',
            publishedOn: '2025-09',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stageNote: 'IEEE P802.11bt PAR approved Sep 10, 2025 — pre-draft study-group stage',
        note: 'PAR scope covers PQC digital signature algorithms and a PQC password-authenticated key exchange (PAKE); no draft text published as of Jul 2026, so no specific signature scheme (pure vs. hybrid/composite) has been named.',
        refs: [
          {
            kind: 'spec',
            id: 'IEEE P802.11BT',
            title: 'PAR — Enhancements for Post-Quantum Cryptography',
            url: 'https://standards.ieee.org/ieee/802.11bt/12187/',
            publishedOn: '2025-09',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stageNote: 'IEEE P802.11bt PAR approved Sep 10, 2025 — pre-draft study-group stage',
        note: 'Same PAR scope as pure signature — digital signature algorithms are not yet differentiated into pure vs. hybrid/composite constructs.',
        refs: [
          {
            kind: 'spec',
            id: 'IEEE P802.11BT',
            title: 'PAR — Enhancements for Post-Quantum Cryptography',
            url: 'https://standards.ieee.org/ieee/802.11bt/12187/',
            publishedOn: '2025-09',
          },
        ],
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    liveDeployments: [],
    noDeploymentReason:
      'Standard is still at the pre-draft study-group stage (PAR approved Sep 2025, IEEE 802.11 Working Group) — no chipset or AP vendor can implement PQC support before draft technical text exists.',
  },
  {
    id: 'fc-sp-3',
    name: 'Fibre Channel FC-SP-3',
    description:
      'ANSI/INCITS Fibre Channel — Security Protocols, Third Edition. Adds CNSA 2.0 algorithm definitions (ML-KEM, ML-DSA) alongside existing CNSA 1.0 support, plus an automatic in-flight FC encryption profile for SAN fabrics. Completed by the Fibre Channel Industry Association Feb 2026.',
    latestRelease: [
      {
        id: 'FC-SP-3',
        title: 'Fibre Channel — Security Protocols, Third Edition (FC-SP-3)',
        url: 'https://fibrechannel.org/fibre-channel-industry-association-announces-completion-of-fc-sp-3-specification-advancing-enterprise-storage-security-for-a-post-quantum-era/',
        date: '2026-02',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stageNote: 'FC-SP-3 completed Feb 2026 — CNSA 2.0 algorithm definitions added',
        note: 'FC-SP-3 adds CNSA 2.0 algorithm support (ML-KEM) for FC-SP key exchange. Broadcom Emulex SecureHBA already negotiates ML-KEM-1024 automatically as part of the standard Fibre Channel login process.',
        deploymentPosture: 'production',
        deploymentNote:
          'Broadcom Emulex SecureHBA (SAN Manager 3.0) — 120,000+ units shipped on OEM server platforms as of Mar 2026.',
        refs: [
          {
            kind: 'spec',
            id: 'INCITS 577',
            title: 'FC-SP-3 — CNSA 2.0 algorithm support (ML-KEM)',
            url: 'https://fibrechannel.org/fibre-channel-industry-association-announces-completion-of-fc-sp-3-specification-advancing-enterprise-storage-security-for-a-post-quantum-era/',
            publishedOn: '2026-02',
          },
        ],
      },
      hybridKem: {
        value: 'na',
        note: 'FC-SP-3 adopts CNSA 2.0 algorithms directly (pure ML-KEM); no composite/hybrid KEM construct is defined.',
      },
      pureSig: {
        value: 'rfc',
        stageNote: 'FC-SP-3 completed Feb 2026 — CNSA 2.0 algorithm definitions added',
        note: 'FC-SP-3 adds CNSA 2.0 algorithm support (ML-DSA) for FC-SP key/entity authentication. Broadcom Emulex SecureHBA already negotiates ML-DSA-87 automatically as part of the standard Fibre Channel login process.',
        deploymentPosture: 'production',
        deploymentNote:
          'Broadcom Emulex SecureHBA (SAN Manager 3.0) — 120,000+ units shipped on OEM server platforms as of Mar 2026.',
        refs: [
          {
            kind: 'spec',
            id: 'INCITS 577',
            title: 'FC-SP-3 — CNSA 2.0 algorithm support (ML-DSA)',
            url: 'https://fibrechannel.org/fibre-channel-industry-association-announces-completion-of-fc-sp-3-specification-advancing-enterprise-storage-security-for-a-post-quantum-era/',
            publishedOn: '2026-02',
          },
        ],
      },
      hybridSig: {
        value: 'na',
        note: 'FC-SP-3 adopts CNSA 2.0 algorithms directly (pure ML-DSA); no composite/hybrid signature construct is defined.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [
      {
        productId: 'broadcom-emulex-securehba',
        name: 'Broadcom Emulex SecureHBA',
        versionNote:
          'SAN Manager 3.0 — ML-KEM-1024 + ML-DSA-87 automatic in-flight FC encryption, AES-GCM-256 data path',
      },
    ],
    playgrounds: [],
    liveDeployments: [
      {
        provider: 'Broadcom Emulex SecureHBA + Everpure FlashArray//XL130 R5',
        what: 'End-to-end PQC-safe in-flight Fibre Channel encryption — ML-KEM-1024 + ML-DSA-87 key negotiation, AES-GCM-256 data encryption, no measurable performance penalty or CPU overhead',
        since: '2026-03',
        referenceUrl:
          'https://www.globenewswire.com/news-release/2026/03/19/3259050/19933/en/Broadcom-Delivers-the-World-s-First-End-to-End-PQC-safe-In-flight-Network-Encryption-Solution.html',
      },
    ],
    recommended: true,
    recommendedReason:
      'FC-SP-3 has published CNSA 2.0 (ML-KEM + ML-DSA) algorithm support and a shipping production deployment (Broadcom Emulex SecureHBA, 120,000+ units) with no measured performance cost.',
  },
  {
    id: 'tls-1-0-1-1',
    name: 'TLS 1.0 / 1.1',
    description:
      'Deprecated TLS versions. RFC 8996 (BCP 195) deprecates both; no PQC work targets them and none ever will. Migration target is TLS 1.3.',
    historical: true,
    latestRelease: [
      {
        id: 'RFC-8996',
        title: 'RFC 8996 — Deprecating TLS 1.0 and TLS 1.1',
        url: 'https://datatracker.ietf.org/doc/html/rfc8996',
        date: '2021-03',
      },
      {
        id: 'RFC-2246',
        title: 'RFC 2246 — TLS 1.0 (deprecated)',
        url: 'https://datatracker.ietf.org/doc/html/rfc2246',
        date: '1999-01',
      },
      {
        id: 'RFC-4346',
        title: 'RFC 4346 — TLS 1.1 (deprecated)',
        url: 'https://datatracker.ietf.org/doc/html/rfc4346',
        date: '2006-04',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. All IETF PQC work is scoped to TLS 1.3.',
      },
      hybridKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. All IETF PQC work is scoped to TLS 1.3.',
      },
      pureSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. All IETF PQC work is scoped to TLS 1.3.',
      },
      hybridSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. All IETF PQC work is scoped to TLS 1.3.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'Formally deprecated. Retained in this matrix only as a migration SOURCE — it shows where PQC work is NOT happening and where to go instead.',
    supersededByProtocolId: 'tls-1-3',
  },
  {
    id: 'ssl-3-0',
    name: 'SSL 3.0',
    description:
      'Prohibited by RFC 7568. Predates TLS entirely; retained only to show that deployments still running it have no PQC path short of moving to TLS 1.3.',
    historical: true,
    latestRelease: [
      {
        id: 'RFC-7568',
        title: 'RFC 7568 — Deprecating Secure Sockets Layer Version 3.0',
        url: 'https://datatracker.ietf.org/doc/html/rfc7568',
        date: '2015-06',
      },
      {
        id: 'RFC-6101',
        title: 'RFC 6101 — The SSL Protocol Version 3.0 (Historic)',
        url: 'https://datatracker.ietf.org/doc/html/rfc6101',
        date: '2011-08',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Prohibited by RFC 7568. No PQC path.',
      },
      hybridKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Prohibited by RFC 7568. No PQC path.',
      },
      pureSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Prohibited by RFC 7568. No PQC path.',
      },
      hybridSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Prohibited by RFC 7568. No PQC path.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'Formally deprecated. Retained in this matrix only as a migration SOURCE — it shows where PQC work is NOT happening and where to go instead.',
    supersededByProtocolId: 'tls-1-3',
  },
  {
    id: 'dtls-1-0',
    name: 'DTLS 1.0',
    description:
      'Deprecated alongside TLS 1.0/1.1 by RFC 8996. Migration target is DTLS 1.3, which inherits TLS 1.3 PQC posture.',
    historical: true,
    latestRelease: [
      {
        id: 'RFC-8996',
        title: 'RFC 8996 — Deprecating TLS 1.0 and TLS 1.1 (also deprecates DTLS 1.0)',
        url: 'https://datatracker.ietf.org/doc/html/rfc8996',
        date: '2021-03',
      },
      {
        id: 'RFC-4347',
        title: 'RFC 4347 — Datagram Transport Layer Security (DTLS 1.0, deprecated)',
        url: 'https://datatracker.ietf.org/doc/html/rfc4347',
        date: '2006-04',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. There is no DTLS 1.1; the path is DTLS 1.2 then DTLS 1.3.',
      },
      hybridKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. There is no DTLS 1.1; the path is DTLS 1.2 then DTLS 1.3.',
      },
      pureSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. There is no DTLS 1.1; the path is DTLS 1.2 then DTLS 1.3.',
      },
      hybridSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 8996. There is no DTLS 1.1; the path is DTLS 1.2 then DTLS 1.3.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'Formally deprecated. Retained in this matrix only as a migration SOURCE — it shows where PQC work is NOT happening and where to go instead.',
    supersededByProtocolId: 'dtls-1-3',
  },
  {
    id: 'ikev1',
    name: 'IKEv1',
    description:
      'Deprecated by RFC 9395. IKEv2 (see IKE / IPsec) carries all PQC work — RFC 8784 PPKs and the ML-KEM/ML-DSA drafts.',
    historical: true,
    latestRelease: [
      {
        id: 'RFC-9395',
        title:
          'RFC 9395 — Deprecation of the Internet Key Exchange Version 1 (IKEv1) Protocol and Obsoleted Algorithms',
        url: 'https://datatracker.ietf.org/doc/html/rfc9395',
        date: '2023-05',
      },
      {
        id: 'RFC-2409',
        title: 'RFC 2409 — The Internet Key Exchange (IKEv1, deprecated)',
        url: 'https://datatracker.ietf.org/doc/html/rfc2409',
        date: '1998-11',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 9395. All IPsec PQC work targets IKEv2.',
      },
      hybridKem: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 9395. All IPsec PQC work targets IKEv2.',
      },
      pureSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 9395. All IPsec PQC work targets IKEv2.',
      },
      hybridSig: {
        value: 'na',
        stage: 'none',
        stageNote: 'Deprecated protocol — no PQC work exists or will exist.',
        note: 'Deprecated by RFC 9395. All IPsec PQC work targets IKEv2.',
      },
    },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    noDeploymentReason:
      'Formally deprecated. Retained in this matrix only as a migration SOURCE — it shows where PQC work is NOT happening and where to go instead.',
    supersededByProtocolId: 'ike-ipsec',
  },
]
