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
  // §6.1.64 Validate / §6.1.6 Certify / §6.1.52 Re-certify (Certificate
  // Services, WP5) — cross-checked against `pqctoday-hsm/kmip/src/kmip30/
  // wire.rs`'s `tags::*` constants (the decoder these are built to match).
  '0x420013': 'Certificate',
  '0x42001E': 'CertificateValue',
  '0x420018': 'CertificateRequest',
  '0x420019': 'CertificateRequestType',
  '0x420140': 'CertificateRequestValue',
  '0x420139': 'CertificateRequestUniqueIdentifier',
  '0x42009A': 'ValidityDate',
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

/** Case-normalize a `0x`-prefixed hex codepoint for dictionary lookup — every
 * table here keys on a LOWERCASE `0x` prefix + UPPERCASE hex digits. A bare
 * `.toUpperCase()` on the whole string corrupts the prefix to `0X`, which
 * then never matches any key regardless of the input's own casing — this
 * silently broke every `tagName`/`ENUM_NAMES` lookup (raw hex rendered
 * everywhere instead of names) until fixed here. */
export const normalizeHexKey = (hex: string): string => '0x' + hex.replace(/^0x/i, '').toUpperCase()

export const tagName = (tag: string): string => TAG_NAMES[normalizeHexKey(tag)] ?? tag

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
  /** `true` sends `intent` instead of `algorithm` — the active policy resolves
   * the algorithm itself (the crypto-agility "flip the policy, same request
   * resolves differently" lesson, made hands-on). */
  auto?: boolean
  /** `false` marks a real PQC algorithm this in-browser engine cannot
   * actually create — a policy may still name it in an allow/denylist (the
   * dry-run/matrix will show a verdict for the string), but no lifecycle op
   * can run it here. Omitted/`true` = runnable. See `isRunnable`. */
  runnable?: boolean
  /** Key-size/curve choices for RSA/ECDSA (A-grade review item #18) — the
   * engine's `CryptographicLength` attribute is a REAL functional input, not
   * a cosmetic label: it drives both the actual RSA bit length / ECDSA curve
   * generated (`ecdsa_curve_from_length` in `create_key_pair.rs`) and the
   * qualified name (`RSA-2048`, `ECDSA-P384`, …) `min_key_length` rules gate
   * on. Several shipped policies (fips-only, bsi-tr-02102,
   * pqc-migration-2030) deny RSA below 3072 bits — without this picker the
   * workbench could only ever send the 2048-bit default and could never
   * demonstrate that denial by hand. */
  sizes?: { length: number; label: string }[]
}

/** The sentinel `AlgoChoice.value` for the "Auto" picker entry. */
export const AUTO_ALGO = '__auto__'

/** Algorithms the lifecycle picker offers (a representative cross-section of
 * the engine's full set — PQC first, classical for the agility contrast).
 * "Auto" is first: the headline crypto-agility lesson (A-grade review C1) —
 * omit the algorithm, let the active policy resolve it, flip the policy,
 * watch the SAME request resolve differently. The remaining spec-only
 * entries (A-grade review A1) show real PQC algorithms a policy can
 * reference that this in-browser engine cannot actually create, so picking
 * one explains why rather than silently disappearing from the catalog.
 * FrodoKEM/Classic McEliece graduated OUT of that spec-only set on
 * 2026-07-06 (BSI TR-02102-1 support) — they're genuinely runnable now,
 * see RUNNABLE_EXACT below. */
