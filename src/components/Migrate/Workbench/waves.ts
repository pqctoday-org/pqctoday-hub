// SPDX-License-Identifier: GPL-3.0-only
// Wave sequencing metadata for the plan board (handoff §Wave). Tokens, not hex.

export interface WaveMeta {
  title: string
  subtitle: string
  /** One-line "why here, why now" — the sequencing rationale asserted but never
   *  explained elsewhere (see PlanTab.tsx wave-rationale explainers). */
  rationale: string
  /** tile color classes (semantic tokens) */
  tileClass: string
}

export const WAVES_FALLBACK: Record<1 | 2 | 3 | 4, WaveMeta> = {
  1: {
    title: 'External-facing live traffic',
    subtitle: 'Public TLS & VPN — highest exposure, HNDL risk',
    rationale:
      'Prioritized first because it is the most exposed to harvest-now-decrypt-later attacks — traffic an adversary can record today and decrypt once a cryptanalytically relevant quantum computer exists.',
    tileClass: 'bg-status-error/15 text-status-error',
  },
  2: {
    title: 'Signing & access',
    subtitle: 'Certificates, SSH, code & firmware signing — CNSA early deadlines',
    rationale:
      'Sequenced second because CNSA 2.0 sets its earliest signature-migration deadlines here, and certificates/signatures are long-lived — a forged signature stays valid long after the classical algorithm behind it is broken.',
    tileClass: 'bg-status-warning/15 text-status-warning',
  },
  3: {
    title: 'Key & identity infrastructure',
    subtitle: 'HSMs, cloud KMS, messaging — depends on vendor firmware',
    rationale:
      'Sequenced third because these are gated on vendor firmware/API roadmaps rather than something you can act on unilaterally — track vendor readiness while Waves 1–2 are in progress.',
    tileClass: 'bg-primary/15 text-primary',
  },
  4: {
    title: 'Data-at-rest & messaging',
    subtitle: 'Disk/DB encryption, email — symmetric-safe, re-wrap keys',
    rationale:
      'Sequenced last because AES-256 itself already resists quantum attack — the remaining exposure is only the key-wrapping layer, which is a re-key operation rather than a protocol replacement.',
    tileClass: 'bg-secondary/20 text-secondary',
  },
}
