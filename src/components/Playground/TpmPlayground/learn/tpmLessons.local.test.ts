// SPDX-License-Identifier: GPL-3.0-only
//
// Curriculum guarantee for the TPM Learn tab (Phase 1 WS6 of the 2026-07-23
// remediation plan). Replays every lesson step against the REAL pqctpm WASM
// engine — the same loader WS0(b) pinned — asserting each step reaches its
// declared outcome (expect:'refusal' steps must throw; all others must
// return). This is what stops the curriculum from silently drifting out of
// sync with the serializer / engine, mirroring
// hsm/learn/pkcs11Lessons.local.test.ts and kmip3/learnLessons.local.test.ts.
//
// Also asserts the structural curriculum invariants (every lesson has a
// quiz and vice versa; valid answer indices; non-empty "why"; glossary hex
// is well-formed) and — per the WS4 verification rule — that every glossary
// hex codepoint that duplicates a serializer/decoder constant actually
// MATCHES it (no hex asserted from memory).
//
// Venue: `*.local.test.ts` per the 2026-07-01 new-test-suite convention —
// local gate only, not CI.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import { TPM_LESSONS, type TpmLearnContext, type TpmStepResult } from './tpmLessons'
import { TPM_QUIZZES } from './tpmQuiz'
import { TAG_GLOSSARY, TERMS } from './tpmGlossary'
import { CC_NAMES } from '../tpmWireDecode'
import * as SER from '../../../../wasm/tpmSerializer'

const REPO_ROOT = process.cwd()
const WASM_DIR = join(REPO_ROOT, 'public', 'wasm')

interface PqcTpmModule {
  cwrap: (name: string, ret: string | null, args: string[]) => (...a: unknown[]) => number
  HEAPU8: Uint8Array
  _malloc: (n: number) => number
  _free: (p: number) => void
}
type Factory = (cfg: {
  locateFile: (p: string) => string
  print: (t: string) => void
  printErr: (t: string) => void
}) => Promise<PqcTpmModule>

function loadFactory(): Factory {
  const src = readFileSync(join(WASM_DIR, 'pqctpm.js'), 'utf-8')
  const shim: { exports: unknown } = { exports: {} }
  const req = createRequire(`file://${join(REPO_ROOT, 'package.json')}`)
  const wrapped = new Function('module', 'exports', 'require', '__dirname', '__filename', src)
  wrapped(shim, shim.exports, req, WASM_DIR, join(WASM_DIR, 'pqctpm.js'))
  return shim.exports as Factory
}

