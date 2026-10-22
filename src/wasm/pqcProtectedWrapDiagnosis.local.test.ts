// SPDX-License-Identifier: AGPL-3.0-only
// Diagnostic only. No private-key/seed attribute reads or JS-side private import.
import { it, expect } from 'vitest'
import * as S from './softhsm'

it('tests native wrap/unwrap on sensitive ML-DSA keys without exposing private material', async () => {
  const M = (await S.getSoftHSMRustModule()) as S.SoftHSMModule
  S.hsm_initialize(M)
  const slot = S.hsm_initToken(M, S.hsm_getFirstFreeSlot(M), '1234', 'protected-wrap')
  const session = S.hsm_openUserSession(M, slot, '1234', '1234')
  try {
    // Generate directly with sensitive=true and extractable=true; no downgrade.
    const pubAttrs: S.AttrDef[] = [
      { type: S.CKA_PARAMETER_SET, ulongVal: 2 },
      { type: S.CKA_VERIFY, boolVal: true },
    ]
    const privAttrs: S.AttrDef[] = [
      { type: S.CKA_SIGN, boolVal: true },
      { type: S.CKA_SENSITIVE, boolVal: true },
      { type: S.CKA_EXTRACTABLE, boolVal: true },
    ]
    const pubTpl = S.buildTemplate(M, pubAttrs),
      privTpl = S.buildTemplate(M, privAttrs)
    const mech = S.buildMech(M, S.CKM_ML_DSA_KEY_PAIR_GEN)
    const pubPtr = M._malloc(4),
      privPtr = M._malloc(4)
    let pub: number, priv: number
    try {
      expect(
        M._C_GenerateKeyPair(
          session,
          mech,
          pubTpl.ptr,
          pubAttrs.length,
          privTpl.ptr,
          privAttrs.length,
          pubPtr,
          privPtr
        ) >>> 0
      ).toBe(0)
      pub = M.getValue(pubPtr, 'i32') >>> 0
      priv = M.getValue(privPtr, 'i32') >>> 0
    } finally {
      S.freeTemplate(M, pubTpl, pubAttrs.length)
      S.freeTemplate(M, privTpl, privAttrs.length)
      for (const p of [mech, pubPtr, privPtr]) M._free(p)
    }
    expect(S.hsm_verify(M, session, pub, 'before', S.hsm_sign(M, session, priv, 'before'))).toBe(
      true
    )
    const kek = S.hsm_generateAESKey(M, session, 256)
    const restore: S.AttrDef[] = [
      { type: S.CKA_CLASS, ulongVal: S.CKO_PRIVATE_KEY },
      { type: S.CKA_KEY_TYPE, ulongVal: S.CKK_ML_DSA },
      { type: S.CKA_PARAMETER_SET, ulongVal: 2 },
      { type: S.CKA_SIGN, boolVal: true },
      { type: S.CKA_SENSITIVE, boolVal: true },
      { type: S.CKA_EXTRACTABLE, boolVal: true },
    ]
    const outcomes: Record<string, string> = {}
    for (const mode of ['kwp', 'gcm']) {
      let stage = 'wrap'
      let wrappedLength = 0
      try {
        let handle: number
        if (mode === 'kwp') {
          const blob = S.hsm_wrapKeyMech(M, session, S.CKM_AES_KEY_WRAP_KWP, kek, priv)
          wrappedLength = blob.length
          stage = 'unwrap'
          handle = S.hsm_unwrapKeyMech(M, session, S.CKM_AES_KEY_WRAP_KWP, kek, blob, restore)
        } else {
          const result = S.hsm_aesGcmWrapKey(M, session, kek, priv, new Uint8Array(0))
          wrappedLength = result.wrapped.length
          stage = 'unwrap'
          handle = S.hsm_aesGcmUnwrapKey(M, session, kek, result.wrapped, result.iv, restore)
        }
        stage = 'sign with restored key'
        const signature = S.hsm_sign(M, session, handle, 'after')
        const valid = S.hsm_verify(M, session, pub, 'after', signature)
        console.info(
          JSON.stringify({ mode, wrappedLength, stage: 'verify with original public key', valid })
        )
        outcomes[mode] = valid
          ? 'restored key verifies with original public key'
          : 'signature invalid'
      } catch (error) {
        console.info(JSON.stringify({ mode, wrappedLength, stage, error: String(error) }))
        outcomes[mode] = `${stage}: ${String(error)}`
      }
    }
    expect(outcomes.kwp).toMatch(/unwrap:.*CKR_WRAPPED_KEY_INVALID/)
    expect(outcomes.gcm).toBe('restored key verifies with original public key')
  } finally {
    S.hsm_finalize(M, session)
  }
}, 30000)
