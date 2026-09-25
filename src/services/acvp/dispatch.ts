// SPDX-License-Identifier: GPL-3.0-only
/**
 * Dispatch (F-3): IR → execution plan → per-test results.
 *
 * `planVectorSet` is PURE and engine-independent: it decides, from the IR
 * alone, which tests this prototype can execute and which are structurally
 * unsupported (with the reason). `executePlan` then hands each executable
 * item to the injected engine, which may add engine-specific `unsupported`
 * (mechanism not advertised) or `error` (unexpected PKCS#11 return value).
 * Nothing is ever defaulted: an option the plan cannot map exactly is
 * `unsupported`, and an engine failure is `error` — neither yields a response
 * value.
 *
 * ── IR → plan rules (normative for every runner) ───────────────────────────
 * D1  ML-KEM/encapDecap/FIPS203, function "decapsulation" (testType VAL):
 *     operation "ml-kem.decapsulate" {parameterSet, dk, c} → response field k.
 * D2  ML-KEM function "encapsulation" (AFT): unsupported (group) — needs the
 *     server-chosen m; PKCS#11 C_EncapsulateKey has no input for it.
 * D3  ML-KEM "encapsulationKeyCheck"/"decapsulationKeyCheck": unsupported (group).
 * D4  ML-DSA/sigVer/FIPS204, signatureInterface "external", preHash "pure":
 *     operation "ml-dsa.verify" via CKM_ML_DSA, context from the test → testPassed.
 * D5  … preHash "preHash": same via CKM_HASH_ML_DSA_<hash> by HASH_ALG_TO_MECHANISM;
 *     a hashAlg with no PKCS#11 v3.2 mechanism is unsupported (test).
 * D6  ML-DSA signatureInterface "internal" (either externalMu value): unsupported (group).
 * D7  Engine outcome → value: decapsulation CKR_OK → k = upper-case hex of the
 *     derived secret's CKA_VALUE; verification CKR_OK → testPassed true,
 *     CKR_SIGNATURE_INVALID / CKR_SIGNATURE_LEN_RANGE → false; any other
 *     return value → error (no response entry). A mechanism the engine does not
 *     list in C_GetMechanismList → unsupported (test), not called.
 */
import type { AcvpPromptIR, JsonObject, SupportedSchemaId } from './ir'

export const PLAN_VERSION = 'pqctoday.acvp-plan/1'

export type MlKemParameterSet = 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'
export type MlDsaParameterSet = 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'

export type Pkcs11MechanismName =
  | 'CKM_ML_KEM'
  | 'CKM_ML_DSA'
  | 'CKM_HASH_ML_DSA_SHA224'
  | 'CKM_HASH_ML_DSA_SHA256'
  | 'CKM_HASH_ML_DSA_SHA384'
  | 'CKM_HASH_ML_DSA_SHA512'
  | 'CKM_HASH_ML_DSA_SHA3_224'
  | 'CKM_HASH_ML_DSA_SHA3_256'
  | 'CKM_HASH_ML_DSA_SHA3_384'
  | 'CKM_HASH_ML_DSA_SHA3_512'
  | 'CKM_HASH_ML_DSA_SHAKE128'
  | 'CKM_HASH_ML_DSA_SHAKE256'

/**
 * ACVP hashAlg → PKCS#11 v3.2 HashML-DSA mechanism. SHA2-512/224 and
 * SHA2-512/256 are ACVP hashAlgs with NO CKM_HASH_ML_DSA_* counterpart in
 * PKCS#11 v3.2, so they are absent on purpose (→ unsupported, D5).
 */
export const HASH_ALG_TO_MECHANISM: Readonly<Record<string, Pkcs11MechanismName>> = {
  'SHA2-224': 'CKM_HASH_ML_DSA_SHA224',
  'SHA2-256': 'CKM_HASH_ML_DSA_SHA256',
  'SHA2-384': 'CKM_HASH_ML_DSA_SHA384',
  'SHA2-512': 'CKM_HASH_ML_DSA_SHA512',
  'SHA3-224': 'CKM_HASH_ML_DSA_SHA3_224',
  'SHA3-256': 'CKM_HASH_ML_DSA_SHA3_256',
  'SHA3-384': 'CKM_HASH_ML_DSA_SHA3_384',
  'SHA3-512': 'CKM_HASH_ML_DSA_SHA3_512',
  'SHAKE-128': 'CKM_HASH_ML_DSA_SHAKE128',
  'SHAKE-256': 'CKM_HASH_ML_DSA_SHAKE256',
}

