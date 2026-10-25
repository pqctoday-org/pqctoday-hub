// SPDX-License-Identifier: AGPL-3.0-only
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
 * D6  ML-DSA signatureInterface "internal", externalMu true: operation
 *     "ml-dsa.verify-external-mu" {parameterSet, pk, mu, signature} via the
 *     VENDOR-DEFINED mechanism CKM_ML_DSA_EXTERNAL_MU (0x0000403c, pqctoday-hsm
 *     src/lib/vendor_mechanisms.h / rust/src/constants.rs — not PKCS#11 v3.2):
 *     C_VerifyInit(no parameter) + C_Verify(data = mu) → testPassed.
 * D6b ML-DSA signatureInterface "internal", externalMu false: unsupported
 *     (group) — raw M′ (ML-DSA.Verify_internal on a message) has no PKCS#11 path.
 * D7  Engine outcome → value: decapsulation CKR_OK → k = upper-case hex of the
 *     derived secret's CKA_VALUE; verification CKR_OK → testPassed true,
 *     CKR_SIGNATURE_INVALID / CKR_SIGNATURE_LEN_RANGE → false; any other
 *     return value → error (no response entry). A mechanism the engine does not
 *     list in C_GetMechanismList → unsupported (test), not called.
 *
 * ── Plan profiles ──────────────────────────────────────────────────────────
 * `planVectorSet(ir, 'bounded')` (the default, plan version 1) applies D1–D7
 * exactly as above. The cross-platform runner (tools/acvp-native, acvp-xplat)
 * mirrors that plan and rejects any other plan version, so it stays on it.
 * `planVectorSet(ir, 'extended')` (plan version 2, used by the Step 3 panel,
 * the Developer tab and `acvp-respond --profile extended`) keeps D1, D4, D6
 * and replaces D2, D3, D5 (SHA2-512/t) and D6b:
 * X1  encapsulation (AFT): operation "ml-kem.encapsulate" {parameterSet, ek, m}.
 *     m is passed as the CKM_ML_KEM mechanism parameter — a TEST-ONLY pqctoday-hsm
 *     extension outside PKCS#11 (ACVP explicit-randomness model; a production
 *     module must refuse a caller-chosen m). → response fields c and k;
 *     inputKind "test-input-m". The engine adapter first proves that the engine
 *     honours m (same m twice → identical output) and otherwise answers
 *     nothing (unsupported).
 * X2  key checks: operation "ml-kem.key-check" {parameterSet, keyKind, key}. The
 *     key is imported with C_CreateObject: CKR_OK → testPassed true; exactly
 *     CKR_ATTRIBUTE_VALUE_INVALID → false; any other return value → error.
 *     inputKind "key-import-result".
 * X3  ML-DSA "internal" with externalMu false: mu = SHAKE256(SHAKE256(pk,64) ‖ M′,
 *     64) is computed here (testInputs.mlDsaMu) and the case becomes
 *     "ml-dsa.verify-external-mu" (vendor mechanism, as D6). inputKind "computed-mu".
 * X4  preHash with SHA2-512/224 or SHA2-512/256: operation "ml-dsa.verify" via the
 *     generic CKM_HASH_ML_DSA, with SHA-512/224 or SHA-512/256 as the hash (an allowance of
 *     the PKCS#11 v3.3 working draft; v3.2 has no hash-specific mechanism for them), named in
 *     CK_HASH_SIGN_ADDITIONAL_CONTEXT and PH(M) computed here (data = PH(M)).
 *     inputKind "computed-ph".
 */
import { bytesToUpperHex, hexToBytes } from './ir'
import type { AcvpPromptIR, JsonObject, SupportedSchemaId } from './ir'
import { isSha512t, mlDsaMu, preHashSha512t } from './testInputs'

export const PLAN_VERSION = 'pqctoday.acvp-plan/1'
/** Plan version of the `extended` profile (see "Plan profiles" above). */
export const PLAN_VERSION_EXTENDED = 'pqctoday.acvp-plan/2'

export type PlanProfile = 'bounded' | 'extended'

/**
 * How an answered case obtained its value, when it is not the plain standard
 * path. Absent (undefined) = standard PKCS#11 call over the prompt's own inputs.
 */
export type InputKind = 'test-input-m' | 'computed-mu' | 'computed-ph' | 'key-import-result'

export type MlKemParameterSet = 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'
export type MlDsaParameterSet = 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'

export type Pkcs11MechanismName =
  | 'CKM_ML_KEM'
  | 'CKM_ML_DSA'
  /** Generic HashML-DSA with a SHA-512/t hash (PKCS#11 v3.3 working-draft allowance): the hash is named in the mechanism parameter, data = PH(M). */
  | 'CKM_HASH_ML_DSA'
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
  /** Vendor-defined by pqctoday-hsm (0x0000403c) — NOT a PKCS#11 v3.2 mechanism. */
  | 'CKM_ML_DSA_EXTERNAL_MU'

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
  /**
   * Extended profile only: the hash named in CK_HASH_SIGN_ADDITIONAL_CONTEXT when the
   * generic CKM_HASH_ML_DSA carries a SHA-512/t hash; `message` is then PH(M), not M.
   */
  hashMechanism?: 'CKM_SHA512_224' | 'CKM_SHA512_256'
}

