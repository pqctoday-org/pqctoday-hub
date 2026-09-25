// SPDX-License-Identifier: GPL-3.0-only
//
// SHA-2 / SHA-3 message-length boundaries and Monte Carlo (remediation plan
// 2026-09-24, WS-E), per engine, from pinned NIST ACVP-Server samples:
//
//  - AFT: the empty message, the shortest message, block-1 / block / block+1
//    bytes, the SHA-2 length-field boundary and the longest message, where the
//    upstream sample has them — C_Digest must byte-match md;
//  - MCT (standard version): the ACVP chained-digest loop from the upstream
//    seed, 1000 C_Digest calls, byte-compared to the FIRST of the 100 upstream
//    outer-iteration results (the row says so — it is not a full MCT);
//  - alternate-version MCT and LDT (1 GiB expanded message) groups are skip rows.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName } from '@/wasm/softhsm'
import { srcOf, srcTag, unsupportedReason, type AcvpCaseMeta, type Provenance } from './mldsaAcvp'
import {
  WSE_MECH,
  digestRv,
  eqHex,
  hexUp,
  runRow,
  skipRow,
  type ClassicalSectionCtx,
  type WseMechName,
} from './classicalRaw'
import { hashSlug } from './hmacAcvp'

export const DIGEST_BY_HASH: Readonly<Record<string, WseMechName>> = {
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

interface ShaCase {
  tcId: number
  msg: string
  len: number
  md?: string
  resultsArray?: { md: string }[]
}
interface ShaGroup {
  tgId: number
  testType: 'AFT' | 'MCT'
  algorithm: string
  revision: string
  hashAlg: string
  blockBytes: number
  source_path: string
  source_sha256: string
  tests: ShaCase[]
}
interface ShaNotExecuted {
  tgId: number
  hashAlg: string
  testType: string
  mctVersion?: string
  cases: number
  why: string
}

/** One ACVP standard-MCT outer iteration: 1000 chained C_Digest calls. */
function mctOuter(
  digest: (m: Uint8Array) => Uint8Array,
  seed: Uint8Array,
  sha3: boolean
): Uint8Array {
  if (sha3) {
    let md = seed
    for (let i = 0; i < 1000; i++) md = digest(md)
    return md
  }
  let a = seed
  let b = seed
  let c = seed
  for (let i = 0; i < 1000; i++) {
    const m = new Uint8Array(a.length + b.length + c.length)
    m.set(a)
    m.set(b, a.length)
    m.set(c, a.length + b.length)
    a = b
    b = c
    c = digest(m)
  }
  return c
}

export async function runShaAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/sha_acvp_boundary_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: ShaGroup[]
    notExecuted: ShaNotExecuted[]
  }
  for (const g of f.testGroups) {
    const P: Provenance = {
      ...f._provenance,
      source_path: g.source_path,
      source_sha256: g.source_sha256,
    }
    const mechName = DIGEST_BY_HASH[g.hashAlg]
    const mech = mechName ? WSE_MECH[mechName] : undefined // eslint-disable-line security/detect-object-injection
    const why = unsupportedReason(mechs, mech, mechName ?? g.hashAlg)
    const slug = hashSlug(g.hashAlg)
    const algorithm = `${g.hashAlg} (${eName})`
    for (const t of g.tests) {
      const bytes = t.len / 8
      const mct = g.testType === 'MCT'
      const id = mct
        ? `sha-mct-${slug}-tg${g.tgId}-tc${t.tcId}-${eName}`
        : `sha-nist-${slug}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const where =
        bytes === 0
          ? 'empty message'
          : bytes === g.blockBytes
            ? 'exactly one block'
            : bytes === g.blockBytes - 1 || bytes === g.blockBytes + 1
              ? `block ${bytes < g.blockBytes ? '-' : '+'} 1 byte`
              : `${bytes}B`
      const testCase = mct
        ? `Digest MCT · NIST ${g.algorithm} tg${g.tgId}/tc${t.tcId} · standard MCT, outer iteration 0 of 100 (1000 chained C_Digest) · expect byte-match`
        : `Digest · NIST ${g.algorithm} tg${g.tgId}/tc${t.tcId} · ${where} (block ${g.blockBytes}B) · expect byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'digest',
        localOperation: 'digest',
        parameterSet: g.hashAlg,
        hashAlg: g.hashAlg,
        messageBytes: bytes,
        parameters: {
          blockBytes: g.blockBytes,
          testType: g.testType,
          ...(mct ? { outerIterationsChecked: 1 } : {}),
        },
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
        exec: () => {
          let failure: string | null = null
          const digest = (m: Uint8Array): Uint8Array => {
            const r = digestRv(M, h, mech!, m)
            if (!r.out) {
              failure = `${r.step} → ${rvName(r.rv)}`
              throw new Error(failure)
            }
            return r.out
          }
          const want = mct ? t.resultsArray![0].md : t.md!
          let out: Uint8Array
          try {
            out = mct
              ? mctOuter(digest, hexToBytes(t.msg), g.hashAlg.startsWith('SHA3'))
              : digest(hexToBytes(t.msg))
          } catch (e: unknown) {
            const o = failure ?? (e instanceof Error ? e.message : String(e))
            return { ok: false, observed: o, details: o }
          }
          const ok = eqHex(out, want)
          return {
            ok,
            observed: ok ? 'byte-equal' : `md ${hexUp(out)}`,
            details: ok
              ? `md[${out.length}B] byte-equal to NIST expected${mct ? ' (MCT outer iteration 0)' : ''}`
              : `digest mismatch: got ${hexUp(out)}, expected ${want}`,
          }
        },
      })
    }
  }
  for (const ne of f.notExecuted) {
    const slug = hashSlug(ne.hashAlg)
    await skipRow(ctx, {
      id: `sha-skip-${ne.testType.toLowerCase()}-${slug}-tg${ne.tgId}-${eName}`,
      algorithm: `${ne.hashAlg} (${eName})`,
      testCase: `Digest ${ne.testType}${ne.mctVersion ? ` (${ne.mctVersion})` : ''} · NIST tg${ne.tgId} · ${ne.cases} case(s)`,
      meta: {
        origin: 'not-executed',
        upstreamOperation: 'digest',
        localOperation: 'none',
        parameterSet: ne.hashAlg,
        hashAlg: ne.hashAlg,
        expected: 'not-run',
        tgId: ne.tgId,
        source: srcOf(f._provenance),
      },
      why:
        ne.why === 'alternate-mct-not-implemented'
          ? 'this boundary subset carries no alternate-version MCT case; the alternate-version MCT runs in full (all 100 outer iterations) in section 10g from sha_mct_full_test.json'
          : 'the LDT expands a message to 1 GiB — not run in the browser workbench',
    })
  }
}
