/**
 * Pipeline primitive registry — the single description of what each palette primitive
 * can do, which mechanism it uses, and which parameter set it carries.
 *
 * Every numeric value here is imported from the vendored PKCS#11 constants, which are
 * generated from the headers the C++ softhsmv3 module is compiled against
 * (pqctoday-hsm/constants.js, guarded by `npm run check:constants`).
 *
 * NO NUMERIC LITERAL MAY APPEAR IN THIS FILE.
 *
 * That rule is the point. The previous generator hardcoded `CKP_LEVEL2` for all three
 * ML-DSA and all three ML-KEM variants, so ML-DSA-44 silently produced an ML-DSA-65 key
 * and printed "ML-DSA-65" while doing it. Deriving the parameter set from the registry
 * makes that class of bug impossible rather than merely fixed.
 *
 * The op vocabulary is likewise derived per primitive, not per family. RSA-OAEP and
 * ECDH P-256 sit in the KEM family for display purposes, but neither offers
 * encapsulate/decapsulate here -- previously both did, and both silently executed
 * ML-KEM-768.
 */
/**
 * Constants come from the generated ESM view of pqctoday-hsm/constants.js rather than
 * the vendored CommonJS file directly. The vendored copy stays byte-identical to the HSM
 * repo so the drift check means something, but Vite serves files under src/ untransformed
 * in dev, where `module.exports` throws "module is not defined" in the browser — a fault
 * the production build hides, because Rollup interops CJS and the dev server does not.
 * `npm run check:constants` verifies the vendored copies and regenerates this module.
 */
import { PKCS11 } from './pkcs11Constants.generated'

const ALL_CONSTANTS: Record<string, number> = PKCS11

const {
  CKM_ML_DSA,
  CKM_ML_KEM,
  CKM_SLH_DSA,
  CKM_HSS,
  CKM_EDDSA,
  CKM_ECDSA_SHA256,
  CKM_ECDH1_DERIVE,
  CKM_AES_GCM,
  CKM_RSA_PKCS_OAEP,
  CKM_SHA256_RSA_PKCS,
  CKM_SHA256_RSA_PKCS_PSS,
  CKM_SHA3_256,
  CKM_SHA256,
  CKP_ML_DSA_44,
  CKP_ML_DSA_65,
  CKP_ML_DSA_87,
  CKP_ML_KEM_512,
  CKP_ML_KEM_768,
  CKP_ML_KEM_1024,
  CKP_SLH_DSA_SHA2_128S,
  CKP_LMS_SHA256_M32_H5,
  CKP_LMS_SHA256_M32_H10,
  CKP_LMOTS_SHA256_N32_W8,
} = ALL_CONSTANTS

export type Op =
  | 'generate'
  | 'sign'
  | 'verify'
  | 'encrypt'
  | 'decrypt'
  | 'encapsulate'
  | 'decapsulate'
  | 'derive'
  | 'digest'
  | 'import'
  | 'assert'

/** What a parameter slot accepts. Drives the binding dropdown and validation. */
export type ParamKind =
  | 'bytes'
  | 'pubKey'
  | 'privKey'
  | 'secretKey'
  | 'ciphertext'
  | 'signature'
  | 'peerPoint'
  | 'label'

/** What a step leaves behind for later steps to bind to. */
export type OutputKind =
  | 'none'
  | 'keypair'
  | 'secretKey'
  | 'bytes'
  | 'ciphertext'
  | 'signature'
  | 'bool'

/**
 * Parameter sets carry their CKP_ name explicitly rather than being reverse-looked-up
 * by value: ML-DSA-44, ML-KEM-512 and SLH-DSA-SHA2-128S are all `1`. Reversing by value
 * would print a confident, wrong name — the same failure the old generator had when it
 * shared one "level" constant across all three families.
 */
