// SPDX-License-Identifier: AGPL-3.0-only
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
    subtitle: 'Public TLS & VPN — often early where recorded traffic must stay confidential',
    rationale:
      'A common first wave when the traffic carries data that must stay confidential for years: key establishment on connections an adversary can record today is exposed to harvest-now-decrypt-later once a cryptanalytically relevant quantum computer exists, and it depends mainly on your own endpoints and your vendors’ library support. Where your longest-lived secrets sit in storage, or other services wait on a signing change, start there instead.',
    tileClass: 'bg-status-error/15 text-status-error',
  },
  2: {
    title: 'Signing & access',
    subtitle: 'Certificates, SSH, code & firmware signing — ordered by how long trust must last',
    rationale:
      'Often early where a signature must still be trusted after a cryptanalytically relevant quantum computer exists: a signature forged on firmware or a long-lived certificate stays accepted until verifiers stop trusting the old key. Order by how long the trust must last and what depends on the signing key. National security systems also have their own NSA dates under CNSSP 15 (CNSA 2.0 FAQ version 2.2): CNSA 2.0 algorithms required in new acquisitions from 1 January 2027, equipment and services that cannot support them phased out by 31 December 2030, and CNSA 2.0 mandated by 31 December 2031 unless otherwise noted. These apply to national security systems, not as a general order for other organizations.',
    tileClass: 'bg-status-warning/15 text-status-warning',
  },
  3: {
    title: 'Key & identity infrastructure',
    subtitle: 'HSMs, cloud KMS, messaging — depends on vendor firmware',
    rationale:
      'Placed here when the work is gated on vendor firmware or API roadmaps rather than something you can act on alone, so track vendor readiness while Waves 1–2 are in progress. If other waves depend on a KMS or HSM capability, this work moves earlier.',
    tileClass: 'bg-primary/15 text-primary',
  },
  4: {
    title: 'Data-at-rest & messaging',
    subtitle: 'Disk/DB encryption, email — bulk cipher stays; key protection changes',
    rationale:
      'Symmetric standards such as AES are not expected to need replacing (NIST IR 8547); what changes is how the data keys are protected. Rewrapping data keys under a new wrapping key is enough only if no copy of the old wrapped keys or old ciphertext has been exposed. For data that must stay confidential for decades, or where old key material or backups may already have been captured, storage work can be urgent and rewrapping is not enough: the data needs re-encryption under a new data key. Order storage by confidentiality lifetime and key history, not as a fixed last step.',
    tileClass: 'bg-secondary/20 text-secondary',
  },
}
