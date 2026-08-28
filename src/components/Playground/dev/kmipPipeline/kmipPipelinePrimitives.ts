// SPDX-License-Identifier: GPL-3.0-only
/**
 * KMIP/CACP step vocabulary for the KMIP Developer tab's graphical pipeline
 * builder (dev-tabs-pkcs11-kmip plan, WS-E). Same structural role as
 * ../pipeline/pipelinePrimitives.ts on the PKCS#11 side, but the KMIP
 * lesson is about the LIFECYCLE SEQUENCE and the crypto-agility policy
 * plane (D3 scope), not a fixed algorithm-to-mechanism table — so the
 * shape here is deliberately different, not a re-skin of the PKCS#11 file.
 *
 * Algorithm names are the real KMIP wire strings the shim's
 * create_key_pair()/create_symmetric() send (confirmed against
 * pqctoday-hsm/kmip/python-client's real algorithm-name handling in P3) —
 * "ML_DSA_65" not "ML-DSA-65", matching every real sandbox KMIP sample.
 */

export type KmipOp =
  | 'createKeyPair' | 'create'
  | 'activate' | 'sign' | 'encapsulate' | 'decapsulate'
  | 'getAttributes' | 'locate' | 'revoke' | 'destroy'

/** What a parameter slot accepts — mirrors the PKCS#11 side's ParamKind,
 *  narrowed to what KMIP steps actually bind: a prior step's produced
 *  UID(s), or free text (the message to sign, ciphertext hex, ...). */
export type KmipParamKind = 'uid' | 'pubUid' | 'privUid' | 'text' | 'ciphertextHex'

export type KmipOutputKind = 'none' | 'keypairUids' | 'uid' | 'signatureHex' | 'ciphertextAndUid' | 'bool'

export interface KmipOpSpec {
  requires: Partial<Record<string, KmipParamKind>>
  produces: KmipOutputKind
}

export type KmipKeyKind = 'keypair' | 'symmetric'

export interface KmipPrimSpec {
  label: string
  /** Real KMIP algorithm wire name (underscore convention — see module doc). */
  algorithm: string
  keyKind: KmipKeyKind
  ops: Partial<Record<KmipOp, KmipOpSpec>>
}

const lifecycleOps = (extra: Partial<Record<KmipOp, KmipOpSpec>>): Partial<Record<KmipOp, KmipOpSpec>> => ({
  getAttributes: { requires: { uid: 'uid' }, produces: 'bool' },
  locate: { requires: {}, produces: 'bool' },
  revoke: { requires: { uid: 'uid' }, produces: 'bool' },
  destroy: { requires: { uid: 'uid' }, produces: 'bool' },
  ...extra,
})

export const KMIP_PRIMITIVES: Record<string, KmipPrimSpec> = {
  'ml-dsa-65': {
    label: 'ML-DSA-65', algorithm: 'ML_DSA_65', keyKind: 'keypair',
    ops: lifecycleOps({
      createKeyPair: { requires: {}, produces: 'keypairUids' },
      activate: { requires: { uid: 'uid' }, produces: 'bool' },
      sign: { requires: { privUid: 'privUid', text: 'text' }, produces: 'signatureHex' },
    }),
  },
  'ml-kem-768': {
    label: 'ML-KEM-768', algorithm: 'ML_KEM_768', keyKind: 'keypair',
    ops: lifecycleOps({
      createKeyPair: { requires: {}, produces: 'keypairUids' },
      activate: { requires: { uid: 'uid' }, produces: 'bool' },
      encapsulate: { requires: { pubUid: 'pubUid' }, produces: 'ciphertextAndUid' },
      decapsulate: { requires: { privUid: 'privUid', ciphertext: 'ciphertextHex' }, produces: 'uid' },
    }),
  },
  'aes-256': {
    label: 'AES-256', algorithm: 'AES', keyKind: 'symmetric',
    ops: lifecycleOps({
      create: { requires: {}, produces: 'uid' },
      activate: { requires: { uid: 'uid' }, produces: 'bool' },
    }),
  },
}

export const opsFor = (primId: string): KmipOp[] =>
  Object.keys(KMIP_PRIMITIVES[primId]?.ops ?? {}) as KmipOp[]

export const specFor = (primId: string): KmipPrimSpec | undefined => KMIP_PRIMITIVES[primId]

export const defaultOpFor = (primId: string): KmipOp => {
  const ops = opsFor(primId)
  if (ops.includes('createKeyPair')) return 'createKeyPair'
  if (ops.includes('create')) return 'create'
  return ops[0] ?? 'locate'
}
