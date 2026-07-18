// SPDX-License-Identifier: GPL-3.0-only
//
// opTemplates.ts — one request-building function per KMIP 3.0 operation (all
// 66 the WD19 draft defines — 64 in the published-3.0/CSD01 baseline plus
// WD19's Encapsulate/Decapsulate), organized into the same 7 functional
// categories the Commands tab groups them by. Each template returns the
// RequestPayload children `request.ts`'s `buildRequest()` wraps in a full
// Request Message.
//
// Field shapes are grounded in real, tested sources — not guessed from the
// spec alone:
//   - The 14 ops already wired to `OpSpec`/`run_op` (kmipEngine.ts) mirror
//     `wasm/src/lib.rs`'s `build_payload` exactly, so the Commands tab's
//     generic path and the Agility tab's friendly path build identical wire
//     requests for the same op.
//   - The 7 newest ops (GetUsageAllocation…ReKeyKeyPair) and the ops beyond
//     the OASIS corpus's coverage (Archive, Recover, Import, Export, MAC,
//     Hash, RNG…, session/admin ops, …) mirror the literal request structs
//     `pqctoday-hsm/kmip/tests/op_coverage_e2e.rs` builds and asserts a
//     SUBSTANTIVE outcome for (not just "didn't crash") — e.g. `deriveKey`'s
//     default `method: 'NIST800-108-C'` matches that file's `dk-derive` case
//     exactly, not a guess at "the obvious KDF".
//   - The 4 permanently-unsupported ops (Notify/Put — server-to-client by
//     definition; Delegated Login/Re-Provision — no handler) need no payload
//     at all — the dispatcher rejects them before payload semantics matter
//     (KMIP 3.0 §9.2 `OperationNotSupported`), so an empty payload is the
//     correct, real request, not a stand-in.
//
// `build(values)` — every op's field editor (the Commands/Reference tab)
// supplies a `values` object keyed by each of its `params[]`' `key`, always
// populated from that param's own `default` unless the learner edited it.
// `orUndef`/`orUndefNum` translate an empty-string field back to "omitted"
// for the underlying builder function's optional args, matching the
// "absent → empty, caller supplies it" convention `wasm/src/lib.rs`'s
// `build_payload` uses.

import { leaf, struct, type KmipNode } from './nodes'

/** UTF-8 text → lowercase hex, browser-safe (no `Buffer`). */
const textHex = (s: string): string =>
  Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export type OpCategory =
  | 'Discovery & Session'
  | 'Object Lifecycle'
  | 'Attributes'
  | 'Cryptographic Services'
  | 'RNG & PKCS#11 Passthrough'
  | 'Asynchronous Processing'
  | 'Certificate Services'
  | 'Not Implemented (out of scope)'

export type ParamKind = 'uid' | 'algorithm' | 'text' | 'hex' | 'number' | 'select' | 'bool'

export interface OpParam {
  /** Matches the `values` key `build(values)` reads. */
  key: string
  label: string
  kind: ParamKind
  /** `select` kind's choices. */
  options?: string[]
  /** Pre-filled value the field editor shows before the learner edits it. */
  default?: string
  /** `hex` kind only: auto-fill a fresh random value of this many bytes the
   * first time the row expands (e.g. Encrypt's IV) — still a normal
   * editable field afterward; never silently reuses one value all session. */
  randomBytes?: number
}

export interface OpTemplate {
  op: string
  category: OpCategory
  /** One-line KMIP 3.0 spec citation, e.g. "§6.1.18 Derive Key". */
  spec: string
  /** `false` for the 4 permanently-unsupported ops (Notify/Put —
   * server-to-client by definition; Delegated Login/Re-Provision — no
   * handler) — the Run button still fires a REAL request and shows the real
   * `OperationNotSupported` response; this only flags the Commands tab to
   * label the card. */
  supported: boolean
  /** One-line plain-English description shown in the op row. */
  blurb: string
  /** Editable fields the Reference tab's per-op form renders. Empty for ops
   * with no meaningful input (Query, Ping, the unimplemented ops, …). */
  params: OpParam[]
  /** RequestPayload children for `buildRequest(op, ...build(values))`. */
  build: (values: Record<string, string>) => KmipNode[]
  /** Extra RequestHeader fields (KMIP 3.0 §8.1.2 `Asynchronous Indicator`) —
   * header-level, so `build`'s payload can't carry them. */
  headerBuild?: (values: Record<string, string>) => KmipNode[]
}

const uidLeaf = (uid: string) => leaf('UniqueIdentifier', 'TextString', uid)

/** Empty-string field → "omitted", for an underlying builder's optional arg. */
const orUndef = (s: string | undefined): string | undefined => (s ? s : undefined)
const orUndefNum = (s: string | undefined): number | undefined => (s ? Number(s) : undefined)
const numOr = (s: string | undefined, fallback: number): number => (s ? Number(s) : fallback)
const splitList = (s: string | undefined): string[] =>
  (s ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

// ── 1. Discovery & Session ──────────────────────────────────────────────────

export const query = (
  functions: string[] = ['QueryOperations', 'QueryObjects', 'QueryServerInformation']
): KmipNode[] => functions.map((f) => leaf('QueryFunction', 'Enumeration', f))

export const discoverVersions = (protocolVersions: Array<[number, number]> = []): KmipNode[] =>
  protocolVersions.map(([major, minor]) =>
    struct(
      'ProtocolVersion',
      leaf('ProtocolVersionMajor', 'Integer', major),
      leaf('ProtocolVersionMinor', 'Integer', minor)
    )
  )

export const ping = (): KmipNode[] => []

export const interop = (
  fn: 'Begin' | 'End' = 'Begin',
  identifier = 'kmip3-commands'
): KmipNode[] => [
  leaf('InteropFunction', 'Enumeration', fn),
  leaf('InteropIdentifier', 'TextString', identifier),
]

export const login = (leaseTime?: number, requestCount?: number): KmipNode[] => {
  const payload: KmipNode[] = []
  if (leaseTime !== undefined) payload.push(leaf('LeaseTime', 'Interval', leaseTime))
  if (requestCount !== undefined) payload.push(leaf('RequestCount', 'Integer', requestCount))
  return payload
}

export const logout = (ticket = ''): KmipNode[] =>
  ticket ? [leaf('Ticket', 'ByteString', ticket)] : []

export const log = (message = 'kmip3-commands log entry'): KmipNode[] => [
  leaf('LogMessage', 'TextString', message),
]

export const createCredential = (username: string, password?: string): KmipNode[] => {
  const cred = [leaf('Username', 'TextString', username)]
  if (password !== undefined) cred.push(leaf('Password', 'TextString', password))
  return [
    leaf('CredentialType', 'Enumeration', 'UsernameAndPassword'),
    struct('PasswordCredential', ...cred),
  ]
}

export const createGroup = (name = 'kmip3-group'): KmipNode[] => [
  struct('Attributes', leaf('Name', 'TextString', name)),
]

export const createUser = (name = 'kmip3-user'): KmipNode[] => [
  struct('Attributes', leaf('Name', 'TextString', name)),
]

export const setEndpointRole = (role: 'Server' | 'Client' = 'Server'): KmipNode[] => [
  leaf('EndpointRole', 'Enumeration', role),
]

// ── 2. Object Lifecycle ─────────────────────────────────────────────────────

export const create = (algorithm = 'AES', length = 256, usage = 'Encrypt Decrypt'): KmipNode[] => [
  leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
  struct(
    'Attributes',
    leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
    leaf('CryptographicLength', 'Integer', length),
    leaf('CryptographicUsageMask', 'Integer', usage)
  ),
]

export const createKeyPair = (
  algorithm = 'ML-DSA-65',
  usage = 'Sign Verify',
  seedHex?: string
): KmipNode[] => {
  const payload: KmipNode[] = [
    struct(
      'CommonAttributes',
      leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
      leaf('CryptographicUsageMask', 'Integer', usage)
    ),
  ]
  // WD19 §3.4 `Seed` — deterministic keygen from FIPS 204 ξ / FIPS 203
  // d‖z / FIPS 205 SK.seed‖SK.prf‖PK.seed (create_key_pair.rs forwards it
  // to `generate_*_keypair_from_seed_extractable`), for KAT reproducibility
  // instead of the RNG. A seeded key is born Extractable so its material
  // can be Got byte-exact.
  if (seedHex) payload.push(leaf('Seed', 'ByteString', seedHex))
  return payload
}

export const register = (algorithm = 'AES', length = 256, keyMaterialHex = ''): KmipNode[] => [
  leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
  struct(
    'Attributes',
    leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
    leaf('CryptographicLength', 'Integer', length),
    leaf('CryptographicUsageMask', 'Integer', 'Encrypt Decrypt')
  ),
  struct(
    'SymmetricKey',
    struct(
      'KeyBlock',
      leaf('KeyFormatType', 'Enumeration', 'Raw'),
      struct('KeyValue', leaf('KeyMaterial', 'ByteString', keyMaterialHex)),
      leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
      leaf('CryptographicLength', 'Integer', length)
    )
  ),
]

export const importObject = (
  uid: string,
  algorithm = 'AES',
  length = 256,
  keyMaterialHex = '',
  replaceExisting = false
): KmipNode[] => [
  uidLeaf(uid),
  leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
  leaf('ReplaceExisting', 'Boolean', replaceExisting),
  struct(
    'Attributes',
    leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
    leaf('CryptographicLength', 'Integer', length),
    leaf('CryptographicUsageMask', 'Integer', 'Encrypt Decrypt')
  ),
  struct(
    'SymmetricKey',
    struct(
      'KeyBlock',
      leaf('KeyFormatType', 'Enumeration', 'Raw'),
      struct('KeyValue', leaf('KeyMaterial', 'ByteString', keyMaterialHex)),
      leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
      leaf('CryptographicLength', 'Integer', length)
    )
  ),
]

/** §11 Key Wrapping Specification — AES-KW (RFC 3394) wrap the returned
 * key material under `wrapKeyUid` (which must be Active with WrapKey
 * usage) instead of returning it in the clear. Shared by Get (§6.1.23)
 * and Export (§6.1.22) — `helpers::wrap_key_value` backs both identically
 * (K16). This is also the ONLY way to Get/Export a `Sensitive=true`
 * object at all (get.rs / register_import_export.rs's Export both refuse
 * a plaintext read of one). */
const keyWrappingSpecification = (wrapKeyUid: string): KmipNode =>
  struct(
    'KeyWrappingSpecification',
    leaf('WrappingMethod', 'Enumeration', 'Encrypt'),
    struct(
      'EncryptionKeyInformation',
      uidLeaf(wrapKeyUid),
      struct('CryptographicParameters', leaf('BlockCipherMode', 'Enumeration', 'NISTKeyWrap'))
    )
  )

export const exportObject = (
  uid: string,
  keyFormatType?: string,
  wrapKeyUid?: string
): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (keyFormatType) payload.push(leaf('KeyFormatType', 'Enumeration', keyFormatType))
  if (wrapKeyUid) payload.push(keyWrappingSpecification(wrapKeyUid))
  return payload
}

