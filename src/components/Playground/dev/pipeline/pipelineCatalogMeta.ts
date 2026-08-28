// SPDX-License-Identifier: GPL-3.0-only
/**
 * Palette display metadata for the pipeline builder — family grouping, PQ/
 * classical flag, mechanism hex string. The sandbox's PipelinePage reads
 * these from its much larger sandboxCatalog.ts (2000+ lines covering every
 * playground surface, not just the pipeline builder). Rather than port that
 * whole catalog for four display fields, this is a small, self-contained
 * table keyed on the SAME primitive ids as pipelinePrimitives.ts's
 * PRIMITIVES registry — every id here must exist there (checked by
 * pipelineCatalogMeta.driftguard.test.ts).
 */
import { PRIMITIVES } from './pipelinePrimitives'

export type PrimitiveFamily = 'Signature' | 'KEM' | 'Symmetric' | 'Hash'

export interface PaletteMeta {
  family: PrimitiveFamily
  /** true = post-quantum, false = classical, undefined = not applicable (hash). */
  pq?: boolean
  hex: string
}

export const PALETTE_META: Record<string, PaletteMeta> = {
  'ml-dsa-44': { family: 'Signature', pq: true, hex: '0x1d' },
  'ml-dsa-65': { family: 'Signature', pq: true, hex: '0x1d' },
  'ml-dsa-87': { family: 'Signature', pq: true, hex: '0x1d' },
  'ml-kem-512': { family: 'KEM', pq: true, hex: '0x17' },
  'ml-kem-768': { family: 'KEM', pq: true, hex: '0x17' },
  'ml-kem-1024': { family: 'KEM', pq: true, hex: '0x17' },
  'slh-dsa': { family: 'Signature', pq: true, hex: '0x2e' },
  'hss-lms': { family: 'Signature', pq: true, hex: '0x4033' },
  'rsa-2048': { family: 'Signature', pq: false, hex: '0x40' },
  'rsa-pss': { family: 'Signature', pq: false, hex: '0x43' },
  'ecdsa-p256': { family: 'Signature', pq: false, hex: '0x1044' },
  'ed25519': { family: 'Signature', pq: false, hex: '0x1057' },
  'rsa-oaep': { family: 'KEM', pq: false, hex: '0x09' },
  'ecdh-p256': { family: 'KEM', pq: false, hex: '0x1050' },
  'aes-256-gcm': { family: 'Symmetric', hex: '0x1087' },
  'sha3-256': { family: 'Hash', hex: '0x2b0' },
  'sha-256': { family: 'Hash', hex: '0x250' },
}

export interface PaletteEntry {
  id: string
  name: string
  family: PrimitiveFamily
  pq?: boolean
  hex: string
}

export const PALETTE_ENTRIES: PaletteEntry[] = Object.entries(PRIMITIVES).map(([id, spec]) => {
  const meta = PALETTE_META[id]
  if (!meta) throw new Error(`pipelineCatalogMeta: no PALETTE_META entry for primitive "${id}"`)
  return { id, name: spec.label, family: meta.family, pq: meta.pq, hex: meta.hex }
})