export type KeygenSpec =
  | { kind: 'ml-dsa'; paramSet: number; paramSetName: string }
  | { kind: 'ml-kem'; paramSet: number; paramSetName: string }
  | { kind: 'slh-dsa'; paramSet: number; paramSetName: string }
  | { kind: 'hss'; lmsType: number; lmotsType: number; lmsName: string; lmotsName: string }
  | { kind: 'rsa'; bits: number }
  | { kind: 'ec-p256' }
  | { kind: 'ed25519' }
  | { kind: 'aes256' }

export interface OpSpec {
  requires: Partial<Record<string, ParamKind>>
  produces: OutputKind
  /** Operation mechanism. Absent for ops that take no CK_MECHANISM (keygen carries its own). */
  mech?: number
}

export interface PrimSpec {
  /** Display label. Also what the generated code must print — never a hardcoded string. */
  label: string
  keygen?: KeygenSpec
  ops: Partial<Record<Op, OpSpec>>
  /** HSS/LMS only: the key holds finite signatures and its state changes on every use. */
  stateful?: boolean
  /** Signatures available from a freshly generated key (HSS: 2^height). */
  maxSignatures?: number
}

const signOps = (mech: number): Partial<Record<Op, OpSpec>> => ({
  generate: { requires: { keyLabel: 'label' }, produces: 'keypair' },
  // ACVP known-answer tests: `keyMaterial` is a fixed vector's own raw
  // private-key hex, not a display label — reuses the 'label' ParamKind
  // (free-text, always literal-bound) since neither carries UI-binding
  // compatibility semantics here; the codegen (emitOp's 'import' case)
  // is what actually treats the value as hex, not the type layer.
  import: { requires: { keyMaterial: 'label' }, produces: 'keypair' },
  sign: { requires: { privKey: 'privKey', input: 'bytes' }, produces: 'signature', mech },
  verify: {
    requires: { pubKey: 'pubKey', input: 'bytes', signature: 'signature' },
    produces: 'bool',
    mech,
  },
})

const kemOps = (): Partial<Record<Op, OpSpec>> => ({
  generate: { requires: { keyLabel: 'label' }, produces: 'keypair' },
  import: { requires: { keyMaterial: 'label' }, produces: 'keypair' },
  encapsulate: { requires: { pubKey: 'pubKey' }, produces: 'ciphertext', mech: CKM_ML_KEM },
  decapsulate: {
    requires: { privKey: 'privKey', ciphertext: 'ciphertext' },
    produces: 'secretKey',
    mech: CKM_ML_KEM,
  },
})

