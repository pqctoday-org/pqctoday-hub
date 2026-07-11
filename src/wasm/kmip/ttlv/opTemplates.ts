// SPDX-License-Identifier: GPL-3.0-only
//
// opTemplates.ts — one request-building function per KMIP 3.0 operation (all
// 66 the protocol defines), organized into the same 7 functional categories
// the Commands tab groups them by. Each template returns the RequestPayload
// children `request.ts`'s `buildRequest()` wraps in a full Request Message.
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
//   - The 15 permanently-unsupported ops (3 native-gated + 12 zero-handler)
//     need no payload at all — the dispatcher rejects them before payload
//     semantics matter (KMIP 3.0 §9.2 `OperationNotSupported`), so an empty
//     payload is the correct, real request, not a stand-in.
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
  /** `false` for the 3 native-gated + 4 zero-handler ops — the Run button
   * still fires a REAL request and shows the real `OperationNotSupported`
   * response; this only flags the Commands tab to label the card. */
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

export const createKeyPair = (algorithm = 'ML-DSA-65', usage = 'Sign Verify'): KmipNode[] => [
  struct(
    'CommonAttributes',
    leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
    leaf('CryptographicUsageMask', 'Integer', usage)
  ),
]

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

export const exportObject = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const get = (uid: string, keyFormatType?: string): KmipNode[] =>
  keyFormatType
    ? [uidLeaf(uid), leaf('KeyFormatType', 'Enumeration', keyFormatType)]
    : [uidLeaf(uid)]

/** Locate filters ride in an `Attributes` structure (§6.1.32). Length /
 * usage-mask / UID filtering became REAL in engine 0.13.0 — previously the
 * server accepted these as valid syntax and silently ignored them,
 * returning every object instead of narrowing. */
export const locate = (algorithm?: string, length?: number, uid?: string): KmipNode[] => {
  const filters: KmipNode[] = []
  if (algorithm) filters.push(leaf('CryptographicAlgorithm', 'Enumeration', algorithm))
  if (length !== undefined) filters.push(leaf('CryptographicLength', 'Integer', length))
  if (uid) filters.push(leaf('UniqueIdentifier', 'TextString', uid))
  return filters.length ? [struct('Attributes', ...filters)] : []
}

export const activate = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const revoke = (uid: string, reason = 'Unspecified'): KmipNode[] => [
  uidLeaf(uid),
  struct('RevocationReason', leaf('RevocationReasonCode', 'Enumeration', reason)),
]

export const destroy = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const deactivate = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const check = (uid: string): KmipNode[] => [uidLeaf(uid)]

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
  value = 'kmip3-commands'
): KmipNode[] => [uidLeaf(uid), struct('NewAttribute', leaf(name, 'TextString', value))]

export const deleteAttribute = (uid: string, attributeReference = 'Comment'): KmipNode[] => [
  uidLeaf(uid),
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

export const encrypt = (uid: string, dataHex: string, ivHex?: string): KmipNode[] => {
  const payload = [
    uidLeaf(uid),
    struct('CryptographicParameters'),
    leaf('Data', 'ByteString', dataHex),
  ]
  if (ivHex) payload.push(leaf('IVCounterNonce', 'ByteString', ivHex))
  return payload
}

export const decrypt = (uid: string, dataHex: string, ivHex?: string): KmipNode[] => {
  const payload = [
    uidLeaf(uid),
    struct('CryptographicParameters'),
    leaf('Data', 'ByteString', dataHex),
  ]
  if (ivHex) payload.push(leaf('IVCounterNonce', 'ByteString', ivHex))
  return payload
}

export const sign = (uid: string, dataHex: string, algorithm?: string): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (algorithm)
    payload.push(
      struct('CryptographicParameters', leaf('CryptographicAlgorithm', 'Enumeration', algorithm))
    )
  payload.push(leaf('Data', 'ByteString', dataHex))
  return payload
}

