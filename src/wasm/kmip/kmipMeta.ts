// SPDX-License-Identifier: GPL-3.0-only
//
// kmipMeta.ts — display metadata for the KMIP playground: the TTLV tag
// dictionary (codepoint → human name), ResultStatus naming, the algorithm
// catalog the lifecycle picker offers, and the Plane-1 policy presets. Kept in
// data here (not in the wasm) so it's easy to extend without a rebuild.

/** KMIP 3.0 TTLV tag codepoint (0x42xxxx) → human name. Subset covering the
 * playground's request/response surface; unknown tags render as raw hex. */
export const TAG_NAMES: Record<string, string> = {
  '0x420008': 'Attribute',
  '0x42000A': 'AttributeName',
  '0x42000B': 'AttributeValue',
  '0x42000F': 'BatchItem',
  '0x42000E': 'BatchErrorContinuationOption',
  '0x420028': 'CryptographicAlgorithm',
  '0x42002A': 'CryptographicLength',
  '0x42002C': 'CryptographicUsageMask',
  '0x4200C2': 'Data',
  '0x42003D': 'IVCounterNonce',
  '0x420040': 'KeyBlock',
  '0x420042': 'KeyFormatType',
  '0x420043': 'KeyMaterial',
  '0x420045': 'KeyValue',
  '0x42003F': 'Key',
  '0x420057': 'ObjectType',
  '0x42005C': 'Operation',
  '0x420069': 'ProtocolVersion',
  '0x42006A': 'ProtocolVersionMajor',
  '0x42006B': 'ProtocolVersionMinor',
  '0x420074': 'QueryFunction',
  '0x420077': 'RequestHeader',
  '0x420078': 'RequestMessage',
  '0x420079': 'RequestPayload',
  '0x42007A': 'ResponseHeader',
  '0x42007B': 'ResponseMessage',
  '0x42007C': 'ResponsePayload',
  '0x42007D': 'ResultMessage',
  '0x42007E': 'ResultReason',
  '0x42007F': 'ResultStatus',
  '0x420081': 'RevocationReason',
  '0x420082': 'RevocationReasonCode',
  '0x420088': 'ServerInformation',
  '0x42008D': 'State',
  '0x42008F': 'SymmetricKey',
  '0x42006D': 'PublicKey',
  '0x420064': 'PrivateKey',
  '0x420092': 'TimeStamp',
  '0x420094': 'UniqueIdentifier',
  '0x42009B': 'ValidityIndicator',
  '0x42009D': 'VendorIdentification',
  '0x420126': 'CommonAttributes',
  '0x420127': 'PrivateKeyAttributes',
  '0x420128': 'PublicKeyAttributes',
  '0x420125': 'Attributes',
  '0x420053': 'Name',
  '0x4200C3': 'SignatureData',
  '0x420052': 'Modulus',
  '0x420063': 'PrivateExponent',
  '0x42006C': 'PublicExponent',
}

export const tagName = (tag: string): string => TAG_NAMES[tag.toUpperCase()] ?? tag

/** ResultStatus enumeration value → label. */
export const RESULT_STATUS: Record<string, string> = {
  '0x00000000': 'Success',
  '0x00000001': 'Operation Failed',
  '0x00000002': 'Operation Pending',
  '0x00000003': 'Operation Undone',
}

/** Per-tag enumeration dictionaries: tag codepoint → { value(8-hex) → label }.
 * Lets the wire tree render `Operation 0x00000002` as `CreateKeyPair`, etc.
 * Codepoints are from the KMIP 3.0 enum tables (kmip30 Rust source). */