export const get = (uid: string, keyFormatType?: string, wrapKeyUid?: string): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (keyFormatType) payload.push(leaf('KeyFormatType', 'Enumeration', keyFormatType))
  if (wrapKeyUid) payload.push(keyWrappingSpecification(wrapKeyUid))
  return payload
}

/** Locate filters ride in an `Attributes` structure (§6.1.32). Length /
 * usage-mask / UID filtering became REAL in engine 0.13.0 — previously the
 * server accepted these as valid syntax and silently ignored them,
 * returning every object instead of narrowing. */
export interface LocatePagingParams {
  /** §6.1.32 Maximum Items — cap the number of UIDs returned. */
  maxItems?: number
  /** §6.1.32 Offset Items — skip this many matches before applying
   * Maximum Items (paging: offset selects the page start). */
  offsetItems?: number
  /** §12.3 Table 608 Storage Status Mask bitmask — On-line 0x01, Archival
   * 0x02, Destroyed 0x04 (OR together for more than one class). Omitted
   * defaults to On-line only, per §6.1.32. */
  storageStatusMask?: number
}

export const locate = (
  algorithm?: string,
  length?: number,
  uid?: string,
  paging?: LocatePagingParams
): KmipNode[] => {
  const filters: KmipNode[] = []
  if (algorithm) filters.push(leaf('CryptographicAlgorithm', 'Enumeration', algorithm))
  if (length !== undefined) filters.push(leaf('CryptographicLength', 'Integer', length))
  if (uid) filters.push(leaf('UniqueIdentifier', 'TextString', uid))
  // §6.1.32 — Attributes is REQUIRED, even with no filters: "the Attributes
  // structure MAY be empty indicating all objects should match." Omitting
  // it outright (the pre-2026-07-17 behavior) was non-conformant.
  const payload: KmipNode[] = [struct('Attributes', ...filters)]
  if (paging?.maxItems !== undefined) payload.push(leaf('MaximumItems', 'Integer', paging.maxItems))
  if (paging?.offsetItems !== undefined)
    payload.push(leaf('OffsetItems', 'Integer', paging.offsetItems))
  if (paging?.storageStatusMask !== undefined)
    payload.push(leaf('StorageStatusMask', 'Integer', paging.storageStatusMask))
  return payload
}

export const activate = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const revoke = (uid: string, reason = 'Unspecified'): KmipNode[] => [
  uidLeaf(uid),
  struct('RevocationReason', leaf('RevocationReasonCode', 'Enumeration', reason)),
]

export const destroy = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const deactivate = (uid: string, reason?: string): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  // §6.1.14 — Deactivation Reason Code is genuinely stored
  // (`obj.deactivation_reason_code`); Deactivation Date is NOT — the
  // handler always stamps "now" regardless of any client-supplied value
  // (deactivate.rs), so there is no matching date field to expose here.
  if (reason)
    payload.push(
      struct('DeactivationReason', leaf('DeactivationReasonCode', 'Enumeration', reason))
    )
  return payload
}

export interface CheckParams {
  /** §6.1.7 — must fit within the object's remaining Usage Limits budget. */
  usageLimitsCount?: number
  /** §6.1.7 — must be a subset of the object's own Cryptographic Usage
   * Mask (same mask-string convention as Create's `usage`). */
  cryptographicUsageMask?: string
  /** §6.1.7 — must not exceed the object's own Lease Time cap. */
  leaseTimeSeconds?: number
}

/** §6.1.7 Check — validates policy permits the client's intended use
 * WITHOUT performing a crypto operation: all three fields are real
 * (Phase 3.1), not a v0.1 always-allow stub. */
export const check = (uid: string, params?: CheckParams): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (params?.usageLimitsCount !== undefined)
    payload.push(leaf('UsageLimitsCount', 'LongInteger', params.usageLimitsCount))
  if (params?.cryptographicUsageMask)
    payload.push(leaf('CryptographicUsageMask', 'Integer', params.cryptographicUsageMask))
  if (params?.leaseTimeSeconds !== undefined)
    payload.push(leaf('LeaseTime', 'Interval', params.leaseTimeSeconds))
  return payload
}

export const archive = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const recover = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const obliterate = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const getUsageAllocation = (uid: string, usageLimitsCount?: number): KmipNode[] =>
  usageLimitsCount !== undefined
    ? [uidLeaf(uid), leaf('UsageLimitsCount', 'LongInteger', usageLimitsCount)]
    : [uidLeaf(uid)]

// ── 3. Attributes ────────────────────────────────────────────────────────────

export const getAttributes = (uid: string, attributeReferences: string[] = []): KmipNode[] => [
  uidLeaf(uid),
  ...attributeReferences.map((name) => leaf('AttributeReference', 'Enumeration', name)),
]

export const getAttributeList = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const addAttribute = (
  uid: string,
  name = 'Comment',
  value = 'kmip3-commands'
): KmipNode[] => [uidLeaf(uid), struct('NewAttribute', leaf(name, 'TextString', value))]

export const modifyAttribute = (
  uid: string,
  name = 'Comment',
  value = 'kmip3-commands',
  currentValue?: string
): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  // §6.1.38 `CurrentAttribute` — disambiguates WHICH existing instance to
  // change when an attribute could carry more than one value; omitted
  // auto-selects the sole instance. attribute_mutate.rs's `modify_attribute`
  // rejects a CurrentAttribute that doesn't match any existing value.
  if (currentValue) payload.push(struct('CurrentAttribute', leaf(name, 'TextString', currentValue)))
  payload.push(struct('NewAttribute', leaf(name, 'TextString', value)))
  return payload
}

export const deleteAttribute = (
  uid: string,
  attributeReference = 'Comment',
  currentValue?: string
): KmipNode[] => [
  uidLeaf(uid),
  // §6.1.17 — a `CurrentAttribute` deletes that ONE value; a bare
  // `AttributeReference` deletes every instance of the named attribute.
  // delete_attribute.rs checks CurrentAttribute FIRST, so sending both is
  // safe: the value-specific delete wins when currentValue is supplied.
  ...(currentValue
    ? [struct('CurrentAttribute', leaf(attributeReference, 'TextString', currentValue))]
    : []),
  leaf('AttributeReference', 'Enumeration', attributeReference),
]

export const setAttribute = (uid: string, name = 'Name', value = 'kmip3-commands'): KmipNode[] => [
  uidLeaf(uid),
  struct('NewAttribute', leaf(name, 'TextString', value)),
]

export const adjustAttribute = (
  uid: string,
  attributeReference = 'CryptographicUsageMask',
  adjustmentType: 'Increment' | 'Decrement' | 'Negate' = 'Increment',
  adjustmentValue?: number
): KmipNode[] => {
  const payload = [
    uidLeaf(uid),
    leaf('AttributeReference', 'Enumeration', attributeReference),
    leaf('AdjustmentType', 'Enumeration', adjustmentType),
  ]
  if (adjustmentValue !== undefined)
    payload.push(leaf('AdjustmentValue', 'Integer', adjustmentValue))
  return payload
}

export const getConstraints = (): KmipNode[] => []

export const setDefaults = (objectType = 'SymmetricKey', name?: string): KmipNode[] => {
  const attrs = name ? [leaf('Name', 'TextString', name)] : []
  return [
    struct(
      'DefaultsInformation',
      struct(
        'ObjectDefaults',
        leaf('ObjectType', 'Enumeration', objectType),
        struct('Attributes', ...attrs)
      )
    ),
  ]
}

// ── 4. Cryptographic Services ───────────────────────────────────────────────

export interface EncryptAeadParams {
  /** §11 Authenticated Encryption Additional Data — AAD for AES-GCM /
   * ChaCha20-Poly1305, bound into the auth tag but never encrypted
   * (encrypt.rs reads `req.aad`, forwarded to the engine unconditionally). */
  aadHex?: string
  /** §11 Tag Length (bytes) — requested AEAD tag length (NIST SP 800-38D
   * §5.2.1.2: 12-16 for GCM; ChaCha20-Poly1305 requires exactly 16).
   * `CryptographicParameters.TagLength`, validated in encrypt_classical. */
  tagLengthBytes?: number
}

export const encrypt = (
  uid: string,
  dataHex: string,
  ivHex?: string,
  aead?: EncryptAeadParams
): KmipNode[] => {
  const cpChildren: KmipNode[] = []
  if (aead?.tagLengthBytes !== undefined)
    cpChildren.push(leaf('TagLength', 'Integer', aead.tagLengthBytes))
  const payload = [
    uidLeaf(uid),
    struct('CryptographicParameters', ...cpChildren),
    leaf('Data', 'ByteString', dataHex),
  ]
  if (ivHex) payload.push(leaf('IVCounterNonce', 'ByteString', ivHex))
  if (aead?.aadHex)
    payload.push(leaf('AuthenticatedEncryptionAdditionalData', 'ByteString', aead.aadHex))
  return payload
}