export const ALGORITHMS: AlgoChoice[] = [
  {
    value: AUTO_ALGO,
    label: 'Auto — let the policy decide',
    kind: 'signature',
    pqc: true,
    auto: true,
  },
  { value: 'ML-DSA-44', label: 'ML-DSA-44 (FIPS 204)', kind: 'signature', pqc: true },
  { value: 'ML-DSA-65', label: 'ML-DSA-65 (FIPS 204)', kind: 'signature', pqc: true },
  { value: 'ML-DSA-87', label: 'ML-DSA-87 (FIPS 204)', kind: 'signature', pqc: true },
  // LAMPS composite signatures (draft-ietf-lamps-pq-composite-sigs-19) —
  // RUNNABLE: CreateKeyPair generates both component keys in-engine, Certify
  // signs with both, Validate verifies both independently. Composite-KEM
  // needs NO separate entry here — certifying an existing X25519MLKEM768
  // hybrid-KEM key (below) automatically produces the composite-KEM
  // certificate format; SecP256r1MLKEM768 doesn't (no verified draft-17
  // byte-order reference — see the kmip crate's composite_kem.rs).
  {
    value: 'ML-DSA-44-RSA2048-PSS',
    label: 'ML-DSA-44 + RSA-2048-PSS (composite, draft-19)',
    kind: 'signature',
    pqc: true,
  },
  {
    value: 'ML-DSA-65-ECDSA-P256',
    label: 'ML-DSA-65 + ECDSA-P256 (composite, draft-19)',
    kind: 'signature',
    pqc: true,
  },
  {
    value: 'ML-DSA-87-ECDSA-P384',
    label: 'ML-DSA-87 + ECDSA-P384 (composite, draft-19)',
    kind: 'signature',
    pqc: true,
  },
  {
    value: 'SLH-DSA-SHA2-128f',
    label: 'SLH-DSA-SHA2-128f (FIPS 205)',
    kind: 'signature',
    pqc: true,
  },
  { value: 'ML-KEM-512', label: 'ML-KEM-512 (FIPS 203)', kind: 'kem', pqc: true },
  { value: 'ML-KEM-768', label: 'ML-KEM-768 (FIPS 203)', kind: 'kem', pqc: true },
  { value: 'ML-KEM-1024', label: 'ML-KEM-1024 (FIPS 203)', kind: 'kem', pqc: true },
  {
    value: 'RSA',
    label: 'RSA (classical)',
    kind: 'signature',
    pqc: false,
    sizes: [
      { length: 2048, label: '2048-bit' },
      { length: 3072, label: '3072-bit' },
      { length: 4096, label: '4096-bit' },
    ],
  },
  {
    value: 'ECDSA',
    label: 'ECDSA (classical)',
    kind: 'signature',
    pqc: false,
    sizes: [
      { length: 256, label: 'P-256' },
      { length: 384, label: 'P-384' },
      { length: 521, label: 'P-521' },
    ],
  },
  { value: 'AES', label: 'AES-256 (symmetric, quantum-safe)', kind: 'symmetric', pqc: false },
  // Hybrid KEMs (KMIP 3.0 CSD02 names, published codepoints) — RUNNABLE:
  // the engine composes them in-process (K6). These are the one hybrid
  // primitive the stack executes; BSI-style hybrid mandates are testable.
  { value: 'X25519MLKEM768', label: 'X25519MLKEM768 (hybrid KEM)', kind: 'kem', pqc: true },
  { value: 'SecP256r1MLKEM768', label: 'SecP256r1MLKEM768 (hybrid KEM)', kind: 'kem', pqc: true },
  {
    value: 'ECDH',
    label: 'ECDH (classical key agreement)',
    kind: 'kem',
    pqc: false,
    sizes: [
      { length: 256, label: 'P-256' },
      { length: 384, label: 'P-384' },
      { length: 521, label: 'P-521' },
    ],
  },
  // Stateful hash-based signatures (SP 800-208) — spec-only: policies gate
  // them (CNSA 2.0 allows single-tree LMS/XMSS for firmware signing and
  // denies multi-tree HSS/XMSS-MT) but this in-browser engine cannot
  // instantiate stateful HBS keys, so picking one demonstrates the policy
  // verdict. Previously none were selectable, so CNSA's own firmware-signing
  // suite was untestable either way (2026-07-04 gap audit).
  {
    value: 'LMS',
    label: 'LMS (stateful HBS, spec-only)',
    kind: 'signature',
    pqc: true,
    runnable: false,
  },
  {
    value: 'HSS',
    label: 'HSS (multi-tree HBS, spec-only)',
    kind: 'signature',
    pqc: true,
    runnable: false,
  },
  {
    value: 'XMSS',
    label: 'XMSS (stateful HBS, spec-only)',
    kind: 'signature',
    pqc: true,
    runnable: false,
  },
  {
    value: 'XMSS-MT',
    label: 'XMSS-MT (multi-tree HBS, spec-only)',
    kind: 'signature',
    pqc: true,
    runnable: false,
  },
  // Ed25519 (RFC 8032 EdDSA) — runnable as of 2026-07-05 (P1): keygen/sign/
  // verify wired through the KMIP layer to the existing PKCS#11 engine path.
  { value: 'Ed25519', label: 'Ed25519 (EdDSA)', kind: 'signature', pqc: false },
  // X25519 stays spec-only: the KMIP layer has no key-agreement OPERATION
  // yet (DeriveKey's Asymmetric Key method) — keygen alone would be inert.
  { value: 'X25519', label: 'X25519 (spec-only)', kind: 'kem', pqc: false, runnable: false },
  // FrodoKEM / Classic McEliece (BSI TR-02102-1 §2.4.1/§2.4.2) — runnable as
  // of 2026-07-06: keygen/encapsulate/decapsulate wired through the KMIP
  // layer to the softhsmrustv3 engine (frodo-kem + classic-mceliece-rust).
  // The bare "FrodoKEM-1344" value resolves to the AES variant (mirrors
  // create_key_pair.rs::parse_algorithm's own bare-name convention) — the
  // SHAKE variant and the 640/976 sizes exist but aren't in this curated
  // picker, same as most SLH-DSA parameter sets aren't.
  { value: 'FrodoKEM-1344', label: 'FrodoKEM-1344 (BSI TR-02102-1)', kind: 'kem', pqc: true },
  {
    value: 'Classic-McEliece-6688128',
    label: 'Classic-McEliece-6688128 (BSI TR-02102-1)',
    kind: 'kem',
    pqc: true,
  },
]

