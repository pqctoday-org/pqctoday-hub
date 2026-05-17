/**
 * PQC Protocol Support Matrix — 10 standard families × release / draft / 4 PQC dimensions / OSS libs / playground.
 *
 * Snapshot date: 2026-05-16.
 *
 * The 4 dimensions reflect the published external PQC-readiness heatmap:
 *  - pureKem   = pure post-quantum KEM (e.g. ML-KEM-only, no classical fallback)
 *  - hybridKem = classical + PQ KEM concatenation (e.g. X25519+ML-KEM-768)
 *  - pureSig   = pure PQ signature/auth (e.g. ML-DSA-only, SLH-DSA-only)
 *  - hybridSig = classical + PQ composite signature (e.g. ECDSA+ML-DSA)
 *
 * Dimension status values (coarse — kept for backwards compatibility and as
 * the heatmap fallback when `stage` is absent):
 *  - 'rfc'          published RFC / TCG release / ITU-T edition
 *  - 'draft'        active IETF / TCG draft
 *  - 'experimental' non-IETF or expired draft / vendor pre-standard
 *  - 'none'         not specified, not pursued
 *  - 'na'           not applicable for this protocol family
 *
 * DraftStage (optional, finer 0–7 scale aligned with the IETF progression):
 *  - 'none'              0  no plan / no work
 *  - 'identified'        1  problem flagged, no WG draft yet
 *  - 'experimental'      2  expired or non-IETF / vendor pre-standard
 *  - 'individual-draft'  3  individual Internet-Draft
 *  - 'wg-document'       4  WG-adopted document
 *  - 'wg-last-call'      4  WG Last Call (same color tier as wg-document)
 *  - 'iesg-submitted'    5  submitted to the IESG
 *  - 'ietf-last-call'    6  IETF Last Call
 *  - 'rfc-editor-queue'  6  in the RFC Editor publication queue
 *  - 'rfc-published'     7  published RFC / final spec
 *  - 'na'               n/a not applicable for this dimension
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

/** ISO date of the last manual update to PROTOCOL_MATRIX below. */
export const PROTOCOL_MATRIX_LAST_UPDATED = '2026-05-17'

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
  'iesg-submitted': 5,
  'ietf-last-call': 6,
  'rfc-editor-queue': 6,
  'rfc-published': 7,
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
 * can sit in `draft` but already be in production (e.g. X25519MLKEM768 in TLS
 * 1.3 at Cloudflare/Google/AWS while draft-ietf-tls-ecdhe-mlkem is still in
 * RFC Editor queue). Marks where deployment outpaces the spec.
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
   * `id` whose dimensions are reused. Inheritance rows render visually muted
   * and reuse the parent's dimension badges at render time.
   */
  inheritsFromProtocolId?: string
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
        id: 'draft-miller-sshm-mldsa65-ed25519-composite-sigs',
        title:
          'draft-miller-sshm-mldsa65-ed25519-composite-sigs — Composite ML-DSA+Ed25519 for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-miller-sshm-mldsa65-ed25519-composite-sigs/',
        date: '2026-02',
      },
      {
        id: 'draft-becker-cnsa2-ssh-profile-03',
        title: 'draft-becker-cnsa2-ssh-profile-03 — CNSA 2.0 Profile for SSH',
        url: 'https://datatracker.ietf.org/doc/draft-becker-cnsa2-ssh-profile/',
        date: '2026-05-08',
        localFile: '/library/draft-becker-cnsa2-ssh-profile-03.html',
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
          'RFC 9941 published 2026-04; IETF Last Call (Dec 2025) on follow-on ML-KEM hybrid draft',
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
        stage: 'individual-draft',
        stageNote: 'Internet-Draft (individual)',
        note: 'Composite ML-DSA+Ed25519 host-key authentication track; the CNSA 2.0 SSH profile (Independent Submission) also touches composite-sig host-key semantics.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-miller-sshm-mldsa65-ed25519-composite-sigs',
            title: 'Composite ML-DSA65+Ed25519 Signatures for SSH',
            url: 'https://datatracker.ietf.org/doc/draft-miller-sshm-mldsa65-ed25519-composite-sigs/',
            publishedOn: '2026-02',
          },
        ],
      },
    },
    ossLibraries: [
      {
        productId: 'openssh',
        name: 'OpenSSH',
        versionNote: '9.9+ (sntrup761x25519, mlkem768x25519)',
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
        what: 'mlkem768x25519-sha256 default in OpenSSH 9.9',
        since: '2024-09',
        referenceUrl: 'https://www.openssh.org/txt/release-9.9',
      },
      {
        provider: 'GitHub SSH',
        what: 'sntrup761x25519-sha512 on github.com (from 2025-09-17)',
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
  },
  {
    id: 'tls-1-3',
    name: 'TLS 1.3',
    description:
      'Modern transport-layer security with hybrid + pure PQC key exchange and PQ signatures.',
    latestRelease: [
      {
        id: 'RFC-8446',
        title: 'RFC 8446 — TLS 1.3',
        url: 'https://datatracker.ietf.org/doc/html/rfc8446',
        date: '2018-08',
        localFile: '/library/RFC_8446.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-tls-ecdhe-mlkem-04',
        title: 'draft-ietf-tls-ecdhe-mlkem-04 — Hybrid X25519MLKEM768 / SecP256r1MLKEM768',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
        date: '2026-02-08',
        localFile: '/library/draft-ietf-tls-ecdhe-mlkem-04.html',
      },
      {
        id: 'draft-ietf-tls-mlkem-07',
        title: 'draft-ietf-tls-mlkem-07 — Standalone ML-KEM groups for TLS',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
        date: '2026-02-12',
        localFile: '/library/draft-ietf-tls-mlkem-07.html',
      },
      {
        id: 'draft-ietf-tls-mldsa-03',
        title: 'draft-ietf-tls-mldsa-03 — ML-DSA in TLS 1.3',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mldsa/',
        date: '2026-05-06',
        localFile: '/library/draft-ietf-tls-mldsa-03.html',
      },
      {
        id: 'draft-ietf-tls-hybrid-design-16',
        title: 'draft-ietf-tls-hybrid-design-16 — Hybrid KEX design framework',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-hybrid-design/',
        date: '2025-09-07',
        localFile: '/library/draft-ietf-tls-hybrid-design-16.html',
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
        stage: 'wg-document',
        stageNote: 'WG document',
        deploymentPosture: 'pilot',
        deploymentNote:
          'Standalone ML-KEM groups gated behind feature flags in BoringSSL / Chromium experimental builds.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-mlkem',
            title: 'Standalone ML-KEM groups for TLS',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/',
            publishedOn: '2026-02-12',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'ietf-last-call',
        stageNote: 'IETF Last Call (Jan 2026)',
        note: 'X25519MLKEM768 hybrid group (IANA codepoint 4588) — already shipped in production while spec is in IETF Last Call.',
        deploymentPosture: 'production',
        deploymentNote:
          'X25519MLKEM768 enabled by default in Cloudflare edge, Google services, AWS, BoringSSL, OpenSSL 3.5 since 2024–2025 — production deployment exceeds spec status.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-ecdhe-mlkem',
            title: 'Hybrid X25519MLKEM768 / SecP256r1MLKEM768 for TLS 1.3',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
            publishedOn: '2026-02-08',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote: 'Submitted to IESG (May 2025)',
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
        stage: 'ietf-last-call',
        stageNote: 'LAMPS composite at IETF LC (Jan 2026); TLS dual-cert draft at I-D stage',
        note: 'Two work streams: dual-certificate negotiation in TLS WG (Internet-Draft) and composite signatures from LAMPS that TLS will profile after publication. TLS profiling pending LAMPS publication.',
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
        what: 'X25519MLKEM768 default for TLS 1.3 and QUIC in Chrome',
        since: '2024-04',
        referenceUrl: 'https://blog.google/chromium/advancing-our-amazing-bet-on-asymmetric/',
      },
      {
        provider: 'AWS',
        what: 'ML-KEM hybrid TLS in KMS, ACM, Secrets Manager (non-FIPS endpoints)',
        since: '2025-05',
        referenceUrl:
          'https://aws.amazon.com/blogs/security/ml-kem-post-quantum-tls-now-supported-in-aws-kms-acm-and-secrets-manager/',
      },
      {
        provider: 'Apple iOS / macOS',
        what: 'X25519MLKEM768 advertised in TLS 1.3 from iOS 26 / macOS 26',
        since: '2025-09',
        referenceUrl: 'https://blog.cloudflare.com/pq-2025/',
      },
      {
        provider: 'Microsoft (Azure / Windows)',
        what: 'SymCrypt ships ML-KEM + ML-DSA across Azure, Win11, Server 2025',
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
        what: 'X25519_ML-KEM-768 hybrid in TLS 1.3 (BIG-IP v17.5+)',
        since: '2025',
        referenceUrl:
          'https://www.f5.com/products/big-ip-services/quantum-resistance-with-pqc-in-ltm',
      },
      {
        provider: 'Symantec SWG (Broadcom)',
        what: 'X25519MLKEM768 hybrid KEX as first-to-market SWG PQ capability',
        since: '2025',
        referenceUrl: 'https://www.security.com/product-insights/post-quantum-security-edge',
      },
    ],
    inheritedBy: ['DTLS 1.3', 'FIDO 2', 'MACsec'],
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
        localFile: '/library/RFC_9935.html',
      },
      {
        id: 'RFC-9909',
        title: 'RFC 9909 — X.509 Algorithm Identifiers for SLH-DSA',
        url: 'https://datatracker.ietf.org/doc/html/rfc9909',
        date: '2025-12',
        localFile: '/library/RFC_9909.html',
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
        id: 'draft-ietf-lamps-pq-composite-kem-14',
        title: 'draft-ietf-lamps-pq-composite-kem-14 — Composite ML-KEM in X.509',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
        date: '2026-03-27',
        localFile: '/library/draft-ietf-lamps-pq-composite-kem-14.html',
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
        stageNote: 'Submitted to IESG (Mar 2026)',
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
        stage: 'ietf-last-call',
        stageNote: 'IETF Last Call (Jan 2026)',
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
    ],
    inheritedBy: ['UEFI'],
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
        localFile: '/library/RFC_9936.html',
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
        id: 'draft-ietf-lamps-cms-composite-sigs-04',
        title: 'draft-ietf-lamps-cms-composite-sigs-04 — Composite ML-DSA for CMS',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-composite-sigs/',
        date: '2026-02',
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
        stage: 'wg-last-call',
        stageNote: 'WG Last Call (May 2026)',
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
        stage: 'ietf-last-call',
        stageNote: 'IETF Last Call (Mar 2026)',
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
      { productId: 'gmail-google-workspace', name: 'Gmail / Google Workspace' },
      {
        productId: 'proton-mail-pqc-openpgp',
        name: 'Proton Mail PQC OpenPGP',
        versionNote: 'Open Source / Commercial',
      },
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
    ],
    latestDraft: [
      {
        id: 'draft-ietf-cose-dilithium-05',
        title: 'draft-ietf-cose-dilithium-05 — ML-DSA for JOSE and COSE',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-dilithium/',
        date: '2026-04-28',
        localFile: '/library/draft-ietf-cose-dilithium-05.html',
      },
      {
        id: 'draft-ietf-cose-falcon-04',
        title: 'draft-ietf-cose-falcon-04 — FN-DSA for JOSE and COSE',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-falcon/',
        date: '2026-03-25',
        localFile: '/library/draft-ietf-cose-falcon-04.html',
      },
      {
        id: 'draft-reddy-cose-jose-pqc-hybrid-hpke-11',
        title:
          'draft-reddy-cose-jose-pqc-hybrid-hpke-11 — PQ/T Hybrid KEMs for HPKE with JOSE/COSE',
        url: 'https://datatracker.ietf.org/doc/draft-reddy-cose-jose-pqc-hybrid-hpke/',
        date: '2026-02-16',
        localFile: '/library/draft-reddy-cose-jose-pqc-hybrid-hpke.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'experimental',
        refs: [
          {
            kind: 'draft',
            id: 'draft-reddy-cose-jose-pqc-hybrid-hpke',
            title: 'PQ/T Hybrid KEMs for HPKE with JOSE/COSE (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-reddy-cose-jose-pqc-hybrid-hpke/',
            publishedOn: '2026-02-16',
          },
        ],
      },
      hybridKem: {
        value: 'experimental',
        note: 'Same HPKE construction covers both pure and hybrid KEM modes.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-reddy-cose-jose-pqc-hybrid-hpke',
            title: 'PQ/T Hybrid KEMs for HPKE with JOSE/COSE (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-reddy-cose-jose-pqc-hybrid-hpke/',
            publishedOn: '2026-02-16',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-cose-dilithium',
            title: 'ML-DSA for JOSE and COSE',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-dilithium/',
            publishedOn: '2026-04-28',
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
        value: 'experimental',
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
        id: 'draft-reddy-cose-jose-pqc-hybrid-hpke-11',
        title:
          'draft-reddy-cose-jose-pqc-hybrid-hpke-11 — PQ/T Hybrid KEMs for HPKE with JOSE/COSE',
        url: 'https://datatracker.ietf.org/doc/draft-reddy-cose-jose-pqc-hybrid-hpke/',
        date: '2026-02-16',
        localFile: '/library/draft-reddy-cose-jose-pqc-hybrid-hpke.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
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
        value: 'experimental',
        refs: [
          {
            kind: 'draft',
            id: 'draft-reddy-cose-jose-pqc-hybrid-hpke',
            title: 'PQ/T Hybrid KEMs for HPKE with JOSE/COSE (individual)',
            url: 'https://datatracker.ietf.org/doc/draft-reddy-cose-jose-pqc-hybrid-hpke/',
            publishedOn: '2026-02-16',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'iesg-submitted',
        stageNote: 'iesg submitted (datatracker 2025-11-15)',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-cose-dilithium',
            title: 'ML-DSA for JOSE and COSE (shared with COSE)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-dilithium/',
            publishedOn: '2026-04-28',
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
          'ML-DSA-44/65/87 and SLH-DSA-SHA2-128s/192s/256s; IETF cose-dilithium-11 KAT vectors verified in-browser.',
        hybridSigNote:
          'MLDSA65-Ed25519 composite per draft-ietf-jose-pq-composite-sigs-01 §4; pinned KAT snapshot verified.',
      },
    ],
    liveDeployments: [
      {
        provider: 'AWS KMS',
        what: 'ML-DSA signing GA for JWT/JWS (and CMS, COSE, UEFI) — US West (N. California), Europe (Milan)',
        since: '2025',
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
        id: 'draft-ietf-lamps-pq-composite-kem-14',
        title: 'draft-ietf-lamps-pq-composite-kem-14 — Composite ML-KEM (enrollment payload)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/',
        date: '2026-03-27',
        localFile: '/library/draft-ietf-lamps-pq-composite-kem-14.html',
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
          'Composite KEM (draft-ietf-lamps-pq-composite-kem-14) deferred — awaiting OpenSSL composite provider integration.',
        hybridSigNote:
          'Composite sigs (draft-ietf-lamps-pq-composite-sigs-19) deferred — awaiting OpenSSL composite provider integration.',
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
    id: '5g-suci',
    name: '5G SUCI (3GPP)',
    description:
      '3GPP 5G Subscription Concealed Identifier — Profile C study introduces ML-KEM-768 and X25519+ML-KEM-768 hybrid for SUPI/IMSI concealment.',
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
        id: '3GPP-TR-33.841',
        title: '3GPP TR 33.841 — Study on Preparing for Transition to PQC in 3GPP',
        url: 'https://www.3gpp.org/ftp/Specs/archive/33_series/33.841/',
        date: '2025-05',
        localFile: '/library/3GPP-PQC-Study-2025.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'experimental',
        note: '3GPP TR 33.841 "Profile C" — ML-KEM-768 standalone for SUCI concealment (study item).',
        refs: [
          {
            kind: 'spec',
            id: '3GPP TR 33.841',
            title: 'Study on Preparing for Transition to PQC in 3GPP (Profile C)',
            url: 'https://www.3gpp.org/ftp/Specs/archive/33_series/33.841/',
            publishedOn: '2025-05',
          },
        ],
      },
      hybridKem: {
        value: 'experimental',
        note: '3GPP TR 33.841 Profile C hybrid mode — X25519 + ML-KEM-768 SUCI concealment (study item).',
        refs: [
          {
            kind: 'spec',
            id: '3GPP TR 33.841',
            title: 'Study on Preparing for Transition to PQC in 3GPP (Profile C hybrid)',
            url: 'https://www.3gpp.org/ftp/Specs/archive/33_series/33.841/',
            publishedOn: '2025-05',
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
          'SUCI tool demonstrates Profile C ML-KEM-768 concealment in pre-standard form (3GPP TR 33.841 is a study item, not standardized).',
        hybridKemNote:
          'Hybrid X25519 + ML-KEM-768 mode is illustrative — 3GPP has not finalized Profile C wire format.',
      },
    ],
    liveDeployments: [
      {
        provider: 'SK Telecom + Thales',
        what: 'Crystals-Kyber (ML-KEM) PQ trial on 5G SA network with 5G SIM cards to protect subscriber identity',
        since: '2024',
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
    ],
    latestDraft: [
      {
        id: 'draft-ietf-openpgp-pqc-17',
        title: 'draft-ietf-openpgp-pqc-17 — PQC for OpenPGP (in AUTH48)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-pqc/',
        date: '2026-01-13',
        localFile: '/library/draft-ietf-openpgp-pqc-17.html',
      },
      {
        id: 'draft-ietf-openpgp-nist-bp-comp-03',
        title: 'draft-ietf-openpgp-nist-bp-comp-03 — NIST + Brainpool composites',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-nist-bp-comp/',
        date: '2026-01-08',
        localFile: '/library/draft-ietf-openpgp-nist-bp-comp-03.html',
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
        value: 'draft',
        stage: 'ietf-last-call',
        stageNote: 'IETF Last Call (Oct 2025) — single draft also covers Pure/Hybrid Sig',
        note: 'Composite mode pairs ML-KEM-768/1024 with ECDH P-256 / P-384 / X25519 / X448. Same draft draft-ietf-openpgp-pqc covers Pure Sig and Hybrid Sig.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-openpgp-pqc',
            title: 'Post-Quantum Cryptography in OpenPGP (covers hybrid KEM + pure/hybrid sig)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-pqc/',
            publishedOn: '2026-01-13',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'ietf-last-call',
        stageNote: 'IETF Last Call (Oct 2025) — same draft as Hybrid KEM',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-openpgp-pqc',
            title: 'Post-Quantum Cryptography in OpenPGP (covers hybrid KEM + pure/hybrid sig)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-pqc/',
            publishedOn: '2026-01-13',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'ietf-last-call',
        stageNote: 'IETF Last Call (Oct 2025) — same draft as Hybrid KEM',
        note: 'Composite mode pairs ML-DSA with ECDSA / EdDSA classical signatures.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-openpgp-pqc',
            title: 'Post-Quantum Cryptography in OpenPGP (covers hybrid KEM + pure/hybrid sig)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-openpgp-pqc/',
            publishedOn: '2026-01-13',
          },
        ],
      },
    },
    ossLibraries: [
      { productId: 'gnupg', name: 'GnuPG', versionNote: 'PQC branch tracking draft -17' },
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
        what: 'Quantum-safe PGP encryption shipped for inter-Proton mail',
        since: '2024',
        referenceUrl: 'https://proton.me/blog/post-quantum-encryption',
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
        localFile: '/library/RFC_9242.html',
      },
    ],
    latestDraft: [
      {
        id: 'draft-ietf-ipsecme-ikev2-mlkem-05',
        title: 'draft-ietf-ipsecme-ikev2-mlkem-05 — ML-KEM in IKEv2',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/',
        date: '2026-03-14',
        localFile: '/library/draft-ietf-ipsecme-ikev2-mlkem-05.html',
      },
      {
        id: 'draft-ietf-ipsecme-ikev2-pqc-auth-08',
        title: 'draft-ietf-ipsecme-ikev2-pqc-auth-08 — PQ Authentication in IKEv2',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-pqc-auth/',
        date: '2026-04-14',
        localFile: '/library/draft-ietf-ipsecme-ikev2-pqc-auth-08.html',
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
        stage: 'iesg-submitted',
        stageNote: 'Submitted to IESG (Mar 2026) — same draft covers Pure + Hybrid KEM',
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
        stage: 'iesg-submitted',
        stageNote: 'Submitted to IESG (Mar 2026) — same draft as Pure KEM; no RFC yet',
        note: 'Same draft as Pure KEM. No standalone RFC for hybrid KEM in IKEv2 (corrects an earlier mis-encoding to "rfc"). RFC 9370 multi-KE framework + draft-ietf-ipsecme-ikev2-mlkem together define the hybrid binding.',
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
        stage: 'iesg-submitted',
        stageNote: 'Submitted to IESG (Apr 2026)',
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
        provider: 'Mullvad VPN',
        what: 'Quantum-resistant WireGuard default on all desktop platforms',
        since: '2025-01',
        referenceUrl:
          'https://mullvad.net/en/blog/quantum-resistant-tunnels-are-now-the-default-on-desktop',
      },
      {
        provider: 'Cisco Secure Firewall',
        what: 'Hybrid IKEv2 (IKE_INTERMEDIATE + multi-KE RFCs) on ASA 9.19+; ML-KEM in FTD 10.5 / ASA 9.25',
        since: '2024',
        referenceUrl:
          'https://blogs.cisco.com/security/preparing-for-post-quantum-cryptography-the-secure-firewall-roadmap',
      },
      {
        provider: 'Palo Alto Networks PAN-OS',
        what: 'PQC Site-to-Site VPN with hybrid IKEv2 + ML-KEM (PAN-OS 11.2, 12.1+)',
        since: '2025',
        referenceUrl:
          'https://docs.paloaltonetworks.com/network-security/quantum-security/administration/quantum-security-concepts/support-for-quantum-features',
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
        id: 'draft-ietf-mls-pq-ciphersuites-04',
        title: 'draft-ietf-mls-pq-ciphersuites-04 — PQ Cipher Suites for MLS (WGLC)',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
        date: '2026-03-19',
        localFile: '/library/draft-ietf-mls-pq-ciphersuites-04.html',
      },
      {
        id: 'draft-ietf-mls-combiner-02',
        title: 'draft-ietf-mls-combiner-02 — Traditional + PQ MLS combiner',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-combiner/',
        date: '2025-10-22',
        localFile: '/library/draft-ietf-mls-combiner-02.html',
      },
      {
        id: 'draft-ietf-mls-extensions-09',
        title: 'draft-ietf-mls-extensions-09 — MLS Extensions framework',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-extensions/',
        date: '2026-03-02',
        localFile: '/library/draft-ietf-mls-extensions-09.html',
      },
    ],
    dimensions: {
      pureKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote: 'WG Last Call (Apr 2026) — single draft covers all 4 cases',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-03-19',
          },
        ],
      },
      hybridKem: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote: 'WG Last Call (Apr 2026) — same draft as Pure KEM',
        note: 'Combiner seeds PQ guarantees into the traditional ciphersuite via the exporter secret.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-03-19',
          },
        ],
      },
      pureSig: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote: 'WG Last Call (Apr 2026) — same draft as Pure KEM',
        note: 'Cipher suites bundle ML-DSA with the PQ KEM as a paired choice.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-03-19',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
        stage: 'wg-last-call',
        stageNote: 'WG Last Call (Apr 2026) — same draft as Pure KEM',
        note: 'Hybrid sig path is via session combination; cert-layer composite-sigs lives in the X.509 row.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-mls-pq-ciphersuites',
            title: 'PQ Cipher Suites for MLS (covers all 4 cases)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-mls-pq-ciphersuites/',
            publishedOn: '2026-03-19',
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
    commercialLibraries: [
      {
        productId: 'apple-pq3-corecrypto',
        name: 'Apple PQ3 / CoreCrypto',
        versionNote: 'Proprietary (iMessage PQ3)',
      },
      {
        productId: 'whatsapp',
        name: 'WhatsApp',
        versionNote: 'Proprietary (PQXDH on Signal protocol)',
      },
    ],
    playgrounds: [
      {
        toolId: 'mls-group-messaging',
        toolName: 'MLS Group Messaging',
        testability: { pureKem: 'partial', hybridKem: 'none', pureSig: 'none', hybridSig: 'none' },
      },
    ],
    liveDeployments: [
      {
        provider: 'Apple iMessage (PQ3)',
        what: 'iMessage PQ3 — three-key continuous PQ ratcheting',
        since: '2024-02',
        referenceUrl: 'https://security.apple.com/blog/imessage-pq3/',
      },
      {
        provider: 'Signal Protocol (PQXDH)',
        what: 'X3DH replaced with PQXDH (Kyber + X25519); also used by WhatsApp',
        since: '2023-09',
        referenceUrl: 'https://signal.org/blog/pqxdh/',
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
        localFile:
          '/library/Trusted-Platform-Module-2.0-Library-Part-3-Commands_Version-185_pub.pdf',
      },
      {
        id: 'TCG-PC-Client-Platform-TPM-Profile-v1.07',
        title: 'TCG PC Client Specific Platform TPM Profile v1.07 (Published)',
        url: 'https://trustedcomputinggroup.org/resource/pc-client-platform-tpm-profile-ptp-specification/',
        date: '2026-03-12',
        localFile: '/library/PC-Client-Specific-Platform-TPM-Profile-for-TPM-2p0-v1p07_Pub.pdf',
      },
      {
        id: 'TCG-EK-Credential-Profile-v2.7',
        title: 'TCG EK Credential Profile for TPM 2.0, Level 0, v2.7 (Published)',
        url: 'https://trustedcomputinggroup.org/resource/tcg-ek-credential-profile-for-tpm-family-2-0/',
        date: '2026-03-12',
        localFile:
          '/library/TCG-EK-Credential-Profile-for-TPM-Family-2.0-Level-0-Version-2.7_Pub.pdf',
      },
      {
        id: 'TCG-TPM-2.0-Library-v1.85-Errata',
        title: 'TCG TPM 2.0 Library v1.85 — Errata',
        url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
        date: '2026-03-12',
        localFile: '/library/Eratta-Trusted-Platform-Module-2.0-Library_Version-185_pub.pdf',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'rfc',
        stage: 'rfc-published',
        stageNote: 'TPM 2.0 Library v1.85 published 2026-03 — ML-KEM, ML-DSA, HashML-DSA',
        note: 'TPM 2.0 SHALL support ML-KEM-768 or ML-KEM-1024.',
        refs: [
          {
            kind: 'spec',
            id: 'TCG TPM 2.0 v1.85',
            title: 'TCG TPM 2.0 Library v1.85 — ML-KEM commands',
            url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
            publishedOn: '2026-03-12',
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
        stageNote: 'TPM 2.0 Library v1.85 published 2026-03',
        note: 'TPM 2.0 SHALL support ML-DSA-65 or ML-DSA-87 (incl. HashML-DSA).',
        refs: [
          {
            kind: 'spec',
            id: 'TCG TPM 2.0 v1.85',
            title: 'TCG TPM 2.0 Library v1.85 — ML-DSA + HashML-DSA commands',
            url: 'https://trustedcomputinggroup.org/resource/tpm-library-specification/',
            publishedOn: '2026-03-12',
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
        stage: 'identified',
        stageNote: 'Problem flagged — no WG draft chartered',
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
        stage: 'identified',
        stageNote: 'Problem flagged — no WG draft chartered',
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
        value: 'draft',
        note: 'Inherits TLS 1.3 — X25519MLKEM768 hybrid group.',
        deploymentPosture: 'pilot',
        deploymentNote:
          'DTLS 1.3 ML-KEM hybrid follows TLS 1.3 implementations; production rollout lags TLS by ~6–12 mo.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-ecdhe-mlkem',
            title: 'Hybrid X25519MLKEM768 (inherited from TLS 1.3)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
            publishedOn: '2026-02-08',
          },
        ],
      },
      pureSig: {
        value: 'draft',
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
  },
  {
    id: 'fido',
    name: 'FIDO',
    description:
      'FIDO authenticators (U2F) — channel security inherits TLS 1.2; no separate PQC track.',
    latestRelease: [],
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
        value: 'draft',
        note: 'Inherits TLS 1.3 — X25519MLKEM768 hybrid group.',
        deploymentPosture: 'production',
        deploymentNote:
          'WebAuthn / passkey traffic over Chromium + Cloudflare edge benefits from TLS 1.3 hybrid KEM in production.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-ecdhe-mlkem',
            title: 'Hybrid X25519MLKEM768 (inherited from TLS 1.3)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
            publishedOn: '2026-02-08',
          },
        ],
      },
      pureSig: {
        value: 'experimental',
        note: 'Algorithm IDs sourced from the COSE row. Constraint: authenticator-side ML-DSA private key (~5–7 KB) strains secure-element storage budgets.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-cose-dilithium',
            title: 'ML-DSA for COSE (inherited via WebAuthn COSE alg IDs)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-cose-dilithium/',
            publishedOn: '2026-04-28',
          },
        ],
      },
      hybridSig: {
        value: 'experimental',
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
        url: 'https://standards.ieee.org/ieee/802.1AE/6905/',
        date: '2018-12',
      },
    ],
    latestDraft: [],
    dimensions: {
      pureKem: {
        value: 'draft',
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
        value: 'draft',
        note: 'Inherits TLS 1.3 (EAP-TLS bootstrap) — X25519MLKEM768 hybrid.',
        deploymentPosture: 'pilot',
        deploymentNote: 'Cisco / Juniper MACsec stacks pilot PQ EAP-TLS bootstrap in 2025–2026.',
        refs: [
          {
            kind: 'draft',
            id: 'draft-ietf-tls-ecdhe-mlkem',
            title: 'Hybrid X25519MLKEM768 (inherited)',
            url: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
            publishedOn: '2026-02-08',
          },
        ],
      },
      pureSig: {
        value: 'draft',
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
        what: 'Quantum-safe MACsec validated on Juniper SRX/MX/ACX for 5G mobile backhaul (QKD-based key delivery)',
        since: '2025-06',
        referenceUrl:
          'https://www.juniper.net/gb/en/company/press-releases/2025/pr-2025-06-26-00-00.html',
      },
    ],
    inheritsFromProtocolId: 'tls-1-3',
  },
  {
    id: 'uefi',
    name: 'UEFI Secure Boot',
    description:
      'UEFI Secure Boot — image verification inherits X.509 PKI; PQ migration tracks X.509 algorithm OIDs.',
    latestRelease: [
      {
        id: 'UEFI-2.10',
        title: 'UEFI Specification 2.10 (Aug 2022 + errata)',
        url: 'https://uefi.org/specifications',
        date: '2022-08',
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
            id: 'UEFI 2.10',
            title: 'UEFI Specification 2.10 (PE/COFF Authenticode chain consumes X.509 PQ OIDs)',
            url: 'https://uefi.org/specifications',
            publishedOn: '2022-08',
          },
        ],
      },
      hybridSig: {
        value: 'draft',
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
]