export interface DecryptAeadParams {
  /** §11 Authenticated Encryption Additional Data — MUST byte-match the
   * value supplied at Encrypt time or the AEAD tag check fails. */
  aadHex?: string
  /** §11 Authenticated Encryption Tag — the AEAD tag, carried as its own
   * field (NOT appended to Data); decrypt.rs recombines
   * `ciphertext||tag` server-side before calling the engine, since the
   * shim's AEAD primitives expect them concatenated. */
  tagHex?: string
  /** §11 Tag Length (bytes) — see EncryptAeadParams. */
  tagLengthBytes?: number
}

export const decrypt = (
  uid: string,
  dataHex: string,
  ivHex?: string,
  aead?: DecryptAeadParams
): KmipNode[] => {
  const cpChildren: KmipNode[] = []
  if (aead?.tagLengthBytes !== undefined)
    cpChildren.push(leaf('TagLength', 'Integer', aead.tagLengthBytes))
  const payload = [
    uidLeaf(uid),
    struct('CryptographicParameters', ...cpChildren),
    leaf('Data', 'ByteString', dataHex),
  ]
  if (ivHex) payload.push(leaf('IVCounterNonce', 'ByteString', ivHex))
  if (aead?.tagHex) payload.push(leaf('AuthenticatedEncryptionTag', 'ByteString', aead.tagHex))
  if (aead?.aadHex)
    payload.push(leaf('AuthenticatedEncryptionAdditionalData', 'ByteString', aead.aadHex))
  return payload
}

export interface SignPqcParams {
  /** §11 Deterministic — force the non-hedged variant on a per-call basis. */
  deterministic?: boolean
  /** §11 Internal — use the `*.Sign_internal` interface (no external domain framing). */
  internal?: boolean
  /** §11 External Mu — `data` below is the 64-byte message representative µ
   * (FIPS 204's ExternalMu-ML-DSA.Sign), not the message itself. */
  externalMu?: boolean
  /** §11 Context String (hex) — FIPS 204/205 signing context; the mechanism
   * a HashML-DSA/HashSLH-DSA-style prehash binds which hash function was
   * used to produce `data`. */
  contextStringHex?: string
  /** §11 Random (hex) — explicit signing randomizer for the hedged variant,
   * making an otherwise-random signature reproducible. */
  randomHex?: string
}

export const sign = (
  uid: string,
  dataHex: string,
  algorithm?: string,
  pqc?: SignPqcParams
): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  const cpChildren: KmipNode[] = []
  if (algorithm) cpChildren.push(leaf('CryptographicAlgorithm', 'Enumeration', algorithm))
  if (pqc?.deterministic) cpChildren.push(leaf('Deterministic', 'Boolean', true))
  if (pqc?.internal) cpChildren.push(leaf('Internal', 'Boolean', true))
  if (pqc?.externalMu) cpChildren.push(leaf('ExternalMu', 'Boolean', true))
  if (pqc?.contextStringHex)
    cpChildren.push(leaf('ContextString', 'ByteString', pqc.contextStringHex))
  if (pqc?.randomHex) cpChildren.push(leaf('Random', 'ByteString', pqc.randomHex))
  if (cpChildren.length > 0) payload.push(struct('CryptographicParameters', ...cpChildren))
  payload.push(leaf('Data', 'ByteString', dataHex))
  return payload
}

export interface SignatureVerifyPqcParams {
  /** §11 Internal — verify via the `*.Verify_internal` interface (no
   * external domain framing), mirrors Sign's `internal`. */
  internal?: boolean
  /** §11 External Mu — `data` is the 64-byte message representative µ. */
  externalMu?: boolean
  /** §11 Context String (hex) — FIPS 204/205 verification context; MUST
   * match the value used at signing time. */
  contextStringHex?: string
  /** §11 Salt Length (bytes) — pins RSA-PSS EMSA-PSS-VERIFY to exactly
   * this salt length; absent keeps the engine's two-candidate default
   * (hash length / maximal). signature_verify.rs's `pss_salt_from_cp`
   * reads this the same way sign.rs's PSS path does. */
  saltLengthBytes?: number
}

export const signatureVerify = (
  uid: string,
  dataHex: string,
  signatureHex: string,
  pqc?: SignatureVerifyPqcParams
): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  const cpChildren: KmipNode[] = []
  if (pqc?.internal) cpChildren.push(leaf('Internal', 'Boolean', true))
  if (pqc?.externalMu) cpChildren.push(leaf('ExternalMu', 'Boolean', true))
  if (pqc?.contextStringHex)
    cpChildren.push(leaf('ContextString', 'ByteString', pqc.contextStringHex))
  if (pqc?.saltLengthBytes !== undefined)
    cpChildren.push(leaf('SaltLength', 'Integer', pqc.saltLengthBytes))
  if (cpChildren.length > 0) payload.push(struct('CryptographicParameters', ...cpChildren))
  payload.push(leaf('Data', 'ByteString', dataHex))
  payload.push(leaf('SignatureData', 'ByteString', signatureHex))
  return payload
}

export const encapsulate = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const decapsulate = (uid: string, dataHex: string): KmipNode[] => [
  uidLeaf(uid),
  leaf('Data', 'ByteString', dataHex),
]

export const mac = (uid: string, dataHex: string): KmipNode[] => [
  uidLeaf(uid),
  leaf('Data', 'ByteString', dataHex),
]

export const macVerify = (uid: string, dataHex: string, macDataHex: string): KmipNode[] => [
  uidLeaf(uid),
  leaf('Data', 'ByteString', dataHex),
  leaf('MACData', 'ByteString', macDataHex),
]

export const hash = (dataHex: string, algorithm = 'SHA256'): KmipNode[] => [
  struct('CryptographicParameters', leaf('HashingAlgorithm', 'Enumeration', algorithm)),
  leaf('Data', 'ByteString', dataHex),
]

export interface DeriveKeyParams {
  /** §7.13 — REQUIRED for HASH (which hash to run) and for PBKDF2 (which
   * PRF hash; defaults server-side to SHA-256 if omitted); OPTIONAL for
   * HMAC/NIST800-108-C (falls back to the base key's own HMAC algorithm,
   * then SHA-256). Feeds `DerivationParameters.CryptographicParameters
   * .HashingAlgorithm` — derive_key.rs's `request_hash`. */
  hashAlgorithm?: string
  /** §7.13 Table 465 — REQUIRED for PBKDF2. */
  saltHex?: string
  /** §7.13 Table 465 — REQUIRED for PBKDF2 (must be a positive integer). */
  iterationCount?: number
}

/** Defaults match `op_coverage_e2e.rs`'s `dk-derive` case: NIST SP 800-108
 * Counter-Mode, deriving a 256-bit AES key. PBKDF2/HASH/HMAC/AsymmetricKey
 * (ECDH agreement) are also real (derive_key.rs) — `params` carries the
 * extra fields those methods consume. */
export const deriveKey = (
  baseUid: string,
  derivationDataHex = textHex('label\x00context'),
  objectType = 'SymmetricKey',
  method = 'NIST800-108-C',
  algorithm = 'AES',
  length = 256,
  params?: DeriveKeyParams
): KmipNode[] => {
  const dpChildren: KmipNode[] = []
  if (params?.hashAlgorithm)
    dpChildren.push(
      struct(
        'CryptographicParameters',
        leaf('HashingAlgorithm', 'Enumeration', params.hashAlgorithm)
      )
    )
  if (derivationDataHex) dpChildren.push(leaf('DerivationData', 'ByteString', derivationDataHex))
  if (params?.saltHex) dpChildren.push(leaf('Salt', 'ByteString', params.saltHex))
  if (params?.iterationCount !== undefined)
    dpChildren.push(leaf('IterationCount', 'Integer', params.iterationCount))
  return [
    leaf('ObjectType', 'Enumeration', objectType),
    uidLeaf(baseUid),
    leaf('DerivationMethod', 'Enumeration', method),
    struct('DerivationParameters', ...dpChildren),
    struct(
      'Attributes',
      leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
      leaf('CryptographicLength', 'Integer', length),
      leaf('CryptographicUsageMask', 'Integer', 'Encrypt Decrypt')
    ),
  ]
}

export const rekey = (uid: string, offset?: number): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (offset !== undefined) payload.push(leaf('Offset', 'Interval', offset))
  return payload
}

export const rekeyKeyPair = (uid: string, offset?: number): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (offset !== undefined) payload.push(leaf('Offset', 'Interval', offset))
  return payload
}

// ── 5. RNG & PKCS#11 Passthrough ────────────────────────────────────────────

export const rngRetrieve = (dataLength = 32): KmipNode[] => [
  leaf('DataLength', 'Integer', dataLength),
]

export const rngSeed = (dataHex: string): KmipNode[] => [leaf('Data', 'ByteString', dataHex)]

export const pkcs11 = (
  fn = 'CGetInfo',
  inputParametersHex?: string,
  iface?: string
): KmipNode[] => {
  const payload: KmipNode[] = []
  // §6.1.42 `PKCS#11 Interface` — names which Cryptoki version's
  // semantics the passthrough call should honor (e.g. "3.0" vs "3.2");
  // decoded into `Pkcs11Request.interface` and echoed back verbatim on
  // the response (rng_and_pkcs11.rs).
  if (iface) payload.push(leaf('PKCS11Interface', 'TextString', iface))
  payload.push(leaf('PKCS11Function', 'Enumeration', fn))
  if (inputParametersHex)
    payload.push(leaf('PKCS11InputParameters', 'ByteString', inputParametersHex))
  return payload
}

// ── 6. Certificate Services — pure-Rust since the cert-ops port ─────────────
// Validate/Certify/ReCertify used to be native-only: Validate's chain check
// went through `x509-parser`'s `ring`-backed `verify_signature`, and
// Certify's CSR check through rcgen — neither cross-compiles to wasm32. Both
// now verify/issue via `ops::spki_verify::verify_with_spki` (pure-Rust
// `spki`/`der` decode + the SAME engine every other op uses), so they
// dispatch identically here and in the native server. Field shapes mirror
// `pqctoday-hsm/kmip/src/kmip30/wire.rs`'s `decode_validate_req` /
// `decode_certify_req` / `decode_recertify_req` exactly.