// ── Structural curriculum invariants (no engine needed) ────────────────────
describe('TPM curriculum structure', () => {
  it('every lesson has a quiz bank and vice versa', () => {
    const lessonIds = TPM_LESSONS.map((l) => l.id).sort()
    const quizIds = Object.keys(TPM_QUIZZES).sort()
    expect(quizIds).toEqual(lessonIds)
  })

  it('every lesson id and number is unique and sequential', () => {
    expect(new Set(TPM_LESSONS.map((l) => l.id)).size).toBe(TPM_LESSONS.length)
    expect(TPM_LESSONS.map((l) => l.n)).toEqual(TPM_LESSONS.map((_, i) => i + 1))
  })

  it('every lesson has ≥1 step, non-empty setup/blurb/whyItMatters', () => {
    for (const l of TPM_LESSONS) {
      expect(l.steps.length, l.id).toBeGreaterThan(0)
      expect(l.setup.length, l.id).toBeGreaterThan(0)
      expect(l.blurb.length, l.id).toBeGreaterThan(0)
      expect(l.whyItMatters.length, l.id).toBeGreaterThan(0)
      expect(l.notes.length, l.id).toBeGreaterThan(0)
    }
  })

  it('every quiz question has ≥2 options, an in-range answer, and a non-empty why', () => {
    for (const [id, bank] of Object.entries(TPM_QUIZZES)) {
      expect(bank.length, id).toBeGreaterThan(0)
      for (const q of bank) {
        expect(q.options.length, `${id}: ${q.q}`).toBeGreaterThanOrEqual(2)
        expect(q.answer, `${id}: ${q.q}`).toBeGreaterThanOrEqual(0)
        expect(q.answer, `${id}: ${q.q}`).toBeLessThan(q.options.length)
        expect(q.why.length, `${id}: ${q.q}`).toBeGreaterThan(0)
      }
    }
  })

  it('every glossary hex is well-formed, and duplicated codepoints match the code constants (no hex from memory)', () => {
    // Serializer/decoder constants the glossary re-states — the WS4 rule
    // says a hex value may ONLY appear where it matches one of these.
    const KNOWN: Record<string, number> = {
      TPM2_Startup: SER.TPM_CC_Startup,
      TPM2_SelfTest: SER.TPM_CC_SelfTest,
      TPM2_GetCapability: SER.TPM_CC_GetCapability,
      TPM2_GetRandom: SER.TPM_CC_GetRandom,
      TPM2_CreatePrimary: SER.TPM_CC_CreatePrimary,
      TPM2_ReadPublic: SER.TPM_CC_ReadPublic,
      TPM2_NV_Read: SER.TPM_CC_NV_Read,
      TPM2_NV_ReadPublic: SER.TPM_CC_NV_ReadPublic,
      TPM2_Encapsulate: SER.TPM_CC_Encapsulate,
      TPM2_Decapsulate: SER.TPM_CC_Decapsulate,
      TPM2_SignDigest: SER.TPM_CC_SignDigest,
      TPM2_VerifyDigestSignature: SER.TPM_CC_VerifyDigestSignature,
      TPM2_SignSequenceStart: SER.TPM_CC_SignSequenceStart,
      TPM2_SignSequenceComplete: SER.TPM_CC_SignSequenceComplete,
      TPM2_VerifySequenceStart: SER.TPM_CC_VerifySequenceStart,
      TPM2_VerifySequenceComplete: SER.TPM_CC_VerifySequenceComplete,
      TPM2_SequenceUpdate: SER.TPM_CC_SequenceUpdate,
      TPM2_SequenceComplete: SER.TPM_CC_SequenceComplete,
      TPM2_HashSequenceStart: SER.TPM_CC_HashSequenceStart,
      TPM2_Sign: SER.TPM_CC_Sign,
      TPM2_VerifySignature: SER.TPM_CC_VerifySignature,
      TPM2_RSA_Encrypt: SER.TPM_CC_RSA_Encrypt,
      TPM2_RSA_Decrypt: SER.TPM_CC_RSA_Decrypt,
      TPM_ST_NO_SESSIONS: SER.TPM_ST_NO_SESSIONS,
      TPM_ST_SESSIONS: SER.TPM_ST_SESSIONS,
      TPM_ST_HASHCHECK: SER.TPM_ST_HASHCHECK,
      TPM_ALG_RSA: SER.ALG_RSA,
      TPM_ALG_SHA256: SER.ALG_SHA256,
      TPM_ALG_NULL: SER.ALG_NULL,
      TPM_ALG_RSASSA: SER.ALG_RSASSA,
      TPM_ALG_OAEP: SER.ALG_OAEP,
      TPM_ALG_MLKEM: SER.ALG_MLKEM,
      TPM_ALG_MLDSA: SER.ALG_MLDSA,
    }
    for (const [key, entry] of Object.entries(TAG_GLOSSARY)) {
      if (entry.hex === undefined) continue
      expect(entry.hex, key).toMatch(/^0x[0-9A-Fa-f]+$/)
      if (key in KNOWN) {
        // eslint-disable-next-line security/detect-object-injection -- key is a fixed glossary key iterated from this module's own catalog
        expect(parseInt(entry.hex, 16), `${key} hex must match the code constant`).toBe(KNOWN[key])
      }
    }
  })

  it('every command with a glossary entry also has a decoder name (Term hovers resolve)', () => {
    const decoderNames = new Set(Object.values(CC_NAMES))
    for (const key of Object.keys(TAG_GLOSSARY)) {
      if (key.startsWith('TPM2_')) {
        expect(decoderNames.has(key), `${key} should be in CC_NAMES for Execution Log hovers`).toBe(
          true
        )
      }
    }
  })

  it('has ~45+ glossary entries as the plan targeted', () => {
    expect(Object.keys(TAG_GLOSSARY).length + TERMS.length).toBeGreaterThanOrEqual(45)
  })
})

