// SPDX-License-Identifier: GPL-3.0-only
//
// Full 100-iteration Monte Carlo Tests (gap-closure plan 2026-09-25, P5 item 2 —
// WS-E remainder). Sections 10f (shaAcvp.ts) and 12b (aesCbcCtrAcvp.ts) check
// only the first of the 100 upstream outer iterations. Here, per engine:
//
//  - SHA MCT, every SHA-2 / SHA-3 digest both engines list: the standard
//    version (SHA-2: MSG = A‖B‖C; SHA-3: MD = SHA3(MD)) and the alternate
//    version the SHA2-256/512/512-256 samples register (A‖B‖C truncated or
//    zero-padded to the seed length), 100 outer × 1000 C_Digest, each of the
//    100 outer results byte-compared (sha_mct_full_test.json).
//  - AES-CBC MCT (AESAVS §6.4), 128/192/256 encrypt and decrypt: per outer
//    iteration a fresh key object and C_*Init(IV), 1000 chained single-block
//    C_*Update in one multi-part operation, the last output byte-compared, and
//    the next key / IV / input derived from the engine outputs
//    (aescbc_mct_full_test.json).
//
// Runtime measured 2026-09-25 (WebAssembly in Node.js): the whole section takes
// well under 30 s per engine (≈1.5 µs per C_Digest on C++, ≈3 µs on Rust).
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import {
  WSE_CK,
  WSE_MECH,
  digestRv,
  eqHex,
  hexUp,
  importSecretRv,
  multipartRv,
  pBytes,
  rawMech,
  runRow,
  skipRow,
  type ClassicalSectionCtx,
  type RowOutcome,
} from './classicalRaw'

const DIGEST: Readonly<Record<string, keyof typeof WSE_MECH>> = {
  'SHA2-224': 'CKM_SHA224',
  'SHA2-256': 'CKM_SHA256',
  'SHA2-384': 'CKM_SHA384',
  'SHA2-512': 'CKM_SHA512',
  'SHA2-512/224': 'CKM_SHA512_224',
  'SHA2-512/256': 'CKM_SHA512_256',
  'SHA3-224': 'CKM_SHA3_224',
  'SHA3-256': 'CKM_SHA3_256',
  'SHA3-384': 'CKM_SHA3_384',
  'SHA3-512': 'CKM_SHA3_512',
}

/** One ACVP SHA MCT outer iteration (1000 inner digests) → the new seed / output. */
export function shaMctOuter(
  digest: (m: Uint8Array) => Uint8Array,
  seed: Uint8Array,
  kind: 'sha3' | 'standard' | 'alternate',
  seedLen: number
): Uint8Array {
  if (kind === 'sha3') {
    let md = seed
    for (let i = 0; i < 1000; i++) md = digest(md)
    return md
  }
  let a = seed
  let b = seed
  let c = seed
  for (let i = 0; i < 1000; i++) {
    let m = new Uint8Array(a.length + b.length + c.length)
    m.set(a)
    m.set(b, a.length)
    m.set(c, a.length + b.length)
    if (kind === 'alternate') {
      if (m.length >= seedLen) m = m.slice(0, seedLen)
      else {
        const p = new Uint8Array(seedLen)
        p.set(m)
        m = p
      }
    }
    a = b
    b = c
    c = digest(m)
  }
  return c
}

const xor = (a: Uint8Array, b: Uint8Array) => a.map((x, i) => x ^ b[i]) // eslint-disable-line security/detect-object-injection

