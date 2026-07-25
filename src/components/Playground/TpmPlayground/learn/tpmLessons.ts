// SPDX-License-Identifier: GPL-3.0-only
//
// tpmLessons.ts — the TPM 2.0 playground's guided curriculum: 8 lessons
// (T1–T8) whose steps run REAL wire commands against the same WASM TPM the
// workbench tabs drive, through the same serializeDemoCommand chaining seam
// the Command Builder uses. No mocked responses anywhere; `expect: 'refusal'`
// marks steps whose honest rejection IS the successful outcome.
//
// Curriculum spine: each lesson pairs the classical (pre-quantum) operation
// against its V1.85 PQC modernization in ONE linear sequence, then compares
// what both halves actually produced (the PKCS#11 v3.2-track shape — chosen
// over the KMIP paired-cards shape because this engine has only 3 transient
// object slots, so sequential execution with flushes between halves is the
// honest fit). Spec citations reference the PUBLISHED TCG TPM 2.0 Library
// v1.85 (2026-03-12) + Errata v1; wire layouts were live-probed against the
// shipped wasm (WS0 spike, 2026-07-23).
import type { LessonStepExpect, LinearLessonBase } from '../../learnkit/lessonTypes'
import {
  serializeDemoCommand,
  buildGetCapabilityCmd,
  buildGetRandomCmd,
  getU16,
  getU32,
  toHex,
  TPM_CAP_HANDLES,
  type DemoCommandExtras,
} from '../../../../wasm/tpmSerializer'
import { getRcInfo } from '../tpmCommandDefs'
import { parseRespHeader, formatRc } from '../tpmWireDecode'
import type { PqcBridgeStatus } from '../../../../wasm/tpmBridge'

// ── Execution context ──────────────────────────────────────────────────────

/**
 * What a lesson step runs against. Constructed by TpmLearnView in the
 * browser (wrapping tpmBridge) and by the curriculum replay test in Node
 * (wrapping the loader harness) — the SAME lesson code runs in both.
 */
export interface TpmLearnContext {
  exec: (cmd: Uint8Array) => Promise<Uint8Array>
  execLarge: (cmd: Uint8Array, maxResp: number) => Promise<Uint8Array>
  /** Flush all transient object + sequence slots (3 transient slots total). */
  flushAll: () => Promise<void>
  /** Full chunked NV read (returns the raw NV data, e.g. an EK cert DER). */
  nvReadAll: (nvIndex: number) => Promise<Uint8Array>
  bridgeStatus: () => PqcBridgeStatus
  /** Mutable per-lesson chain of real results — reset when a lesson opens. */
  chain: DemoCommandExtras & { handles: Record<string, number> }
}

export interface TpmStepResult {
  detail: string
}

export interface TpmLessonStep {
  op: string
  label: string
  expect?: LessonStepExpect
  run: (ctx: TpmLearnContext, results: (TpmStepResult | null)[]) => Promise<TpmStepResult>
}

export type TpmLesson = LinearLessonBase<TpmLessonStep>

// ── Shared step helpers ────────────────────────────────────────────────────

/** Execute + require rc=0, throwing a decoded error otherwise. */
async function execOk(ctx: TpmLearnContext, cmd: Uint8Array): Promise<Uint8Array> {
  const resp = await ctx.exec(cmd)
  const { rc } = parseRespHeader(resp)
  if (rc !== 0) {
    const info = getRcInfo(rc)
    throw new Error(`${info.name} (${formatRc(rc)}) — ${info.description}`)
  }
  return resp
}

/** Execute expecting a nonzero rc; throws (for expect:'refusal') with the decoded name. */
async function execRefused(ctx: TpmLearnContext, cmd: Uint8Array): Promise<never> {
  const resp = await ctx.exec(cmd)
  const { rc } = parseRespHeader(resp)
  if (rc === 0) {
    throw new Error('Unexpectedly succeeded — this should not happen.')
  }
  const info = getRcInfo(rc)
  throw new Error(`${info.name} (${formatRc(rc)}) — ${info.description}`)
}

/** CreatePrimary via the demo serializer; returns the new transient handle. */
async function createPrimary(ctx: TpmLearnContext, algorithm: string): Promise<number> {
  const resp = await execOk(ctx, serializeDemoCommand('TPM2_CreatePrimary', algorithm))
  return getU32(resp, 10)
}

const hex8 = (v: number) => `0x${v.toString(16).padStart(8, '0')}`

// ── The 8 lessons ──────────────────────────────────────────────────────────

