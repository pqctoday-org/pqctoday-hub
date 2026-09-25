// SPDX-License-Identifier: GPL-3.0-only
//
// RSA dedicated SigVer from the NIST ACVP-Server RSA-SigVer-FIPS186-5 sample
// (remediation plan 2026-09-24, WS-E), per engine: every case (1 valid + 5
// upstream modifications) of the groups PKCS#11 v3.2 can express —
// PKCS#1 v1.5 / SHA2-256 at 2048, 3072 and 4096 bits (CKM_SHA256_RSA_PKCS) and
// PSS / SHA3-256 / MGF1-SHA3-256 at 2048 bits (CKM_SHA3_256_RSA_PKCS_PSS,
// sLen = the upstream saltLen). Valid cases must return CKR_OK; invalid ones
// CKR_SIGNATURE_INVALID from C_Verify (the signature always has the modulus
// length). SHAKE-hash / SHAKE-mask PSS groups are skip rows. The older
// rsapss_test.json (section 3) keeps its independent-oracle label.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName, hsm_importRSAPublicKey, Pkcs11Error } from '@/wasm/softhsm'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  CKR_SIGNATURE_INVALID,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import {
  WSE_MECH,
  pPss,
  rawMech,
  runRow,
  skipRow,
  verifyRaw,
  type ClassicalSectionCtx,
  type RowOutcome,
} from './classicalRaw'

const CKM_SHA3_256_DIGEST = 0x2b0
const CKG_MGF1_SHA3_256 = 0x7

interface RsaCase {
  tcId: number
  testPassed: boolean
  reason: string
  message: string
  signature: string
}
interface RsaGroup {
  tgId: number
  sigType: 'pkcs1v1.5' | 'pss'
  modulo: number
  hashAlg: string
  maskFunction: string
  saltLen: number
  n: string
  e: string
  tests: RsaCase[]
}
interface RsaNotExecuted {
  tgId: number
  modulo: number
  sigType: string
  hashAlg: string
  maskFunction: string
  cases: number
}

export async function runRsaSigVerAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/rsa_sigver_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: RsaGroup[]
    notExecuted: RsaNotExecuted[]
  }
  const P = f._provenance
  for (const g of f.testGroups) {
    const pss = g.sigType === 'pss'
    const mech = pss ? WSE_MECH.CKM_SHA3_256_RSA_PKCS_PSS : WSE_MECH.CKM_SHA256_RSA_PKCS
    const mechName = pss ? 'CKM_SHA3_256_RSA_PKCS_PSS' : 'CKM_SHA256_RSA_PKCS'
    const why = unsupportedReason(mechs, mech, mechName)
    const bits = Number(g.modulo)
    const saltLen = Number(g.saltLen)
    for (const t of g.tests) {
      const valid = t.testPassed === true
      const id = `rsa-sigver-nist-${bits}-${g.sigType}-${g.hashAlg}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `RSA-${bits} ${pss ? 'PSS' : 'PKCS#1 v1.5'} (${eName})`
      const testCase = `SigVer · NIST RSA sigVer tg${g.tgId}/tc${t.tcId} · ${bits}-bit · ${g.sigType} · ${g.hashAlg}${pss ? ` · MGF1 · sLen ${saltLen}` : ''} · expect ${valid ? 'valid' : `invalid (${t.reason})`}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: `RSA-${bits}`,
        hashAlg: g.hashAlg,
        messageBytes: t.message.length / 2,
        parameters: { modulo: bits, sigType: g.sigType, maskFunction: g.maskFunction, saltLen },
        expected: valid ? 'valid' : 'invalid',
        expectedReason: t.reason,
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(P),
        exec: (): RowOutcome => {
          let pub = 0
          try {
            pub = hsm_importRSAPublicKey(M, h, hexToBytes(g.n), hexToBytes(g.e), false)
          } catch (e: unknown) {
            const o =
              e instanceof Pkcs11Error
                ? `C_CreateObject → ${rvName(e.rv)}`
                : e instanceof Error
                  ? e.message
                  : String(e)
            return {
              ok: false,
              observed: o,
              details: `${o} — refused before the signature was checked`,
            }
          }
          const m = rawMech(
            M,
            mech,
            pss ? pPss(M, CKM_SHA3_256_DIGEST, CKG_MGF1_SHA3_256, saltLen) : null
          )
          try {
            const r = verifyRaw(M, h, m, pub, hexToBytes(t.message), hexToBytes(t.signature))
            if (r.initRv !== CKR_OK) {
              const o = `C_VerifyInit → ${rvName(r.initRv)}`
              return { ok: false, observed: o, details: o }
            }
            const o = rvName(r.rv)
            const ok = valid ? r.rv === CKR_OK : r.rv === CKR_SIGNATURE_INVALID
            return {
              ok,
              observed: o,
              details: ok
                ? `C_Verify → ${o}${valid ? '' : ' (rejected)'}`
                : `C_Verify → ${o} — expected ${valid ? 'CKR_OK' : 'CKR_SIGNATURE_INVALID'}`,
            }
          } finally {
            m.free()
            destroy(M, h, pub)
          }
        },
      })
    }
  }
  for (const ne of f.notExecuted) {
    await skipRow(ctx, {
      id: `rsa-sigver-nist-skip-${ne.modulo}-${ne.hashAlg}-${ne.maskFunction}-tg${ne.tgId}-${eName}`,
      algorithm: `RSA-${ne.modulo} PSS (${eName})`,
      testCase: `SigVer · NIST RSA sigVer tg${ne.tgId} · ${ne.modulo}-bit · ${ne.sigType} · ${ne.hashAlg} · mask ${ne.maskFunction} · ${ne.cases} cases`,
      meta: {
        origin: 'not-executed',
        upstreamOperation: 'sigVer',
        localOperation: 'none',
        parameterSet: `RSA-${ne.modulo}`,
        hashAlg: ne.hashAlg,
        expected: 'not-run',
        tgId: ne.tgId,
        source: srcOf(P),
      },
      why: `PKCS#11 v3.2 has no RSA-PSS mechanism / CKG_MGF for ${ne.hashAlg} hashing with a ${ne.maskFunction} mask`,
    })
  }
}