// ── Live engine replay of every lesson step ────────────────────────────────
//
// Every step runs for real against the WASM engine — no tolerance, no
// fallback. (History: this suite originally had to tolerate a
// CKR_KEY_HANDLE_INVALID failure on ML-KEM decapsulation / ML-DSA signing.
// That was traced to pqcCryptoBridge.ts's `ensureHSM()` logging into softhsm
// as CKU_USER with a PIN that was never set — a bug present in the browser
// too, not a Node-only limitation. Fixed 2026-07-23 by switching to the
// proven `hsm_initToken`/`hsm_openUserSession` SO→InitPIN→logout→USER
// sequence; see the fix commit for the full root-cause trace.)
describe('TPM lessons replay against the real WASM engine', () => {
  let ctx: TpmLearnContext
  let provisionForT6: () => Promise<void>
  // Every TPM2_FlushContext rc issued by flushAll() across the WHOLE
  // curriculum replay — asserted all-success below. Before the 2026-07-24
  // discovery-based rewrite, flushAll() blind-probed a handle range
  // (0x80FF0000+) that never matches how this engine numbers sequence
  // handles, so every run guaranteed several TPM_RC_VALUE failures; this
  // regresses that (see also the flushAll() comment near its definition).
  const flushRcs: number[] = []

  beforeAll(async () => {
    const factory = loadFactory()
    const mod = await factory({
      locateFile: (p) => (p.endsWith('.wasm') ? join(WASM_DIR, 'pqctpm.wasm') : p),
      print: () => {},
      printErr: () => {},
    })
    expect(mod.cwrap('tpm_wasm_startup', 'number', ['string'])('')).toBe(0)

    // Register the REAL PQC bridge (softhsm-wasm — loads in Node, same as the
    // PKCS#11 lesson test does) so ML-KEM/ML-DSA run for real, including
    // signing and decapsulation. Registered on the test's own module,
    // mirroring what initTpm() does in the browser.
    const { registerPqcBridge } = await import('../../../../wasm/pqcCryptoBridge')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test module shape matches PqcTpmModule at runtime
    await registerPqcBridge(mod as any)

    // C-side EK provisioning: creates the 6 persistent V2.7 EK handles
    // (0x810100B0–B6) that T6 enumerates.
    mod.cwrap('tpm_wasm_provision_v2p7', 'number', [])()

    const proc = mod.cwrap('tpm_wasm_process', 'number', ['number', 'number', 'number', 'number'])
    const call = (cmd: Uint8Array, maxResp: number): Uint8Array => {
      const inPtr = mod._malloc(cmd.length)
      mod.HEAPU8.set(cmd, inPtr)
      const outPtr = mod._malloc(maxResp)
      const n = proc(inPtr, cmd.length, outPtr, maxResp)
      const out = n > 0 ? new Uint8Array(mod.HEAPU8.buffer, outPtr, n).slice() : new Uint8Array(0)
      mod._free(inPtr)
      mod._free(outPtr)
      return out
    }
    const exec = async (cmd: Uint8Array) => call(cmd, 8192)
    const execLarge = async (cmd: Uint8Array, maxResp: number) => call(cmd, maxResp)
    const u16 = (v: number): number[] => [(v >> 8) & 0xff, v & 0xff]
    const u32 = (v: number): number[] => [
      (v >>> 24) & 0xff,
      (v >>> 16) & 0xff,
      (v >>> 8) & 0xff,
      v & 0xff,
    ]
    const flushOne = async (h: number) => {
      const resp = await exec(
        new Uint8Array([...u16(0x8001), ...u32(14), ...u32(0x00000165), ...u32(h)])
      )
      if (resp.length >= 10) flushRcs.push(SER.getU32(resp, 6))
    }
    // Mirrors tpmBridge.ts's flushAllTransient: discover what's ACTUALLY
    // loaded via TPM2_GetCapability(TPM_CAP_HANDLES) rather than guessing a
    // handle range — the range this harness blind-probed before 2026-07-24
    // (0x80FF0000+ for "sequences") never matches how this engine actually
    // numbers handles (sequences share the 0x80000000+ pool with objects),
    // so every one of those probes was a guaranteed TPM_RC_VALUE. Keeping
    // this harness in sync with the real implementation, not a parallel
    // fiction of it.
    const flushAll = async () => {
      const resp = await exec(SER.buildGetCapabilityCmd(SER.TPM_CAP_HANDLES, 0x80000000, 16))
      const rc = SER.getU32(resp, 6)
      if (rc !== 0 || resp.length < 15) return
      const count = SER.getU32(resp, 15)
      for (let i = 0; i < count; i++) {
        const off = 19 + i * 4
        if (resp.length < off + 4) break
        await flushOne(SER.getU32(resp, off))
      }
    }
    const nvReadAll = async (nvIndex: number): Promise<Uint8Array> => {
      // Minimal chunked NV read mirroring tpmBridge.nvReadAll (SHA-256 slots).
      const pub = await execLarge(
        new Uint8Array([...u16(0x8001), ...u32(14), ...u32(0x00000169), ...u32(nvIndex)]),
        1024
      )
      const off0 = 10
      const nvPubSize = (pub[off0] << 8) | pub[off0 + 1]
      const nvPub = pub.slice(off0 + 2, off0 + 2 + nvPubSize)
      const authPolicySize = (nvPub[10] << 8) | nvPub[11]
      const dsOff = 12 + authPolicySize
      const dataSize = (nvPub[dsOff] << 8) | nvPub[dsOff + 1]
      const out = new Uint8Array(dataSize)
      const CHUNK = 1024
      let off = 0
      while (off < dataSize) {
        const want = Math.min(CHUNK, dataSize - off)
        const session = [...u32(0x40000009), ...u16(0), 0, ...u16(0)]
        const cmd = new Uint8Array([
          ...u16(0x8002),
          ...u32(10 + 4 + 4 + 4 + session.length + 2 + 2),
          ...u32(0x0000014e),
          ...u32(nvIndex),
          ...u32(nvIndex),
          ...u32(session.length),
          ...session,
          ...u16(want),
          ...u16(off),
        ])
        const resp = await execLarge(cmd, 2048)
        const bodyOff = 10 + 4
        const got = (resp[bodyOff] << 8) | resp[bodyOff + 1]
        out.set(resp.slice(bodyOff + 2, bodyOff + 2 + got), off)
        off += got
        if (got === 0) break
      }
      return out
    }

    // Fixture EK cert into the ML-DSA-65 slot, written lazily right before T6
    // so it doesn't sit in NV during earlier lessons. The browser uses a
    // separate, tpmBridge-singleton-coupled JS provisioner too heavy to
    // reproduce here; the fixture keeps T6's chunked NV-read a real engine
    // exercise. Idempotent.
    let provisioned = false
    provisionForT6 = async () => {
      if (provisioned) return
      provisioned = true
      const nvIndex = 0x01c00072
      const der = new Uint8Array(384)
      der[0] = 0x30
      der[1] = 0x82
      der[2] = 0x01
      der[3] = 0x7c
      for (let i = 4; i < der.length; i++) der[i] = i & 0xff
      const session = [...u32(0x40000009), ...u16(0), 0, ...u16(0)]
      const nvPublic = [
        ...u32(nvIndex),
        ...u16(0x000b),
        ...u32(0x42072001),
        ...u16(0),
        ...u16(der.length),
      ]
      const defBody = [
        ...u32(0x4000000c),
        ...u32(session.length),
        ...session,
        ...u16(0),
        ...u16(nvPublic.length),
        ...nvPublic,
      ]
      await execLarge(
        new Uint8Array([
          ...u16(0x8002),
          ...u32(10 + defBody.length),
          ...u32(0x0000012a),
          ...defBody,
        ]),
        1024
      )
      let off = 0
      while (off < der.length) {
        const want = Math.min(1024, der.length - off)
        const wBody = [
          ...u32(0x4000000c),
          ...u32(nvIndex),
          ...u32(session.length),
          ...session,
          ...u16(want),
          ...Array.from(der.subarray(off, off + want)),
          ...u16(off),
        ]
        await execLarge(
          new Uint8Array([...u16(0x8002), ...u32(10 + wBody.length), ...u32(0x00000137), ...wBody]),
          1024
        )
        off += want
      }
    }

    ctx = {
      exec,
      execLarge,
      flushAll,
      nvReadAll,
      // The bridge was registered on this module above, so PQC crypto is
      // genuinely active for the test — T8's status check reflects reality.
      bridgeStatus: () => 'active',
      chain: { handles: {} },
    }
  }, 120_000)

  for (const lesson of TPM_LESSONS) {
    it(`T${lesson.n} — ${lesson.title}`, async () => {
      // T6 reads the V2.7 EK handles + cert — provision (once) right before,
      // AFTER the ML-KEM lessons have run clean.
      if (lesson.id === 'v27-ek-certs') await provisionForT6()
      // Each lesson runs in its own fresh chain, like selectLesson does.
      ctx.chain = { handles: {} }
      const results: (TpmStepResult | null)[] = lesson.steps.map(() => null)
      for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i]
        const where = `${lesson.id} step ${i + 1} (${step.op})`
        if (step.expect === 'refusal') {
          await expect(step.run(ctx, results), `${where} must be refused`).rejects.toThrow()
          continue
        }
        const r = await step.run(ctx, results)
        expect(r.detail.length, where).toBeGreaterThan(0)
        results[i] = r
      }
    }, 60_000)
  }

  // Runs last (vitest executes a describe's `it`s in declaration order) —
  // every flush issued by every lesson's ctx.flushAll() across the whole
  // curriculum must have hit a handle the engine actually reported as
  // loaded, so every one of them succeeds. See the flushRcs comment above.
  it('flushAll() only ever flushes handles the engine reports as loaded — zero failures', () => {
    expect(flushRcs.length, 'expected at least one flush across the curriculum').toBeGreaterThan(0)
    expect(
      flushRcs.every((rc) => rc === 0),
      `non-success flush rcs: ${flushRcs.join(', ')}`
    ).toBe(true)
  })
})
