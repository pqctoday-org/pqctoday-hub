// SPDX-License-Identifier: GPL-3.0-only
//
// AES-CBC and AES-CTR from NIST ACVP-Server reference samples, plus
// product-authored CBC length / IV probes (remediation plan 2026-09-24, WS-E).
// Per engine:
//
//  - CBC AFT (AES-128/192/256, encrypt + decrypt): one GFSBox block and the
//    1-block / 10-block MMT cases — single-part C_Encrypt / C_Decrypt
//    (CKM_AES_CBC) byte-match;
//  - CBC MCT: the ACVP Monte Carlo inner loop (1000 chained blocks) as ONE
//    multi-part operation of single-block C_EncryptUpdate / C_DecryptUpdate
//    calls, compared with the FIRST of the 100 upstream outer iterations;
//  - CTR (RFC 3686 test mode, decrypt groups): C_Decrypt byte-match, then
//    C_Encrypt of the plaintext byte-match (CK_AES_CTR_PARAMS, 32-bit counter);
//  - product-authored CBC probes (not NIST): 15-byte plaintext, 17-byte
//    ciphertext and a 15-byte IV must be refused with the CK_RV pinned per
//    engine.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import { CKK_AES } from '@/wasm/softhsm/constants'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import { pinnedVerdict, type PinnedRv } from './pkcs11Raw'
import {
  WSE_MECH,
  cryptRv,
  eqHex,
  hexUp,
  importSecretRv,
  multipartRv,
  pBytes,
  pCtr,
  rawMech,
  runRow,
  skipRow,
  type ClassicalSectionCtx,
  type RowOutcome,
} from './classicalRaw'

/** Product-authored CBC refusals, pinned per engine. */
export const CBC_PROBE_PINS: Record<'encLen15' | 'decLen17' | 'iv15', PinnedRv> = {
  encLen15: {
    cpp: 'CKR_DATA_LEN_RANGE',
    rust: 'CKR_DATA_LEN_RANGE',
    listed: ['CKR_DATA_LEN_RANGE', 'CKR_DATA_INVALID'],
    section: '§5.8.2 (C_Encrypt)',
  },
  decLen17: {
    cpp: 'CKR_ENCRYPTED_DATA_LEN_RANGE',
    rust: 'CKR_ENCRYPTED_DATA_LEN_RANGE',
    listed: ['CKR_ENCRYPTED_DATA_LEN_RANGE', 'CKR_ENCRYPTED_DATA_INVALID'],
    section: '§5.10.2 (C_Decrypt)',
  },
  iv15: {
    cpp: 'CKR_MECHANISM_PARAM_INVALID',
    rust: 'CKR_MECHANISM_PARAM_INVALID',
    listed: ['CKR_MECHANISM_PARAM_INVALID'],
    section: '§5.8.1 (C_EncryptInit)',
  },
}

interface CbcCase {
  tcId: number
  key: string
  iv: string
  pt?: string
  ct?: string
  resultsArray?: { key: string; iv: string; pt: string; ct: string }[]
}
interface CbcGroup {
  tgId: number
  testType: 'AFT' | 'MCT'
  internalTestType?: string
  direction: 'encrypt' | 'decrypt'
  keyLen: number
  tests: CbcCase[]
}
interface CtrCase {
  tcId: number
  payloadLen: number
  key: string
  iv: string
  pt: string
  ct: string
}
interface CtrGroup {
  tgId: number
  keyLen: number
  tests: CtrCase[]
}
interface CtrNotExecuted {
  tgId: number
  keyLen: number
  cases: number
  why: string
}

/** ACVP AES-CBC MCT, outer iteration 0 (AESAVS §6.4): 1000 chained blocks. */
function cbcMct(
  step: (block: Uint8Array) => Uint8Array,
  iv: Uint8Array,
  first: Uint8Array
): Uint8Array {
  // encrypt: PT[0] given, PT[1] = IV, PT[j+1] = CT[j-1]; output CT[999].
  // decrypt: CT[0] given, CT[1] = IV, CT[j+1] = PT[j-1]; output PT[999].
  // The engine's own CBC chaining supplies the XOR with the previous block.
  let input = first
  let prev: Uint8Array = new Uint8Array(0)
  let out: Uint8Array = new Uint8Array(0)
  for (let j = 0; j < 1000; j++) {
    const o = step(input)
    input = j === 0 ? iv : prev
    prev = o
    out = o
  }
  return out
}