export const TPM_LESSONS: TpmLesson[] = [
  // ── T1 — Boot & discover ─────────────────────────────────────────────────
  {
    id: 'boot-discover',
    n: 1,
    tag: 'Core',
    tone: 'ok',
    title: 'Boot & discover — one chip, two cryptographic eras',
    blurb:
      'The TPM booted when this page loaded. These steps interrogate the live chip: self-test, then the algorithm table — where RSA (0x0001) and ML-KEM (0x00A0) sit side by side — and finally a deliberate rule-break to see what an honest TPM refusal looks like.',
    setup:
      'TCG V1.85 (published March 2026) did not replace the TPM command set — it EXTENDED it. Everything classical still works; the PQC algorithms and commands were added alongside. GetCapability is the migration story in one response.',
    steps: [
      {
        op: 'TPM2_SelfTest(fullTest=YES)',
        label: 'Run the full algorithm self-test',
        run: async (ctx) => {
          await execOk(ctx, serializeDemoCommand('TPM2_SelfTest', ''))
          return {
            detail:
              'TPM_RC_SUCCESS — every implemented algorithm (classical AND post-quantum) passed its self-test. Part 3 §10.2.',
          }
        },
      },
      {
        op: 'TPM2_GetCapability(TPM_CAP_ALGS)',
        label: 'Read the algorithm table — both eras in one list',
        run: async (ctx) => {
          const resp = await execOk(ctx, buildGetCapabilityCmd(0, 0, 128))
          // hdr(10) + moreData(1) + capability(4) + count(4) + {algId(2)+attrs(4)}×count
          const count = getU32(resp, 15)
          const algs: number[] = []
          for (let i = 0; i < count; i++) algs.push(getU16(resp, 19 + i * 6))
          const has = (id: number) => algs.includes(id)
          if (!has(0x0001) || !has(0x00a0) || !has(0x00a1)) {
            throw new Error(
              `Algorithm table missing an expected entry (got ${count} algorithms) — RSA=${has(0x0001)}, MLKEM=${has(0x00a0)}, MLDSA=${has(0x00a1)}`
            )
          }
          return {
            detail: `${count} algorithms registered. Classical: RSA (0x0001) ✓, ECC (0x0023) ${has(0x0023) ? '✓' : '✗'}. Post-quantum: ML-KEM (0x00A0) ✓, ML-DSA (0x00A1) ✓, HashML-DSA (0x00A2) ${has(0x00a2) ? '✓' : '✗'}. One chip, two eras — migration is coexistence, not replacement.`,
          }
        },
      },
      {
        op: 'TPM2_GetCapability(TPM_CAP_TPM_PROPERTIES)',
        label: 'Check the version this chip actually claims to be',
        run: async (ctx) => {
          const resp = await execOk(ctx, buildGetCapabilityCmd(0x00000006, 0x100, 5))
          // hdr(10) + moreData(1) + capability(4) + count(4) + {property(4)+value(4)}×count
          const count = getU32(resp, 15)
          const props = new Map<number, number>()
          for (let i = 0; i < count; i++) {
            const off = 19 + i * 8
            props.set(getU32(resp, off), getU32(resp, off + 4))
          }
          const revision = props.get(0x102) // TPM_PT_REVISION
          const year = props.get(0x104) // TPM_PT_YEAR
          const errata = props.get(0x103) // TPM_PT_DAY_OF_YEAR — now TPM_SPEC_ERRATA (Errata v1 §2.1)
          if (revision !== 185) {
            throw new Error(
              `TPM_PT_REVISION=${revision} — this engine does not report the published V1.85 baseline it implements (expected 185).`
            )
          }
          return {
            detail: `TPM_PT_REVISION=${revision} (Library v1.85), TPM_PT_YEAR=${year} (shall be zero per Errata v1 §2.1), errata level=${errata} (TPM_SPEC_ERRATA, the slot that used to be TPM_SPEC_DAY_OF_YEAR). This is a REAL capability query, not a claim — every TPM you meet in the field should answer the same way if it truly implements the published spec, not just its command set.`,
          }
        },
      },
      {
        op: 'TPM2_GetRandom(32)',
        label: 'Draw 32 bytes from the shared entropy source',
        run: async (ctx) => {
          const resp = await execOk(ctx, buildGetRandomCmd(32))
          const size = getU16(resp, 10)
          const preview = toHex(resp.slice(12, 12 + Math.min(size, 8)))
          return {
            detail: `${size} B of DRBG output (first 8: ${preview} …). Classical and PQC key generation both draw from this same source — entropy quality is era-independent.`,
          }
        },
      },
      {
        op: 'TPM2_Startup (again)',
        label: 'Break a rule on purpose: start an already-started TPM',
        expect: 'refusal',
        run: async (ctx) => {
          return execRefused(ctx, serializeDemoCommand('TPM2_Startup', ''))
        },
      },
    ],
    compare: [
      {
        label: 'Algorithm table',
        a: 'RSA, ECC, SHA-256…',
        b: '+ ML-KEM, ML-DSA, HashML-DSA',
        same: false,
      },
      { label: 'Command set', a: 'unchanged', b: '+ 8 new PQC commands', same: false },
      { label: 'Entropy source', a: 'TPM DRBG', b: 'TPM DRBG (same)', same: true },
    ],
    compareHeaders: ['', 'Pre-quantum TPM 2.0', 'V1.85'],
    notes: [
      'TPM_RC_INITIALIZE (0x100) on the double-Startup is the TPM enforcing its state machine — a specified, honest refusal, not a crash. This playground treats expected refusals as SUCCESSFUL outcomes.',
      'The GetCapability(TPM_CAP_TPM_PROPERTIES) step above is live proof, not an assertion: Errata v1 §2.1 retired TPM_SPEC_DAY_OF_YEAR in favor of TPM_SPEC_ERRATA and requires TPM_SPEC_YEAR=0 — this engine used to fail that check silently (TPM_PT_REVISION reported 183, not 185) until the 2026-07-24 spec-alignment audit caught it.',
    ],
    whyItMatters:
      'Migration planning starts with discovery. On real estates you will run exactly this capability query against thousands of TPMs to learn which ones already speak ML-KEM/ML-DSA — the PC Client PTP v1.07 profile (published 2026) makes them mandatory for new PC-class TPMs, but the installed base is a mix.',
    tryRef: ['builder'],
  },

  // ── T2 — Create primary keys ─────────────────────────────────────────────
  {
    id: 'create-keys',
    n: 2,
    tag: 'Keys',
    tone: 'primary',
    title: 'Create primary keys — same trust model, new math',
    blurb:
      'Create an RSA-2048 key and an ML-KEM-768 key in the live TPM and read back what each actually produced. The hierarchy seeds, deterministic derivation, and non-exportability are identical — the public key grows from 256 bytes to 1184.',
    setup:
      'TPM2_CreatePrimary (Part 3 §24.1) derives a key deterministically from hierarchy seed + template. The template’s `type` field selects the era: TPM_ALG_RSA (0x0001) or TPM_ALG_MLKEM (0x00A0). Everything else about the trust model carries over unchanged.',
    steps: [
      {
        op: 'TPM2_FlushContext ×N',
        label: 'Free the transient slots (this build has 3)',
        run: async (ctx) => {
          await ctx.flushAll()
          return {
            detail:
              'All transient object and sequence slots flushed. Real TPMs have single-digit slot counts too — handle hygiene is part of the programming model, not a quirk of this emulator.',
          }
        },
      },
      {
        op: 'TPM2_CreatePrimary(RSA-2048)',
        label: 'Classical: create an RSA-2048 signing key under Owner',
        run: async (ctx) => {
          const t0 = performance.now()
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_CreatePrimary', 'RSA-2048'))
          const ms = Math.round(performance.now() - t0)
          const handle = getU32(resp, 10)
          ctx.chain.handles.rsaSign = handle
          // TPMT_PUBLIC @20; RSA unrestricted parms → unique.size @40
          const pkSize = getU16(resp, 40)
          if (pkSize !== 256) throw new Error(`Expected a 256 B RSA-2048 modulus, got ${pkSize} B`)
          return {
            detail: `handle ${hex8(handle)}, public modulus ${pkSize} B, generated in ${ms} ms (prime search is why RSA keygen is slow). Scheme=NULL — the caller picks RSASSA/OAEP per operation.`,
          }
        },
      },
      {
        op: 'TPM2_CreatePrimary(ML-KEM-768)',
        label: 'Post-quantum: create an ML-KEM-768 EK under Endorsement',
        run: async (ctx) => {
          const t0 = performance.now()
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_CreatePrimary', 'MLKEM-768'))
          const ms = Math.round(performance.now() - t0)
          const handle = getU32(resp, 10)
          ctx.chain.handles.mlkem = handle
          // TPMT_PUBLIC @20; ML-KEM restricted parms → unique.size @38
          const pkSize = getU16(resp, 38)
          if (pkSize !== 1184) throw new Error(`Expected a 1184 B ML-KEM-768 pk, got ${pkSize} B`)
          return {
            detail: `handle ${hex8(handle)}, public key ${pkSize} B (FIPS 203), generated in ${ms} ms — lattice keygen has no prime search. Restricted+decrypt template: this is an Endorsement Key shape.`,
          }
        },
      },
    ],
    compare: [
      { label: 'Public key bytes', a: '256 B (modulus)', b: '1184 B (FIPS 203)', same: false },
      {
        label: 'Hard problem',
        a: 'Integer factoring — broken by Shor',
        b: 'Module-LWE — no known quantum attack',
        same: false,
      },
      {
        label: 'Derivation',
        a: 'hierarchy seed + template',
        b: 'hierarchy seed + template (same)',
        same: true,
      },
      {
        label: 'Private key exportable?',
        a: 'No (fixedTPM)',
        b: 'No (fixedTPM — same)',
        same: true,
      },
    ],
    compareHeaders: ['', 'RSA-2048', 'ML-KEM-768'],
    notes: [
      'The unique.size field read out of each response is the REAL byte count the live engine produced — 256 vs 1184 is measured here, not quoted.',
      'The ~4.6× public-key growth is why TPM_BUFFER_MAX grew to 8192 in V1.85: ML-DSA-87 signatures (4627 B) must fit one response.',
    ],
    whyItMatters:
      'Key size drives everything downstream: certificate sizes, NV storage budgets, protocol messages. When you inventory an estate for migration, the delta you just measured is the delta every certificate chain and attestation message will absorb.',
    tryRef: ['builder'],
  },

  // ── T3 — Key establishment ───────────────────────────────────────────────
  {
    id: 'key-establishment',
    n: 3,
    tag: 'KEM',
    tone: 'spec',
    title: 'Key establishment — transport vs encapsulation, loud vs silent failure',
    blurb:
      'Run classical RSA-OAEP key transport and ML-KEM encapsulation back to back — then corrupt a ciphertext in each system and watch them fail in OPPOSITE ways. OAEP refuses loudly; ML-KEM “succeeds” with a useless secret (implicit rejection).',
    setup:
      'Classical key transport (TPM2_RSA_Encrypt, §14.2): the CALLER picks a secret and wraps it. A KEM (TPM2_Encapsulate, §14.10 — new in V1.85): the TPM GENERATES the secret during the operation. Not a drop-in swap — which is why V1.85 added new commands instead of overloading RSA_Encrypt.',
    steps: [
      {
        op: 'TPM2_CreatePrimary(RSA-2048 decrypt)',
        label: 'Create the classical decrypt key',
        run: async (ctx) => {
          await ctx.flushAll()
          const handle = await createPrimary(ctx, 'RSA-2048-DEC')
          ctx.chain.handles.rsaDec = handle
          return { detail: `Unrestricted RSA-2048 decrypt key at ${hex8(handle)}.` }
        },
      },
      {
        op: 'TPM2_RSA_Encrypt(OAEP)',
        label: 'Classical: wrap a 32-byte secret we chose',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_RSA_Encrypt', 'RSA-2048-DEC', ctx.chain.handles.rsaDec)
          )
          const ctSize = getU16(resp, 10)
          ctx.chain.rsaCiphertext = resp.slice(12, 12 + ctSize)
          return {
            detail: `Secret (bytes 00…1F, chosen by US, the caller) → ${ctSize} B OAEP ciphertext. The TPM never saw a secret it didn’t receive.`,
          }
        },
      },
      {
        op: 'TPM2_RSA_Decrypt(OAEP)',
        label: 'Classical: unwrap it — bytes must match exactly',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_RSA_Decrypt', 'RSA-2048-DEC', ctx.chain.handles.rsaDec, {
              rsaCiphertext: ctx.chain.rsaCiphertext,
            })
          )
          const size = getU16(resp, 14)
          const msg = resp.slice(16, 16 + size)
          const match = size === 32 && msg.every((b, i) => b === i)
          if (!match)
            throw new Error('Round-trip mismatch — decrypted bytes differ from the secret')
          return { detail: `Recovered ${size} B — byte-exact match with the wrapped secret ✓` }
        },
      },
      {
        op: 'TPM2_RSA_Decrypt (corrupted ciphertext)',
        label: 'Classical failure mode: corrupt one byte — OAEP refuses LOUDLY',
        expect: 'refusal',
        run: async (ctx) => {
          const corrupted = ctx.chain.rsaCiphertext!.slice()
          corrupted[0] ^= 0xff
          return execRefused(
            ctx,
            serializeDemoCommand('TPM2_RSA_Decrypt', 'RSA-2048-DEC', ctx.chain.handles.rsaDec, {
              rsaCiphertext: corrupted,
            })
          )
        },
      },
      {
        op: 'TPM2_Encapsulate(ML-KEM-768)',
        label: 'Post-quantum: the TPM generates the secret itself',
        run: async (ctx) => {
          await ctx.flushAll()
          const kem = await createPrimary(ctx, 'MLKEM-768')
          ctx.chain.handles.mlkem = kem
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_Encapsulate', 'MLKEM-768', kem))
          const ssSize = getU16(resp, 10)
          const ss = resp.slice(12, 12 + ssSize)
          const ctSize = getU16(resp, 12 + ssSize)
          ctx.chain.ciphertext = resp.slice(14 + ssSize, 14 + ssSize + ctSize)
          ctx.chain.handles.encapSsFirst4 = getU32(ss, 0)
          return {
            detail: `TPM generated ss=${ssSize} B + ct=${ctSize} B (FIPS 203: 32/1088). NOBODY chose this secret — the KEM did. ss[0..3]=${toHex(ss.slice(0, 4))}.`,
          }
        },
      },
      {
        op: 'TPM2_Decapsulate (real ciphertext)',
        label: 'Post-quantum: recover the same secret from the real ciphertext',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_Decapsulate', 'MLKEM-768', ctx.chain.handles.mlkem, {
              ciphertext: ctx.chain.ciphertext,
            })
          )
          const ssSize = getU16(resp, 14)
          const ss = resp.slice(16, 16 + ssSize)
          if (getU32(ss, 0) !== ctx.chain.handles.encapSsFirst4) {
            throw new Error('Decapsulated secret does not match — round trip broken')
          }
          return {
            detail: `ss=${ssSize} B, matches the encapsulated secret ✓ (ss[0..3]=${toHex(ss.slice(0, 4))})`,
          }
        },
      },
      {
        op: 'TPM2_Decapsulate (corrupted ciphertext)',
        label: 'PQC failure mode: corrupt one byte — SUCCESS, but a different secret',
        run: async (ctx) => {
          const corrupted = ctx.chain.ciphertext!.slice()
          corrupted[0] ^= 0xff
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_Decapsulate', 'MLKEM-768', ctx.chain.handles.mlkem, {
              ciphertext: corrupted,
            })
          )
          const ss = resp.slice(16, 16 + getU16(resp, 14))
          if (getU32(ss, 0) === ctx.chain.handles.encapSsFirst4) {
            throw new Error(
              'Corrupted ciphertext yielded the SAME secret — implicit rejection broken'
            )
          }
          return {
            detail: `TPM_RC_SUCCESS — yet ss[0..3]=${toHex(ss.slice(0, 4))} differs from the real secret. FIPS 203 implicit rejection: no error oracle for attackers, the protocol simply fails to agree. Compare the loud OAEP refusal above.`,
          }
        },
      },
    ],
    compare: [
      { label: 'Who picks the secret', a: 'The caller', b: 'The KEM itself', same: false },
      { label: 'Ciphertext', a: '256 B', b: '1088 B', same: false },
      {
        label: 'Corrupted-ciphertext behavior',
        a: 'Hard failure (error code)',
        b: 'SUCCESS + wrong secret (implicit rejection)',
        same: false,
      },
      { label: 'Shared secret', a: '32 B (chosen)', b: '32 B (generated)', same: true },
    ],
    compareHeaders: ['', 'RSA-OAEP transport', 'ML-KEM-768'],
    notes: [
      'Implicit rejection is deliberate (FIPS 203): a decryption-failure oracle enabled real attacks on RSA (Bleichenbacher). ML-KEM denies the oracle by never failing visibly.',
      'The shape difference (who picks the secret) is why “swap RSA for ML-KEM” is a protocol redesign, not a config change — the same lesson CACP’s KMIP curriculum teaches at the KMS layer.',
    ],
    whyItMatters:
      'EK credential activation — how a CA proves a TPM is genuine — is classically RSA-OAEP key transport. The V2.7 EK profile rebuilds it on ML-KEM encapsulation. Understanding the shape change is understanding why attestation protocols needed re-plumbing, not just re-keying.',
    tryRef: ['builder'],
    crossPlaygroundLink: {
      to: '/playground/cacp',
      label: 'See the same KEM-vs-agreement lesson at the KMS layer (CACP Learn, Lesson 3)',
    },
  },

  // ── T4 — Sign & verify ───────────────────────────────────────────────────
  {
    id: 'sign-verify',
    n: 4,
    tag: 'Sig',
    tone: 'primary',
    title: 'Sign & verify — new commands, not just new algorithms',
    blurb:
      'Sign with RSA through the classic TPM2_Sign, then with ML-DSA through the NEW TPM2_SignDigest — and notice V1.85 gave PQC signing its own command surface, its own signature layout, and its own verified-ticket type.',
    setup:
      'Classical signing: TPM2_Sign (§20.5) over a 32-byte digest. PQC signing: TPM2_SignDigest (§20.7, new) — for ML-DSA with allowExternalMu, the “digest” is the 64-byte external µ of FIPS 204 Algorithm 7. The API surface migrated along with the math.',
    steps: [
      {
        op: 'TPM2_CreatePrimary(RSA-2048) + TPM2_Sign',
        label: 'Classical: sign a digest with RSASSA/SHA-256',
        run: async (ctx) => {
          await ctx.flushAll()
          const rsa = await createPrimary(ctx, 'RSA-2048')
          ctx.chain.handles.rsaSign = rsa
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_Sign', 'RSA-2048', rsa))
          const sigAlg = getU16(resp, 14)
          const hashAlg = getU16(resp, 16)
          const sigSize = getU16(resp, 18)
          ctx.chain.rsaSignature = resp.slice(20, 20 + sigSize)
          if (sigSize !== 256) throw new Error(`Expected 256 B RSA signature, got ${sigSize}`)
          return {
            detail: `sigAlg=0x${sigAlg.toString(16)} (RSASSA), hash=0x${hashAlg.toString(16)} (SHA-256, embedded IN the signature structure), signature ${sigSize} B.`,
          }
        },
      },
      {
        op: 'TPM2_VerifySignature',
        label: 'Classical: verify it — ticket tag TPM_ST_VERIFIED (0x8022)',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_VerifySignature', 'RSA-2048', ctx.chain.handles.rsaSign, {
              rsaSignature: ctx.chain.rsaSignature,
            })
          )
          const tag = getU16(resp, 10)
          if (tag !== 0x8022)
            throw new Error(`Expected TPM_ST_VERIFIED (0x8022), got 0x${tag.toString(16)}`)
          return {
            detail: `Verified ✓ — TPMT_TK_VERIFIED ticket, tag 0x8022 (TPM_ST_VERIFIED): the classical member of the ticket family.`,
          }
        },
      },
      {
        op: 'TPM2_CreatePrimary(ML-DSA-65) + TPM2_SignDigest',
        label: 'Post-quantum: sign an external µ with ML-DSA-65',
        run: async (ctx) => {
          const ak = await createPrimary(ctx, 'MLDSA-65')
          ctx.chain.handles.mldsa = ak
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_SignDigest', 'MLDSA-65', ak))
          const sigAlg = getU16(resp, 14)
          const sigSize = getU16(resp, 16)
          ctx.chain.digestSignature = resp.slice(18, 18 + sigSize)
          if (sigSize !== 3309)
            throw new Error(`Expected 3309 B ML-DSA-65 signature, got ${sigSize}`)
          return {
            detail: `sigAlg=0x${sigAlg.toString(16)} (ML-DSA), signature ${sigSize} B (FIPS 204) over a 64 B external µ. Note the layout: NO embedded hash algorithm — the ML-DSA union case is just a TPM2B (errata §2.3: its scheme union reads as TPMS_EMPTY).`,
          }
        },
      },
      {
        op: 'TPM2_VerifyDigestSignature',
        label: 'Post-quantum: verify it — ticket tag TPM_ST_DIGEST_VERIFIED (0x8027)',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand(
              'TPM2_VerifyDigestSignature',
              'MLDSA-65',
              ctx.chain.handles.mldsa,
              { digestSignature: ctx.chain.digestSignature }
            )
          )
          const tag = getU16(resp, 10)
          if (tag !== 0x8027)
            throw new Error(`Expected TPM_ST_DIGEST_VERIFIED (0x8027), got 0x${tag.toString(16)}`)
          return {
            detail: `Verified ✓ — ticket tag 0x8027 (TPM_ST_DIGEST_VERIFIED), NEW in V1.85 and distinguishable on the wire from classical 0x8022. Errata §2.5: for an external µ this ticket can’t serve TPM2_PolicyAuthorize, so a conforming TPM SHOULD return a NULL ticket — this engine (built from RC4) still returns the real one. Lesson T8 makes that drift a first-class topic.`,
          }
        },
      },
    ],
    compare: [
      { label: 'Command', a: 'TPM2_Sign (§20.5)', b: 'TPM2_SignDigest (§20.7, NEW)', same: false },
      { label: 'Signature bytes', a: '256 B', b: '3309 B (~13×)', same: false },
      {
        label: 'Signature layout',
        a: 'sigAlg + hashAlg + sig',
        b: 'sigAlg + sig (no hash field)',
        same: false,
      },
      {
        label: 'Verified-ticket tag',
        a: '0x8022 VERIFIED',
        b: '0x8027 DIGEST_VERIFIED (NEW)',
        same: false,
      },
      {
        label: 'Digest input',
        a: '32 B SHA-256',
        b: '64 B external µ (FIPS 204 Alg. 7)',
        same: false,
      },
    ],
    compareHeaders: ['', 'RSA (classical)', 'ML-DSA-65 (V1.85)'],
    notes: [
      'Both signatures above are REAL — the RSA one from OpenSSL inside the wasm, the ML-DSA one through the PQC crypto bridge. Both verify against the same chip’s public keys.',
      'allowExternalMu=YES on the AK is what lets the µ be computed outside the TPM — the trade-off errata §2.5 documents is the price of that flexibility.',
    ],
    whyItMatters:
      'Code that “migrates to PQC” by swapping an algorithm ID will not compile against V1.85 — signing moved to new commands with new layouts and new ticket types. Migration inventories must find COMMAND usage, not just key types.',
    tryRef: ['builder'],
  },

  // ── T5 — Streaming signatures ────────────────────────────────────────────
  {
    id: 'streaming',
    n: 5,
    tag: 'Stream',
    tone: 'spec',
    title: 'Streaming — why pure ML-DSA must see the message',
    blurb:
      'Classical TPMs hash-then-sign: stream chunks into a hash sequence, sign the 32-byte digest. Pure ML-DSA signs the MESSAGE — hashing first changes the security claim — so V1.85 streams chunks into the signing operation itself. Run both flows.',
    setup:
      'Classical: HashSequenceStart (§17.4) → SequenceUpdate (§17.7) → SequenceComplete (§17.8) → sign the digest. V1.85 PQC: SignSequenceStart (§17.5) → …Complete (§20.6), and on the verify side SequenceUpdate feeds the message before VerifySequenceComplete (§20.3).',
    steps: [
      {
        op: 'TPM2_HashSequenceStart(SHA-256)',
        label: 'Classical: open a hash sequence',
        run: async (ctx) => {
          await ctx.flushAll()
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_HashSequenceStart', ''))
          ctx.chain.hashSeqHandle = getU32(resp, 10)
          return {
            detail: `Sequence object at ${hex8(ctx.chain.hashSeqHandle)} — a transient slot now holds accumulating hash state, not a key. Note this command has NO handles: a stray auth session gets refused (the WS0 probe proved it).`,
          }
        },
      },
      {
        op: 'TPM2_SequenceUpdate + TPM2_SequenceComplete',
        label: 'Classical: feed 64 bytes, close, receive digest + ticket',
        run: async (ctx) => {
          await execOk(ctx, serializeDemoCommand('TPM2_SequenceUpdate', '', 0, ctx.chain))
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_SequenceComplete', '', 0, ctx.chain)
          )
          const digestSize = getU16(resp, 14)
          const digest = resp.slice(16, 16 + digestSize)
          ctx.chain.hashSeqHandle = undefined
          return {
            detail: `Digest ${digestSize} B = ${toHex(digest.slice(0, 8))}… + a TPM_ST_HASHCHECK ticket. Classically you now sign THIS 32-byte digest — the message itself never needs to fit anywhere.`,
          }
        },
      },
      {
        op: 'TPM2_CreatePrimary(ML-DSA-65) + TPM2_SignSequenceStart',
        label: 'PQC: open a SIGNING sequence — the message streams into the signature',
        run: async (ctx) => {
          const ak = await createPrimary(ctx, 'MLDSA-65')
          ctx.chain.handles.mldsa = ak
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_SignSequenceStart', 'MLDSA-65', ak)
          )
          ctx.chain.signSeqHandle = getU32(resp, 10)
          return {
            detail: `signSeqHandle ${hex8(ctx.chain.signSeqHandle)} (Part 3 §17.5, NEW). Pure ML-DSA has no “sign the digest” shortcut — FIPS 204’s security claim is over the message, so the TPM must accumulate it.`,
          }
        },
      },
      {
        op: 'TPM2_SignSequenceComplete',
        label: 'PQC: close the sign sequence — a 3309-byte signature over the streamed message',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand(
              'TPM2_SignSequenceComplete',
              'MLDSA-65',
              ctx.chain.handles.mldsa,
              ctx.chain
            )
          )
          const sigSize = getU16(resp, 16)
          ctx.chain.seqSignature = resp.slice(18, 18 + sigSize)
          ctx.chain.signSeqHandle = undefined
          if (sigSize !== 3309) throw new Error(`Expected 3309 B, got ${sigSize}`)
          return {
            detail: `Signature ${sigSize} B over the accumulated 64-byte message. Sequence handle consumed.`,
          }
        },
      },
      {
        op: 'TPM2_VerifySequenceStart + SequenceUpdate',
        label: 'PQC verify side: stream the SAME message into a verify sequence',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_VerifySequenceStart', 'MLDSA-65', ctx.chain.handles.mldsa)
          )
          ctx.chain.verifySeqHandle = getU32(resp, 10)
          await execOk(ctx, serializeDemoCommand('TPM2_SequenceUpdate', 'MLDSA-65', 0, ctx.chain))
          return {
            detail: `verifySeqHandle ${hex8(ctx.chain.verifySeqHandle)}; 64 message bytes fed via the SAME TPM2_SequenceUpdate command the classical flow used — the sequence machinery is shared, the completion commands differ.`,
          }
        },
      },
      {
        op: 'TPM2_VerifySequenceComplete',
        label: 'PQC: verify — ticket tag TPM_ST_MESSAGE_VERIFIED (0x8026)',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand(
              'TPM2_VerifySequenceComplete',
              'MLDSA-65',
              ctx.chain.handles.mldsa,
              ctx.chain
            )
          )
          const tag = getU16(resp, 14)
          ctx.chain.verifySeqHandle = undefined
          if (tag !== 0x8026)
            throw new Error(`Expected TPM_ST_MESSAGE_VERIFIED (0x8026), got 0x${tag.toString(16)}`)
          return {
            detail: `Verified ✓ — ticket tag 0x8026 (MESSAGE_VERIFIED): provably a message-level verification, distinguishable from digest-level 0x8027. Three ticket tags, three verification semantics, all inspectable on the wire.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'What streams',
        a: 'Message → hash state',
        b: 'Message → signing operation',
        same: false,
      },
      { label: 'What gets signed', a: 'The 32 B digest', b: 'The message itself', same: false },
      {
        label: 'Chunk feeder',
        a: 'TPM2_SequenceUpdate',
        b: 'TPM2_SequenceUpdate (same command!)',
        same: true,
      },
      {
        label: 'Success ticket',
        a: 'HASHCHECK → then sign',
        b: 'MESSAGE_VERIFIED (0x8026)',
        same: false,
      },
    ],
    compareHeaders: ['', 'Classical hash-then-sign', 'V1.85 streaming ML-DSA'],
    notes: [
      'HashML-DSA (0x00A2) exists precisely for callers who NEED hash-then-sign semantics with ML-DSA — FIPS 204 §5.4 defines it as a distinct algorithm with a distinct security claim, not a transparent optimization.',
      'Watch the transient slots: key + one open sequence = 2 of 3 slots. The sign sequence is consumed by its Complete before the verify sequence opens.',
    ],
    whyItMatters:
      'Firmware images and attestation evidence are bigger than one TPM buffer. Classical designs solved this with hash sequences; V1.85’s sign/verify sequences are the PQC answer — and code that assumed “hash first, sign small” must be found and rewritten.',
    tryRef: ['builder'],
  },

  // ── T6 — V2.7 EKs & their certificates ──────────────────────────────────
  {
    id: 'v27-ek-certs',
    n: 6,
    tag: 'EK',
    tone: 'info',
    title: 'Factory identity — V2.7 PQC EKs and their certificates',
    blurb:
      'This TPM was provisioned at “manufacture” (page load) with six V2.7 PQC Endorsement Keys and X.509 certificates in well-known NV slots. Find them with live queries — persistent handles first, then the DER certificate bytes themselves.',
    setup:
      'The published TCG EK Credential Profile v2.7 defines PQC EK templates, their persistent handles, and NV certificate slots (§5.3.1: 0x01C00060–0x01C00074). An EK cert is the manufacturer’s signed claim “this public key lives in a genuine TPM” — the root of remote attestation.',
    steps: [
      {
        op: 'TPM2_GetCapability(TPM_CAP_HANDLES, persistent)',
        label: 'Enumerate persistent handles — the factory-provisioned EKs',
        run: async (ctx) => {
          const resp = await execOk(ctx, buildGetCapabilityCmd(TPM_CAP_HANDLES, 0x81000000, 16))
          const count = getU32(resp, 15)
          const handles: number[] = []
          for (let i = 0; i < count; i++) handles.push(getU32(resp, 19 + i * 4))
          if (count === 0) {
            throw new Error(
              'No persistent handles found — V2.7 provisioning did not run (PQC bridge unavailable at boot?)'
            )
          }
          return {
            detail: `${count} persistent handle(s): ${handles.map(hex8).join(', ')}. The V2.7 EKs live at 0x810100B0–B6 — created at boot, surviving “restarts”, never created by anything you clicked.`,
          }
        },
      },
      {
        op: 'TPM2_NV_ReadPublic + chunked TPM2_NV_Read',
        label: 'Read the ML-DSA-65 EK certificate out of NV slot 0x01C00072',
        run: async (ctx) => {
          const der = await ctx.nvReadAll(0x01c00072)
          if (der.length < 4 || der[0] !== 0x30) {
            throw new Error(
              `NV slot 0x01C00072 does not hold a DER certificate (${der.length} B, first byte 0x${der[0]?.toString(16) ?? '—'})`
            )
          }
          return {
            detail: `${der.length} B from NV — starts 0x30 0x82 (a DER SEQUENCE): a real X.509 certificate, read with the same §31.13 chunked NV_Read flow real attestation software uses. The EK Certs tab parses it fully.`,
          }
        },
      },
      {
        op: 'TPM2_ReadPublic(0x810100B5)',
        label: 'Read the ML-DSA-65 EK public key and confirm its 1952-byte size',
        run: async (ctx) => {
          // §12.4 — large response (ML-DSA pk), so use the large-buffer path.
          const cmd = serializeDemoCommand('TPM2_ReadPublic', 'MLDSA-65', 0x810100b5)
          const resp = await ctx.execLarge(cmd, 8192)
          const { rc } = parseRespHeader(resp)
          if (rc !== 0) {
            const info = getRcInfo(rc)
            throw new Error(`${info.name} (${formatRc(rc)}) — is the V2.7 EK provisioned?`)
          }
          // Body: outPublic TPM2B @10: size(2) + TPMT_PUBLIC{type,nameAlg,attrs,policySize,policy…}
          const policySize = getU16(resp, 20)
          // unique TPM2B after policy + MLDSA parms (paramSet 2 + allowExternalMu 1)
          const uniqueOff = 22 + policySize + 3
          const pkSize = getU16(resp, uniqueOff)
          if (pkSize !== 1952) throw new Error(`Expected 1952 B ML-DSA-65 pk, got ${pkSize} B`)
          return {
            detail: `EK public key ${pkSize} B (FIPS 204 ML-DSA-65) under a ${policySize}-byte auth policy (the V2.7 policyB). This is the key the NV certificate certifies.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'EK algorithm',
        a: 'RSA-2048 (classical profile)',
        b: 'ML-KEM / ML-DSA ×6 (V2.7)',
        same: false,
      },
      { label: 'Cert NV slots', a: '0x01C00002 (RSA)', b: '0x01C00060–74 (§5.3.1)', same: false },
      {
        label: 'Discovery flow',
        a: 'GetCapability + NV_Read',
        b: 'GetCapability + NV_Read (same)',
        same: true,
      },
    ],
    compareHeaders: ['', 'Classical EK provisioning', 'V2.7 PQC profile'],
    notes: [
      'Honesty note (shown in the EK Certs tab too): the issuer here is an EPHEMERAL dev CA created in your browser — educational, not a production trust anchor. V2.7 deliberately doesn’t mandate a CA hierarchy.',
      'The classical RSA EK cert slot value (0x01C00002) comes from the pre-V2.7 EK profile lineage and is cited here for contrast, not read live — this build provisions only the V2.7 PQC slots.',
    ],
    whyItMatters:
      'Attestation software finds EK certs by convention: well-known NV indices. The V2.7 profile extends the convention to PQC — and the queries you just ran are exactly how relying parties will discover whether a fleet TPM carries PQC identity.',
    tryRef: ['v27-eks', 'v27-certs'],
  },

  // ── T7 — Attestation (capstone) ──────────────────────────────────────────
  {
    id: 'attestation',
    n: 7,
    tag: 'Quote',
    tone: 'primary',
    title: 'Attestation — the point of a TPM, in both eras (capstone)',
    blurb:
      'Quote platform state with a classical restricted RSA AK, then with ML-DSA — reusing everything the track taught: restricted keys, pinned schemes, PCRs, signatures, and ticket semantics.',
    setup:
      'TPM2_Quote (§18.4) signs a TPMS_ATTEST over selected PCR values with a RESTRICTED signing key — restricted so relying parties know the TPM itself produced the report. A restricted signer pins its scheme at creation; Quote with inScheme=NULL inherits it.',
    steps: [
      {
        op: 'TPM2_CreatePrimary(RSA-2048 restricted AK)',
        label: 'Classical: a restricted AK — scheme pinned, symmetric NULL',
        run: async (ctx) => {
          await ctx.flushAll()
          const ak = await createPrimary(ctx, 'RSA-2048-AK')
          ctx.chain.handles.rsaAk = ak
          return {
            detail: `Restricted RSA AK at ${hex8(ak)} with RSASSA/SHA-256 PINNED at creation (a restricted signer must fix its scheme — and keep symmetric=NULL: the WS0 probe’s AES-block attempt was refused with TPM_RC_SYMMETRIC).`,
          }
        },
      },
      {
        op: 'TPM2_Quote (RSA AK, inScheme=NULL)',
        label: 'Classical: quote PCR 0 — the key’s own scheme takes over',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand('TPM2_Quote', 'RSA-2048-AK', ctx.chain.handles.rsaAk)
          )
          const quotedSize = getU16(resp, 14)
          const sigAlg = getU16(resp, 16 + quotedSize)
          const sigSize = getU16(resp, 20 + quotedSize)
          return {
            detail: `TPMS_ATTEST ${quotedSize} B + RSASSA signature ${sigSize} B (sigAlg 0x${sigAlg.toString(16)}, inherited from the pinned scheme via inScheme=NULL). The attest structure begins with TPM_GENERATED — proof no caller supplied it.`,
          }
        },
      },
      {
        op: 'TPM2_CreatePrimary(ML-DSA-65) + TPM2_Quote',
        label: 'Post-quantum: the same quote, signed with ML-DSA-65',
        run: async (ctx) => {
          await ctx.flushAll()
          const ak = await createPrimary(ctx, 'MLDSA-65')
          ctx.chain.handles.mldsa = ak
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_Quote', 'MLDSA-65', ak))
          const quotedSize = getU16(resp, 14)
          const sigAlg = getU16(resp, 16 + quotedSize)
          const sigSize = getU16(resp, 18 + quotedSize)
          if (sigSize !== 3309) throw new Error(`Expected 3309 B ML-DSA signature, got ${sigSize}`)
          return {
            detail: `TPMS_ATTEST ${quotedSize} B + ML-DSA signature ${sigSize} B (sigAlg 0x${sigAlg.toString(16)}). Same attest structure, ~13× the signature. Errata §2.6: with a schemeless pure-ML-DSA key, pcrDigest uses the key’s NAME algorithm — nameAlg stops being “just metadata”.`,
          }
        },
      },
    ],
    compare: [
      { label: 'AK type', a: 'RSA-2048 restricted', b: 'ML-DSA-65', same: false },
      { label: 'Quote signature', a: '256 B', b: '3309 B', same: false },
      {
        label: 'Attest structure',
        a: 'TPMS_ATTEST + PCR digest',
        b: 'TPMS_ATTEST + PCR digest (same)',
        same: true,
      },
      { label: 'Evidence per attestation', a: '~0.5 KB', b: '~3.8 KB', same: false },
    ],
    compareHeaders: ['', 'Classical Quote', 'V1.85 ML-DSA Quote'],
    notes: [
      'The Attestation tab does the full relying-party side — independent signature verification and a downloadable JSON evidence bundle you can verify outside the browser.',
      'Restricted + pinned scheme is the attestation trust argument: the key CANNOT sign arbitrary caller data, so a valid Quote signature proves the TPM generated the report.',
    ],
    whyItMatters:
      'Attestation is why TPMs exist: proving platform state to someone who doesn’t trust the platform. Every size you measured propagates into fleet evidence pipelines — 7–8× more bytes per attestation is an infrastructure line item, not a rounding error.',
    tryRef: ['attestation'],
  },

  // ── T8 — An honest TPM ───────────────────────────────────────────────────
  {
    id: 'honest-tpm',
    n: 8,
    tag: 'Audit',
    tone: 'warn',
    title: 'An honest TPM — detect fake crypto and spec drift yourself',
    blurb:
      'A 2026 audit of this very playground found silent-placeholder risks and a compliance suite that could report a false 100%. This lesson turns those checks into things YOU run: placeholder detection, bridge status, and a live spec-vs-engine drift check.',
    setup:
      'This engine’s PQC math runs through a crypto bridge to a real ML-KEM/ML-DSA implementation. If that bridge failed to load, commands would still “work” — returning placeholder bytes. Trust, then verify: the same discipline the CACP playground’s Lesson 9 teaches at the KMS layer.',
    steps: [
      {
        op: 'getPqcBridgeStatus()',
        label: 'Ask the playground what crypto it is actually running',
        run: async (ctx) => {
          const status = ctx.bridgeStatus()
          if (status === 'unavailable') {
            throw new Error(
              'PQC bridge UNAVAILABLE — every PQC result this session is a placeholder. The banner above says the same: the playground refuses to pretend.'
            )
          }
          return {
            detail: `Bridge status: ${status.toUpperCase()} — the top-of-page badge and this call read the same source. Before the 2026-07-23 fixes, a failed bridge was a console warning and nothing else.`,
          }
        },
      },
      {
        op: 'TPM2_Encapsulate/Decapsulate — placeholder detector',
        label: 'Prove the KEM output is not the 0xDD placeholder pattern',
        run: async (ctx) => {
          await ctx.flushAll()
          const kem = await createPrimary(ctx, 'MLKEM-768')
          ctx.chain.handles.mlkem = kem
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_Encapsulate', 'MLKEM-768', kem))
          const ssSize = getU16(resp, 10)
          const ss = resp.slice(12, 12 + ssSize)
          const ctSize = getU16(resp, 12 + ssSize)
          ctx.chain.ciphertext = resp.slice(14 + ssSize, 14 + ssSize + ctSize)
          if (ss.every((b) => b === 0xdd)) {
            throw new Error('Shared secret is all 0xDD — placeholder stubs active, NOT real ML-KEM')
          }
          return {
            detail: `ss[0..7]=${toHex(ss.slice(0, 8))} — non-trivial bytes, not the 0xDD stub pattern. This is the Compliance Suite’s V185-017 check, run by hand.`,
          }
        },
      },
      {
        op: 'TPM2_SignDigest — placeholder detector',
        label: 'Prove the ML-DSA signature is not the 0xEE placeholder pattern',
        run: async (ctx) => {
          const ak = await createPrimary(ctx, 'MLDSA-65')
          ctx.chain.handles.mldsa = ak
          const resp = await execOk(ctx, serializeDemoCommand('TPM2_SignDigest', 'MLDSA-65', ak))
          const sigSize = getU16(resp, 16)
          const sig = resp.slice(18, 18 + sigSize)
          ctx.chain.digestSignature = sig
          if (sig.every((b) => b === 0xee)) {
            throw new Error('Signature is all 0xEE — placeholder stub active, NOT real ML-DSA')
          }
          return {
            detail: `sig[0..7]=${toHex(sig.slice(0, 8))}, ${sigSize} B — real lattice signature (V185-018 by hand). A stub that returns success is worse than an error: it teaches you to trust nothing happened.`,
          }
        },
      },
      {
        op: 'TPM2_VerifyDigestSignature — spec-drift check',
        label: 'Observe live where this engine diverges from the published spec',
        run: async (ctx) => {
          const resp = await execOk(
            ctx,
            serializeDemoCommand(
              'TPM2_VerifyDigestSignature',
              'MLDSA-65',
              ctx.chain.handles.mldsa,
              { digestSignature: ctx.chain.digestSignature }
            )
          )
          const tag = getU16(resp, 10)
          const observed = `0x${tag.toString(16)}`
          if (tag !== 0x8027) {
            return {
              detail: `Ticket tag ${observed} — NOT the RC4-era DIGEST_VERIFIED: this build appears to implement errata §2.5’s NULL-ticket preference. Spec drift resolved.`,
            }
          }
          return {
            detail: `Ticket tag ${observed} (TPM_ST_DIGEST_VERIFIED) — the RC4-era behavior. The PUBLISHED errata (v1 §2.5, 2026-03-12) says a conforming TPM SHOULD return a NULL ticket for external-µ verification instead. You just detected spec-vs-engine drift with your own command — the engine was built from RC4 (Dec 2025) and hasn’t caught up. THAT is what auditing an implementation against a moving standard looks like.`,
          }
        },
      },
    ],
    compare: [
      {
        label: 'Bridge status',
        a: 'console.warn only',
        b: 'Top-level badge + this lesson',
        same: false,
      },
      {
        label: 'Placeholder crypto',
        a: 'Detectable only in Compliance Suite',
        b: 'You just detected it by hand',
        same: false,
      },
      {
        label: 'Suite pass-rate math',
        a: 'Could report false N/N',
        b: 'Aborts surface as “not run”',
        same: false,
      },
    ],
    compareHeaders: ['', 'Before 2026-07-23 audit', 'After'],
    notes: [
      'The full 24-check TCG V1.85 Compliance Suite (Command Builder tab, left column) runs these detectors plus 20 more, with a pass-rate that can no longer silently shrink its denominator.',
      'Every claim in this curriculum is falsifiable with commands you now know: capability queries, byte-size checks, ticket tags, placeholder patterns. Distrust any playground that can’t show you this.',
    ],
    whyItMatters:
      'PQC migration will be full of half-implementations: bridges that silently fail, stubs that return success, engines trailing their specs. The skill this track leaves you with is not “ML-KEM is 1184 bytes” — it is knowing how to make a cryptographic system PROVE what it is actually doing.',
    tryRef: ['builder'],
  },
]