export const ENUM_NAMES: Record<string, Record<string, string>> = {
  // Operation (0x42005C)
  '0x42005C': {
    '0x00000001': 'Create',
    '0x00000002': 'CreateKeyPair',
    '0x00000003': 'Register',
    '0x00000008': 'Locate',
    '0x0000000A': 'Get',
    '0x0000000B': 'GetAttributes',
    '0x00000012': 'Activate',
    '0x00000013': 'Revoke',
    '0x00000014': 'Destroy',
    '0x00000018': 'Query',
    '0x0000001F': 'Encrypt',
    '0x00000020': 'Decrypt',
    '0x00000021': 'Sign',
    '0x00000022': 'SignatureVerify',
    '0x00000041': 'Encapsulate',
    '0x00000042': 'Decapsulate',
  },
  // ObjectType (0x420057)
  '0x420057': {
    '0x00000001': 'Certificate',
    '0x00000002': 'SymmetricKey',
    '0x00000003': 'PublicKey',
    '0x00000004': 'PrivateKey',
    '0x00000005': 'SplitKey',
    '0x00000007': 'SecretData',
    '0x00000008': 'OpaqueObject',
  },
  // State (0x42008D)
  '0x42008D': {
    '0x00000001': 'Pre-Active',
    '0x00000002': 'Active',
    '0x00000003': 'Deactivated',
    '0x00000004': 'Compromised',
    '0x00000005': 'Destroyed',
    '0x00000006': 'Destroyed Compromised',
  },
  // ResultStatus (0x42007F)
  '0x42007F': {
    '0x00000000': 'Success',
    '0x00000001': 'Operation Failed',
    '0x00000002': 'Operation Pending',
    '0x00000003': 'Operation Undone',
  },
  // ResultReason (0x42007E) — common subset
  '0x42007E': {
    '0x00000004': 'Invalid Message',
    '0x00000005': 'Operation Not Supported',
    '0x0000000C': 'Permission Denied',
    '0x0000003F': 'Unsupported Protocol Version',
  },
  // ValidityIndicator (0x42009B)
  '0x42009B': { '0x00000001': 'Valid', '0x00000002': 'Invalid', '0x00000003': 'Unknown' },
}

/** Friendly PKCS#11 mechanism names by hex value (the engine emits `CKM_0x001C`). */
export const CKM_NAMES: Record<string, string> = {
  '0x001C': 'CKM_ML_DSA_KEY_PAIR_GEN',
  '0x001D': 'CKM_ML_DSA',
  '0x0017': 'CKM_ML_KEM',
  '0x0001': 'CKM_RSA_PKCS_KEY_PAIR_GEN',
  '0x000D': 'CKM_RSA_PKCS_PSS',
  '0x1040': 'CKM_EC_KEY_PAIR_GEN',
  '0x1041': 'CKM_ECDSA',
  '0x1080': 'CKM_AES_KEY_GEN',
  '0x1087': 'CKM_AES_GCM',
}

/** Map an engine mechanism string (`CKM_0x001C`) to a friendly name if known. */
export const friendlyMechanism = (m: string): string => {
  const hex = m.match(/0x[0-9a-fA-F]+/)?.[0]
  if (hex) {
    const key = '0x' + parseInt(hex, 16).toString(16).toUpperCase().padStart(4, '0')
    return CKM_NAMES[key] ?? m
  }
  return m
}

export interface AlgoChoice {
  value: string // KMIP spec name passed to run_op
  label: string
  kind: 'signature' | 'kem' | 'symmetric'
  pqc: boolean
}

/** Algorithms the lifecycle picker offers (a representative cross-section of
 * the engine's full set — PQC first, classical for the agility contrast). */
export const ALGORITHMS: AlgoChoice[] = [
  { value: 'ML-DSA-44', label: 'ML-DSA-44 (FIPS 204)', kind: 'signature', pqc: true },
  { value: 'ML-DSA-65', label: 'ML-DSA-65 (FIPS 204)', kind: 'signature', pqc: true },
  { value: 'ML-DSA-87', label: 'ML-DSA-87 (FIPS 204)', kind: 'signature', pqc: true },
  {
    value: 'SLH-DSA-SHA2-128f',
    label: 'SLH-DSA-SHA2-128f (FIPS 205)',
    kind: 'signature',
    pqc: true,
  },
  { value: 'ML-KEM-512', label: 'ML-KEM-512 (FIPS 203)', kind: 'kem', pqc: true },
  { value: 'ML-KEM-768', label: 'ML-KEM-768 (FIPS 203)', kind: 'kem', pqc: true },
  { value: 'ML-KEM-1024', label: 'ML-KEM-1024 (FIPS 203)', kind: 'kem', pqc: true },
  { value: 'RSA', label: 'RSA (classical)', kind: 'signature', pqc: false },
  { value: 'ECDSA', label: 'ECDSA (classical)', kind: 'signature', pqc: false },
]

