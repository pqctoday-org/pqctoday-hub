// SPDX-License-Identifier: GPL-3.0-only
//
// tpmWireDecode.ts — shared TPM wire-format decode helpers, extracted from
// ExecutionLog.tsx's module-private copies (Phase 1 WS2 of the 2026-07-23
// remediation plan) so lesson steps can produce human-readable detail
// strings from raw responses through the SAME decode path the workbench
// renders — curriculum and Execution Log can't drift apart.
//
// Command-code values verified against src/wasm/tpmSerializer.ts constants
// (themselves checked against pqctoday-tpm TpmTypes.h / the published v1.85
// Part 2 §6.5 table).

import { getU16, getU32 } from '../../../wasm/tpmSerializer'

/** Render a fixed-width big-endian field as 0x-prefixed hex ('—' if absent). */
export function readField(buf: Uint8Array, offset: number, size: number): string {
  if (buf.length < offset + size) return '—'
  switch (size) {
    case 1:
      return `0x${buf[offset].toString(16).padStart(2, '0')}`
    case 2:
      return `0x${getU16(buf, offset).toString(16).padStart(4, '0')}`
    case 4:
      return `0x${getU32(buf, offset).toString(16).padStart(8, '0')}`
    default:
      return '—'
  }
}

/** Hex preview of a variable-length field (first `maxBytes`, '…' if longer). */
export function readVariablePreview(buf: Uint8Array, offset: number, maxBytes = 8): string {
  if (buf.length <= offset) return '—'
  const available = Math.min(buf.length - offset, maxBytes)
  const preview = Array.from(buf.slice(offset, offset + available))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
  return buf.length - offset > maxBytes ? `${preview} …` : preview
}

export const TAG_NAMES: Record<number, string> = {
  0x8001: 'TPM_ST_NO_SESSIONS',
  0x8002: 'TPM_ST_SESSIONS',
}

export const CC_NAMES: Record<number, string> = {
  0x00000131: 'TPM2_CreatePrimary',
  0x0000013e: 'TPM2_SequenceComplete',
  0x00000143: 'TPM2_SelfTest',
  0x00000144: 'TPM2_Startup',
  0x00000148: 'TPM2_Certify',
  0x0000014e: 'TPM2_NV_Read',
  0x00000157: 'TPM2_Load',
  0x00000158: 'TPM2_Quote',
  0x00000159: 'TPM2_RSA_Decrypt',
  0x00000184: 'TPM2_NV_Certify',
  0x0000015c: 'TPM2_SequenceUpdate',
  0x0000015d: 'TPM2_Sign',
  0x00000165: 'TPM2_FlushContext',
  0x00000169: 'TPM2_NV_ReadPublic',
  0x00000173: 'TPM2_ReadPublic',
  0x00000174: 'TPM2_RSA_Encrypt',
  0x00000177: 'TPM2_VerifySignature',
  0x0000017a: 'TPM2_GetCapability',
  0x0000017b: 'TPM2_GetRandom',
  0x00000186: 'TPM2_HashSequenceStart',
  0x000001a3: 'TPM2_VerifySequenceComplete',
  0x000001a4: 'TPM2_SignSequenceComplete',
  0x000001a5: 'TPM2_VerifyDigestSignature',
  0x000001a6: 'TPM2_SignDigest',
  0x000001a7: 'TPM2_Encapsulate',
  0x000001a8: 'TPM2_Decapsulate',
  0x000001a9: 'TPM2_VerifySequenceStart',
  0x000001aa: 'TPM2_SignSequenceStart',
}

/** Parse the fixed 10-byte response header: {tag, size, rc}. */
export function parseRespHeader(resp: Uint8Array): { tag: number; size: number; rc: number } {
  if (resp.length < 10) return { tag: 0, size: 0, rc: -1 }
  return { tag: getU16(resp, 0), size: getU32(resp, 2), rc: getU32(resp, 6) }
}

/** Response-code as '0x········'. */
export function formatRc(rc: number): string {
  return `0x${(rc >>> 0).toString(16).padStart(8, '0')}`
}