/** Exact algorithm names the wasm engine's `CreateKeyPair`/`Create` can
 * actually instantiate — mirrors the exact-match arms of
 * `pqctoday-hsm/kmip/src/ops/create_key_pair.rs::parse_algorithm`. Keep in
 * sync with that function; it is the single source of truth. */
const RUNNABLE_EXACT = new Set([
  'ML-KEM-512',
  'ML-KEM-768',
  'ML-KEM-1024',
  'ML-DSA-44',
  'ML-DSA-65',
  'ML-DSA-87',
  // LAMPS composite signatures (draft-ietf-lamps-pq-composite-sigs-19).
  'ML-DSA-44-RSA2048-PSS',
  'ML-DSA-65-ECDSA-P256',
  'ML-DSA-87-ECDSA-P384',
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-256s',
  'SLH-DSA-SHAKE-256f',
  'X25519MLKEM768',
  'SecP256r1MLKEM768',
  // 2026-07-05 (P1): Ed25519 keygen/sign/verify wired KMIP → PKCS#11 engine.
  'Ed25519',
  // 2026-07-06: BSI TR-02102-1 §2.4.1/§2.4.2 — the bare name resolves to the
  // AES variant (wasm/src/lib.rs::alg_from_name mirrors parse_algorithm's own
  // bare-name-defaults-to-AES convention); Classic McEliece has only the one
  // BSI-recommended parameter set, so its name is already unambiguous.
  'FrodoKEM-1344',
  'Classic-McEliece-6688128',
])

/** Family prefixes `parse_algorithm` collapses to a concrete algorithm
 * regardless of the qualifying suffix (`ECDSA-P256` → `Ecdsa`, etc.).
 * ECDH became genuinely runnable on 2026-07-05 (P0) — before that it was in
 * this set but CreateKeyPair failed at the engine (the standing bug P0
 * fixed); the set was aspirational, now it's accurate. */
const RUNNABLE_FAMILIES = new Set(['AES', 'RSA', 'ECDSA', 'ECDH'])

/** `true` if the wasm engine can actually create/use a real key for this
 * algorithm name — a policy may still reference a non-runnable name (e.g.
 * `LMS`, `X25519`, a hash name like `SHA-1`) in an allow/denylist, and the
 * dry-run engine will happily evaluate a verdict for the literal string, but
 * no lifecycle op can create/sign/encapsulate one here. Distinguishing this
 * is the fix for A-grade review finding A1 — "the tool proves a policy
 * permits X" when the tool simply can't do X. (FrodoKEM/Classic McEliece
 * used to be this docstring's example of that gap; BSI TR-02102-1 support
 * landed 2026-07-06, so they graduated to RUNNABLE_EXACT instead.) */
