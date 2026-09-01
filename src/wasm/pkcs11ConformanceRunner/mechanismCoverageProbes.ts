// PKCS#11 v3.2 mechanism-behavior coverage — real mechanisms neither the
// OASIS Profiles Tier A/B conformance suite (profileConditions.ts) nor this
// app's own ACVP tab (HsmAcvpTesting.tsx) exercises anywhere (2026-08-31
// audit, done at the user's explicit request: "cover in conformance the
// tests that are not covered by the acvp test suites").
//
// NOT a "Tier C": that name is already reserved for porting the native
// engines' own 976/815-check conformance suites into the browser (see
// pkcs11-hsm-playground-ws11-conformance-runner-plan-08282026.md §3.3) — a
// much larger, separate undertaking. This is a narrower, product-specific
// gap-closure pass, surfaced in the UI as its own "Mechanism Coverage"
// section, not part of the OASIS A/B/C tier sequence at all.
//
// Gated purely on whether C_GetMechanismList actually advertises each
// mechanism — there is no "Profile claim" concept here, none of these
// mechanisms are tied to a Profiles v3.2 §5.x condition.

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  buildTemplate,
  freeTemplate,
  checkRV,
  hsm_extractKeyValue,
  dsaParamSet,
  kemParamSet,
  CKA_CLASS,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_PARAMETER_SET,
  CKA_SEED,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_ENCAPSULATE,
  CKA_DECAPSULATE,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKM_ML_DSA_KEY_PAIR_GEN,
  CKM_ML_KEM_KEY_PAIR_GEN,
  CKM_SLH_DSA_KEY_PAIR_GEN,
  CKP_SLH_DSA_SHA2_128S,
} from '../softhsm'

export interface MechanismProbeContext {
  M: SoftHSMModule
  hSession: number
  slotId: number
  /** From C_GetMechanismList — the only gate a probe here runs under. */
  mechs: Set<number>
}

export interface MechanismProbe {
  id: string
  mechanism: number
  mechanismName: string
  family: 'PQC' | 'Hybrid KEM' | 'Classical Asymmetric' | 'Symmetric/AEAD' | 'KDF' | 'Digest'
  /** Exact spec citation, e.g. "PKCS#11 v3.2 §6.67.4". */
  citation: string
  run: (ctx: MechanismProbeContext) => string
}

export interface MechanismProbeResult extends MechanismProbe {
  status: 'pass' | 'fail' | 'not-claimed'
  detail: string
}