/** §6.1.62 Validate. `certificateHex` are inline DER blobs (each wrapped in
 * its own `Certificate { CertificateValue }` structure per the wire
 * decoder); `uids` are stored Certificate objects; both lists combine into
 * one candidate chain. `validityDate` (unix seconds) is optional — omitted
 * means "now" server-side. */
export const validate = (
  certificateHex: string[] = [],
  uids: string[] = [],
  validityDate?: number
): KmipNode[] => {
  const payload: KmipNode[] = []
  for (const hex of certificateHex) {
    payload.push(struct('Certificate', leaf('CertificateValue', 'ByteString', hex)))
  }
  for (const uid of uids) payload.push(uidLeaf(uid))
  if (validityDate !== undefined) payload.push(leaf('ValidityDate', 'DateTime', validityDate))
  return payload
}

/** §6.1.6 Certify. Either `uid` (certify a stored PublicKey by UID) or
 * `csrHex` (a PKCS#10 CSR — the only `CertificateRequestType` Certify
 * accepts) should be supplied; supplying neither reproduces the real
 * `neither a Certificate Request nor a Unique Identifier supplied` error,
 * not a client-side guess at one. */
export interface CertifyValidityParams {
  /** §6.1.6 — Activation Date attribute inside the request's Attributes
   * bag (unix seconds); `dates_from_attributes` reads it as the issued
   * cert's Not-Before. Omitted defaults to now (or Offset, on Re-certify). */
  activationDate?: number
  /** §6.1.6 — Deactivation Date attribute (unix seconds); read as the
   * issued cert's Not-After. Omitted defaults to Not-Before + 1 year. */
  deactivationDate?: number
}

const certifyValidityAttrs = (validity?: CertifyValidityParams): KmipNode[] => {
  const attrs: KmipNode[] = []
  if (validity?.activationDate !== undefined)
    attrs.push(leaf('ActivationDate', 'DateTime', validity.activationDate))
  if (validity?.deactivationDate !== undefined)
    attrs.push(leaf('DeactivationDate', 'DateTime', validity.deactivationDate))
  return attrs
}

export const certify = (uid = '', csrHex = '', validity?: CertifyValidityParams): KmipNode[] => {
  const payload: KmipNode[] = []
  if (uid) payload.push(uidLeaf(uid))
  if (csrHex) {
    payload.push(leaf('CertificateRequestType', 'Enumeration', 'PKCS10'))
    payload.push(leaf('CertificateRequest', 'ByteString', csrHex))
  }
  const attrs = certifyValidityAttrs(validity)
  if (attrs.length > 0) payload.push(struct('Attributes', ...attrs))
  return payload
}

/** §6.1.50 Re-certify. `uid` (the existing Certificate to renew) is
 * REQUIRED; an optional `csrHex` re-keys with a fresh subject key instead
 * of reusing the existing one; `offsetSeconds` shifts the new Activation
 * Date relative to Initial Date (omitted → renews the existing window). */
export const reCertify = (
  uid: string,
  csrHex = '',
  offsetSeconds?: number,
  validity?: CertifyValidityParams
): KmipNode[] => {
  const payload: KmipNode[] = [uidLeaf(uid)]
  if (csrHex) {
    payload.push(leaf('CertificateRequestType', 'Enumeration', 'PKCS10'))
    payload.push(leaf('CertificateRequest', 'ByteString', csrHex))
  }
  if (offsetSeconds !== undefined) payload.push(leaf('Offset', 'Interval', offsetSeconds))
  // Offset (above) takes precedence over ActivationDate when both are
  // supplied — validity_window() resolves Not-Before that way.
  const attrs = certifyValidityAttrs(validity)
  if (attrs.length > 0) payload.push(struct('Attributes', ...attrs))
  return payload
}

// ── 7. Split keys, leases, async (engine 0.12.0 "honest maximum") ───────────
// Real since engine 0.12.0 — request shapes mirror the wire decoders in
// `pqctoday-hsm/kmip/src/kmip30/wire.rs` (`decode_create_split_key_req`,
// `decode_join_split_key_req`, `decode_poll_req`, …) and were verified
// end-to-end against the wasm build before promotion out of the
// "Advertised-only / Not Implemented" bucket.

/** §6.1.12 Create Split Key — splits an existing key into N share objects,
 * any M (threshold) of which reconstruct it. NOTE: the XOR method requires
 * parts == threshold (KMIP 3.0 §13.1 — every share is needed); true M-of-N
 * needs one of the polynomial (Shamir) methods. */
export const createSplitKey = (
  uid: string,
  parts = 5,
  threshold = 3,
  method = 'Polynomial Sharing GF (28)'
): KmipNode[] => [
  leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
  uidLeaf(uid),
  leaf('SplitKeyParts', 'Integer', parts),
  leaf('SplitKeyThreshold', 'Integer', threshold),
  leaf('SplitKeyMethod', 'Enumeration', method),
]

/** §6.1.31 Join Split Key — reconstruct from a threshold-sized subset of
 * share UIDs (repeated UniqueIdentifier leaves). Below-threshold subsets are
 * refused with the exact shortfall named, never garbage. */
export const joinSplitKey = (uids: string[]): KmipNode[] => [
  leaf('ObjectType', 'Enumeration', 'SymmetricKey'),
  ...uids.map((u) => leaf('UniqueIdentifier', 'TextString', u)),
]

/** §6.1.40 Obtain Lease — grant/renew a lease on a managed object. */
export const obtainLease = (uid: string): KmipNode[] => [uidLeaf(uid)]

/** §6.1.57 Set Constraints — replace the server's constraint table. */
export const setConstraints = (): KmipNode[] => [struct('Constraints')]

/** §6.1.43/§6.1.5/§6.1.44 — the async-management trio all address a job by
 * the Asynchronous Correlation Value the enqueue response returned. */
export const poll = (correlationValueHex: string): KmipNode[] => [
  leaf('AsynchronousCorrelationValue', 'ByteString', correlationValueHex),
]
export const cancel = (correlationValueHex: string): KmipNode[] => [
  leaf('AsynchronousCorrelationValue', 'ByteString', correlationValueHex),
]
export const process = (correlationValueHex: string): KmipNode[] => [
  leaf('AsynchronousCorrelationValue', 'ByteString', correlationValueHex),
]

/** §6.1.46 Query Asynchronous Requests — both filters optional; an empty
 * payload lists every outstanding job. `operations` narrows by KMIP
 * Operation name (e.g. `['Hash', 'Sign']`) — async_ops.rs ANDs it with
 * the correlation-value filter (a job matches when its correlation value
 * is absent-or-listed AND its operation is absent-or-listed). */
export const queryAsynchronousRequests = (
  correlationValueHex?: string,
  operations?: string[]
): KmipNode[] => {
  const payload: KmipNode[] = []
  if (correlationValueHex)
    payload.push(
      struct(
        'AsynchronousCorrelationValues',
        leaf('AsynchronousCorrelationValue', 'ByteString', correlationValueHex)
      )
    )
  if (operations && operations.length > 0)
    payload.push(
      struct('Operations', ...operations.map((op) => leaf('Operation', 'Enumeration', op)))
    )
  return payload
}

// ── 8. Not implemented (out of scope) ────────────────────────────────────────
// The last 4 truly-unimplemented ops. Since engine 0.12.0's honest-Query
// audit these are NOT advertised either — `Query` lists only real
// capabilities. Notify/Put are server-to-client push (a deliberate,
// documented scope boundary — the spec leaves that transport unspecified);
// DelegatedLogin/Re-Provision simply have no handler. The dispatcher rejects
// all four with a real `OperationNotSupported (0x05)`, so an empty payload
// is the correct, real request.

export const notify = (): KmipNode[] => []
export const put = (): KmipNode[] => []
export const delegatedLogin = (): KmipNode[] => []
export const reProvision = (): KmipNode[] => []

// ── Registry ─────────────────────────────────────────────────────────────────
// One entry per operation, in the same 7-bucket order the Commands tab
// groups them by. `params[]`/`blurb` ported from the design handoff's
// cacp3-ops.js (categories/op-names/spec citations there were derived from
// this exact file). `build(values)` routes the field editor's real values to
// each op's own named builder function above.

