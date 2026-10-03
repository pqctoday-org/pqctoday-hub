// SPDX-License-Identifier: GPL-3.0-only

// ── Where every key and data item sits, per step — data for the key map ────
// Placements are deployment choices layered on the library flows (the
// libraries only provide serialization: OpenFHE Serialize, TFHE-rs
// safe_serialize, Lattigo MarshalBinary). `persisted` placements appear only
// when the "persist at rest" toggle is on.

import type { FheFlowId } from './fheHsmFlows'

/** Secret = must never be exposed; public = may be exposed (integrity only); ciphertext = safe to expose. */
export type ItemClass = 'secret' | 'public' | 'ciphertext'

export type ItemId =
  | 'plain-data'
  | 'plain-result'
  | 'fhe-seed'
  | 'fhe-sk'
  | 'sk-share'
  | 'owner-sk'
  | 'kreyvium-key'
  | 'fhe-pk'
  | 'eval-keys'
  | 'ct-data'
  | 'ct-key'
  | 'stream-ct'
  | 'ct-result'
  | 'shares-out'
  | 'ct-owner'
  | 'seed-backup'

export interface MapItem {
  id: ItemId
  label: string
  /** ≤ 16 chars, drawn as a chip in the diagram lanes. */
  short: string
  cls: ItemClass
}

export const MAP_ITEMS: Record<ItemId, MapItem> = {
  'plain-data': { id: 'plain-data', label: 'Data in clear', short: 'data (clear)', cls: 'secret' },
  'plain-result': {
    id: 'plain-result',
    label: 'Result in clear',
    short: 'result (clear)',
    cls: 'secret',
  },
  'fhe-seed': { id: 'fhe-seed', label: 'FHE seed', short: 'FHE seed', cls: 'secret' },
  'fhe-sk': { id: 'fhe-sk', label: 'FHE secret / client key', short: 'secret key', cls: 'secret' },
  'sk-share': { id: 'sk-share', label: 'Secret-key share', short: 'key share', cls: 'secret' },
  'owner-sk': {
    id: 'owner-sk',
    label: 'Data owner’s own secret key',
    short: 'owner key',
    cls: 'secret',
  },
  'kreyvium-key': {
    id: 'kreyvium-key',
    label: 'Kreyvium key k',
    short: 'Kreyvium key',
    cls: 'secret',
  },
  'fhe-pk': { id: 'fhe-pk', label: 'FHE public key', short: 'public key', cls: 'public' },
  'eval-keys': {
    id: 'eval-keys',
    label: 'Evaluation / server keys',
    short: 'eval/server keys',
    cls: 'public',
  },
  'ct-data': {
    id: 'ct-data',
    label: 'FHE ciphertext of data',
    short: 'data (enc)',
    cls: 'ciphertext',
  },
  'ct-key': { id: 'ct-key', label: 'FHE(k)', short: 'FHE(k)', cls: 'ciphertext' },
  'stream-ct': {
    id: 'stream-ct',
    label: 'Kreyvium ciphertext of data',
    short: 'data (Kreyvium)',
    cls: 'ciphertext',
  },
  'ct-result': {
    id: 'ct-result',
    label: 'FHE ciphertext of result',
    short: 'result (enc)',
    cls: 'ciphertext',
  },
  'shares-out': {
    id: 'shares-out',
    label: 'Partial decryptions / protocol shares',
    short: 'protocol shares',
    cls: 'ciphertext',
  },
  'ct-owner': {
    id: 'ct-owner',
    label: 'Result under owner’s key',
    short: 'result → owner',
    cls: 'ciphertext',
  },
  'seed-backup': {
    id: 'seed-backup',
    label: 'Offline backup package',
    short: 'backup package',
    cls: 'ciphertext',
  },
}

export type ProtectionMode = 'hsm' | 'memory' | 'rest-encrypted' | 'rest-plain' | 'shared'

