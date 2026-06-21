// SPDX-License-Identifier: GPL-3.0-only
// Wave sequencing metadata for the plan board (handoff §Wave). Tokens, not hex.

export interface WaveMeta {
  title: string
  subtitle: string
  /** tile color classes (semantic tokens) */
  tileClass: string
}

export const WAVES_FALLBACK: Record<1 | 2 | 3 | 4, WaveMeta> = {
  1: {
    title: 'External-facing live traffic',
    subtitle: 'Public TLS & VPN — highest exposure, HNDL risk',
    tileClass: 'bg-status-error/15 text-status-error',
  },
  2: {
    title: 'Signing & access',
    subtitle: 'Certificates, SSH, code & firmware signing — CNSA early deadlines',
    tileClass: 'bg-status-warning/15 text-status-warning',
  },
  3: {
    title: 'Key & identity infrastructure',
    subtitle: 'HSMs, cloud KMS, messaging — depends on vendor firmware',
    tileClass: 'bg-primary/15 text-primary',
  },
  4: {
    title: 'Data-at-rest & messaging',
    subtitle: 'Disk/DB encryption, email — symmetric-safe, re-wrap keys',
    tileClass: 'bg-secondary/20 text-secondary',
  },
}
