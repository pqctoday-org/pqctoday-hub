// SPDX-License-Identifier: GPL-3.0-only
//
// ML-KEM encapsulation-key check depth (gap-closure plan 2026-09-25, P5 item
// 3). Section 7b (mlkemAcvp.ts) carries ONE invalid NIST encapsulation key per
// parameter set, so the encapsulate cells' negative column is "sampled". This
// section runs every remaining testPassed=false case of the upstream
// encapsulationKeyCheck groups (FIPS 203 §7.2 modulus check): the key must be
// rejected at C_CreateObject or at C_EncapsulateKey (any error, no ciphertext).
// The ML-KEM inputs have fixed lengths, so the capability map declares no
// length boundary for these cells; the wrong-length probes of section 7b are
// state-error cases, not boundary cases.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import { CKM_ML_KEM } from '@/wasm/softhsm/constants'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type MldsaAcvpSectionCtx,
  type Provenance,
} from './mldsaAcvp'
import { CT_LEN, encapsulateRv, importPublic, type Variant } from './mlkemAcvp'

interface EkCase {
  tcId: number
  testPassed: boolean
  reason: string
  ek: string
}
interface EkGroup {
  tgId: number
  parameterSet: string
  tests: EkCase[]
}

const variantOf = (ps: string) => parseInt(ps.split('-')[2], 10) as Variant

/** Run the ML-KEM encapsulation-key check depth rows for ONE engine. */
export async function runMlkemKeyCheckDepthSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const mod = await import('@/data/acvp/mlkem_ekcheck_depth_test.json')
  const f = mod.default as unknown as { _provenance: Provenance; testGroups: EkGroup[] }
  const P = f._provenance
  const why = unsupportedReason(mechs, CKM_ML_KEM, 'CKM_ML_KEM')
  for (const g of f.testGroups) {
    const ps = g.parameterSet
    const v = variantOf(ps)
    const algorithm = `${ps} (${eName})`
    for (const t of g.tests) {
      const expectAccept = t.testPassed === true
      const id = `mlkem-ekcheck-depth-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase = `Encapsulation-key check (FIPS 203 §7.2) · NIST VAL tg${g.tgId}/tc${t.tcId} · ${t.reason} · expect ${expectAccept ? 'accepted' : 'rejected'}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'encapsulationKeyCheck',
        localOperation: 'encapsulation',
        parameterSet: ps,
        expected: expectAccept ? 'accepted' : 'rejected',
        expectedReason: t.reason,
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why) {
        addLog(`[${eName}] [SKIP] ${algorithm} ${testCase}: ${why}`)
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: 'skip',
          details: `Skipped — ${why}`,
          caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
        })
        continue
      }
      let key = 0
      let sec = 0
      try {
        const imp = importPublic(M, hSession, v, hexToBytes(t.ek))
        key = imp.handle
        let observed = `C_CreateObject → ${rvName(imp.rv)}`
        let accepted = false
        if (imp.rv === CKR_OK) {
          const r = encapsulateRv(M, hSession, key, CT_LEN[v]) // eslint-disable-line security/detect-object-injection
          sec = r.handle
          observed += `; C_EncapsulateKey → ${rvName(r.rv)}`
          accepted = r.rv === CKR_OK
        }
        const ok = accepted === expectAccept
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details:
            observed +
            (ok
              ? ''
              : expectAccept
                ? ' — REJECTED a key NIST marks valid'
                : ` — ACCEPTED a key NIST marks invalid (${t.reason}); FIPS 203 §7.2 modulus check not enforced`) +
            ` · ${srcTag(P)}`,
          caseMeta: { ...meta, observed },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: 'fail',
          details: `${msg} · ${srcTag(P)}`,
          caseMeta: { ...meta, observed: msg },
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
      } finally {
        destroy(M, hSession, sec)
        destroy(M, hSession, key)
      }
    }
  }
}