export const MODE_LABELS: Record<ProtectionMode, { short: string; long: string }> = {
  hsm: {
    short: 'HSM',
    long: 'Inside the HSM boundary; the FHE seed is non-extractable and leaves only by replication to an authenticated HSM',
  },
  memory: { short: 'RAM', long: 'In memory only, lost on restart' },
  'rest-encrypted': { short: 'At rest · enc', long: 'At rest, encrypted (wrapped)' },
  'rest-plain': { short: 'At rest', long: 'At rest as is (public or already encrypted)' },
  shared: { short: 'Share in HSM', long: 'Only a secret share, held inside an HSM' },
}

/** The extra column for storage at rest. */
export const DATA_CENTER = { id: 'datacenter', label: 'Data center', sub: 'at rest' } as const

export interface Placement {
  item: ItemId
  /** An actor id of the flow, or 'datacenter'. */
  at: string
  mode: ProtectionMode
  /** 0-based step index from which the item is present. */
  from: number
  /** Last 0-based step at which it is present (inclusive). */
  until?: number
  /** Shown only when the FHE server persists data at rest. */
  persisted?: boolean
  /** Shown only when the owner's policy also releases the result to the third party. */
  shared?: boolean
}

const p = (
  item: ItemId,
  at: string,
  mode: ProtectionMode,
  from: number,
  extra: Partial<Placement> = {}
): Placement => ({ item, at, mode, from, ...extra })

/** Cloud-side public/ciphertext items mirrored into the data center when persisted. */
const atRest = (item: ItemId, from: number): Placement =>
  p(item, 'datacenter', 'rest-plain', from, { persisted: true })