/** Visual tone for a policy chip / catalog card. Drives colour + grouping. */
export type PolicyTone =
  | 'permissive'
  | 'classical'
  | 'pqc'
  | 'compliance'
  | 'regional'
  | 'hybrid'
  | 'migration'
  | 'mechanism'

/** Catalog grouping header (the dedicated Policy view groups by this). */
export type PolicyCategory =
  | 'Baseline'
  | 'Post-quantum'
  | 'Migration & transition'
  | 'Compliance regimes'
  | 'Mechanism controls'

export interface PolicyPreset {
  file: string // under /kmip-policies/
  name: string
  label: string
  blurb: string
  tone: PolicyTone
  /** Grouping header in the Policy catalog. */
  category: PolicyCategory
  /** One-liner: the crypto-policy dimension this example illustrates. */
  illustrates: string
  /** Shown in the sticky Plane-1 quick-switch strip (a curated subset; the full
   * catalog of every preset lives in the dedicated Policy view). */
  featured?: boolean
}

/** Plane-1 policy presets. The full breadth lives in the dedicated Policy view;
 * `featured` marks the curated few in the sticky quick-switch strip. The
 * `classical` → `pqc` flip is the canonical "same ops migrate" agility demo. */
export const POLICY_PRESETS: PolicyPreset[] = [
  // ── Baseline ──────────────────────────────────────────────────────────────
  {
    file: 'training-permissive.yaml',
    name: 'training-permissive',
    label: 'Permissive (default)',
    blurb: 'Allow everything — the sandbox starting point.',
    tone: 'permissive',
    category: 'Baseline',
    illustrates: 'No rules — every algorithm and operation is allowed.',
    featured: true,
  },
  {
    file: 'classical.yaml',
    name: 'classical',
    label: 'Classical (the "before")',
    blurb: 'RSA / ECDSA / ECDH defaults — a pre-migration baseline.',
    tone: 'classical',
    category: 'Baseline',
    illustrates: 'Algorithm defaults — resolves unspecified keys to classical algorithms.',
    featured: true,
  },
  // ── Post-quantum ──────────────────────────────────────────────────────────
  {
    file: 'pqc.yaml',
    name: 'pqc',
    label: 'PQC (the "after")',
    blurb:
      'ML-KEM-1024 + ML-DSA-87 defaults; classical asymmetric Create denied; legacy keys auto-rekey at first use.',
    tone: 'pqc',
    category: 'Post-quantum',
    illustrates: 'PQC defaults + denials + rekey — the canonical agility flip.',
    featured: true,
  },
  {
    file: 'auto-migrate-on-use.yaml',
    name: 'auto-migrate-on-use',
    label: 'Auto-migrate on use',
    blurb:
      'Lazy, transparent migration: each legacy key rekeys to its PQC equivalent the first time it is used.',
    tone: 'migration',
    category: 'Post-quantum',
    illustrates: 'Algorithm substitution — rekey-on-use, no flag day, no code change.',
  },
  // ── Migration & transition ────────────────────────────────────────────────
  {
    file: 'pqc-migration-2030.yaml',
    name: 'pqc-migration-2030',
    label: 'PQC migration · 2030 cutoff',
    blurb:
      'Enterprise roadmap with dated cutoffs — classical Sign/Encrypt banned after 2030-01-01; verify/decrypt stays.',
    tone: 'migration',
    category: 'Migration & transition',
    illustrates: 'Temporal cutoffs + min-key-length + lifecycle gates on a roadmap.',
  },
  {
    file: 'hybrid-migration-window.yaml',
    name: 'hybrid-migration-window',
    label: 'Hybrid window (2026–2029)',
    blurb:
      'Every signature must be a composite classical + PQC (LAMPS draft-19) during the migration window.',
    tone: 'hybrid',
    category: 'Migration & transition',
    illustrates: 'Hybrid dual-sign requirement inside a time window.',
  },
  // ── Compliance regimes ────────────────────────────────────────────────────
  {
    file: 'cnsa-2.0.yaml',
    name: 'cnsa-2.0',
    label: 'NSA CNSA 2.0',
    blurb:
      'Only the CNSA 2.0 Level-5 suite (ML-DSA-87, ML-KEM-1024, AES-256, SHA-384/512); everything else denied.',
    tone: 'compliance',
    category: 'Compliance regimes',
    illustrates: 'Strict allowlist to a single national-security suite.',
    featured: true,
  },
  {
    file: 'fips-only.yaml',
    name: 'fips-only',
    label: 'FIPS-only',
    blurb: 'Restrict to FIPS 203/204/205 + FIPS-validated classical; deny Round-4 / alternate PQC.',
    tone: 'compliance',
    category: 'Compliance regimes',
    illustrates: 'FIPS 140-3 algorithm boundary — allowlist + min-key-length.',
  },
  {
    file: 'bsi-tr-02102.yaml',
    name: 'bsi-tr-02102',
    label: 'BSI TR-02102-1 (Germany)',
    blurb:
      'Hybrid key establishment + the conservative KEMs (FrodoKEM, Classic McEliece) that FIPS/CNSA deny.',
    tone: 'regional',
    category: 'Compliance regimes',
    illustrates: 'A different regulator, a different algorithm set — regional contrast.',
  },
  // ── Mechanism controls ────────────────────────────────────────────────────
  {
    file: 'aead-only.yaml',
    name: 'aead-only',
    label: 'AEAD-only',
    blurb: 'AES must use an authenticated mode (GCM / CCM); RSA must use OAEP padding.',
    tone: 'mechanism',
    category: 'Mechanism controls',
    illustrates: 'Mechanism-parameter constraint — gates *how* a cipher is used.',
  },
  {
    file: 'deterministic-signing.yaml',
    name: 'deterministic-signing',
    label: 'Deterministic signing',
    blurb: 'Force the deterministic ML-DSA / SLH-DSA variant on every Sign, overriding the client.',
    tone: 'mechanism',
    category: 'Mechanism controls',
    illustrates: 'Mechanism-parameter default — policy *forces* a parameter.',
  },
  {
    file: 'fips-hashing.yaml',
    name: 'fips-hashing',
    label: 'FIPS hashing',
    blurb:
      'Signature hashing restricted to the FIPS SHA-2 / SHA-3 families; SHA-1 and legacy denied.',
    tone: 'mechanism',
    category: 'Mechanism controls',
    illustrates: 'Hash-algorithm allowlist — hashing agility, independent of the key.',
  },
  {
    file: 'pkcs11-mechanism-lockdown.yaml',
    name: 'pkcs11-mechanism-lockdown',
    label: 'PKCS#11 mechanism lockdown',
    blurb:
      'Gate on the canonical PKCS#11 CKM_* mechanism — bypass-proof; MAC limited to HMAC-SHA-2.',
    tone: 'mechanism',
    category: 'Mechanism controls',
    illustrates: 'Mechanism allow/deny-list at the PKCS#11 layer.',
  },
]

/** The catalog grouping order for the dedicated Policy view. */
export const POLICY_CATEGORIES: PolicyCategory[] = [
  'Baseline',
  'Post-quantum',
  'Migration & transition',
  'Compliance regimes',
  'Mechanism controls',
]

/** Plane label → short human name + tailwind tone, for the audit trail. */
export const PLANE_INFO: Record<string, { label: string; tone: string }> = {
  p1: { label: 'Plane 1 · Agility', tone: 'text-status-warning' },
  p2: { label: 'Plane 2 · KMIP', tone: 'text-primary' },
  p3: { label: 'Plane 3 · PKCS#11', tone: 'text-status-success' },
}