const buildMechRaw = (M: SoftHSMModule, type: number): number => {
  const mech = M._malloc(12)
  M.setValue(mech, type, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')
  return mech
}

// ── PQC: deterministic key generation from CKA_SEED ────────────────────────
//
// §6.67.4 (ML-DSA), §6.68.4 (ML-KEM), §6.69.2 (SLH-DSA) all let a caller
// supply CKA_SEED in the private-key template of C_GenerateKeyPair for
// reproducible generation (verified against both engines' dispatch —
// pqctoday-hsm SoftHSM_keygen.cpp's extractSeed(pPrivateKeyTemplate, ...)
// call sites; Rust ffi.rs mirrors it). ACVP's KAT suites only ever import a
// pre-existing key or generate a random one — this path is untested
// anywhere. The real conformance claim here is determinism, not merely
// "the attribute was accepted": generate twice from the SAME seed and
// assert the two public keys are byte-identical.

type PqcSeedKind = 'ml-dsa' | 'ml-kem' | 'slh-dsa'

const seededKeygenOnce = (
  ctx: MechanismProbeContext,
  kind: PqcSeedKind,
  mechType: number,
  paramSet: number,
  seed: Uint8Array
): { pubHandle: number; privHandle: number } => {
  const { M, hSession } = ctx
  const mech = buildMechRaw(M, mechType)
  const seedPtr = M._malloc(seed.length)
  M.HEAPU8.set(seed, seedPtr)
  const pubAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
    kind === 'ml-kem'
      ? { type: CKA_ENCAPSULATE, boolVal: true }
      : { type: CKA_VERIFY, boolVal: true },
  ]
  const prvAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
    kind === 'ml-kem'
      ? { type: CKA_DECAPSULATE, boolVal: true }
      : { type: CKA_SIGN, boolVal: true },
    { type: CKA_SEED, bytesPtr: seedPtr, bytesLen: seed.length },
  ]
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      `C_GenerateKeyPair(${kind}, seeded)`
    )
    return {
      pubHandle: M.getValue(pubHPtr, 'i32') >>> 0,
      privHandle: M.getValue(prvHPtr, 'i32') >>> 0,
    }
  } finally {
    M._free(mech)
    M._free(seedPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

const deterministicKeygenProbe =
  (kind: PqcSeedKind, mechType: number, paramSet: number, seedLen: number) =>
  (ctx: MechanismProbeContext): string => {
    const { M, hSession } = ctx
    // Fixed, reproducible byte pattern — not random. The claim under test is
    // "same seed in -> same key out", so the seed's own value is arbitrary
    // as long as it's identical across both calls.
    const seed = new Uint8Array(seedLen)
    for (let i = 0; i < seedLen; i++) seed[i] = (i * 37 + 11) & 0xff

    const first = seededKeygenOnce(ctx, kind, mechType, paramSet, seed)
    const firstPub = hsm_extractKeyValue(M, hSession, first.pubHandle)
    M._C_DestroyObject(hSession, first.pubHandle)
    M._C_DestroyObject(hSession, first.privHandle)

    const second = seededKeygenOnce(ctx, kind, mechType, paramSet, seed)
    const secondPub = hsm_extractKeyValue(M, hSession, second.pubHandle)
    M._C_DestroyObject(hSession, second.pubHandle)
    M._C_DestroyObject(hSession, second.privHandle)

    if (firstPub.length === 0 || firstPub.length !== secondPub.length)
      throw new Error(
        `public key length mismatch or empty: ${firstPub.length}B vs ${secondPub.length}B`
      )
    for (let i = 0; i < firstPub.length; i++) {
      if (firstPub[i] !== secondPub[i])
        throw new Error(`same ${seedLen}B CKA_SEED produced DIFFERENT public keys at byte ${i}`)
    }
    return `two independent C_GenerateKeyPair(${kind}) calls with the same ${seedLen}B CKA_SEED produced byte-identical ${firstPub.length}B public keys`
  }

export const MECHANISM_PROBES: MechanismProbe[] = [
  {
    id: 'pqc-seed-mldsa',
    mechanism: CKM_ML_DSA_KEY_PAIR_GEN,
    mechanismName: 'CKM_ML_DSA_KEY_PAIR_GEN (CKA_SEED)',
    family: 'PQC',
    citation: 'PKCS#11 v3.2 §6.67.4 (ML-DSA deterministic key generation)',
    run: deterministicKeygenProbe('ml-dsa', CKM_ML_DSA_KEY_PAIR_GEN, dsaParamSet(65), 32),
  },
  {
    id: 'pqc-seed-mlkem',
    mechanism: CKM_ML_KEM_KEY_PAIR_GEN,
    mechanismName: 'CKM_ML_KEM_KEY_PAIR_GEN (CKA_SEED)',
    family: 'PQC',
    citation: 'PKCS#11 v3.2 §6.68.4 (ML-KEM deterministic key generation, d‖z)',
    run: deterministicKeygenProbe('ml-kem', CKM_ML_KEM_KEY_PAIR_GEN, kemParamSet(768), 64),
  },
  {
    id: 'pqc-seed-slhdsa',
    mechanism: CKM_SLH_DSA_KEY_PAIR_GEN,
    mechanismName: 'CKM_SLH_DSA_KEY_PAIR_GEN (CKA_SEED)',
    family: 'PQC',
    citation:
      'PKCS#11 v3.2 §6.69.2 (SLH-DSA deterministic key generation, SK.seed‖SK.prf‖PK.seed — SLH-DSA-SHA2-128s, n=16, 3n=48B)',
    run: deterministicKeygenProbe('slh-dsa', CKM_SLH_DSA_KEY_PAIR_GEN, CKP_SLH_DSA_SHA2_128S, 48),
  },
]

// ── Orchestrator ─────────────────────────────────────────────────────────

export const runMechanismCoverageProbes = (
  M: SoftHSMModule,
  hSession: number,
  slotId: number,
  mechs: Set<number>
): MechanismProbeResult[] => {
  const ctx: MechanismProbeContext = { M, hSession, slotId, mechs }
  const results: MechanismProbeResult[] = []
  for (const probe of MECHANISM_PROBES) {
    if (!mechs.has(probe.mechanism)) {
      results.push({
        ...probe,
        status: 'not-claimed',
        detail: `engine does not advertise ${probe.mechanismName.split(' ')[0]} in C_GetMechanismList`,
      })
      continue
    }
    try {
      const detail = probe.run(ctx)
      results.push({ ...probe, status: 'pass', detail })
    } catch (e) {
      results.push({
        ...probe,
        status: 'fail',
        detail: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return results
}
