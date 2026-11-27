// SPDX-License-Identifier: AGPL-3.0-only
/**
 * ML-KEM ACVP category runner extracted from `useAcvpSuite.ts`.
 *
 * Preserves exact case ordering, IDs, caseMeta provenance, skip reasons, and
 * cryptographic verification across sections 7, 7b, 7b+, 7c, and 8 while leaving
 * session lifecycle, `runningRef` concurrency protection, and React state
 * batching in `useAcvpSuite`.
 */
import mlkemTestVectors from '@/data/acvp/mlkem_test.json'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  hsm_decapsulate,
  hsm_encapsulate,
  hsm_extractKeyValue,
  hsm_generateMLKEMKeyPair,
  hsm_importMLKEMPrivateKey,
  type Pkcs11LogEntry,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import type { HsmKey } from '../../HsmContext'
import { logByteComparison } from '../comparisonLog'
import type { AcvpCaseMeta, MldsaAcvpSectionCtx } from './mldsaAcvp'
import { runMlkemAcvpSection } from './mlkemAcvp'
import { runMlkemKeyCheckDepthSection } from './mlkemKeyCheckDepth'
import { runOptionalInputSection } from './optionalInputAcvp'
import { formatSessionTime } from '@/lib/format'

export interface MlkemCategoryRunnerCtx extends MldsaAcvpSectionCtx {
  engineId: HsmKey['engine']
  regKey: (key: Omit<HsmKey, 'generatedAt' | 'uniqueId' | 'slotId'>) => void
  addHsmLog: (entry: Pkcs11LogEntry) => void
  toHex: (bytes: Uint8Array, maxBytes?: number) => string
}