/**
 * Yield the main thread between MCT outer iterations.
 *
 * Why this exists (2026-09-25 browser-crash fix): each of these rows is
 * 100 outer × 1000 inner WASM calls, and every inner call allocates (a
 * CK_MECHANISM, three `_malloc`s and a `HEAPU8.slice()` output, ~3 KB of JS
 * garbage in total). Run as one uninterrupted synchronous block that is
 * ~1 000 000 allocations for the SHA section alone: measured in Chromium the
 * heap climbed 198 → 1692 → 3217 MB in three seconds and the renderer was
 * killed ("Page crashed") before the section's third row — V8 never gets a
 * chance to complete a major GC inside a single macrotask, so nothing is ever
 * reclaimed. A `setTimeout(0)` per outer iteration hands control back, the
 * garbage from the preceding 1000 calls is collected, and the heap stays flat.
 * It also lets the streamed progress label paint during a long row.
 *
 * Do NOT replace this with `await Promise.resolve()` — a microtask does not
 * leave the current macrotask and does not let V8 run a full GC cycle.
 */
const yieldToGc = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

interface ShaGroup {
  tgId: number
  mctVersion: 'standard' | 'alternate'
  hashAlg: string
  source_path: string
  source_sha256: string
  tests: { tcId: number; msg: string; resultsArray: { md: string }[] }[]
}
interface CbcResult {
  key: string
  iv: string
  pt: string
  ct: string
}
interface CbcGroup {
  tgId: number
  direction: 'encrypt' | 'decrypt'
  keyLen: number
  tests: {
    tcId: number
    key: string
    iv: string
    pt?: string
    ct?: string
    resultsArray: CbcResult[]
  }[]
}

export async function runShaMctFullSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/sha_mct_full_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: ShaGroup[]
  }
  for (const g of f.testGroups) {
    const P: Provenance = {
      ...f._provenance,
      source_path: g.source_path,
      source_sha256: g.source_sha256,
    }
    const mechName = DIGEST[g.hashAlg]
    const mech = mechName ? WSE_MECH[mechName] : undefined // eslint-disable-line security/detect-object-injection
    const why = unsupportedReason(mechs, mech, mechName ?? g.hashAlg)
    const slug = g.hashAlg.toLowerCase().replace('/', '-')
    for (const t of g.tests) {
      const id = `sha-mct-full-${slug}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `${g.hashAlg} (${eName})`
      const n = t.resultsArray.length
      const testCase = `Digest MCT · NIST ${g.hashAlg} tg${g.tgId}/tc${t.tcId} · ${g.mctVersion} version · all ${n} outer iterations (${n} × 1000 chained C_Digest) · expect byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'digest',
        localOperation: 'digest',
        parameterSet: g.hashAlg,
        hashAlg: g.hashAlg,
        messageBytes: t.msg.length / 2,
        parameters: { mctVersion: g.mctVersion, outerIterationsChecked: n },
        expected: 'byte-match',
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
        exec: async (): Promise<RowOutcome> => {
          const digest = (m: Uint8Array) => {
            const r = digestRv(M, h, mech!, m)
            if (!r.out) throw new Error(`${r.step} → ${rvName(r.rv)}`)
            return r.out
          }
          const seed0 = hexToBytes(t.msg)
          const kind = g.hashAlg.startsWith('SHA3') ? 'sha3' : g.mctVersion
          let seed = seed0
          for (let j = 0; j < n; j++) {
            // One outer iteration = 1000 C_Digest calls; yield before each so
            // the preceding iteration's garbage is collectable (see yieldToGc).
            await yieldToGc()
            const md = shaMctOuter(digest, seed, kind, seed0.length)
            if (!eqHex(md, t.resultsArray[j].md))
              return {
                ok: false,
                observed: `outer ${j}: md ${hexUp(md)}`,
                details: `outer iteration ${j} of ${n} differs from NIST (expected ${t.resultsArray[j].md})`, // eslint-disable-line security/detect-object-injection
              }
            seed = md
          }
          return {
            ok: true,
            observed: 'byte-equal',
            details: `all ${n} outer results byte-equal to NIST (${g.mctVersion} MCT)`,
          }
        },
      })
    }
  }
}