export const signatureVerify = (uid: string, dataHex: string, signatureHex: string): KmipNode[] => [
  uidLeaf(uid),
  leaf('Data', 'ByteString', dataHex),
  leaf('SignatureData', 'ByteString', signatureHex),
]

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

/** Defaults match `op_coverage_e2e.rs`'s `dk-derive` case: NIST SP 800-108
 * Counter-Mode, deriving a 256-bit AES key. */
export const deriveKey = (
  baseUid: string,
  derivationDataHex = textHex('label\x00context'),
  objectType = 'SymmetricKey',
  method = 'NIST800-108-C',
  algorithm = 'AES',
  length = 256
): KmipNode[] => [
  leaf('ObjectType', 'Enumeration', objectType),
  uidLeaf(baseUid),
  leaf('DerivationMethod', 'Enumeration', method),
  struct('DerivationParameters', leaf('DerivationData', 'ByteString', derivationDataHex)),
  struct(
    'Attributes',
    leaf('CryptographicAlgorithm', 'Enumeration', algorithm),
    leaf('CryptographicLength', 'Integer', length),
    leaf('CryptographicUsageMask', 'Integer', 'Encrypt Decrypt')
  ),
]

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

export const pkcs11 = (fn = 'CGetInfo', inputParametersHex?: string): KmipNode[] => {
  const payload = [leaf('PKCS11Function', 'Enumeration', fn)]
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
export const certify = (uid = '', csrHex = ''): KmipNode[] => {
  const payload: KmipNode[] = []
  if (uid) payload.push(uidLeaf(uid))
  if (csrHex) {
    payload.push(leaf('CertificateRequestType', 'Enumeration', 'PKCS10'))
    payload.push(leaf('CertificateRequest', 'ByteString', csrHex))
  }
  return payload
}

/** §6.1.50 Re-certify. `uid` (the existing Certificate to renew) is
 * REQUIRED; an optional `csrHex` re-keys with a fresh subject key instead
 * of reusing the existing one; `offsetSeconds` shifts the new Activation
 * Date relative to Initial Date (omitted → renews the existing window). */
export const reCertify = (uid: string, csrHex = '', offsetSeconds?: number): KmipNode[] => {
  const payload: KmipNode[] = [uidLeaf(uid)]
  if (csrHex) {
    payload.push(leaf('CertificateRequestType', 'Enumeration', 'PKCS10'))
    payload.push(leaf('CertificateRequest', 'ByteString', csrHex))
  }
  if (offsetSeconds !== undefined) payload.push(leaf('Offset', 'Interval', offsetSeconds))
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
 * payload lists every outstanding job. */
export const queryAsynchronousRequests = (correlationValueHex?: string): KmipNode[] =>
  correlationValueHex
    ? [
        struct(
          'AsynchronousCorrelationValues',
          leaf('AsynchronousCorrelationValue', 'ByteString', correlationValueHex)
        ),
      ]
    : []

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
    spec: '§6.1.24 Query',
    supported: true,
    blurb:
      'Ask the server what it supports — operations, object types, vendor info. The first call any client makes. Since engine 0.12.0 the answer is audited-honest: every one of the 62 operations it advertises is genuinely implemented.',
    params: [],
    build: () => query(),
  },
  {
    op: 'DiscoverVersions',
    category: 'Discovery & Session',
    spec: '§6.1.30 Discover Versions',
    supported: true,
    blurb: 'Negotiate which KMIP protocol versions client and server both speak.',
    params: [],
    build: () => discoverVersions(),
  },
  {
    op: 'Ping',
    category: 'Discovery & Session',
    spec: '§6.1.59 Ping',
    supported: true,
    blurb: 'The simplest possible request — an empty round trip to confirm the server is alive.',
    params: [],
    build: () => ping(),
  },
  {
    op: 'Interop',
    category: 'Discovery & Session',
    spec: '§6.1.31 Interop (test-suite framework marker)',
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
    spec: '§6.1.45 Login',
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
    spec: '§6.1.46 Logout',
    supported: true,
    blurb: 'End a Login session, invalidating its ticket.',
    params: [{ key: 'ticket', label: 'Ticket (hex)', kind: 'hex', default: '' }],
    build: (v) => logout(v.ticket ?? ''),
  },
  {
    op: 'Log',
    category: 'Discovery & Session',
    spec: '§6.1.44 Log',
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
    spec: '§6.1.11 Create Credential',
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
    spec: '§6.1.65 Create User',
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
    spec: '§6.1.1 Create',
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
    spec: '§6.1.2 Create Key Pair',
    supported: true,
    blurb: 'Make an asymmetric key pair in one call — returns TWO UniqueIdentifiers, one per half.',
    params: [
      { key: 'algorithm', label: 'Algorithm', kind: 'algorithm', default: 'ML-DSA-65' },
      { key: 'usage', label: 'Usage mask', kind: 'text', default: 'Sign Verify' },
    ],
    build: (v) => createKeyPair(v.algorithm || 'ML-DSA-65', v.usage || 'Sign Verify'),
  },
  {
    op: 'Register',
    category: 'Object Lifecycle',
    spec: '§6.1.3 Register',
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
    spec: '§7.x Import',
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
    spec: '§7.x Export',
    supported: true,
    blurb: "Pull a managed object's full key material back out — the inverse of Import.",
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => exportObject(v.uid ?? ''),
  },
  {
    op: 'Get',
    category: 'Object Lifecycle',
    spec: '§6.1.4 Get',
    supported: true,
    blurb: "Fetch a managed object's key material in a specific KeyFormatType.",
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      {
        key: 'keyFormatType',
        label: 'Key format',
        kind: 'select',
        options: ['', 'Raw', 'PKCS#1', 'PKCS#8', 'TransparentPublicKey'],
        default: '',
      },
    ],
    build: (v) => get(v.uid ?? '', orUndef(v.keyFormatType)),
  },
  {
    op: 'Locate',
    category: 'Object Lifecycle',
    spec: '§6.1.8 Locate',
    supported: true,
    blurb:
      'Search for objects matching attribute filters — algorithm, key length, or UID. Leave all filters empty to list everything in scope. (Length/UID filtering became real in engine 0.13.0; before that it was accepted and silently ignored.)',
    params: [
      { key: 'algorithm', label: 'Filter: algorithm', kind: 'algorithm', default: '' },
      { key: 'length', label: 'Filter: length (bits)', kind: 'number', default: '' },
      { key: 'uid', label: 'Filter: UID', kind: 'uid', default: '' },
    ],
    build: (v) => locate(orUndef(v.algorithm), orUndefNum(v.length), orUndef(v.uid)),
  },
  {
    op: 'Activate',
    category: 'Object Lifecycle',
    spec: '§6.1.12 Activate',
    supported: true,
    blurb:
      'Flip a key from Pre-Active to Active — the lifecycle gate every crypto op checks before it will run.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => activate(v.uid ?? ''),
  },
  {
    op: 'Revoke',
    category: 'Object Lifecycle',
    spec: '§6.1.13 Revoke',
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
    spec: '§6.1.14 Destroy',
    supported: true,
    blurb:
      "Irrevocably remove a key's material — genuinely: since engine 0.13.0 the raw bytes are zeroized in memory and securely deleted from storage, not just flagged. The object's UID and history remain.",
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => destroy(v.uid ?? ''),
  },
  {
    op: 'Deactivate',
    category: 'Object Lifecycle',
    spec: '§6.1.64 Deactivate',
    supported: true,
    blurb: 'A softer Revoke — no reason code, just ends the Active state.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => deactivate(v.uid ?? ''),
  },
  {
    op: 'Check',
    category: 'Object Lifecycle',
    spec: '§6.1.9 Check',
    supported: true,
    blurb:
      'Ask the server to confirm an object still satisfies a set of usage constraints, without performing a crypto operation.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => check(v.uid ?? ''),
  },
  {
    op: 'Archive',
    category: 'Object Lifecycle',
    spec: '§6.1.15 Archive',
    supported: true,
    blurb: 'Move an object to cold/offline storage, out of active service.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => archive(v.uid ?? ''),
  },
  {
    op: 'Recover',
    category: 'Object Lifecycle',
    spec: '§6.1.16 Recover',
    supported: true,
    blurb: 'Bring an Archived object back into active service.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => recover(v.uid ?? ''),
  },
  {
    op: 'Obliterate',
    category: 'Object Lifecycle',
    spec: '§6.1.61 Obliterate',
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
    spec: '§6.1.5 Get Attributes',
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
    spec: '§6.1.6 Get Attribute List',
    supported: true,
    blurb: 'List which attribute NAMES exist on an object, without fetching their values.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => getAttributeList(v.uid ?? ''),
  },
  {
    op: 'AddAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Add Attribute',
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
    spec: '§6.1.7 Modify Attribute',
    supported: true,
    blurb: 'Change the value of an attribute that already exists.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'name', label: 'Attribute name', kind: 'text', default: 'Comment' },
      { key: 'value', label: 'Value', kind: 'text', default: 'kmip3-commands' },
    ],
    build: (v) => modifyAttribute(v.uid ?? '', v.name || 'Comment', v.value || 'kmip3-commands'),
  },
  {
    op: 'DeleteAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Delete Attribute',
    supported: true,
    blurb: 'Remove a named attribute from an object.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'attributeReference', label: 'Attribute name', kind: 'text', default: 'Comment' },
    ],
    build: (v) => deleteAttribute(v.uid ?? '', v.attributeReference || 'Comment'),
  },
  {
    op: 'SetAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Set Attribute',
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
    spec: '§6.1.7 Adjust Attribute',
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
    spec: '§6.1.19 Encrypt',
    supported: true,
    blurb:
      'Symmetric or asymmetric encryption using a managed key — returns ciphertext (and, for AEAD modes, an authentication tag).',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Plaintext', kind: 'text', default: 'hello post-quantum world' },
      { key: 'ivHex', label: 'IV (hex)', kind: 'hex', default: '', randomBytes: 12 },
    ],
    build: (v) =>
      encrypt(v.uid ?? '', textHex(v.data || 'hello post-quantum world'), orUndef(v.ivHex)),
  },
  {
    op: 'Decrypt',
    category: 'Cryptographic Services',
    spec: '§6.1.20 Decrypt',
    supported: true,
    blurb:
      'The inverse of Encrypt — recovers plaintext given the ciphertext and (for symmetric AEAD) the IV.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Ciphertext (hex)', kind: 'hex', default: '' },
      { key: 'ivHex', label: 'IV (hex)', kind: 'hex', default: '' },
    ],
    build: (v) => decrypt(v.uid ?? '', v.data ?? '', orUndef(v.ivHex)),
  },
  {
    op: 'Sign',
    category: 'Cryptographic Services',
    spec: '§6.1.21 Sign',
    supported: true,
    blurb: 'Produce a signature over Data using a managed private key.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
    ],
    build: (v) => sign(v.uid ?? '', textHex(v.data || 'hello post-quantum world')),
  },
  {
    op: 'SignatureVerify',
    category: 'Cryptographic Services',
    spec: '§6.1.22 Signature Verify',
    supported: true,
    blurb:
      'Check a signature against Data using a managed public key — answers with a ValidityIndicator.',
    params: [
      { key: 'uid', label: 'Object UID', kind: 'uid', default: '' },
      { key: 'data', label: 'Message', kind: 'text', default: 'hello post-quantum world' },
      { key: 'signature', label: 'Signature (hex)', kind: 'hex', default: '' },
    ],
    build: (v) =>
      signatureVerify(
        v.uid ?? '',
        textHex(v.data || 'hello post-quantum world'),
        v.signature ?? ''
      ),
  },
  {
    op: 'Encapsulate',
    category: 'Cryptographic Services',
    spec: 'WD19 §6.1.60 Encapsulate (PQC KEM)',
    supported: true,
    blurb:
      'PQC KEM operation: turn a public key into a ciphertext + shared secret. New in KMIP 3.0 — classical Diffie-Hellman has no equivalent operation.',
    params: [{ key: 'uid', label: 'Object UID', kind: 'uid', default: '' }],
    build: (v) => encapsulate(v.uid ?? ''),
  },
  {
    op: 'Decapsulate',
    category: 'Cryptographic Services',
    spec: 'WD19 §6.1.61 Decapsulate (PQC KEM)',
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
    spec: '§6.1.23 MAC',
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
    spec: '§6.1.23 MAC Verify',
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
    spec: '§6.1.53 Hash',
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
      'Turn one managed key into a new one via a KDF (NIST SP 800-108), instead of generating fresh random material.',
    params: [
      { key: 'baseUid', label: 'Base key UID', kind: 'uid', default: '' },
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        options: ['NIST800-108-C'],
        default: 'NIST800-108-C',
      },
      { key: 'length', label: 'Output length (bits)', kind: 'number', default: '256' },
    ],
    build: (v) =>
      deriveKey(
        v.baseUid ?? '',
        undefined,
        undefined,
        v.method || 'NIST800-108-C',
        undefined,
        numOr(v.length, 256)
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
    spec: '§6.1.56 RNG Retrieve',
    supported: true,
    blurb: "Ask the server's RNG for N bytes of randomness directly — no key involved.",
    params: [{ key: 'dataLength', label: 'Bytes', kind: 'number', default: '32' }],
    build: (v) => rngRetrieve(numOr(v.dataLength, 32)),
  },
  {
    op: 'RNGSeed',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.57 RNG Seed',
    supported: true,
    blurb: "Feed additional entropy into the server's RNG.",
    params: [{ key: 'data', label: 'Seed (hex)', kind: 'hex', default: '00112233' }],
    build: (v) => rngSeed(v.data || '00112233'),
  },
  {
    op: 'PKCS_11',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.63 PKCS#11 passthrough',
    supported: true,
    blurb:
      "Invoke a specific PKCS#11 (Cryptoki) mechanism directly, for capabilities KMIP doesn't model natively.",
    params: [
      { key: 'fn', label: 'Function', kind: 'text', default: 'CGetInfo' },
      { key: 'inputParametersHex', label: 'Input params (hex)', kind: 'hex', default: '' },
    ],
    build: (v) => pkcs11(v.fn || 'CGetInfo', orUndef(v.inputParametersHex)),
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
    ],
    build: (v) => certify(v.uid ?? '', v.csrHex ?? ''),
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
        label: 'Offset (seconds, blank = keep window)',
        kind: 'number',
        default: '',
      },
    ],
    build: (v) => reCertify(v.uid ?? '', v.csrHex ?? '', orUndefNum(v.offsetSeconds)),
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
      "List this client's outstanding asynchronous jobs — optionally filtered to one correlation value. Empty when every job has completed and been polled.",
    params: [{ key: 'cv', label: 'Filter: correlation value (hex)', kind: 'hex', default: '' }],
    build: (v) => queryAsynchronousRequests(orUndef(v.cv)),
  },

  // The 4 genuinely-unimplemented ops — no longer advertised by Query either
  // (engine 0.12.0's honest-Query audit).
  {
    op: 'Notify',
    category: 'Not Implemented (out of scope)',
    spec: '§6.1.36 Notify (server-to-client; out of scope)',
    supported: false,
    blurb:
      'Server-to-client push notification of an object change. A deliberate, documented scope boundary — the spec leaves the server-initiated transport unspecified — and since the honest-Query audit the server no longer advertises it.',
    params: [],
    build: () => notify(),
  },
  {
    op: 'Put',
    category: 'Not Implemented (out of scope)',
    spec: '§6.1.45 Put (server-to-client; out of scope)',
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
    spec: '§6.1.49 Re-Provision (unimplemented)',
    supported: false,
    blurb:
      "Re-provision an object's material in place under a new mechanism. No handler in this build — and honestly not advertised.",
    params: [],
    build: () => reProvision(),
  },
]