export async function runMlkemCategory(ctx: MlkemCategoryRunnerCtx): Promise<void> {
  const {
    M,
    hSession,
    eName,
    engineId,
    mechs,
    referenceUrl,
    pushResult,
    addLog,
    regKey,
    addHsmLog,
    toHex,
  } = ctx

  // ── 7. ML-KEM Decapsulation from upstream encapsulation AFT (FIPS 203) ──
  for (const group of mlkemTestVectors.testGroups) {
    const test = group.tests[0]
    const algo = group.parameterSet
    const variantNum = (parseInt(algo.split('-')[2]) || 768) as 512 | 768 | 1024
    const id7 = `test-${algo}-decap-${eName}`
    const testCase7 = `Decapsulate · upstream encapsulation AFT tg${group.tgId}/tc${test.tcId} → local decapsulation`
    const lineage7 =
      'NIST encapsulation-group output (dk, c, k) re-used as a decapsulation KAT; upstream m → c not executed ' +
      '(ACVP-Server@975de31e ML-KEM-encapDecap-FIPS203)'
    const caseMeta7: AcvpCaseMeta = {
      origin: 'nist-acvp-server',
      upstreamOperation: 'encapsulation',
      localOperation: 'decapsulation',
      parameterSet: algo,
      expected: 'byte-match',
      expectedRv: 'CKR_OK',
      tgId: group.tgId,
      tcId: test.tcId,
      source: {
        repo: 'https://github.com/usnistgov/ACVP-Server',
        commit: mlkemTestVectors._provenance.source_release,
        path: 'gen-val/json-files/ML-KEM-encapDecap-FIPS203/internalProjection.json',
        sha256: mlkemTestVectors._provenance.source_sha256,
      },
    }
    addLog(`[${eName}] Testing ${algo} Decapsulate KAT...`)
    addLog(
      `  ACVP SK: ${test.sk.slice(0, 32)}… | CT[${test.ct.length / 2}B]: ${test.ct.slice(0, 32)}…`
    )
    addLog(`  ACVP Expected SS: ${test.ss}`)

    try {
      const skBytes = hexToBytes(test.sk)
      const ctBytes = hexToBytes(test.ct)
      const expectedSsBytes = hexToBytes(test.ss)

      const privHandle = hsm_importMLKEMPrivateKey(M, hSession, variantNum, skBytes)
      regKey({
        handle: privHandle,
        family: 'ml-kem',
        role: 'private',
        label: `NIST sample ${algo} Private (${eName})`,
        variant: String(variantNum),
        engine: engineId,
      })

      const secretHandle = hsm_decapsulate(M, hSession, privHandle, ctBytes, variantNum)
      const recoveredSs = hsm_extractKeyValue(M, hSession, secretHandle)

      const matches =
        recoveredSs.length === expectedSsBytes.length &&
        // eslint-disable-next-line security/detect-object-injection
        recoveredSs.every((b: number, i: number) => b === expectedSsBytes[i])
      logByteComparison(addLog, `[${eName}] [id:${id7}]`, recoveredSs, test.ss, 'shared secret')

      if (matches) {
        const ssHex = toHex(recoveredSs)
        await pushResult({
          id: id7,
          algorithm: `${algo} (${eName})`,
          testCase: testCase7,
          caseMeta: caseMeta7,
          referenceUrl,
          status: 'pass',
          details: `SS[${recoveredSs.length}B]: ${ssHex} · ${lineage7}`,
        })
        addLog(`[${eName}] [id:${id7}] ${algo} Decapsulate: PASS | SS: ${ssHex}`)
      } else {
        const gotHex = Array.from(recoveredSs.slice(0, 16))
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
        const expHex = Array.from(expectedSsBytes.slice(0, 16))
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
        await pushResult({
          id: id7,
          algorithm: `${algo} (${eName})`,
          testCase: testCase7,
          caseMeta: caseMeta7,
          referenceUrl,
          status: 'fail',
          details: `SS mismatch: got ${gotHex}... expected ${expHex}... · ${lineage7}`,
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id7}] ${algo} Decapsulate: SS mismatch`)
        addHsmLog({
          id: Date.now(),
          timestamp: formatSessionTime(new Date()),
          fn: `[${eName}] C_DecapsulateKey(${algo})`,
          args: 'ACVP KAT Validation — SS MISMATCH',
          rvHex: '0x00000000',
          rvName: 'CKR_OK',
          ms: 0,
          ok: true,
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      await pushResult({
        id: `test-${algo}-err-${eName}`,
        algorithm: `${algo} (${eName})`,
        testCase: testCase7,
        caseMeta: caseMeta7,
        referenceUrl,
        status: 'fail',
        details: `${errorMessage} · ${lineage7}`,
      })
      addLog(`[DISCREPANCY] [${eName}] [id:${id7}] ${algo} Error: ${errorMessage}`)
      addHsmLog({
        id: Date.now(),
        timestamp: formatSessionTime(new Date()),
        fn: `[${eName}] C_DecapsulateKey(${algo})`,
        args: 'ACVP KAT Validation',
        rvHex: '0x00000005',
        rvName: `CKR_GENERAL_ERROR: ${errorMessage}`,
        ms: 0,
        ok: false,
      })
    }
  }

  // ── 7b. ML-KEM reference-sample depth ────────────────────────────────────
  await runMlkemAcvpSection({
    M,
    hSession,
    eName,
    mechs,
    referenceUrl,
    pushResult,
    addLog,
  })

  // ── 7b+. ML-KEM encapsulation AFT with optional NIST m input ─────────────
  await runOptionalInputSection(
    {
      M,
      hSession,
      eName,
      mechs,
      referenceUrl,
      pushResult,
      addLog,
    },
    'ml_kem'
  )

  // ── 7c. ML-KEM encapsulation-key check depth ─────────────────────────────
  await runMlkemKeyCheckDepthSection({
    M,
    hSession,
    eName,
    mechs,
    referenceUrl,
    pushResult,
    addLog,
  })

  // ── 8. ML-KEM Encap+Decap Round-Trip (FIPS 203) ──────────────────────────
  for (const kemVariant of [512, 768, 1024] as const) {
    const kemAlgo = `ML-KEM-${kemVariant}`
    const id8 = `mlkem-rt-${kemVariant}-${eName}`
    addLog(`[${eName}] Testing ${kemAlgo} Encap+Decap Round-Trip (FIPS 203)...`)
    try {
      const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, kemVariant)
      regKey({
        handle: pubHandle,
        family: 'ml-kem',
        role: 'public',
        label: `Round-trip ${kemAlgo} RT Public (${eName})`,
        variant: String(kemVariant),
        engine: engineId,
      })
      regKey({
        handle: privHandle,
        family: 'ml-kem',
        role: 'private',
        label: `Round-trip ${kemAlgo} RT Private (${eName})`,
        variant: String(kemVariant),
        engine: engineId,
      })
      const { ciphertextBytes, secretHandle: encapSecret } = hsm_encapsulate(
        M,
        hSession,
        pubHandle,
        kemVariant
      )
      const encapSs = hsm_extractKeyValue(M, hSession, encapSecret)
      const decapSecret = hsm_decapsulate(M, hSession, privHandle, ciphertextBytes, kemVariant)
      const decapSs = hsm_extractKeyValue(M, hSession, decapSecret)

      const ssMatch =
        encapSs.length === decapSs.length &&
        // eslint-disable-next-line security/detect-object-injection
        encapSs.every((b: number, i: number) => b === decapSs[i])

      if (ssMatch) {
        const ssHex = toHex(encapSs)
        await pushResult({
          id: id8,
          algorithm: `${kemAlgo} (${eName})`,
          testCase: 'Encap+Decap Round-Trip',
          referenceUrl,
          status: 'pass',
          details: `SS[${encapSs.length}B]: ${ssHex} | ct=${ciphertextBytes.length}B`,
        })
        addLog(`[${eName}] [id:${id8}] ${kemAlgo} Round-Trip: PASS | SS: ${ssHex}`)
      } else {
        await pushResult({
          id: id8,
          algorithm: `${kemAlgo} (${eName})`,
          testCase: 'Encap+Decap Round-Trip',
          referenceUrl,
          status: 'fail',
          details: `SS mismatch: encap=${toHex(encapSs, 8)}… decap=${toHex(decapSs, 8)}…`,
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id8}] ${kemAlgo} Round-Trip: SS mismatch`)
      }
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : String(e)
      await pushResult({
        id: `mlkem-rt-${kemVariant}-err-${eName}`,
        algorithm: `${kemAlgo} (${eName})`,
        testCase: 'Encap+Decap Round-Trip',
        referenceUrl,
        status: 'fail',
        details: errMessage,
      })
      addLog(`[DISCREPANCY] [${eName}] [id:${id8}] ${kemAlgo} Round-Trip: ${errMessage}`)
    }
  }
}

export type { SoftHSMModule }