export async function runAesCbcCtrAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const [cbcMod, ctrMod] = await Promise.all([
    import('@/data/acvp/aescbc_acvp_test.json'),
    import('@/data/acvp/aesctr_acvp_test.json'),
  ])
  const cbc = cbcMod.default as unknown as { _provenance: Provenance; testGroups: CbcGroup[] }
  const ctr = ctrMod.default as unknown as {
    _provenance: Provenance
    testGroups: CtrGroup[]
    notExecuted: CtrNotExecuted[]
  }

  const withKey = (keyHex: string, fn: (k: number) => RowOutcome): RowOutcome => {
    const k = importSecretRv(M, h, CKK_AES, hexToBytes(keyHex), { encrypt: true, decrypt: true })
    if (k.rv !== CKR_OK) {
      const o = `C_CreateObject(AES key) → ${rvName(k.rv)}`
      return { ok: false, observed: o, details: o }
    }
    try {
      return fn(k.handle)
    } finally {
      destroy(M, h, k.handle)
    }
  }
  const compare = (out: Uint8Array, want: string, what: string): RowOutcome => {
    const ok = eqHex(out, want)
    return {
      ok,
      observed: ok ? 'byte-equal' : `${what} ${hexUp(out)}`,
      details: ok
        ? `${what}[${out.length}B] byte-equal to NIST expected`
        : `${what} mismatch: got ${hexUp(out)}, expected ${want}`,
    }
  }

  // ── CBC AFT + MCT ──────────────────────────────────────────────────────
  const P = cbc._provenance
  const cbcWhy = unsupportedReason(mechs, WSE_MECH.CKM_AES_CBC, 'CKM_AES_CBC')
  for (const g of cbc.testGroups) {
    for (const t of g.tests) {
      const mct = g.testType === 'MCT'
      const enc = g.direction === 'encrypt'
      const id = `aescbc-${mct ? 'mct' : 'nist'}-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `AES-${g.keyLen}-CBC (${eName})`
      const blocks = mct ? 1000 : (t.pt ?? '').length / 32
      const testCase = mct
        ? `${enc ? 'Encrypt' : 'Decrypt'} MCT · NIST AES-CBC tg${g.tgId}/tc${t.tcId} · outer iteration 0 of 100 (1000 chained single-block C_${enc ? 'Encrypt' : 'Decrypt'}Update) · expect byte-match`
        : `${enc ? 'Encrypt' : 'Decrypt'} · NIST AES-CBC tg${g.tgId}/tc${t.tcId} · ${g.internalTestType} · ${blocks} block(s) · expect byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: g.direction,
        localOperation: g.direction,
        parameterSet: `AES-${g.keyLen}`,
        parameters: {
          keyLen: g.keyLen,
          testType: g.testType,
          ...(mct ? { outerIterationsChecked: 1 } : { blocks }),
        },
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (cbcWhy) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why: cbcWhy })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(P),
        exec: () =>
          withKey(t.key, (k) => {
            const m = rawMech(M, WSE_MECH.CKM_AES_CBC, pBytes(M, hexToBytes(t.iv)))
            try {
              if (!mct) {
                const r = cryptRv(M, h, g.direction, m, k, hexToBytes(enc ? t.pt! : t.ct!))
                if (!r.out) {
                  const o = `${r.step} → ${rvName(r.rv)}`
                  return { ok: false, observed: o, details: o }
                }
                return compare(r.out, enc ? t.ct! : t.pt!, enc ? 'ct' : 'pt')
              }
              const op = multipartRv(M, h, g.direction, m, k)
              if (op.initRv !== CKR_OK) {
                const o = `C_${enc ? 'Encrypt' : 'Decrypt'}Init → ${rvName(op.initRv)}`
                return { ok: false, observed: o, details: o }
              }
              let fail: string | null = null
              const out = cbcMct(
                (b) => {
                  const r = op.update(b)
                  if (!r.out || r.out.length !== 16) {
                    fail = r.out
                      ? `${r.step} returned ${r.out.length} bytes for one block`
                      : `${r.step} → ${rvName(r.rv)}`
                    throw new Error(fail)
                  }
                  return r.out
                },
                hexToBytes(t.iv),
                hexToBytes(enc ? t.pt! : t.ct!)
              )
              op.final()
              const want = enc ? t.resultsArray![0].ct : t.resultsArray![0].pt
              const res = compare(out, want, enc ? 'CT[999]' : 'PT[999]')
              return { ...res, details: `${res.details} (MCT outer iteration 0)` }
            } catch (e: unknown) {
              const o = e instanceof Error ? e.message : String(e)
              return { ok: false, observed: o, details: o }
            } finally {
              m.free()
            }
          }),
      })
    }
  }

  // ── CBC product-authored length / IV probes ────────────────────────────
  const base = cbc.testGroups.find((g) => g.testType === 'AFT')!.tests[0]
  if (!cbcWhy) {
    const probes = [
      {
        key: 'encLen15' as const,
        testCase:
          'Invalid length · product-authored probe · C_Encrypt(CKM_AES_CBC) of 15 bytes (not a block multiple) · expect refusal',
        run: (k: number) => {
          const m = rawMech(M, WSE_MECH.CKM_AES_CBC, pBytes(M, hexToBytes(base.iv)))
          try {
            return cryptRv(M, h, 'encrypt', m, k, new Uint8Array(15))
          } finally {
            m.free()
          }
        },
      },
      {
        key: 'decLen17' as const,
        testCase:
          'Invalid length · product-authored probe · C_Decrypt(CKM_AES_CBC) of 17 bytes (not a block multiple) · expect refusal',
        run: (k: number) => {
          const m = rawMech(M, WSE_MECH.CKM_AES_CBC, pBytes(M, hexToBytes(base.iv)))
          try {
            return cryptRv(M, h, 'decrypt', m, k, new Uint8Array(17))
          } finally {
            m.free()
          }
        },
      },
      {
        key: 'iv15' as const,
        testCase:
          'Invalid IV · product-authored probe · C_EncryptInit(CKM_AES_CBC) with a 15-byte IV · expect refusal at init',
        run: (k: number) => {
          const m = rawMech(M, WSE_MECH.CKM_AES_CBC, pBytes(M, new Uint8Array(15)))
          try {
            return cryptRv(M, h, 'encrypt', m, k, new Uint8Array(16))
          } finally {
            m.free()
          }
        },
      },
    ]
    for (const p of probes) {
      const pin = CBC_PROBE_PINS[p.key]
      await runRow(ctx, {
        id: `aescbc-probe-${p.key}-${eName}`,
        algorithm: `AES-128-CBC (${eName})`,
        testCase: p.testCase,
        meta: {
          origin: 'product-authored-probe',
          upstreamOperation: 'none',
          localOperation: p.key === 'decLen17' ? 'decrypt' : 'encrypt',
          parameterSet: 'AES-128',
          parameters: { probe: p.key },
          expected: 'return-code',
          expectedRv: eName === 'C++' ? pin.cpp : pin.rust,
          source: srcOf(P),
        },
        source:
          'key from the first aescbc_acvp_test case · PQC Today-authored probe, not a NIST vector',
        exec: () =>
          withKey(base.key, (k) => {
            const r = p.run(k)
            if (r.out) {
              const o = `CKR_OK (${r.out.length} bytes output)`
              return { ok: false, observed: o, details: `${o} — expected a refusal` }
            }
            const observed = rvName(r.rv)
            const v = pinnedVerdict(pin, eName, observed)
            const initOk = p.key !== 'iv15' || r.step === 'C_EncryptInit'
            return {
              ok: v.ok && initOk,
              observed,
              details: `refused at ${r.step} · ${v.details}${initOk ? '' : ' · NOT refused at C_EncryptInit'}`,
            }
          }),
      })
    }
  }

  // ── CTR (RFC 3686 test mode, decrypt groups) ───────────────────────────
  const Q = ctr._provenance
  const ctrWhy = unsupportedReason(mechs, WSE_MECH.CKM_AES_CTR, 'CKM_AES_CTR')
  for (const g of ctr.testGroups) {
    for (const t of g.tests) {
      const id = `aesctr-nist-k${g.keyLen}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `AES-${g.keyLen}-CTR (${eName})`
      const testCase = `Decrypt + encrypt · NIST AES-CTR tg${g.tgId}/tc${t.tcId} · RFC 3686 counter (32 bits) · payload ${t.payloadLen / 8}B · expect byte-match both ways`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'decrypt',
        localOperation: 'decrypt',
        parameterSet: `AES-${g.keyLen}`,
        parameters: { keyLen: g.keyLen, payloadLen: t.payloadLen, counterBits: 32 },
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(Q),
      }
      if (ctrWhy) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why: ctrWhy })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(Q),
        exec: () =>
          withKey(t.key, (k) => {
            const once = (op: 'encrypt' | 'decrypt', data: string) => {
              const m = rawMech(M, WSE_MECH.CKM_AES_CTR, pCtr(M, 32, hexToBytes(t.iv)))
              try {
                return cryptRv(M, h, op, m, k, hexToBytes(data))
              } finally {
                m.free()
              }
            }
            const d = once('decrypt', t.ct)
            if (!d.out) {
              const o = `${d.step} → ${rvName(d.rv)}`
              return { ok: false, observed: o, details: o }
            }
            if (!eqHex(d.out, t.pt)) return compare(d.out, t.pt, 'pt')
            const e = once('encrypt', t.pt)
            if (!e.out) {
              const o = `decrypt byte-equal; ${e.step} → ${rvName(e.rv)}`
              return { ok: false, observed: o, details: o }
            }
            const r = compare(e.out, t.ct, 'ct')
            return r.ok
              ? { ...r, details: `pt and ct [${e.out.length}B] byte-equal to NIST expected` }
              : r
          }),
      })
    }
  }
  for (const ne of ctr.notExecuted) {
    await skipRow(ctx, {
      id: `aesctr-nist-skip-encrypt-k${ne.keyLen}-tg${ne.tgId}-${eName}`,
      algorithm: `AES-${ne.keyLen}-CTR (${eName})`,
      testCase: `Encrypt · NIST AES-CTR tg${ne.tgId} · ${ne.cases} cases`,
      meta: {
        origin: 'not-executed',
        upstreamOperation: 'encrypt',
        localOperation: 'none',
        parameterSet: `AES-${ne.keyLen}`,
        expected: 'not-run',
        tgId: ne.tgId,
        source: srcOf(Q),
      },
      why: 'the upstream encrypt groups let the implementation choose the IV (ivGenMode internal, deferred) — the upstream ciphertext is not an expected value for a caller-supplied counter block',
    })
  }
}