export async function runAesCbcMctFullSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/aescbc_mct_full_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: CbcGroup[]
  }
  const P = f._provenance
  const why = unsupportedReason(mechs, WSE_MECH.CKM_AES_CBC, 'CKM_AES_CBC')
  for (const g of f.testGroups) {
    const enc = g.direction === 'encrypt'
    for (const t of g.tests) {
      const n = t.resultsArray.length
      const id = `aescbc-mct-full-k${g.keyLen}-${g.direction}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `AES-${g.keyLen}-CBC (${eName})`
      const testCase = `${enc ? 'Encrypt' : 'Decrypt'} MCT · NIST AES-CBC tg${g.tgId}/tc${t.tcId} · all ${n} outer iterations (AESAVS §6.4, ${n} × 1000 chained single-block C_${enc ? 'Encrypt' : 'Decrypt'}Update) · expect byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: g.direction,
        localOperation: g.direction,
        parameterSet: `AES-${g.keyLen}`,
        parameters: { keyLen: g.keyLen, testType: 'MCT', outerIterationsChecked: n },
        expected: 'byte-match',
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
        exec: async (): Promise<RowOutcome> => {
          let key = hexToBytes(t.key)
          let iv = hexToBytes(t.iv)
          let input = hexToBytes(enc ? t.pt! : t.ct!)
          for (let j = 0; j < n; j++) {
            // 1000 chained C_*Update calls per outer iteration — same reason as
            // the SHA MCT above (see yieldToGc).
            await yieldToGc()
            const k = importSecretRv(M, h, WSE_CK.CKK_AES, key, { encrypt: true, decrypt: true })
            if (k.rv !== CKR_OK) {
              const o = `outer ${j}: C_CreateObject(AES key) → ${rvName(k.rv)}`
              return { ok: false, observed: o, details: o }
            }
            const m = rawMech(M, WSE_MECH.CKM_AES_CBC, pBytes(M, iv))
            const outs: Uint8Array[] = []
            try {
              const op = multipartRv(M, h, g.direction, m, k.handle)
              if (op.initRv !== CKR_OK) {
                const o = `outer ${j}: C_${enc ? 'Encrypt' : 'Decrypt'}Init → ${rvName(op.initRv)}`
                return { ok: false, observed: o, details: o }
              }
              // AESAVS §6.4: input[0] given, input[1] = IV, input[i+1] = output[i-1];
              // the engine's CBC chaining supplies the XOR with the previous block.
              let x = input
              for (let i = 0; i < 1000; i++) {
                const r = op.update(x)
                if (!r.out || r.out.length !== 16) {
                  const o = `outer ${j} inner ${i}: ${r.out ? `${r.step} returned ${r.out.length} bytes` : `${r.step} → ${rvName(r.rv)}`}`
                  return { ok: false, observed: o, details: o }
                }
                outs.push(r.out)
                x = i === 0 ? iv : outs[i - 1]
              }
              op.final()
            } finally {
              m.free()
              destroy(M, h, k.handle)
            }
            const last = outs[999]
            const want = enc ? t.resultsArray[j].ct : t.resultsArray[j].pt // eslint-disable-line security/detect-object-injection
            if (!eqHex(last, want))
              return {
                ok: false,
                observed: `outer ${j}: ${hexUp(last)}`,
                details: `outer iteration ${j} of ${n}: ${enc ? 'CT' : 'PT'}[999] differs from NIST (expected ${want})`,
              }
            // Next outer iteration (AESAVS §6.4): key ^= last key-length bits of the outputs.
            const tail =
              key.length === 16
                ? outs[999]
                : key.length === 24
                  ? new Uint8Array([...outs[998].slice(8), ...outs[999]])
                  : new Uint8Array([...outs[998], ...outs[999]])
            key = xor(key, tail)
            iv = outs[999]
            input = outs[998]
          }
          return {
            ok: true,
            observed: 'byte-equal',
            details: `all ${n} outer results byte-equal to NIST (AESAVS §6.4 MCT)`,
          }
        },
      })
    }
  }
}
