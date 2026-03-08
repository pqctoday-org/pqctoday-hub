import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { readUlong, writeUlong, allocUlong, writeBytes } from './memory'
import { checkRV } from './logging'
import {
  AttrDef,
  MechanismInfo,
  MechanismFamily,
  CKM_AES_KEY_WRAP,
  CKM_SHA256,
  CKM_SHA256_RSA_PKCS,
  CKF_FLAG_NAMES,
  MECH_TABLE,
  CKM_ML_KEM_KEY_PAIR_GEN,
  CKM_ML_DSA,
  CKM_ML_DSA_KEY_PAIR_GEN,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_256F,
} from './constants'

export interface MLDSASignOptions {
  hedging?: 'preferred' | 'required' | 'deterministic'
  context?: Uint8Array
  preHash?: any
}
export type MLDSAPreHash = string
export type SLHDSAPreHash = string

/** Decode a CKF_ flags bitmask into an array of short flag names. */
const decodeMechFlags = (flags: number): string[] =>
  CKF_FLAG_NAMES.filter(([bit]) => (flags & bit) !== 0).map(([, name]) => name)

// Dummy buildMech until proper implementation
const buildMech = (M: any, type: number): number => M._malloc(12)

// SPDX-License-Identifier: GPL-3.0-only

export const hsm_generateSLHDSAKeyPair = (M: any, session: number, params: any) => {
  return { pubHandle: 0, privHandle: 0 }
}
export const hsm_slhdsaSign = (M: any, session: number, key: number, msg: string, opts: any) =>
  new Uint8Array()
export const hsm_slhdsaVerify = (
  M: any,
  session: number,
  key: number,
  msg: string,
  sig: Uint8Array,
  opts: any
) => false

export const hsm_generateAESKey = (M: any, session: number, bits: number) => {
  return 0
}
export const hsm_aesEncrypt = (
  M: any,
  session: number,
  keyHandle: number,
  plaintext: Uint8Array,
  mode: string
) => {
  return { ciphertext: new Uint8Array(), iv: new Uint8Array() }
}
export const hsm_aesDecrypt = (
  M: any,
  session: number,
  keyHandle: number,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  mode: string
) => {
  return new Uint8Array()
}
export const hsm_aesCtrEncrypt = (
  M: any,
  session: number,
  keyHandle: number,
  plaintext: Uint8Array,
  cbParams: Uint8Array
) => {
  return new Uint8Array()
}
export const hsm_aesCtrDecrypt = (
  M: any,
  session: number,
  keyHandle: number,
  ciphertext: Uint8Array,
  cbParams: Uint8Array
) => {
  return new Uint8Array()
}
export const hsm_aesCmac = (M: any, session: number, keyHandle: number, message: Uint8Array) => {
  return new Uint8Array()
}
export const hsm_generateHMACKey = (M: any, session: number, bitLength: number) => {
  return 0
}
export const hsm_hmac = (
  M: any,
  session: number,
  keyHandle: number,
  message: Uint8Array,
  mechType: number
) => {
  return new Uint8Array()
}
export const hsm_hmacVerify = (
  M: any,
  session: number,
  keyHandle: number,
  message: Uint8Array,
  mac: Uint8Array,
  mechType: number
) => {
  return false
}
export const hsm_generateRandom = (M: any, session: number, length: number) => {
  return new Uint8Array()
}
export const hsm_seedRandom = (M: any, session: number, seed: Uint8Array) => {
  return
}
export const hsm_aesWrapKey = (
  M: any,
  session: number,
  wrappingKeyHandle: number,
  keyToWrapHandle: number
) => {
  return new Uint8Array()
}

export const hsm_unwrapKey = (
  M: any,
  session: number,
  unwrappingKeyHandle: number,
  wrappedKey: Uint8Array,
  template: any[]
) => {
  return 0
}