/** Extended profile: ML-KEM encapsulation with the server-chosen m (test-only mechanism parameter). */
export interface MlKemEncapsulateOp {
  operation: 'ml-kem.encapsulate'
  mechanism: 'CKM_ML_KEM'
  parameterSet: MlKemParameterSet
  ek: string
  m: string
}

/** Extended profile: FIPS 203 §7.2/§7.3 key check, read from the C_CreateObject result. */
export interface MlKemKeyCheckOp {
  operation: 'ml-kem.key-check'
  mechanism: 'CKM_ML_KEM'
  parameterSet: MlKemParameterSet
  keyKind: 'ek' | 'dk'
  key: string
}

export interface MlDsaVerifyExternalMuOp {
  operation: 'ml-dsa.verify-external-mu'
  mechanism: 'CKM_ML_DSA_EXTERNAL_MU'
  /** Always true: this mechanism is pqctoday-hsm vendor-defined, not PKCS#11 v3.2. */
  vendorDefined: true
  parameterSet: MlDsaParameterSet
  pk: string
  mu: string
  signature: string
}

/** Vendor-defined mechanisms this prototype may dispatch, with their CK_MECHANISM_TYPE. */
export const VENDOR_DEFINED_MECHANISMS: Readonly<
  Partial<Record<Pkcs11MechanismName, { value: string; source: string }>>
> = {
  CKM_ML_DSA_EXTERNAL_MU: {
    value: '0x0000403c',
    source:
      'pqctoday-hsm src/lib/vendor_mechanisms.h + rust/src/constants.rs (not in the PKCS#11 v3.2 mechanism list; carried in the PKCS#11 v3.3 draft)',
  },
}

export type PlanOperation =
  | MlKemDecapsulateOp
  | MlDsaVerifyOp
  | MlDsaVerifyExternalMuOp
  | MlKemEncapsulateOp
  | MlKemKeyCheckOp

/** The primary response field; an encapsulation answer also carries `c` (see EngineOutcome.extra). */
export type ResponseField = 'k' | 'testPassed'

export type PlanItem =
  | {
      tgId: number
      tcId: number
      kind: 'execute'
      op: PlanOperation
      responseField: ResponseField
      /** Extended profile only; absent = the standard path. */
      inputKind?: InputKind
    }
  | { tgId: number; tcId: number; kind: 'unsupported'; scope: 'group' | 'test'; reason: string }

export interface ExecutionPlan {
  planVersion: typeof PLAN_VERSION | typeof PLAN_VERSION_EXTENDED
  schemaId: SupportedSchemaId
  vsId: number
  items: PlanItem[]
}

export const UNSUPPORTED_REASONS = {
  mlKemEncapsulation:
    'ML-KEM encapsulation AFT needs the server-chosen m (FIPS 203 ML-KEM.Encaps_internal); PKCS#11 v3.2 C_EncapsulateKey draws m from the token RNG and has no input for it, so the standard PKCS#11 path cannot answer this test.',
  mlKemKeyCheck:
    'FIPS 203 §7.2/§7.3 key checks are not a standard PKCS#11 operation; reading a C_CreateObject return code as testPassed would be an inference about engine behaviour, so the standard PKCS#11 path cannot answer this test.',
  mlDsaInternal:
    'signatureInterface "internal" with externalMu false is ML-DSA.Verify_internal on a raw message M′ (FIPS 204 Alg. 8); no PKCS#11 mechanism (standard or pqctoday-hsm vendor) takes M′ — CKM_ML_DSA / CKM_HASH_ML_DSA_* implement the external interface and the vendor CKM_ML_DSA_EXTERNAL_MU takes mu.',
  mlDsaHashAlg: (h: string) =>
    `hashAlg "${h}" has no PKCS#11 v3.2 CKM_HASH_ML_DSA_* mechanism (only SHA2-224/256/384/512, SHA3-224/256/384/512, SHAKE-128/256 do).`,
  /** Extended profile, raised by the engine adapter when its probe shows the supplied m is not honoured. */
  engineIgnoredSuppliedM:
    "The engine did not honour the supplied m (the same m gave two different ciphertexts), so no encapsulation answer is given: a value produced without NIST's m could never match.",
} as const

const str = (o: JsonObject, k: string): string => o[k] as string

/**
 * Pure: IR → plan. `bounded` (default) is rules D1–D6b; `extended` replaces
 * D2, D3, D5 (SHA2-512/t) and D6b by X1–X4 (see the header).
 */