export interface MlKemDecapsulateOp {
  operation: 'ml-kem.decapsulate'
  mechanism: 'CKM_ML_KEM'
  parameterSet: MlKemParameterSet
  dk: string
  c: string
}

export interface MlDsaVerifyOp {
  operation: 'ml-dsa.verify'
  mechanism: Pkcs11MechanismName
  parameterSet: MlDsaParameterSet
  pk: string
  message: string
  signature: string
  /** Hex; empty string = empty context (FIPS 204 ctx of length 0). */
  context: string
  /** The ACVP hashAlg for HashML-DSA, or null for pure ML-DSA. */
  hashAlg: string | null
}

export type PlanOperation = MlKemDecapsulateOp | MlDsaVerifyOp

export type ResponseField = 'k' | 'testPassed'

export type PlanItem =
  | { tgId: number; tcId: number; kind: 'execute'; op: PlanOperation; responseField: ResponseField }
  | { tgId: number; tcId: number; kind: 'unsupported'; scope: 'group' | 'test'; reason: string }

export interface ExecutionPlan {
  planVersion: typeof PLAN_VERSION
  schemaId: SupportedSchemaId
  vsId: number
  items: PlanItem[]
}

export const UNSUPPORTED_REASONS = {
  mlKemEncapsulation:
    'ML-KEM encapsulation AFT needs the server-chosen m (FIPS 203 ML-KEM.Encaps_internal); PKCS#11 v3.2 C_EncapsulateKey draws m from the token RNG and has no input for it, and this prototype uses no randomness-injection seam.',
  mlKemKeyCheck:
    'FIPS 203 §7.2/§7.3 key checks are not a PKCS#11 operation; reading a C_CreateObject return code as testPassed would be an inference about engine behaviour. Outside the bounded prototype (one ML-KEM operation: decapsulation).',
  mlDsaInternal:
    'signatureInterface "internal" is ML-DSA.Verify_internal (FIPS 204 Alg. 8, message or external mu); PKCS#11 v3.2 CKM_ML_DSA / CKM_HASH_ML_DSA_* implement only the external ML-DSA.Verify / HashML-DSA.Verify interface (Alg. 3/5).',
  mlDsaHashAlg: (h: string) =>
    `hashAlg "${h}" has no PKCS#11 v3.2 CKM_HASH_ML_DSA_* mechanism (only SHA2-224/256/384/512, SHA3-224/256/384/512, SHAKE-128/256 do).`,
} as const

const str = (o: JsonObject, k: string): string => o[k] as string

/** Pure: IR → plan (rules D1–D6). */
export const planVectorSet = (ir: AcvpPromptIR): ExecutionPlan => {
  const items: PlanItem[] = []
  for (const g of ir.testGroups) {
    const p = g.properties
    const groupUnsupported = (reason: string) => {
      for (const t of g.tests) {
        items.push({ tgId: g.tgId, tcId: t.tcId, kind: 'unsupported', scope: 'group', reason })
      }
    }
    if (ir.schemaId === 'ML-KEM/encapDecap/FIPS203') {
      const fn = str(p, 'function')
      if (fn === 'decapsulation') {
        for (const t of g.tests) {
          items.push({
            tgId: g.tgId,
            tcId: t.tcId,
            kind: 'execute',
            responseField: 'k',
            op: {
              operation: 'ml-kem.decapsulate',
              mechanism: 'CKM_ML_KEM',
              parameterSet: str(p, 'parameterSet') as MlKemParameterSet,
              dk: str(t.fields, 'dk'),
              c: str(t.fields, 'c'),
            },
          })
        }
      } else if (fn === 'encapsulation') {
        groupUnsupported(UNSUPPORTED_REASONS.mlKemEncapsulation)
      } else {
        groupUnsupported(UNSUPPORTED_REASONS.mlKemKeyCheck)
      }
    } else {
      if (str(p, 'signatureInterface') !== 'external') {
        groupUnsupported(UNSUPPORTED_REASONS.mlDsaInternal)
        continue
      }
      const preHash = str(p, 'preHash') === 'preHash'
      for (const t of g.tests) {
        const hashAlg = preHash ? str(t.fields, 'hashAlg') : null
        const mechanism: Pkcs11MechanismName | undefined = hashAlg
          ? HASH_ALG_TO_MECHANISM[hashAlg]
          : 'CKM_ML_DSA'
        if (!mechanism) {
          items.push({
            tgId: g.tgId,
            tcId: t.tcId,
            kind: 'unsupported',
            scope: 'test',
            reason: UNSUPPORTED_REASONS.mlDsaHashAlg(hashAlg as string),
          })
          continue
        }
        items.push({
          tgId: g.tgId,
          tcId: t.tcId,
          kind: 'execute',
          responseField: 'testPassed',
          op: {
            operation: 'ml-dsa.verify',
            mechanism,
            parameterSet: str(p, 'parameterSet') as MlDsaParameterSet,
            pk: str(t.fields, 'pk'),
            message: str(t.fields, 'message'),
            signature: str(t.fields, 'signature'),
            context: str(t.fields, 'context'),
            hashAlg,
          },
        })
      }
    }
  }
  return { planVersion: PLAN_VERSION, schemaId: ir.schemaId, vsId: ir.vsId, items }
}