export const isRunnable = (algo: string): boolean =>
  RUNNABLE_EXACT.has(algo) || RUNNABLE_FAMILIES.has(algo.split('-')[0])

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

/** A seed request for the Visual tab's simulator that demonstrates a preset's
 * `illustrates` line in one click (A-grade review item #16 — "Load this
 * policy's example"). Sparse — merged over the simulator's own defaults, so
 * only the fields that matter for the demo need setting. Field names mirror
 * `visual/policySim.ts`'s `SimRequest` (kept local here to avoid a
 * meta-data → visual-editor cross-import). */
export interface PolicyExample {
  op: string
  algorithm: string
  date?: string
  bits?: string
  attrs?: string[]
  usageFlags?: string[]
  hash?: string
  blockMode?: string
  mechanism?: string
  /** Key label for label-pattern (`name_pattern`) policies — the Migration
   * estate's label-only contract. Threads into `dryRun`'s `name` field. */
  name?: string
}

export interface PolicyPreset {
  /** Under /kmip-policies/ — the canonical single-file form, always present
   * (even for a preset also split into `files`) and used as this preset's
   * stable identity: React keys, catalog/compare/tour lookups, and the List/
   * YAML/Visual tabs' rule display all key off this one file. */
  file: string
  /** Modular-policy plan (2026-08-28) — when set, these are the per-scope
   * module files (e.g. `-signing.yaml`/`-key-establishment.yaml`/
   * `-encryption.yaml`/`-global.yaml`) that reproduce `file`'s behavior as
   * independently-activated modules; ACTIVATING this preset loads these
   * instead of `file` (see `KmipEngine.activateModulePreset`). Absent for a
   * preset that was never split (still a single legacy file both ways). */
  files?: string[]
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
  /** The request that demonstrates `illustrates` — see [`PolicyExample`]. */
  example?: PolicyExample
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
    example: { op: 'CreateKeyPair', algorithm: 'FrodoKEM-1344' },
  },
  {
    file: 'classical.yaml',
    files: [
      'classical-signing.yaml',
      'classical-key-establishment.yaml',
      'classical-encryption.yaml',
      'classical-global.yaml',
    ],
    name: 'classical',
    label: 'Classical (the "before")',
    blurb: 'RSA / ECDSA / ECDH defaults — a pre-migration baseline.',
    tone: 'classical',
    category: 'Baseline',
    illustrates: 'Algorithm defaults — resolves unspecified keys to classical algorithms.',
    featured: true,
    example: { op: 'CreateKeyPair:Sign', algorithm: '' },
  },
  // ── Post-quantum ──────────────────────────────────────────────────────────
  {
    file: 'pqc.yaml',
    files: [
      'pqc-signing.yaml',
      'pqc-key-establishment.yaml',
      'pqc-encryption.yaml',
      'pqc-global.yaml',
    ],
    name: 'pqc',
    label: 'PQC (the "after")',
    blurb:
      'ML-KEM-1024 + ML-DSA-87 defaults; classical asymmetric Create denied; legacy keys auto-rekey at first use.',
    tone: 'pqc',
    category: 'Post-quantum',
    illustrates: 'PQC defaults + denials + rekey — the canonical agility flip.',
    featured: true,
    example: { op: 'CreateKeyPair:Sign', algorithm: '' },
  },
  {
    file: 'auto-migrate-on-use.yaml',
    files: [
      'auto-migrate-on-use-signing.yaml',
      'auto-migrate-on-use-key-establishment.yaml',
      'auto-migrate-on-use-encryption.yaml',
      'auto-migrate-on-use-global.yaml',
    ],
    name: 'auto-migrate-on-use',
    label: 'Auto-migrate on use',
    blurb:
      'Lazy, transparent migration: each legacy key rekeys to its PQC equivalent the first time it is used.',
    tone: 'migration',
    category: 'Post-quantum',
    illustrates: 'Algorithm substitution — rekey-on-use, no flag day, no code change.',
    example: { op: 'Sign', algorithm: 'ECDSA-P256', date: '2026-07-01' },
  },
  // ── Migration & transition ────────────────────────────────────────────────
  {
    file: 'migration-classical.yaml',
    files: [
      'migration-classical-signing.yaml',
      'migration-classical-key-establishment.yaml',
      'migration-classical-encryption.yaml',
      'migration-classical-global.yaml',
    ],
    name: 'migration-classical',
    label: 'Migration estate · classical',
    blurb:
      'The Migration tab’s seven-key classical estate — label-pattern rules map business key names (firmware-release-signing, payments-db-cipher, …) to AES-128/256, X25519/X448, RSA-2048, ECDSA and Ed25519.',
    tone: 'classical',
    category: 'Migration & transition',
    illustrates:
      'Label-pattern defaults — the app passes only a key NAME; the policy decides every algorithm.',
    example: { op: 'CreateKeyPair:Sign', algorithm: '', name: 'firmware-release-signing' },
  },
  {
    file: 'migration-hybrid.yaml',
    files: [
      'migration-hybrid-signing.yaml',
      'migration-hybrid-key-establishment.yaml',
      'migration-hybrid-encryption.yaml',
      'migration-hybrid-global.yaml',
    ],
    name: 'migration-hybrid',
    label: 'Migration estate · hybrid',
    blurb:
      'The Migration tab’s hybrid transition — key agreement → X25519MLKEM768 (classical + PQC in one key), signing → ML-DSA-44; legacy keys auto-rekey on use.',
    tone: 'hybrid',
    category: 'Migration & transition',
    illustrates: 'Hybrid KEM + rekey-on-use — belt-and-braces migration.',
    example: { op: 'Encapsulate', algorithm: 'X25519', name: 'partner-tls-kex' },
  },
  {
    file: 'migration-pqc.yaml',
    files: [
      'migration-pqc-signing.yaml',
      'migration-pqc-key-establishment.yaml',
      'migration-pqc-encryption.yaml',
      'migration-pqc-global.yaml',
    ],
    name: 'migration-pqc',
    label: 'Migration estate · full PQC',
    blurb:
      'The Migration tab’s full-PQC target — ML-KEM / ML-DSA everywhere; every legacy key auto-rekeys to its PQC successor on first use or via ReKey sweep.',
    tone: 'pqc',
    category: 'Migration & transition',
    illustrates: 'Full-PQC defaults + rekey-on-use + substitution-aware ReKey.',
    example: { op: 'Sign', algorithm: 'RSA-2048', name: 'firmware-release-signing' },
  },
  {
    file: 'pqc-migration-2030.yaml',
    files: [
      'pqc-migration-2030-signing.yaml',
      'pqc-migration-2030-key-establishment.yaml',
      'pqc-migration-2030-encryption.yaml',
      'pqc-migration-2030-global.yaml',
    ],
    name: 'pqc-migration-2030',
    label: 'PQC migration · 2030 cutoff',
    blurb:
      'Enterprise roadmap with dated cutoffs — new classical signing keys end 2027; classical Sign/Encrypt and key creation banned after 2030-01-01; verify/decrypt stays.',
    tone: 'migration',
    category: 'Migration & transition',
    illustrates: 'Temporal cutoffs + min-key-length + lifecycle gates on a roadmap.',
    // The review's own worked example: set the date past the cutoff and Sign
    // with a classical algorithm — watch it flip from Allow to Deny.
    example: { op: 'Sign', algorithm: 'ECDSA-P256', date: '2031-01-01' },
  },
  {
    file: 'hybrid-migration-window.yaml',
    files: ['hybrid-migration-window-signing.yaml', 'hybrid-migration-window-global.yaml'],
    name: 'hybrid-migration-window',
    label: 'Hybrid window (2026–2029)',
    blurb:
      'Classical signing ends 2026; PQC or LAMPS composites only. Tag x-pqctoday-dual-sign=required to mandate the composite.',
    tone: 'hybrid',
    category: 'Migration & transition',
    illustrates: 'Class-based cutoffs + opt-in hybrid dual-sign inside a time window.',
    example: { op: 'Sign', algorithm: 'ECDSA-P256', date: '2027-06-01' },
  },
  // ── Compliance regimes ────────────────────────────────────────────────────
  {
    file: 'cnsa-2.0.yaml',
    files: [
      'cnsa-2.0-signing.yaml',
      'cnsa-2.0-key-establishment.yaml',
      'cnsa-2.0-encryption.yaml',
      'cnsa-2.0-global.yaml',
    ],
    name: 'cnsa-2.0',
    label: 'NSA CNSA 2.0',
    blurb:
      'Only the CNSA 2.0 Level-5 suite (ML-DSA-87, ML-KEM-1024, AES-256, LMS/XMSS, SHA-384/512). New keys must carry x-pqctoday-cnsa-classification; decrypt/verify of legacy artefacts stays open.',
    tone: 'compliance',
    category: 'Compliance regimes',
    illustrates: 'Strict allowlist + creation-time governance tag + hash gating.',
    featured: true,
    example: { op: 'Sign', algorithm: 'RSA-3072', date: '2026-07-01' },
  },
  {
    file: 'fips-only.yaml',
    files: ['fips-only-signing.yaml', 'fips-only-encryption.yaml', 'fips-only-global.yaml'],
    name: 'fips-only',
    label: 'FIPS-only',
    blurb:
      'Restrict to FIPS 203/204/205 + FIPS-validated classical (incl. ECDH); SHA-1 signing and RSA PKCS#1 v1.5 encryption denied; deny Round-4 / alternate PQC.',
    tone: 'compliance',
    category: 'Compliance regimes',
    illustrates: 'FIPS 140-3 algorithm boundary — allowlist + min-key-length.',
    example: { op: 'Encapsulate', algorithm: 'FrodoKEM-976' },
  },
  {
    file: 'bsi-tr-02102.yaml',
    files: [
      'bsi-tr-02102-signing.yaml',
      'bsi-tr-02102-key-establishment.yaml',
      'bsi-tr-02102-encryption.yaml',
      'bsi-tr-02102-global.yaml',
    ],
    name: 'bsi-tr-02102',
    label: 'BSI TR-02102-1 (Germany)',
    blurb:
      'Hybrid key establishment (combined hybrid KEMs, or a PQC KEM declaring its classical partner) + the conservative KEMs (FrodoKEM, Classic McEliece) that FIPS/CNSA deny. PQC and classical signatures allowed; composite on opt-in.',
    tone: 'regional',
    category: 'Compliance regimes',
    illustrates: 'A different regulator, a different algorithm set — regional contrast.',
    // BSI allows FrodoKEM, but only paired with its classical partner —
    // omitting the attribute is denied even though the algorithm is allowlisted.
    example: { op: 'CreateKeyPair:KeyAgreement', algorithm: 'FrodoKEM-1344' },
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
    example: { op: 'Encrypt', algorithm: 'AES-256', blockMode: 'ECB' },
  },
  {
    file: 'deterministic-signing.yaml',
    name: 'deterministic-signing',
    label: 'Deterministic signing',
    blurb: 'Force the deterministic ML-DSA / SLH-DSA variant on every Sign, overriding the client.',
    tone: 'mechanism',
    category: 'Mechanism controls',
    illustrates: 'Mechanism-parameter default — policy *forces* a parameter.',
    example: { op: 'Sign', algorithm: 'ML-DSA-65' },
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
    example: { op: 'Sign', algorithm: 'RSA-3072', hash: 'SHA-1' },
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
    example: { op: 'Encrypt', algorithm: 'AES-256', mechanism: 'CKM_AES_ECB' },
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

/** "Which regime governs you?" quick-pick (A-grade review item #18) — a
 * shortcut into the same catalog below for the four learners most often ask
 * "which policy is mine", by regulator/regime name rather than by what the
 * rule illustrates. Not a 19th preset — every `file` here already exists in
 * `POLICY_PRESETS`; the button just calls the same `onLoadPolicy`. */
export const REGULATORS: { label: string; file: string }[] = [
  { label: 'US · NSA CNSA 2.0', file: 'cnsa-2.0.yaml' },
  { label: 'US · FIPS 140-3', file: 'fips-only.yaml' },
  { label: 'Germany · BSI', file: 'bsi-tr-02102.yaml' },
  { label: 'Enterprise · 2030 roadmap', file: 'pqc-migration-2030.yaml' },
]

/** Plane label → short human name + tailwind tone, for the audit trail. */
export const PLANE_INFO: Record<string, { label: string; tone: string }> = {
  p1: { label: 'Plane 1 · Agility', tone: 'text-status-warning' },
  p2: { label: 'Plane 2 · KMIP', tone: 'text-primary' },
  p3: { label: 'Plane 3 · PKCS#11', tone: 'text-status-success' },
}