export const planVectorSet = (
  ir: AcvpPromptIR,
  profile: PlanProfile = 'bounded'
): ExecutionPlan => {
  const extended = profile === 'extended'
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
      const parameterSet = str(p, 'parameterSet') as MlKemParameterSet
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
              parameterSet,
              dk: str(t.fields, 'dk'),
              c: str(t.fields, 'c'),
            },
          })
        }
      } else if (fn === 'encapsulation') {
        if (!extended) {
          groupUnsupported(UNSUPPORTED_REASONS.mlKemEncapsulation)
          continue
        }
        for (const t of g.tests) {
          items.push({
            tgId: g.tgId,
            tcId: t.tcId,
            kind: 'execute',
            responseField: 'k',
            inputKind: 'test-input-m',
            op: {
              operation: 'ml-kem.encapsulate',
              mechanism: 'CKM_ML_KEM',
              parameterSet,
              ek: str(t.fields, 'ek'),
              m: str(t.fields, 'm'),
            },
          })
        }
      } else {
        if (!extended) {
          groupUnsupported(UNSUPPORTED_REASONS.mlKemKeyCheck)
          continue
        }
        const keyKind = fn === 'encapsulationKeyCheck' ? 'ek' : 'dk'
        for (const t of g.tests) {
          items.push({
            tgId: g.tgId,
            tcId: t.tcId,
            kind: 'execute',
            responseField: 'testPassed',
            inputKind: 'key-import-result',
            op: {
              operation: 'ml-kem.key-check',
              mechanism: 'CKM_ML_KEM',
              parameterSet,
              keyKind,
              key: str(t.fields, keyKind),
            },
          })
        }
      }
    } else {
      if (str(p, 'signatureInterface') !== 'external') {
        if (p.externalMu !== true && !extended) {
          groupUnsupported(UNSUPPORTED_REASONS.mlDsaInternal)
          continue
        }
        const computeMu = p.externalMu !== true
        for (const t of g.tests) {
          items.push({
            tgId: g.tgId,
            tcId: t.tcId,
            kind: 'execute',
            responseField: 'testPassed',
            ...(computeMu ? { inputKind: 'computed-mu' as const } : {}),
            op: {
              operation: 'ml-dsa.verify-external-mu',
              mechanism: 'CKM_ML_DSA_EXTERNAL_MU',
              vendorDefined: true,
              parameterSet: str(p, 'parameterSet') as MlDsaParameterSet,
              pk: str(t.fields, 'pk'),
              mu: computeMu
                ? bytesToUpperHex(
                    mlDsaMu(hexToBytes(str(t.fields, 'pk')), hexToBytes(str(t.fields, 'message')))
                  )
                : str(t.fields, 'mu'),
              signature: str(t.fields, 'signature'),
            },
          })
        }
        continue
      }
      const preHash = str(p, 'preHash') === 'preHash'
      for (const t of g.tests) {
        const hashAlg = preHash ? str(t.fields, 'hashAlg') : null
        if (extended && hashAlg !== null && isSha512t(hashAlg)) {
          items.push({
            tgId: g.tgId,
            tcId: t.tcId,
            kind: 'execute',
            responseField: 'testPassed',
            inputKind: 'computed-ph',
            op: {
              operation: 'ml-dsa.verify',
              mechanism: 'CKM_HASH_ML_DSA',
              parameterSet: str(p, 'parameterSet') as MlDsaParameterSet,
              pk: str(t.fields, 'pk'),
              message: bytesToUpperHex(
                preHashSha512t(hashAlg, hexToBytes(str(t.fields, 'message')))
              ),
              signature: str(t.fields, 'signature'),
              context: str(t.fields, 'context'),
              hashAlg,
              hashMechanism: hashAlg === 'SHA2-512/224' ? 'CKM_SHA512_224' : 'CKM_SHA512_256',
            },
          })
          continue
        }
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
  return {
    planVersion: extended ? PLAN_VERSION_EXTENDED : PLAN_VERSION,
    schemaId: ir.schemaId,
    vsId: ir.vsId,
    items,
  }
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
  | {
      status: 'ok'
      value: string | boolean
      detail?: string
      /** A second response field of the same test (encapsulation: `c` next to `k`). */
      extra?: Record<string, string>
    }
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
  /** The PKCS#11 mechanism the case was dispatched to (executed items only). */
  mechanism?: Pkcs11MechanismName
  /** Second response field of the same test (encapsulation: `c`). */
  extra?: Record<string, string>
  /** How the value was obtained, when not the plain standard path (extended profile). */
  inputKind?: InputKind
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
          mechanism: item.op.mechanism,
          value: outcome.value,
          ...(outcome.detail ? { detail: outcome.detail } : {}),
          ...(outcome.extra ? { extra: outcome.extra } : {}),
          ...(item.inputKind ? { inputKind: item.inputKind } : {}),
        })
      } else if (outcome.status === 'unsupported') {
        results.push({
          tgId: item.tgId,
          tcId: item.tcId,
          disposition: 'unsupported',
          scope: 'engine',
          mechanism: item.op.mechanism,
          reason: outcome.reason,
        })
      } else {
        results.push({
          tgId: item.tgId,
          tcId: item.tcId,
          disposition: 'error',
          reason: outcome.reason,
          mechanism: item.op.mechanism,
        })
      }
    }
    onProgress?.(i + 1, plan.items.length)
  })
  return results
}