// ── Engine interface (injected) ─────────────────────────────────────────────

export interface EngineIdentity {
  /** Short id used in file names and CLI flags. */
  id: 'cpp' | 'rust' | string
  label: string
  /** e.g. "softhsmv3 C++ (Emscripten WASM)". */
  implementation: string
  softhsmProductVersion: string | null
  /** Bundle name in public/wasm/wasm-provenance.json. */
  provenanceBundle: string | null
  hsmCommit: string | null
  builtAt: string | null
  artifactPath: string | null
  artifactSha256: string | null
  /** How artifactSha256 was obtained, or why it is null. */
  artifactSha256Note: string
}

export type EngineOutcome =
  | { status: 'ok'; value: string | boolean; detail?: string }
  | { status: 'unsupported'; reason: string }
  | { status: 'error'; reason: string }

export interface AcvpEngine {
  readonly identity: EngineIdentity
  execute(op: PlanOperation): EngineOutcome
  close(): void
}

export type CaseDisposition = 'answered' | 'unsupported' | 'error'

export interface CaseResult {
  tgId: number
  tcId: number
  disposition: CaseDisposition
  responseField?: ResponseField
  value?: string | boolean
  scope?: 'group' | 'test' | 'engine'
  reason?: string
  /** Engine-side note (e.g. the PKCS#11 return value that produced testPassed=false). */
  detail?: string
}

/** Run every executable plan item on the engine; carry plan-level unsupported through. */
export const executePlan = (
  plan: ExecutionPlan,
  engine: AcvpEngine,
  onProgress?: (done: number, total: number) => void
): CaseResult[] => {
  const results: CaseResult[] = []
  plan.items.forEach((item, i) => {
    if (item.kind === 'unsupported') {
      results.push({
        tgId: item.tgId,
        tcId: item.tcId,
        disposition: 'unsupported',
        scope: item.scope,
        reason: item.reason,
      })
    } else {
      let outcome: EngineOutcome
      try {
        outcome = engine.execute(item.op)
      } catch (e) {
        outcome = { status: 'error', reason: e instanceof Error ? e.message : String(e) }
      }
      if (outcome.status === 'ok') {
        results.push({
          tgId: item.tgId,
          tcId: item.tcId,
          disposition: 'answered',
          responseField: item.responseField,
          value: outcome.value,
          ...(outcome.detail ? { detail: outcome.detail } : {}),
        })
      } else if (outcome.status === 'unsupported') {
        results.push({
          tgId: item.tgId,
          tcId: item.tcId,
          disposition: 'unsupported',
          scope: 'engine',
          reason: outcome.reason,
        })
      } else {
        results.push({
          tgId: item.tgId,
          tcId: item.tcId,
          disposition: 'error',
          reason: outcome.reason,
        })
      }
    }
    onProgress?.(i + 1, plan.items.length)
  })
  return results
}
