// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import * as S from './softhsm'
import {
  decodeProtectedBackup,
  encodeProtectedBackup,
  loadProtectedBackupBindings,
} from './protectedBackup'

it('recovers protected Seed/Expanded PQC keys with correct private/public types and unreadable private values', async () => {
  const M = await S.getSoftHSMRustModule()
  S.hsm_initialize(M)
  const bindings = await loadProtectedBackupBindings()
  bindings.pqctodaySelectEducationalReplicationProfile()
  const lab = new bindings.ProtectedBackupLab('demo-so-pin', 'demo-user-pin')
  try {
    for (const algorithm of [0, 1]) {
      const original = lab.generate(algorithm)
      try {
        for (const seed of [true, false]) {
          const pkg = decodeProtectedBackup(
            encodeProtectedBackup(lab.backup(original.private_handle, seed))
          )
          const restored = lab.recover(pkg)
          try {
            const attributes = S.hsm_getKeyAttributes(
              M,
              restored.session_handle,
              restored.private_handle
            )
            expect(attributes.ckClass).toBe(S.CKO_PRIVATE_KEY)
            expect(attributes.ckKeyType).toBe(algorithm === 0 ? S.CKK_ML_KEM : S.CKK_ML_DSA)
            expect(attributes.ckSensitive).toBe(true)
            expect(attributes.ckExtractable).toBe(false)
            const publicAttributes = S.hsm_getKeyAttributes(
              M,
              restored.session_handle,
              restored.public_handle
            )
            expect(publicAttributes.ckClass).toBe(S.CKO_PUBLIC_KEY)
            expect(publicAttributes.ckKeyType).toBe(attributes.ckKeyType)
            expect(restored.receipt.length).toBeGreaterThan(0)
            // Query lengths only. A private value or retained seed must never
            // become readable through this browser interface.
            for (const attr of [S.CKA_VALUE, ...(seed ? [S.CKA_SEED] : [])]) {
              const template = S.buildTemplate(M, [{ type: attr }])
              try {
                expect(
                  M._C_GetAttributeValue(
                    restored.session_handle,
                    restored.private_handle,
                    template.ptr,
                    1
                  ) >>> 0
                ).toBe(0x11)
                expect(M.getValue(template.ptr + 8, 'i32') >>> 0).toBe(0xffffffff)
              } finally {
                S.freeTemplate(M, template, 1)
              }
            }
          } finally {
            restored.free()
          }
        }
      } finally {
        original.free()
      }
    }
  } finally {
    lab.free()
    M._C_Finalize(0)
  }
}, 60000)