export const OP_TEMPLATES: OpTemplate[] = [
  // 1. Discovery & Session
  {
    op: 'Query',
    category: 'Discovery & Session',
    spec: '§6.1.45 Query',
    supported: true,
    blurb:
      'Ask the server what it supports — operations, object types, vendor info. The first call any client makes. Since engine 0.12.0 the answer is audited-honest: every one of the 62 operations it advertises is genuinely implemented.',
    params: [],
    build: () => query(),
  },
  {
    op: 'DiscoverVersions',
    category: 'Discovery & Session',
    spec: '§6.1.20 Discover Versions',
    supported: true,
    blurb: 'Negotiate which KMIP protocol versions client and server both speak.',
    params: [],
    build: () => discoverVersions(),
  },
  {
    op: 'Ping',
    category: 'Discovery & Session',
    spec: '§6.1.41 Ping',
    supported: true,
    blurb: 'The simplest possible request — an empty round trip to confirm the server is alive.',
    params: [],
    build: () => ping(),
  },
  {
    op: 'Interop',
    category: 'Discovery & Session',
    spec: '§6.1.30 Interop (test-suite framework marker)',
    supported: true,
    blurb:
      'A conformance-tooling marker that brackets a sequence of operations as one interoperability test.',
    params: [
      { key: 'fn', label: 'Function', kind: 'select', options: ['Begin', 'End'], default: 'Begin' },
      { key: 'identifier', label: 'Identifier', kind: 'text', default: 'kmip3-commands' },
    ],
    build: (v) => interop((v.fn as 'Begin' | 'End') || 'Begin', v.identifier),
  },
  {
    op: 'Login',
    category: 'Discovery & Session',
    spec: '§6.1.34 Login',
    supported: true,
    blurb: 'Start a leased, ticket-based session instead of authenticating every request.',
    params: [
      { key: 'leaseTime', label: 'Lease time (s)', kind: 'number', default: '3600' },
      { key: 'requestCount', label: 'Request count', kind: 'number', default: '100' },
    ],
    build: (v) => login(orUndefNum(v.leaseTime), orUndefNum(v.requestCount)),
  },
  {
    op: 'Logout',
    category: 'Discovery & Session',
    spec: '§6.1.35 Logout',
    supported: true,
    blurb: 'End a Login session, invalidating its ticket.',
    params: [{ key: 'ticket', label: 'Ticket (hex)', kind: 'hex', default: '' }],
    build: (v) => logout(v.ticket ?? ''),
  },
  {
    op: 'Log',
    category: 'Discovery & Session',
    spec: '§6.1.33 Log',
    supported: true,
    blurb:
      "Forward a free-text diagnostic message to the server's log — not policy-relevant, purely operational.",
    params: [
      { key: 'message', label: 'Message', kind: 'text', default: 'kmip3-commands log entry' },
    ],
    build: (v) => log(v.message || 'kmip3-commands log entry'),
  },
  {
    op: 'CreateCredential',
    category: 'Discovery & Session',
    spec: '§6.1.9 Create Credential',
    supported: true,
    blurb:
      'Register a username/password credential the server can authenticate future requests against.',
    params: [
      { key: 'username', label: 'Username', kind: 'text', default: 'kmip3-commands-user' },
      { key: 'password', label: 'Password', kind: 'text', default: 'demo-password' },
    ],
    build: (v) => createCredential(v.username || 'kmip3-commands-user', orUndef(v.password)),
  },
  {
    op: 'CreateUser',
    category: 'Discovery & Session',
    spec: '§6.1.13 Create User',
    supported: true,
    blurb: 'Provision a new user principal on the server.',
    params: [{ key: 'name', label: 'Name', kind: 'text', default: 'kmip3-user' }],
    build: (v) => createUser(v.name || 'kmip3-user'),
  },
  {
    op: 'CreateGroup',
    category: 'Discovery & Session',
    spec: '§6.1.10 Create Group',
    supported: true,
    blurb: 'Provision a new group principal on the server.',
    params: [{ key: 'name', label: 'Name', kind: 'text', default: 'kmip3-group' }],
    build: (v) => createGroup(v.name || 'kmip3-group'),
  },
  {
    op: 'SetEndpointRole',
    category: 'Discovery & Session',
    spec: '§6.1.59 Set Endpoint Role',
    supported: true,
    blurb:
      'Declare this endpoint as acting as a Server or Client — relevant when two KMIP nodes peer with each other.',
    params: [
      {
        key: 'role',
        label: 'Role',
        kind: 'select',
        options: ['Server', 'Client'],
        default: 'Server',
      },
    ],
    build: (v) => setEndpointRole((v.role as 'Server' | 'Client') || 'Server'),
  },

  // 2. Object Lifecycle
  {
    op: 'Create',
    category: 'Object Lifecycle',
    spec: '§6.1.8 Create',
    supported: true,
    blurb:
      'Make a single-key object — almost always a symmetric key (AES). Starts life Pre-Active.',
    params: [
      { key: 'algorithm', label: 'Algorithm', kind: 'algorithm', default: 'AES' },
      { key: 'length', label: 'Length (bits)', kind: 'number', default: '256' },
      { key: 'usage', label: 'Usage mask', kind: 'text', default: 'Encrypt Decrypt' },
    ],
    build: (v) => create(v.algorithm || 'AES', numOr(v.length, 256), v.usage || 'Encrypt Decrypt'),
  },
  {
    op: 'CreateKeyPair',
    category: 'Object Lifecycle',
    spec: '§6.1.11 Create Key Pair',
    supported: true,
    blurb: 'Make an asymmetric key pair in one call — returns TWO UniqueIdentifiers, one per half.',
    params: [
      { key: 'algorithm', label: 'Algorithm', kind: 'algorithm', default: 'ML-DSA-65' },
      { key: 'usage', label: 'Usage mask', kind: 'text', default: 'Sign Verify' },
      {
        key: 'seedHex',
        label: 'Seed (hex, deterministic keygen — FIPS 204/203/205)',
        kind: 'hex',
        default: '',
      },
    ],
    build: (v) =>
      createKeyPair(v.algorithm || 'ML-DSA-65', v.usage || 'Sign Verify', orUndef(v.seedHex)),
  },
  {
    op: 'Register',
    category: 'Object Lifecycle',
    spec: '§6.1.48 Register',
    supported: true,
    blurb:
      'Hand the server key material you already generated elsewhere, so it can manage (not generate) it. Since engine 0.13.0 a malformed or unsupported key is refused HERE, at registration — not silently accepted to fail on first use.',
    params: [
      { key: 'algorithm', label: 'Algorithm', kind: 'algorithm', default: 'AES' },
      { key: 'length', label: 'Length (bits)', kind: 'number', default: '256' },
      { key: 'keyMaterialHex', label: 'Key material (hex)', kind: 'hex', default: '' },
    ],
    build: (v) => register(v.algorithm || 'AES', numOr(v.length, 256), v.keyMaterialHex ?? ''),
  },
  {
    op: 'Import',
    category: 'Object Lifecycle',
    spec: '§6.1.29 Import',
    supported: true,
    blurb:
      'Like Register, but lets you choose the UID and optionally overwrite an existing object.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'algorithm', label: 'Algorithm', kind: 'algorithm', default: 'AES' },
      { key: 'length', label: 'Length (bits)', kind: 'number', default: '256' },
      { key: 'keyMaterialHex', label: 'Key material (hex)', kind: 'hex', default: '' },
      { key: 'replaceExisting', label: 'Replace existing', kind: 'bool', default: 'false' },
    ],
    build: (v) =>
      importObject(
        v.uid ?? '',
        v.algorithm || 'AES',
        numOr(v.length, 256),
        v.keyMaterialHex ?? '',
        v.replaceExisting === 'true'
      ),
  },
  {
    op: 'Export',
    category: 'Object Lifecycle',
    spec: '§6.1.22 Export',
    supported: true,
    blurb: "Pull a managed object's full key material back out — the inverse of Import.",
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        key: 'keyFormatType',
        label: 'Key format',
        kind: 'select',
        options: ['', 'Raw', 'PKCS#1', 'PKCS#8'],
        default: '',
      },
      { key: 'wrapKeyUid', label: 'Wrap under key (UID, AES-KW)', kind: 'uid', default: '' },
    ],
    build: (v) => exportObject(v.uid ?? '', orUndef(v.keyFormatType), orUndef(v.wrapKeyUid)),
  },
  {
    op: 'Get',
    category: 'Object Lifecycle',
    spec: '§6.1.23 Get',
    supported: true,
    blurb: "Fetch a managed object's key material in a specific KeyFormatType.",
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        key: 'keyFormatType',
        label: 'Key format',
        kind: 'select',
        // No generic "Transparent Public Key" exists in the KMIP 3.0 Key
        // Format Type enum — only per-algorithm variants (Transparent RSA/EC/
        // DSA/DH Public Key) — so this list sticks to the algorithm-agnostic
        // formats every object accepts.
        options: ['', 'Raw', 'PKCS#1', 'PKCS#8'],
        default: '',
      },
      {
        key: 'wrapKeyUid',
        label: 'Wrap under key (UID, AES-KW) — also the only way to Get a Sensitive key',
        kind: 'uid',
        default: '',
      },
    ],
    build: (v) => get(v.uid ?? '', orUndef(v.keyFormatType), orUndef(v.wrapKeyUid)),
  },
  {
    op: 'Locate',
    category: 'Object Lifecycle',
    spec: '§6.1.32 Locate',
    supported: true,
    blurb:
      'Search for objects matching attribute filters — algorithm, key length, or UID. Leave all filters empty to list everything in scope. (Length/UID filtering became real in engine 0.13.0; before that it was accepted and silently ignored.)',
    params: [
      { key: 'algorithm', label: 'Filter: algorithm', kind: 'algorithm', default: '' },
      { key: 'length', label: 'Filter: length (bits)', kind: 'number', default: '' },
      { key: 'uid', label: 'Filter: UID', kind: 'uid', default: '' },
      { key: 'maxItems', label: 'Max results', kind: 'number', default: '' },
      { key: 'offsetItems', label: 'Skip first N results', kind: 'number', default: '' },
      {
        key: 'storageStatusMask',
        label: 'Storage status bitmask (1=on-line 2=archival 4=destroyed; blank=on-line only)',
        kind: 'number',
        default: '',
      },
    ],
    build: (v) =>
      locate(orUndef(v.algorithm), orUndefNum(v.length), orUndef(v.uid), {
        maxItems: orUndefNum(v.maxItems),
        offsetItems: orUndefNum(v.offsetItems),
        storageStatusMask: orUndefNum(v.storageStatusMask),
      }),
  },
  {
    op: 'Activate',
    category: 'Object Lifecycle',
    spec: '§6.1.1 Activate',
    supported: true,
    blurb:
      'Flip a key from Pre-Active to Active — the lifecycle gate every crypto op checks before it will run.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => activate(v.uid ?? ''),
  },
  {
    op: 'Revoke',
    category: 'Object Lifecycle',
    spec: '§6.1.49 Revoke',
    supported: true,
    blurb:
      'Flip a key to Deactivated/Compromised with a recorded reason — stops it being used for new operations.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        key: 'reason',
        label: 'Reason',
        kind: 'select',
        options: [
          'Unspecified',
          'KeyCompromise',
          'CACompromise',
          'Superseded',
          'CessationOfOperation',
        ],
        default: 'Unspecified',
      },
    ],
    build: (v) => revoke(v.uid ?? '', v.reason || 'Unspecified'),
  },
  {
    op: 'Destroy',
    category: 'Object Lifecycle',
    spec: '§6.1.19 Destroy',
    supported: true,
    blurb:
      "Irrevocably remove a key's material — genuinely: since engine 0.13.0 the raw bytes are zeroized in memory and securely deleted from storage, not just flagged. The object's UID and history remain.",
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => destroy(v.uid ?? ''),
  },
  {
    op: 'Deactivate',
    category: 'Object Lifecycle',
    spec: '§6.1.14 Deactivate',
    supported: true,
    blurb:
      "A softer Revoke — an optional reason code, just ends the Active state. (Deactivation Date is always server-set to 'now'; there's no field to override it.)",
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        // DeactivationReasonCode (§6.1.14) mirrors RevocationReasonCode's
        // 7-member set exactly (`ops.rs`'s `DeactivationReason` enum) — the
        // spec-extraction JSON's own "Deactivation Reason Code" table is a
        // PDF-extraction mismatch (wrong table); patched in
        // `codepointTable.ts`'s `SPEC_EXTRACT_PATCHES`.
        key: 'reason',
        label: 'Reason',
        kind: 'select',
        options: [
          '',
          'Unspecified',
          'KeyCompromise',
          'CACompromise',
          'AffiliationChanged',
          'Superseded',
          'CessationOfOperation',
          'PrivilegeWithdrawn',
        ],
        default: '',
      },
    ],
    build: (v) => deactivate(v.uid ?? '', orUndef(v.reason)),
  },
  {
    op: 'Check',
    category: 'Object Lifecycle',
    spec: '§6.1.7 Check',
    supported: true,
    blurb:
      'Ask the server to confirm an object still satisfies a set of usage constraints, without performing a crypto operation. All three filters are real (Phase 3.1): usage limits budget, usage-mask subset, and lease-time cap.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'usageLimitsCount', label: 'Usage limits count', kind: 'number', default: '' },
      { key: 'cryptographicUsageMask', label: 'Usage mask', kind: 'text', default: '' },
      { key: 'leaseTimeSeconds', label: 'Lease time (s)', kind: 'number', default: '' },
    ],
    build: (v) =>
      check(v.uid ?? '', {
        usageLimitsCount: orUndefNum(v.usageLimitsCount),
        cryptographicUsageMask: orUndef(v.cryptographicUsageMask),
        leaseTimeSeconds: orUndefNum(v.leaseTimeSeconds),
      }),
  },
  {
    op: 'Archive',
    category: 'Object Lifecycle',
    spec: '§6.1.4 Archive',
    supported: true,
    blurb: 'Move an object to cold/offline storage, out of active service.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => archive(v.uid ?? ''),
  },
  {
    op: 'Recover',
    category: 'Object Lifecycle',
    spec: '§6.1.47 Recover',
    supported: true,
    blurb: 'Bring an Archived object back into active service.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => recover(v.uid ?? ''),
  },
  {
    op: 'Obliterate',
    category: 'Object Lifecycle',
    spec: '§6.1.39 Obliterate',
    supported: true,
    blurb:
      'The most destructive op in the protocol — erase an object so thoroughly even its metadata/history is gone.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => obliterate(v.uid ?? ''),
  },
  {
    op: 'GetUsageAllocation',
    category: 'Object Lifecycle',
    spec: '§6.1.27 Get Usage Allocation',
    supported: true,
    blurb:
      "Reserve a slice of a key's remaining usage budget (operation count) for a specific client.",
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'usageLimitsCount', label: 'Usage limit', kind: 'number', default: '1000' },
    ],
    build: (v) => getUsageAllocation(v.uid ?? '', orUndefNum(v.usageLimitsCount)),
  },

  // 3. Attributes
  {
    op: 'GetAttributes',
    category: 'Attributes',
    spec: '§6.1.24 Get Attributes',
    supported: true,
    blurb: 'Read one or more named attributes off a managed object.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        key: 'attributeReferences',
        label: 'Attribute names (comma-sep)',
        kind: 'text',
        default: 'CryptographicAlgorithm, State',
      },
    ],
    build: (v) => getAttributes(v.uid ?? '', splitList(v.attributeReferences)),
  },
  {
    op: 'GetAttributeList',
    category: 'Attributes',
    spec: '§6.1.25 Get Attribute List',
    supported: true,
    blurb: 'List which attribute NAMES exist on an object, without fetching their values.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => getAttributeList(v.uid ?? ''),
  },
  {
    op: 'AddAttribute',
    category: 'Attributes',
    spec: '§6.1.2 Add Attribute',
    supported: true,
    blurb: 'Attach a new (multi-instance-capable) attribute to an object — e.g. an extra Name.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'name', label: 'Attribute name', kind: 'text', default: 'Comment' },
      { key: 'value', label: 'Value', kind: 'text', default: 'kmip3-commands' },
    ],
    build: (v) => addAttribute(v.uid ?? '', v.name || 'Comment', v.value || 'kmip3-commands'),
  },
  {
    op: 'ModifyAttribute',
    category: 'Attributes',
    spec: '§6.1.38 Modify Attribute',
    supported: true,
    blurb: 'Change the value of an attribute that already exists.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'name', label: 'Attribute name', kind: 'text', default: 'Comment' },
      { key: 'value', label: 'New value', kind: 'text', default: 'kmip3-commands' },
      {
        key: 'currentValue',
        label: 'Current value (disambiguates a multi-instance attribute)',
        kind: 'text',
        default: '',
      },
    ],
    build: (v) =>
      modifyAttribute(
        v.uid ?? '',
        v.name || 'Comment',
        v.value || 'kmip3-commands',
        orUndef(v.currentValue)
      ),
  },
  {
    op: 'DeleteAttribute',
    category: 'Attributes',
    spec: '§6.1.17 Delete Attribute',
    supported: true,
    blurb:
      'Remove a named attribute from an object — every instance, unless a current value narrows it to just one.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'attributeReference', label: 'Attribute name', kind: 'text', default: 'Comment' },
      {
        key: 'currentValue',
        label: 'Current value (deletes just this instance, not every one)',
        kind: 'text',
        default: '',
      },
    ],
    build: (v) =>
      deleteAttribute(v.uid ?? '', v.attributeReference || 'Comment', orUndef(v.currentValue)),
  },
  {
    op: 'SetAttribute',
    category: 'Attributes',
    spec: '§6.1.56 Set Attribute',
    supported: true,
    blurb:
      'Add-or-replace in one call, for single-instance attributes. Honest since engine 0.13.0: a writable attribute genuinely persists, and a read-only one (e.g. ProtectionStorageMask) is refused — never a Success that saved nothing.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'name', label: 'Attribute name', kind: 'text', default: 'Name' },
      { key: 'value', label: 'Value', kind: 'text', default: 'kmip3-commands' },
    ],
    build: (v) => setAttribute(v.uid ?? '', v.name || 'Name', v.value || 'kmip3-commands'),
  },
  {
    op: 'AdjustAttribute',
    category: 'Attributes',
    spec: '§6.1.3 Adjust Attribute',
    supported: true,
    blurb:
      'Do arithmetic on a numeric attribute server-side (increment/decrement/negate) instead of read-modify-write.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        key: 'attributeReference',
        label: 'Attribute name',
        kind: 'text',
        default: 'CryptographicUsageMask',
      },
      {
        key: 'adjustmentType',
        label: 'Adjustment',
        kind: 'select',
        options: ['Increment', 'Decrement', 'Negate'],
        default: 'Increment',
      },
      { key: 'adjustmentValue', label: 'By', kind: 'number', default: '1' },
    ],
    build: (v) =>
      adjustAttribute(
        v.uid ?? '',
        v.attributeReference || 'CryptographicUsageMask',
        (v.adjustmentType as 'Increment' | 'Decrement' | 'Negate') || 'Increment',
        orUndefNum(v.adjustmentValue)
      ),
  },
  {
    op: 'GetConstraints',
    category: 'Attributes',
    spec: '§6.1.26 Get Constraints',
    supported: true,
    blurb:
      'Ask the server what usage constraints it would enforce, without naming a specific object.',
    params: [],
    build: () => getConstraints(),
  },
  {
    op: 'SetDefaults',
    category: 'Attributes',
    spec: '§6.1.58 Set Defaults',
    supported: true,
    blurb: 'Configure the attribute defaults the server applies to future objects of a given type.',
    params: [
      {
        key: 'objectType',
        label: 'Object type',
        kind: 'select',
        options: ['SymmetricKey', 'PrivateKey', 'PublicKey'],
        default: 'SymmetricKey',
      },
      { key: 'name', label: 'Default name', kind: 'text', default: '' },
    ],
    build: (v) => setDefaults(v.objectType || 'SymmetricKey', orUndef(v.name)),
  },

  // 4. Cryptographic Services
  {
    op: 'Encrypt',
    category: 'Cryptographic Services',
    spec: '§6.1.21 Encrypt',
    supported: true,
    blurb:
      'Symmetric or asymmetric encryption using a managed key — returns ciphertext (and, for AEAD modes, an authentication tag).',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Plaintext', kind: 'text', default: 'hello post-quantum world' },
      { key: 'ivHex', label: 'IV (hex)', kind: 'hex', default: '', randomBytes: 12 },
      { key: 'aadHex', label: 'AAD (hex, AEAD associated data)', kind: 'hex', default: '' },
      { key: 'tagLengthBytes', label: 'Tag length (bytes, AEAD)', kind: 'number', default: '' },
    ],
    build: (v) =>
      encrypt(v.uid ?? '', textHex(v.data || 'hello post-quantum world'), orUndef(v.ivHex), {
        aadHex: orUndef(v.aadHex),
        tagLengthBytes: orUndefNum(v.tagLengthBytes),
      }),
  },
  {
    op: 'Decrypt',
    category: 'Cryptographic Services',
    spec: '§6.1.15 Decrypt',
    supported: true,
    blurb:
      'The inverse of Encrypt — recovers plaintext given the ciphertext and (for symmetric AEAD) the IV. For AEAD, the auth tag is its own field — paste it separately, not appended to the ciphertext.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Ciphertext (hex)', kind: 'hex', default: '' },
      { key: 'ivHex', label: 'IV (hex)', kind: 'hex', default: '' },
      { key: 'aadHex', label: 'AAD (hex, AEAD associated data)', kind: 'hex', default: '' },
      {
        key: 'tagHex',
        label: 'Auth tag (hex, AEAD — separate from ciphertext)',
        kind: 'hex',
        default: '',
      },
      { key: 'tagLengthBytes', label: 'Tag length (bytes, AEAD)', kind: 'number', default: '' },
    ],
    build: (v) =>
      decrypt(v.uid ?? '', v.data ?? '', orUndef(v.ivHex), {
        aadHex: orUndef(v.aadHex),
        tagHex: orUndef(v.tagHex),
        tagLengthBytes: orUndefNum(v.tagLengthBytes),
      }),
  },
  {
    op: 'Sign',
    category: 'Cryptographic Services',
    spec: '§6.1.60 Sign',
    supported: true,
    blurb: 'Produce a signature over Data using a managed private key.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
      {
        key: 'deterministic',
        label: 'Deterministic (force non-hedged)',
        kind: 'bool',
        default: 'false',
      },
      {
        key: 'internal',
        label: 'Internal (Sign_internal interface)',
        kind: 'bool',
        default: 'false',
      },
      {
        key: 'externalMu',
        label: 'External Mu (Message = 64-byte µ, prehash mode)',
        kind: 'bool',
        default: 'false',
      },
      {
        key: 'contextStringHex',
        label: 'Context string (hex, ML-DSA/SLH-DSA)',
        kind: 'hex',
        default: '',
      },
      {
        key: 'randomHex',
        label: 'Explicit randomizer (hex, hedged variant)',
        kind: 'hex',
        default: '',
      },
    ],
    build: (v) =>
      sign(v.uid ?? '', textHex(v.data || 'hello post-quantum world'), undefined, {
        deterministic: v.deterministic === 'true',
        internal: v.internal === 'true',
        externalMu: v.externalMu === 'true',
        contextStringHex: orUndef(v.contextStringHex),
        randomHex: orUndef(v.randomHex),
      }),
  },
  {
    op: 'SignatureVerify',
    category: 'Cryptographic Services',
    spec: '§6.1.61 Signature Verify',
    supported: true,
    blurb:
      'Check a signature against Data using a managed public key — answers with a ValidityIndicator.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
      { key: 'signature', label: 'Signature (hex)', kind: 'hex', default: '' },
      {
        key: 'internal',
        label: 'Internal (Verify_internal interface)',
        kind: 'bool',
        default: 'false',
      },
      {
        key: 'externalMu',
        label: 'External Mu (Message = 64-byte µ, prehash mode)',
        kind: 'bool',
        default: 'false',
      },
      {
        key: 'contextStringHex',
        label: 'Context string (hex, ML-DSA/SLH-DSA — must match Sign)',
        kind: 'hex',
        default: '',
      },
      { key: 'saltLengthBytes', label: 'RSA-PSS salt length (bytes)', kind: 'number', default: '' },
    ],
    build: (v) =>
      signatureVerify(
        v.uid ?? '',
        textHex(v.data || 'hello post-quantum world'),
        v.signature ?? '',
        {
          internal: v.internal === 'true',
          externalMu: v.externalMu === 'true',
          contextStringHex: orUndef(v.contextStringHex),
          saltLengthBytes: orUndefNum(v.saltLengthBytes),
        }
      ),
  },
  {
    op: 'Encapsulate',
    category: 'Cryptographic Services',
    spec: 'WD19 §6.1.22 Encapsulate (PQC KEM)',
    supported: true,
    blurb:
      'PQC KEM operation: turn a public key into a ciphertext + shared secret. New in KMIP 3.0 — classical Diffie-Hellman has no equivalent operation.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => encapsulate(v.uid ?? ''),
  },
  {
    op: 'Decapsulate',
    category: 'Cryptographic Services',
    spec: 'WD19 §6.1.15 Decapsulate (PQC KEM)',
    supported: true,
    blurb:
      'PQC KEM operation: recover the same shared secret from a ciphertext using the matching private key.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Ciphertext (hex)', kind: 'hex', default: '' },
    ],
    build: (v) => decapsulate(v.uid ?? '', v.data ?? ''),
  },
  {
    op: 'MAC',
    category: 'Cryptographic Services',
    spec: '§6.1.36 MAC',
    supported: true,
    blurb: 'Compute a symmetric message authentication code over Data.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
    ],
    build: (v) => mac(v.uid ?? '', textHex(v.data || 'hello post-quantum world')),
  },
  {
    op: 'MACVerify',
    category: 'Cryptographic Services',
    spec: '§6.1.37 MAC Verify',
    supported: true,
    blurb: 'Check a MAC against a freshly-recomputed one.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
      { key: 'macDataHex', label: 'MAC (hex)', kind: 'hex', default: '' },
    ],
    build: (v) =>
      macVerify(v.uid ?? '', textHex(v.data || 'hello post-quantum world'), v.macDataHex ?? ''),
  },
  {
    // `headerBuild` (KMIP 3.0 §8.1.2): with "Run asynchronously" on, the
    // request carries `Asynchronous Indicator = Mandatory` in its HEADER —
    // the server enqueues a real background job and answers
    // `OperationPending` + an Asynchronous Correlation Value instead of the
    // digest. Feed that value to Poll/Cancel/Process (category below). Hash
    // is the demo op because it needs no key setup; ANY handled op except
    // the async-management/negotiation ops is eligible.
    op: 'Hash',
    category: 'Cryptographic Services',
    spec: '§6.1.28 Hash',
    supported: true,
    blurb:
      "Compute a cryptographic hash over Data — doesn't touch a managed key at all. Turn on 'Run asynchronously' to enqueue it as a real background job instead: the response is OperationPending + a correlation value for the Asynchronous Processing ops.",
    params: [
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
      {
        key: 'algorithm',
        label: 'Hash',
        kind: 'select',
        options: ['SHA256', 'SHA384', 'SHA512', 'SHA3-256'],
        default: 'SHA256',
      },
      { key: 'async', label: 'Run asynchronously', kind: 'bool', default: 'false' },
    ],
    build: (v) => hash(textHex(v.data || 'hello post-quantum world'), v.algorithm || 'SHA256'),
    headerBuild: (v) =>
      v.async === 'true' ? [leaf('AsynchronousIndicator', 'Enumeration', 'Mandatory')] : [],
  },
  {
    op: 'DeriveKey',
    category: 'Cryptographic Services',
    spec: '§6.1.18 Derive Key',
    supported: true,
    blurb:
      'Turn one managed key into a new one via a KDF, instead of generating fresh random material. NIST SP 800-108 Counter Mode, PBKDF2, HASH, and HMAC are all real (K20) — pick the method to see which extra fields it needs.',
    params: [
      { key: 'baseUid', label: 'Base key UID', kind: 'uid', default: '' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        options: ['NIST800-108-C', 'PBKDF2', 'HASH', 'HMAC', 'AsymmetricKey'],
        default: 'NIST800-108-C',
      },
      { key: 'length', label: 'Output length (bits)', kind: 'number', default: '256' },
      {
        key: 'hashAlgorithm',
        label: 'PRF/hash (required for HASH + PBKDF2; optional otherwise)',
        kind: 'select',
        options: ['', 'SHA256', 'SHA384', 'SHA512'],
        default: '',
      },
      { key: 'saltHex', label: 'Salt (hex, required for PBKDF2)', kind: 'hex', default: '' },
      {
        key: 'iterationCount',
        label: 'Iteration count (required for PBKDF2)',
        kind: 'number',
        default: '',
      },
    ],
    build: (v) =>
      deriveKey(
        v.baseUid ?? '',
        undefined,
        undefined,
        v.method || 'NIST800-108-C',
        undefined,
        numOr(v.length, 256),
        {
          hashAlgorithm: orUndef(v.hashAlgorithm),
          saltHex: orUndef(v.saltHex),
          iterationCount: orUndefNum(v.iterationCount),
        }
      ),
  },
  {
    op: 'ReKey',
    category: 'Cryptographic Services',
    spec: '§6.1.51 Re-key',
    supported: true,
    blurb:
      'Provision a successor to a symmetric key, optionally with a future activation offset — for planned rotation.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'offset', label: 'Activation offset (s)', kind: 'number', default: '0' },
    ],
    build: (v) => rekey(v.uid ?? '', orUndefNum(v.offset)),
  },
  {
    op: 'ReKeyKeyPair',
    category: 'Cryptographic Services',
    spec: '§6.1.52 Re-key Key Pair',
    supported: true,
    blurb: 'The asymmetric equivalent of ReKey — provisions a successor key PAIR.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'offset', label: 'Activation offset (s)', kind: 'number', default: '0' },
    ],
    build: (v) => rekeyKeyPair(v.uid ?? '', orUndefNum(v.offset)),
  },

  // 5. RNG & PKCS#11 Passthrough
  {
    op: 'RNGRetrieve',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.54 RNG Retrieve',
    supported: true,
    blurb: "Ask the server's RNG for N bytes of randomness directly — no key involved.",
    params: [{ key: 'dataLength', label: 'Bytes', kind: 'number', default: '32' }],
    build: (v) => rngRetrieve(numOr(v.dataLength, 32)),
  },
  {
    op: 'RNGSeed',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.55 RNG Seed',
    supported: true,
    blurb: "Feed additional entropy into the server's RNG.",
    params: [{ key: 'data', label: 'Seed (hex)', kind: 'hex', default: '00112233' }],
    build: (v) => rngSeed(v.data || '00112233'),
  },
  {
    op: 'PKCS_11',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.42 PKCS#11 passthrough',
    supported: true,
    blurb:
      "Invoke a specific PKCS#11 (Cryptoki) mechanism directly, for capabilities KMIP doesn't model natively.",
    params: [
      { key: 'fn', label: 'Function', kind: 'text', default: 'CGetInfo' },
      { key: 'inputParametersHex', label: 'Input params (hex)', kind: 'hex', default: '' },
      { key: 'iface', label: 'Interface version (e.g. 3.2)', kind: 'text', default: '' },
    ],
    build: (v) => pkcs11(v.fn || 'CGetInfo', orUndef(v.inputParametersHex), orUndef(v.iface)),
  },

  // 6. Certificate Services — real since the pure-Rust cert-ops port. Use
  // the "Set up demo CA" button above the category (KmipEngine.setupDemoCa)
  // first — Certify/Re-certify need a designated CA to sign with, same as
  // the native server's `--ca-key`.
  {
    op: 'Validate',
    category: 'Certificate Services',
    spec: '§6.1.62 Validate',
    supported: true,
    blurb:
      "Check a certificate chain's validity — Valid / Invalid / Unknown, never a false Valid. Try validating a Certify result's UID, then corrupt one hex nibble of an inline DER to see Invalid.",
    params: [
      {
        key: 'certificateHex',
        label: 'Inline cert DER (hex, comma-sep)',
        kind: 'hex',
        default: '',
      },
      { key: 'uids', label: 'Stored Certificate UIDs (comma-sep)', kind: 'text', default: '' },
      {
        key: 'validityDate',
        label: 'Validity date (unix seconds, blank = now)',
        kind: 'number',
        default: '',
      },
    ],
    build: (v) =>
      validate(splitList(v.certificateHex), splitList(v.uids), orUndefNum(v.validityDate)),
  },
  {
    op: 'Certify',
    category: 'Certificate Services',
    spec: '§6.1.6 Certify',
    supported: true,
    blurb:
      "Issue a certificate over a PKCS#10 CSR (any algorithm the engine verifies, ML-DSA included) — or, for an existing PublicKey UID, certify that key directly. Works for a bare CreateKeyPair output (its SubjectPublicKeyInfo is looked up live from the engine) as well as a Register'd key. Needs a designated CA first (the 'Set up demo CA' button).",
    params: [
      {
        key: 'uid',
        label: 'PublicKey UID (from CreateKeyPair or Register), or leave blank + supply a CSR',
        kind: 'uid',
        default: '',
      },
      { key: 'csrHex', label: 'PKCS#10 CSR (hex)', kind: 'hex', default: '' },
      {
        key: 'activationDate',
        label: 'Not-before (unix seconds, blank = now)',
        kind: 'number',
        default: '',
      },
      {
        key: 'deactivationDate',
        label: 'Not-after (unix seconds, blank = not-before + 1y)',
        kind: 'number',
        default: '',
      },
    ],
    build: (v) =>
      certify(v.uid ?? '', v.csrHex ?? '', {
        activationDate: orUndefNum(v.activationDate),
        deactivationDate: orUndefNum(v.deactivationDate),
      }),
  },
  {
    op: 'ReCertify',
    category: 'Certificate Services',
    spec: '§6.1.50 Re-certify',
    supported: true,
    blurb:
      'Renew an existing certificate with a fresh validity window (Offset seconds from now), or re-key it with a new CSR. Links Replaced/Replacement back to the original.',
    params: [
      { key: 'uid', label: 'Existing Certificate UID', kind: 'uid', default: '' },
      { key: 'csrHex', label: 'New CSR (hex, optional re-key)', kind: 'hex', default: '' },
      {
        key: 'offsetSeconds',
        label: 'Offset (seconds, blank = keep window) — wins over Not-before if both set',
        kind: 'number',
        default: '',
      },
      {
        key: 'activationDate',
        label: 'Not-before (unix seconds, ignored if Offset is set)',
        kind: 'number',
        default: '',
      },
      {
        key: 'deactivationDate',
        label: 'Not-after (unix seconds, blank = not-before + 1y)',
        kind: 'number',
        default: '',
      },
    ],
    build: (v) =>
      reCertify(v.uid ?? '', v.csrHex ?? '', orUndefNum(v.offsetSeconds), {
        activationDate: orUndefNum(v.activationDate),
        deactivationDate: orUndefNum(v.deactivationDate),
      }),
  },

  // 7. Split keys, leases, constraints, async — real since engine 0.12.0
  // (each verified end-to-end against this wasm build before being promoted
  // out of the old "Advertised-only / Not Implemented" bucket).
  {
    op: 'CreateSplitKey',
    category: 'Object Lifecycle',
    spec: '§6.1.12 Create Split Key',
    supported: true,
    blurb:
      'Split an existing key into N share objects where any M (the threshold) reconstruct it — all four §11.54 secret-sharing methods are real. XOR requires N == M (every share needed); the polynomial (Shamir) methods give true M-of-N.',
    params: [
      { key: 'uid', label: 'Key to split (UID)', kind: 'uid', default: '' },
      { key: 'parts', label: 'Shares (N)', kind: 'number', default: '5' },
      { key: 'threshold', label: 'Threshold (M)', kind: 'number', default: '3' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        options: [
          'Polynomial Sharing GF (28)',
          'Polynomial Sharing GF (216)',
          'Polynomial Sharing Prime Field',
          'XOR',
        ],
        default: 'Polynomial Sharing GF (28)',
      },
    ],
    build: (v) =>
      createSplitKey(
        v.uid ?? '',
        numOr(v.parts, 5),
        numOr(v.threshold, 3),
        v.method || 'Polynomial Sharing GF (28)'
      ),
  },
  {
    op: 'JoinSplitKey',
    category: 'Object Lifecycle',
    spec: '§6.1.31 Join Split Key',
    supported: true,
    blurb:
      'Reconstruct the original key from any threshold-sized subset of share UIDs. Fewer than the threshold is honestly refused with the exact shortfall named — never silently-wrong key material.',
    params: [
      {
        key: 'uids',
        label: 'Share UIDs (comma-sep)',
        kind: 'text',
        default: '',
      },
    ],
    build: (v) => joinSplitKey(splitList(v.uids)),
  },
  {
    op: 'ObtainLease',
    category: 'Object Lifecycle',
    spec: '§6.1.40 Obtain Lease',
    supported: true,
    blurb:
      "Grant or renew a time-boxed lease on a managed object — the response carries the lease time and the object's last-change date.",
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => obtainLease(v.uid ?? ''),
  },
  {
    op: 'SetConstraints',
    category: 'Attributes',
    spec: '§6.1.57 Set Constraints',
    supported: true,
    blurb:
      "Replace the server's usage-constraint table — the write-side counterpart of Get Constraints. An empty Constraints structure clears it.",
    params: [],
    build: () => setConstraints(),
  },

  // Asynchronous processing — real since engine 0.12.0. Enqueue a job by
  // running any eligible op (e.g. Hash) with the header's Asynchronous
  // Indicator = Mandatory, then manage it here by correlation value.
  {
    op: 'Poll',
    category: 'Asynchronous Processing',
    spec: '§6.1.43 Poll',
    supported: true,
    blurb:
      "Fetch an asynchronous job's outcome by its correlation value. Once complete, the response is identical to what the synchronous op would have returned. Enqueue a job first: run Hash with 'Run asynchronously' on, then paste the correlation value here.",
    params: [{ key: 'cv', label: 'Correlation value (hex)', kind: 'hex', default: '' }],
    build: (v) => poll(v.cv ?? ''),
  },
  {
    op: 'Cancel',
    category: 'Asynchronous Processing',
    spec: '§6.1.5 Cancel',
    supported: true,
    blurb:
      'Best-effort stop of an in-flight asynchronous job — a job that already started executing can finish first; the response says which way the race went.',
    params: [{ key: 'cv', label: 'Correlation value (hex)', kind: 'hex', default: '' }],
    build: (v) => cancel(v.cv ?? ''),
  },
  {
    op: 'Process',
    category: 'Asynchronous Processing',
    spec: '§6.1.44 Process',
    supported: true,
    blurb:
      'Block until a deferred asynchronous job completes — the "wait for it now after all" alternative to repeated polling.',
    params: [{ key: 'cv', label: 'Correlation value (hex)', kind: 'hex', default: '' }],
    build: (v) => process(v.cv ?? ''),
  },
  {
    op: 'QueryAsynchronousRequests',
    category: 'Asynchronous Processing',
    spec: '§6.1.46 Query Asynchronous Requests',
    supported: true,
    blurb:
      "List this client's outstanding asynchronous jobs — optionally filtered to one correlation value and/or one or more operation names. Empty when every job has completed and been polled.",
    params: [
      { key: 'cv', label: 'Filter: correlation value (hex)', kind: 'hex', default: '' },
      {
        key: 'operations',
        label: 'Filter: operations (comma-sep, e.g. Hash,Sign)',
        kind: 'text',
        default: '',
      },
    ],
    build: (v) => queryAsynchronousRequests(orUndef(v.cv), splitList(v.operations)),
  },

  // The 4 genuinely-unimplemented ops — no longer advertised by Query either
  // (engine 0.12.0's honest-Query audit).
  {
    op: 'Notify',
    category: 'Not Implemented (out of scope)',
    spec: '§6.2.2 Notify (server-to-client; out of scope)',
    supported: false,
    blurb:
      'Server-to-client push notification of an object change. A deliberate, documented scope boundary — the spec leaves the server-initiated transport unspecified — and since the honest-Query audit the server no longer advertises it.',
    params: [],
    build: () => notify(),
  },
  {
    op: 'Put',
    category: 'Not Implemented (out of scope)',
    spec: '§6.2.3 Put (server-to-client; out of scope)',
    supported: false,
    blurb:
      'Server-to-client push of a full object — the inverse direction of Get. Same deliberate scope boundary as Notify; not advertised.',
    params: [],
    build: () => put(),
  },
  {
    op: 'DelegatedLogin',
    category: 'Not Implemented (out of scope)',
    spec: '§6.1.16 Delegated Login (unimplemented)',
    supported: false,
    blurb:
      'Federated/delegated authentication via an external IdP. No handler in this build — and honestly not advertised.',
    params: [],
    build: () => delegatedLogin(),
  },
  {
    op: 'Re-Provision',
    category: 'Not Implemented (out of scope)',
    spec: '§6.1.53 Re-Provision (unimplemented)',
    supported: false,
    blurb:
      "Re-provision an object's material in place under a new mechanism. No handler in this build — and honestly not advertised.",
    params: [],
    build: () => reProvision(),
  },
]