export const FHE_KEY_MAP: Record<FheFlowId, Placement[]> = {
  'single-hsm': [
    p('ct-result', 'client', 'memory', 6),
    p('ct-data', 'client', 'memory', 3, { until: 4 }),
    p('plain-data', 'client', 'memory', 0),
    p('fhe-seed', 'hsm', 'hsm', 0),
    p('fhe-sk', 'hsm', 'hsm', 0),
    p('eval-keys', 'cloud', 'memory', 1),
    atRest('eval-keys', 1),
    p('fhe-pk', 'client', 'memory', 2),
    p('ct-data', 'cloud', 'memory', 4),
    atRest('ct-data', 4),
    p('ct-result', 'cloud', 'memory', 5),
    atRest('ct-result', 5),
    p('ct-result', 'hsm', 'hsm', 7),
    p('plain-result', 'hsm', 'hsm', 8, { until: 9 }),
    p('plain-result', 'client', 'memory', 9),
    p('fhe-seed', 'dr', 'hsm', 10),
    p('seed-backup', 'datacenter', 'rest-encrypted', 11),
    p('plain-result', 'cloud', 'memory', 9, { shared: true }),
  ],
  'tfhe-single-hsm': [
    p('ct-result', 'client', 'memory', 7),
    p('ct-data', 'client', 'memory', 4, { until: 5 }),
    p('plain-data', 'client', 'memory', 0),
    p('fhe-seed', 'hsm', 'hsm', 0),
    p('fhe-sk', 'hsm', 'hsm', 0),
    p('eval-keys', 'hsm', 'hsm', 1, { until: 2 }),
    p('eval-keys', 'cloud', 'memory', 2),
    atRest('eval-keys', 2),
    p('fhe-pk', 'client', 'memory', 3),
    p('ct-data', 'cloud', 'memory', 5),
    atRest('ct-data', 5),
    p('ct-result', 'cloud', 'memory', 6),
    atRest('ct-result', 6),
    p('ct-result', 'hsm', 'hsm', 8),
    p('plain-result', 'hsm', 'hsm', 9, { until: 10 }),
    p('plain-result', 'client', 'memory', 10),
    p('fhe-seed', 'dr', 'hsm', 11),
    p('seed-backup', 'datacenter', 'rest-encrypted', 12),
    p('plain-result', 'cloud', 'memory', 10, { shared: true }),
  ],
  'openfhe-threshold': [
    p('ct-result', 'client', 'memory', 8),
    p('ct-data', 'client', 'memory', 5, { until: 6 }),
    p('plain-data', 'client', 'memory', 0),
    p('sk-share', 'hsmA', 'shared', 0),
    p('sk-share', 'hsmB', 'shared', 1),
    p('sk-share', 'hsmC', 'shared', 2),
    p('eval-keys', 'cloud', 'memory', 4),
    atRest('eval-keys', 4),
    p('fhe-pk', 'client', 'memory', 4),
    p('ct-data', 'cloud', 'memory', 6),
    atRest('ct-data', 6),
    p('ct-result', 'cloud', 'memory', 7),
    atRest('ct-result', 7),
    p('ct-result', 'hsmA', 'hsm', 9),
    p('ct-result', 'hsmB', 'hsm', 9),
    p('ct-result', 'hsmC', 'hsm', 9),
    p('shares-out', 'client', 'memory', 10),
    p('plain-result', 'client', 'memory', 13),
  ],
  'lattigo-threshold': [
    p('ct-data', 'client', 'memory', 4, { until: 5 }),
    p('plain-data', 'client', 'memory', 0),
    p('owner-sk', 'client', 'memory', 0),
    p('sk-share', 'hsmA', 'shared', 0),
    p('sk-share', 'hsmB', 'shared', 0),
    p('sk-share', 'hsmC', 'shared', 0),
    p('fhe-pk', 'cloud', 'memory', 1),
    p('eval-keys', 'cloud', 'memory', 2),
    atRest('eval-keys', 2),
    p('fhe-pk', 'client', 'memory', 5),
    p('ct-data', 'cloud', 'memory', 5),
    atRest('ct-data', 5),
    p('ct-result', 'cloud', 'memory', 6),
    atRest('ct-result', 6),
    p('shares-out', 'cloud', 'memory', 7),
    p('ct-owner', 'client', 'memory', 10),
    p('plain-result', 'client', 'memory', 11),
  ],
  'hsm-compute-limits': [
    p('ct-result', 'app', 'memory', 4),
    p('plain-data', 'app', 'memory', 0),
    p('fhe-seed', 'hsm', 'hsm', 0),
    p('fhe-sk', 'hsm', 'hsm', 0),
    p('eval-keys', 'gpu', 'memory', 3),
    atRest('eval-keys', 3),
    p('ct-data', 'gpu', 'memory', 3),
    atRest('ct-data', 3),
    p('ct-result', 'gpu', 'memory', 3),
    p('ct-result', 'hsm', 'hsm', 5),
    p('plain-result', 'hsm', 'hsm', 6, { until: 7 }),
    p('plain-result', 'app', 'memory', 7),
    p('plain-result', 'gpu', 'memory', 7, { shared: true }),
  ],
  'tfhe-transciphering': [
    p('ct-result', 'client', 'memory', 6),
    p('plain-data', 'client', 'memory', 0),
    p('fhe-seed', 'hsm', 'hsm', 0),
    p('fhe-sk', 'hsm', 'hsm', 0),
    p('eval-keys', 'cloud', 'memory', 0),
    atRest('eval-keys', 0),
    p('kreyvium-key', 'client', 'memory', 1),
    p('fhe-pk', 'client', 'memory', 2),
    p('ct-key', 'cloud', 'memory', 2),
    atRest('ct-key', 2),
    p('stream-ct', 'cloud', 'memory', 3),
    atRest('stream-ct', 3),
    p('ct-data', 'cloud', 'memory', 4),
    atRest('ct-data', 4),
    p('ct-result', 'cloud', 'memory', 5),
    atRest('ct-result', 5),
    p('ct-result', 'hsm', 'hsm', 7),
    p('plain-result', 'hsm', 'hsm', 8, { until: 9 }),
    p('plain-result', 'client', 'memory', 9),
    p('plain-result', 'cloud', 'memory', 9, { shared: true }),
  ],
}