export const PRIMITIVES: Record<string, PrimSpec> = {
  // ── ML-DSA: one entry per parameter set, each carrying its own CKP_* ──────────
  'ml-dsa-44': {
    label: 'ML-DSA-44',
    keygen: { kind: 'ml-dsa', paramSet: CKP_ML_DSA_44, paramSetName: 'CKP_ML_DSA_44' },
    ops: signOps(CKM_ML_DSA),
  },
  'ml-dsa-65': {
    label: 'ML-DSA-65',
    keygen: { kind: 'ml-dsa', paramSet: CKP_ML_DSA_65, paramSetName: 'CKP_ML_DSA_65' },
    ops: signOps(CKM_ML_DSA),
  },
  'ml-dsa-87': {
    label: 'ML-DSA-87',
    keygen: { kind: 'ml-dsa', paramSet: CKP_ML_DSA_87, paramSetName: 'CKP_ML_DSA_87' },
    ops: signOps(CKM_ML_DSA),
  },

  // ── ML-KEM: real C_EncapsulateKey / C_DecapsulateKey via the v3.2 interface ───
  'ml-kem-512': {
    label: 'ML-KEM-512',
    keygen: { kind: 'ml-kem', paramSet: CKP_ML_KEM_512, paramSetName: 'CKP_ML_KEM_512' },
    ops: kemOps(),
  },
  'ml-kem-768': {
    label: 'ML-KEM-768',
    keygen: { kind: 'ml-kem', paramSet: CKP_ML_KEM_768, paramSetName: 'CKP_ML_KEM_768' },
    ops: kemOps(),
  },
  'ml-kem-1024': {
    label: 'ML-KEM-1024',
    keygen: { kind: 'ml-kem', paramSet: CKP_ML_KEM_1024, paramSetName: 'CKP_ML_KEM_1024' },
    ops: kemOps(),
  },

  // ── SLH-DSA: its own parameter-set namespace, not ML-DSA's ───────────────────
  'slh-dsa': {
    label: 'SLH-DSA-128s',
    keygen: {
      kind: 'slh-dsa',
      paramSet: CKP_SLH_DSA_SHA2_128S,
      paramSetName: 'CKP_SLH_DSA_SHA2_128S',
    },
    ops: signOps(CKM_SLH_DSA),
  },

  // ── HSS/LMS: stateful. Height H ⇒ 2^H signatures, then the key is spent ───
  // One more height added (dev-tabs-pkcs11-kmip plan G9, W3a) — same pattern
  // this file already uses for every other multi-variant primitive
  // (ML-DSA-44/65/87, ML-KEM-512/768/1024 are separate palette entries too,
  // not one entry with a runtime picker), so no codegen/param-model changes
  // were needed. H10 is confirmed live through the real generated-script
  // path (parseRun step markers, both engines — not just "didn't crash").
  // H15/H20/H25 were tried and DROPPED: a raw shim call to generate_hss at
  // those heights completes in under a second in isolation, but the SAME
  // heights run through the real builder-generated script (the `with
  // Module() as hsm:` / step-marker wrapper every generated pipeline uses)
  // hang indefinitely — reproduced consistently on both engines. Root cause
  // not yet found; shipping them anyway is exactly the "shipped and broken"
  // outcome this plan's own rule exists to prevent. LM-OTS width/hash stay
  // fixed at the H5 entry's existing choice (W8/SHA256) — height is the
  // dimension the plan named as the actual gap.
  'hss-lms': {
    label: 'HSS/LMS-H5',
    keygen: {
      kind: 'hss',
      lmsType: CKP_LMS_SHA256_M32_H5,
      lmotsType: CKP_LMOTS_SHA256_N32_W8,
      lmsName: 'CKP_LMS_SHA256_M32_H5',
      lmotsName: 'CKP_LMOTS_SHA256_N32_W8',
    },
    ops: signOps(CKM_HSS),
    stateful: true,
    maxSignatures: 32,
  },
  'hss-lms-h10': {
    label: 'HSS/LMS-H10',
    keygen: {
      kind: 'hss',
      lmsType: CKP_LMS_SHA256_M32_H10,
      lmotsType: CKP_LMOTS_SHA256_N32_W8,
      lmsName: 'CKP_LMS_SHA256_M32_H10',
      lmotsName: 'CKP_LMOTS_SHA256_N32_W8',
    },
    ops: signOps(CKM_HSS),
    stateful: true,
    maxSignatures: 1024,
  },

  // ── Classical signatures ─────────────────────────────────────────────────────
  'rsa-2048': {
    label: 'RSA-2048 PKCS#1',
    keygen: { kind: 'rsa', bits: 2048 },
    ops: signOps(CKM_SHA256_RSA_PKCS),
  },
  'rsa-pss': {
    label: 'RSA-PSS-2048',
    keygen: { kind: 'rsa', bits: 2048 },
    ops: signOps(CKM_SHA256_RSA_PKCS_PSS),
  },
  // CKM_ECDSA_SHA256 (hash-and-sign in one call), not raw CKM_ECDSA: this is what the
  // catalog card advertises (0x1044) and what the reference snippet prefers. The old
  // generator used raw CKM_ECDSA over a digest it computed itself, so the card and the
  // executed mechanism disagreed.
  'ecdsa-p256': {
    label: 'ECDSA P-256',
    keygen: { kind: 'ec-p256' },
    ops: signOps(CKM_ECDSA_SHA256),
  },
  ed25519: { label: 'Ed25519', keygen: { kind: 'ed25519' }, ops: signOps(CKM_EDDSA) },

  // ── RSA-OAEP is asymmetric ENCRYPTION, not a KEM. No encapsulate here. ────────
  'rsa-oaep': {
    label: 'RSA-OAEP-2048',
    keygen: { kind: 'rsa', bits: 2048 },
    ops: {
      generate: { requires: { keyLabel: 'label' }, produces: 'keypair' },
      encrypt: {
        requires: { pubKey: 'pubKey', input: 'bytes' },
        produces: 'ciphertext',
        mech: CKM_RSA_PKCS_OAEP,
      },
      decrypt: {
        requires: { privKey: 'privKey', input: 'ciphertext' },
        produces: 'bytes',
        mech: CKM_RSA_PKCS_OAEP,
      },
    },
  },

  // ── ECDH is key AGREEMENT — derive, not encapsulate ──────────────────────────
  'ecdh-p256': {
    label: 'ECDH P-256',
    keygen: { kind: 'ec-p256' },
    ops: {
      generate: { requires: { keyLabel: 'label' }, produces: 'keypair' },
      derive: {
        requires: { privKey: 'privKey', peer: 'peerPoint' },
        produces: 'secretKey',
        mech: CKM_ECDH1_DERIVE,
      },
    },
  },

  // ── Symmetric ────────────────────────────────────────────────────────────────
  'aes-256-gcm': {
    label: 'AES-256-GCM',
    keygen: { kind: 'aes256' },
    ops: {
      generate: { requires: { keyLabel: 'label' }, produces: 'secretKey' },
      encrypt: {
        requires: { key: 'secretKey', input: 'bytes' },
        produces: 'ciphertext',
        mech: CKM_AES_GCM,
      },
      decrypt: {
        requires: { key: 'secretKey', input: 'ciphertext' },
        produces: 'bytes',
        mech: CKM_AES_GCM,
      },
    },
  },

  // ── Hashes: digest only. No keygen fall-through. ─────────────────────────────
  'sha3-256': {
    label: 'SHA3-256',
    ops: { digest: { requires: { input: 'bytes' }, produces: 'bytes', mech: CKM_SHA3_256 } },
  },
  'sha-256': {
    label: 'SHA-256',
    ops: { digest: { requires: { input: 'bytes' }, produces: 'bytes', mech: CKM_SHA256 } },
  },

  // ── ACVP known-answer check — not a real algorithm, no keygen/mechanism.
  // A byte-exact comparison against a NIST ACVP vector's own expected
  // output, the reason `import` exists at all: a freshly generated key
  // can never reproduce a fixed vector's expected bytes. ──
  'assert-equals': {
    label: 'ACVP check',
    ops: {
      assert: {
        requires: { secret: 'secretKey', expected: 'label', label: 'label' },
        produces: 'bool',
      },
    },
  },
}

/**
 * Reverse lookup value → CKM_ name, so generated code reads `p11.CKM_ML_DSA` rather
 * than `0x1d`. The script is teaching material as much as it is executable, and a bare
 * hex constant tells a reader nothing about which algorithm just ran.
 */
const MECH_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(ALL_CONSTANTS)
    .filter(([k, v]) => k.startsWith('CKM_') && typeof v === 'number')
    .map(([k, v]) => [v, k])
)

export const mechName = (value: number): string => MECH_NAMES[value] ?? `0x${value.toString(16)}`

/** Ops a primitive actually supports — replaces the family-wide FAMILY_OPS table. */
export const opsFor = (primId: string): Op[] => Object.keys(PRIMITIVES[primId]?.ops ?? {}) as Op[]

export const specFor = (primId: string): PrimSpec | undefined => PRIMITIVES[primId]

/** The op a freshly dropped palette primitive starts on. */
export const defaultOpFor = (primId: string): Op => {
  const ops = opsFor(primId)
  return ops.includes('generate') ? 'generate' : (ops[0] ?? 'digest')
}
