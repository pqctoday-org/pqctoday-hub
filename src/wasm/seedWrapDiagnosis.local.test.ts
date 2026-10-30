// SPDX-License-Identifier: AGPL-3.0-only
// Legacy-file diagnostic: reproduces the retired prefix extraction and
// AES restore bug. These files cannot prove original-key recovery.
import { it, expect } from 'vitest'
import * as S from './softhsm'

it('documents why legacy prefix-based Seed backups do not recover the original key', async () => {
  const M = (await S.getSoftHSMRustModule()) as S.SoftHSMModule
  S.hsm_initialize(M)
  const slot = S.hsm_initToken(M, S.hsm_getFirstFreeSlot(M), '1234', 'seed-diagnostic')
  const session = S.hsm_openUserSession(M, slot, '1234', '1234')
  const kek = S.hsm_generateAESKey(M, session, 256)
  try {
    for (const family of ['ml-kem', 'ml-dsa'] as const) {
      const pair =
        family === 'ml-kem'
          ? S.hsm_generateMLKEMKeyPair(M, session, 768, true)
          : S.hsm_generateMLDSAKeyPair(M, session, 65, true)
      const originalPublic = S.hsm_extractKeyValue(M, session, pair.pubHandle)
      const expanded = S.hsm_extractKeyValue(M, session, pair.privHandle)
      const candidate = expanded.slice(0, family === 'ml-kem' ? 64 : 32)
      const seedAttr = M._malloc(12)
      M.setValue(seedAttr, S.CKA_SEED, 'i32')
      M.setValue(seedAttr + 4, 0, 'i32')
      M.setValue(seedAttr + 8, 0, 'i32')
      expect(M._C_GetAttributeValue(session, pair.privHandle, seedAttr, 1) >>> 0).toBe(0)
      const seedSize = M.getValue(seedAttr + 8, 'i32') >>> 0
      const actualPtr = M._malloc(seedSize)
      M.setValue(seedAttr + 4, actualPtr, 'i32')
      expect(M._C_GetAttributeValue(session, pair.privHandle, seedAttr, 1) >>> 0).toBe(0)
      const actualSeed = M.HEAPU8.slice(actualPtr, actualPtr + seedSize)
      M._free(actualPtr)
      M._free(seedAttr)
      expect(actualSeed.length).toBe(candidate.length)
      expect(actualSeed).not.toEqual(candidate)
      const target = S.hsm_importGenericSecret(M, session, candidate)
      const wrapped = S.hsm_wrapKeyMech(M, session, S.CKM_AES_KEY_WRAP_KWP, kek, target)
      // Legacy AES-256 restore template, including omitted CKA_SENSITIVE.
      const panelTemplate: S.AttrDef[] = [
        { type: S.CKA_CLASS, ulongVal: S.CKO_SECRET_KEY },
        { type: S.CKA_KEY_TYPE, ulongVal: S.CKK_AES },
        { type: S.CKA_TOKEN, boolVal: false },
        { type: S.CKA_EXTRACTABLE, boolVal: true },
        { type: S.CKA_VALUE_LEN, ulongVal: 32 },
      ]
      let panelOutcome: string
      try {
        const restored = S.hsm_unwrapKeyMech(
          M,
          session,
          S.CKM_AES_KEY_WRAP_KWP,
          kek,
          wrapped,
          panelTemplate
        )
        const attrs = S.hsm_getKeyAttributes(M, session, restored)
        panelOutcome = `success; keyType=${attrs.ckKeyType}`
      } catch (error) {
        panelOutcome = String(error)
      }

      // Separate diagnostic, NOT the panel path: recover bytes as generic secret
      // and try them as CKA_SEED to test the prefix-is-seed assumption.
      const genericTemplate: S.AttrDef[] = [
        { type: S.CKA_CLASS, ulongVal: S.CKO_SECRET_KEY },
        { type: S.CKA_KEY_TYPE, ulongVal: S.CKK_GENERIC_SECRET },
        { type: S.CKA_TOKEN, boolVal: false },
        { type: S.CKA_EXTRACTABLE, boolVal: true },
        { type: S.CKA_SENSITIVE, boolVal: false },
      ]
      for (const useActualSeed of [false, true]) {
        const diagnosticWrapped = useActualSeed
          ? S.hsm_wrapKeyMech(
              M,
              session,
              S.CKM_AES_KEY_WRAP_KWP,
              kek,
              S.hsm_importGenericSecret(M, session, actualSeed)
            )
          : wrapped
        const recovered = S.hsm_unwrapKeyMech(
          M,
          session,
          S.CKM_AES_KEY_WRAP_KWP,
          kek,
          diagnosticWrapped,
          genericTemplate
        )
        const bytes = S.hsm_extractKeyValue(M, session, recovered)
        expect(bytes).toEqual(useActualSeed ? actualSeed : candidate)
        const seedPtr = S.writeBytes(M, bytes)
        const pubAttrs: S.AttrDef[] = [
          { type: S.CKA_PARAMETER_SET, ulongVal: 2 },
          { type: family === 'ml-kem' ? S.CKA_ENCAPSULATE : S.CKA_VERIFY, boolVal: true },
        ]
        const privAttrs: S.AttrDef[] = [
          { type: S.CKA_PARAMETER_SET, ulongVal: 2 },
          { type: S.CKA_SEED, bytesPtr: seedPtr, bytesLen: bytes.length },
          { type: S.CKA_SENSITIVE, boolVal: false },
          { type: S.CKA_EXTRACTABLE, boolVal: true },
          { type: family === 'ml-kem' ? S.CKA_DECAPSULATE : S.CKA_SIGN, boolVal: true },
        ]
        const pubTpl = S.buildTemplate(M, pubAttrs)
        const privTpl = S.buildTemplate(M, privAttrs)
        const mech = S.buildMech(
          M,
          family === 'ml-kem' ? S.CKM_ML_KEM_KEY_PAIR_GEN : S.CKM_ML_DSA_KEY_PAIR_GEN
        )
        const pub = M._malloc(4),
          priv = M._malloc(4)
        try {
          const rv =
            M._C_GenerateKeyPair(
              session,
              mech,
              pubTpl.ptr,
              pubAttrs.length,
              privTpl.ptr,
              privAttrs.length,
              pub,
              priv
            ) >>> 0
          expect(rv).toBe(0)
          const regeneratedPublic = S.hsm_extractKeyValue(M, session, M.getValue(pub, 'i32') >>> 0)
          const samePublic =
            originalPublic.length === regeneratedPublic.length &&
            originalPublic.every((b, i) => b === regeneratedPublic[i])
          console.info(
            JSON.stringify({
              family,
              expandedBytes: expanded.length,
              candidateBytes: candidate.length,
              wrappedBytes: wrapped.length,
              panelOutcome,
              seedSource: useActualSeed ? 'CKA_SEED' : 'CKA_VALUE prefix',
              genericUnwrapMatchesInput: true,
              regeneratedPublicMatchesOriginal: samePublic,
            })
          )
          expect(samePublic).toBe(useActualSeed)
        } finally {
          S.freeTemplate(M, pubTpl, pubAttrs.length)
          S.freeTemplate(M, privTpl, privAttrs.length)
          for (const p of [seedPtr, mech, pub, priv]) M._free(p)
        }
      }
    }
  } finally {
    S.hsm_finalize(M, session)
  }
}, 30000)
