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
// Every `uid`-shaped parameter defaults to `''` (the Commands tab's field
// editor fills in a real object UID before running) — same "absent → empty,
// caller supplies it" convention `wasm/src/lib.rs`'s `build_payload` uses.

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
  | 'Certificate Services (not in this build)'
  | 'Advertised-only / Not Implemented'

export interface OpTemplate {
  op: string
  category: OpCategory
  /** One-line KMIP 3.0 spec citation, e.g. "§6.1.18 Derive Key". */
  spec: string
  /** `false` for the 3 native-gated + 12 zero-handler ops — the Run button
   * still fires a REAL request and shows the real `OperationNotSupported`
   * response; this only flags the Commands tab to label the card. */
  supported: boolean
  /** RequestPayload children for `buildRequest(op, ...build())`. */
  build: () => KmipNode[]
}

const uidLeaf = (uid: string) => leaf('UniqueIdentifier', 'TextString', uid)

// ── 1. Discovery & Session ──────────────────────────────────────────────────

export const query = (
  functions: string[] = ['QueryOperations', 'QueryObjects', 'QueryServerInformation']
): KmipNode[] => functions.map((f) => leaf('QueryFunction', 'Enumeration', f))

export const discoverVersions = (protocolVersions: Array<[number, number]> = []): KmipNode[] =>
  protocolVersions.map(([major, minor]) =>
    struct('ProtocolVersion', leaf('ProtocolVersionMajor', 'Integer', major), leaf('ProtocolVersionMinor', 'Integer', minor))
  )

export const ping = (): KmipNode[] => []

export const interop = (fn: 'Begin' | 'End' = 'Begin', identifier = 'kmip3-commands'): KmipNode[] => [
  leaf('InteropFunction', 'Enumeration', fn),
  leaf('InteropIdentifier', 'TextString', identifier),
]

export const login = (leaseTime?: number, requestCount?: number): KmipNode[] => {
  const payload: KmipNode[] = []
  if (leaseTime !== undefined) payload.push(leaf('LeaseTime', 'Interval', leaseTime))
  if (requestCount !== undefined) payload.push(leaf('RequestCount', 'Integer', requestCount))
  return payload
}

export const logout = (ticket = ''): KmipNode[] => (ticket ? [leaf('Ticket', 'ByteString', ticket)] : [])

export const log = (message = 'kmip3-commands log entry'): KmipNode[] => [leaf('LogMessage', 'TextString', message)]

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
  keyFormatType ? [uidLeaf(uid), leaf('KeyFormatType', 'Enumeration', keyFormatType)] : [uidLeaf(uid)]

export const locate = (): KmipNode[] => []

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

export const addAttribute = (uid: string, name = 'Comment', value = 'kmip3-commands'): KmipNode[] => [
  uidLeaf(uid),
  struct('NewAttribute', leaf(name, 'TextString', value)),
]

export const modifyAttribute = (uid: string, name = 'Comment', value = 'kmip3-commands'): KmipNode[] => [
  uidLeaf(uid),
  struct('NewAttribute', leaf(name, 'TextString', value)),
]

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
  if (adjustmentValue !== undefined) payload.push(leaf('AdjustmentValue', 'Integer', adjustmentValue))
  return payload
}

export const getConstraints = (): KmipNode[] => []

export const setDefaults = (objectType = 'SymmetricKey', name?: string): KmipNode[] => {
  const attrs = name ? [leaf('Name', 'TextString', name)] : []
  return [
    struct(
      'DefaultsInformation',
      struct('ObjectDefaults', leaf('ObjectType', 'Enumeration', objectType), struct('Attributes', ...attrs))
    ),
  ]
}

// ── 4. Cryptographic Services ───────────────────────────────────────────────

export const encrypt = (uid: string, dataHex: string, ivHex?: string): KmipNode[] => {
  const payload = [uidLeaf(uid), struct('CryptographicParameters'), leaf('Data', 'ByteString', dataHex)]
  if (ivHex) payload.push(leaf('IVCounterNonce', 'ByteString', ivHex))
  return payload
}

export const decrypt = (uid: string, dataHex: string, ivHex?: string): KmipNode[] => {
  const payload = [uidLeaf(uid), struct('CryptographicParameters'), leaf('Data', 'ByteString', dataHex)]
  if (ivHex) payload.push(leaf('IVCounterNonce', 'ByteString', ivHex))
  return payload
}

export const sign = (uid: string, dataHex: string, algorithm?: string): KmipNode[] => {
  const payload = [uidLeaf(uid)]
  if (algorithm) payload.push(struct('CryptographicParameters', leaf('CryptographicAlgorithm', 'Enumeration', algorithm)))
  payload.push(leaf('Data', 'ByteString', dataHex))
  return payload
}

export const signatureVerify = (uid: string, dataHex: string, signatureHex: string): KmipNode[] => [
  uidLeaf(uid),
  leaf('Data', 'ByteString', dataHex),
  leaf('SignatureData', 'ByteString', signatureHex),
]

export const encapsulate = (uid: string): KmipNode[] => [uidLeaf(uid)]

export const decapsulate = (uid: string, dataHex: string): KmipNode[] => [uidLeaf(uid), leaf('Data', 'ByteString', dataHex)]

export const mac = (uid: string, dataHex: string): KmipNode[] => [uidLeaf(uid), leaf('Data', 'ByteString', dataHex)]

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

export const rngRetrieve = (dataLength = 32): KmipNode[] => [leaf('DataLength', 'Integer', dataLength)]

export const rngSeed = (dataHex: string): KmipNode[] => [leaf('Data', 'ByteString', dataHex)]

export const pkcs11 = (fn = 'CGetInfo', inputParametersHex?: string): KmipNode[] => {
  const payload = [leaf('PKCS11Function', 'Enumeration', fn)]
  if (inputParametersHex) payload.push(leaf('PKCS11InputParameters', 'ByteString', inputParametersHex))
  return payload
}

// ── 6. Certificate Services (not in this build — wasm32 crypto-backend gap) ─
// Validate/Certify/ReCertify are real, spec'd ops with real native handlers;
// this WASM build's dispatcher answers OperationNotSupported for all three
// because `ring`/`rcgen`/`aws_lc_rs` don't cross-compile to wasm32 (see
// `wasm/src/lib.rs`'s crate doc comment). A minimal-but-well-formed payload
// still proves the real rejection, not a simulated one.

export const validate = (): KmipNode[] => []
export const certify = (): KmipNode[] => []
export const reCertify = (): KmipNode[] => []

// ── 7. Advertised-only / Not Implemented ────────────────────────────────────
// These 12 have NO handler at all — `RequestPayload::Unsupported(op)` — the
// dispatcher rejects them with `OperationNotSupported (0x05)` before payload
// semantics matter (KMIP 3.0 §11 advertises the codepoint; nothing consumes
// it). Empty payload is the correct, real request.

export const obtainLease = (): KmipNode[] => []
export const poll = (): KmipNode[] => []
export const notify = (): KmipNode[] => []
export const put = (): KmipNode[] => []
export const createSplitKey = (): KmipNode[] => []
export const setConstraints = (): KmipNode[] => []
export const queryAsynchronousRequests = (): KmipNode[] => []
export const process = (): KmipNode[] => []
export const cancel = (): KmipNode[] => []
export const joinSplitKey = (): KmipNode[] => []
export const delegatedLogin = (): KmipNode[] => []
export const reProvision = (): KmipNode[] => []

// ── Registry ─────────────────────────────────────────────────────────────────
// One entry per operation, in the same 7-bucket order the Commands tab
// groups them by. `build()` here calls each template with its documented
// defaults (a "just try it" first click); the Commands tab's field editor
// swaps in real values (a real object UID, real data, …) before re-running.

export const OP_TEMPLATES: OpTemplate[] = [
  // 1. Discovery & Session
  { op: 'Query', category: 'Discovery & Session', spec: '§6.1.24 Query', supported: true, build: () => query() },
  {
    op: 'DiscoverVersions',
    category: 'Discovery & Session',
    spec: '§6.1.30 Discover Versions',
    supported: true,
    build: () => discoverVersions(),
  },
  { op: 'Ping', category: 'Discovery & Session', spec: '§6.1.59 Ping', supported: true, build: () => ping() },
  {
    op: 'Interop',
    category: 'Discovery & Session',
    spec: '§6.1.31 Interop (test-suite framework marker)',
    supported: true,
    build: () => interop(),
  },
  { op: 'Login', category: 'Discovery & Session', spec: '§6.1.45 Login', supported: true, build: () => login() },
  { op: 'Logout', category: 'Discovery & Session', spec: '§6.1.46 Logout', supported: true, build: () => logout() },
  { op: 'Log', category: 'Discovery & Session', spec: '§6.1.44 Log', supported: true, build: () => log() },
  {
    op: 'CreateCredential',
    category: 'Discovery & Session',
    spec: '§6.1.11 Create Credential',
    supported: true,
    build: () => createCredential('kmip3-commands-user', 'demo-password'),
  },
  {
    op: 'CreateUser',
    category: 'Discovery & Session',
    spec: '§6.1.65 Create User',
    supported: true,
    build: () => createUser(),
  },
  {
    op: 'CreateGroup',
    category: 'Discovery & Session',
    spec: '§6.1.10 Create Group',
    supported: true,
    build: () => createGroup(),
  },
  {
    op: 'SetEndpointRole',
    category: 'Discovery & Session',
    spec: '§6.1.59 Set Endpoint Role',
    supported: true,
    build: () => setEndpointRole(),
  },

  // 2. Object Lifecycle
  { op: 'Create', category: 'Object Lifecycle', spec: '§6.1.1 Create', supported: true, build: () => create() },
  {
    op: 'CreateKeyPair',
    category: 'Object Lifecycle',
    spec: '§6.1.2 Create Key Pair',
    supported: true,
    build: () => createKeyPair(),
  },
  {
    op: 'Register',
    category: 'Object Lifecycle',
    spec: '§6.1.3 Register',
    supported: true,
    build: () => register(),
  },
  {
    op: 'Import',
    category: 'Object Lifecycle',
    spec: '§7.x Import',
    supported: true,
    build: () => importObject(''),
  },
  {
    op: 'Export',
    category: 'Object Lifecycle',
    spec: '§7.x Export',
    supported: true,
    build: () => exportObject(''),
  },
  { op: 'Get', category: 'Object Lifecycle', spec: '§6.1.4 Get', supported: true, build: () => get('') },
  { op: 'Locate', category: 'Object Lifecycle', spec: '§6.1.8 Locate', supported: true, build: () => locate() },
  {
    op: 'Activate',
    category: 'Object Lifecycle',
    spec: '§6.1.12 Activate',
    supported: true,
    build: () => activate(''),
  },
  { op: 'Revoke', category: 'Object Lifecycle', spec: '§6.1.13 Revoke', supported: true, build: () => revoke('') },
  {
    op: 'Destroy',
    category: 'Object Lifecycle',
    spec: '§6.1.14 Destroy',
    supported: true,
    build: () => destroy(''),
  },
  {
    op: 'Deactivate',
    category: 'Object Lifecycle',
    spec: '§6.1.64 Deactivate',
    supported: true,
    build: () => deactivate(''),
  },
  { op: 'Check', category: 'Object Lifecycle', spec: '§6.1.9 Check', supported: true, build: () => check('') },
  {
    op: 'Archive',
    category: 'Object Lifecycle',
    spec: '§6.1.15 Archive',
    supported: true,
    build: () => archive(''),
  },
  {
    op: 'Recover',
    category: 'Object Lifecycle',
    spec: '§6.1.16 Recover',
    supported: true,
    build: () => recover(''),
  },
  {
    op: 'Obliterate',
    category: 'Object Lifecycle',
    spec: '§6.1.61 Obliterate',
    supported: true,
    build: () => obliterate(''),
  },
  {
    op: 'GetUsageAllocation',
    category: 'Object Lifecycle',
    spec: '§6.1.27 Get Usage Allocation',
    supported: true,
    build: () => getUsageAllocation(''),
  },

  // 3. Attributes
  {
    op: 'GetAttributes',
    category: 'Attributes',
    spec: '§6.1.5 Get Attributes',
    supported: true,
    build: () => getAttributes(''),
  },
  {
    op: 'GetAttributeList',
    category: 'Attributes',
    spec: '§6.1.6 Get Attribute List',
    supported: true,
    build: () => getAttributeList(''),
  },
  {
    op: 'AddAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Add Attribute',
    supported: true,
    build: () => addAttribute(''),
  },
  {
    op: 'ModifyAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Modify Attribute',
    supported: true,
    build: () => modifyAttribute(''),
  },
  {
    op: 'DeleteAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Delete Attribute',
    supported: true,
    build: () => deleteAttribute(''),
  },
  {
    op: 'SetAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Set Attribute',
    supported: true,
    build: () => setAttribute(''),
  },
  {
    op: 'AdjustAttribute',
    category: 'Attributes',
    spec: '§6.1.7 Adjust Attribute',
    supported: true,
    build: () => adjustAttribute(''),
  },
  {
    op: 'GetConstraints',
    category: 'Attributes',
    spec: '§6.1.26 Get Constraints',
    supported: true,
    build: () => getConstraints(),
  },
  {
    op: 'SetDefaults',
    category: 'Attributes',
    spec: '§6.1.58 Set Defaults',
    supported: true,
    build: () => setDefaults(),
  },

  // 4. Cryptographic Services
  {
    op: 'Encrypt',
    category: 'Cryptographic Services',
    spec: '§6.1.19 Encrypt',
    supported: true,
    build: () => encrypt('', ''),
  },
  {
    op: 'Decrypt',
    category: 'Cryptographic Services',
    spec: '§6.1.20 Decrypt',
    supported: true,
    build: () => decrypt('', ''),
  },
  { op: 'Sign', category: 'Cryptographic Services', spec: '§6.1.21 Sign', supported: true, build: () => sign('', '') },
  {
    op: 'SignatureVerify',
    category: 'Cryptographic Services',
    spec: '§6.1.22 Signature Verify',
    supported: true,
    build: () => signatureVerify('', '', ''),
  },
  {
    op: 'Encapsulate',
    category: 'Cryptographic Services',
    spec: 'WD19 §6.1.60 Encapsulate (PQC KEM)',
    supported: true,
    build: () => encapsulate(''),
  },
  {
    op: 'Decapsulate',
    category: 'Cryptographic Services',
    spec: 'WD19 §6.1.61 Decapsulate (PQC KEM)',
    supported: true,
    build: () => decapsulate('', ''),
  },
  { op: 'MAC', category: 'Cryptographic Services', spec: '§6.1.23 MAC', supported: true, build: () => mac('', '') },
  {
    op: 'MACVerify',
    category: 'Cryptographic Services',
    spec: '§6.1.23 MAC Verify',
    supported: true,
    build: () => macVerify('', '', ''),
  },
  { op: 'Hash', category: 'Cryptographic Services', spec: '§6.1.53 Hash', supported: true, build: () => hash('') },
  {
    op: 'DeriveKey',
    category: 'Cryptographic Services',
    spec: '§6.1.18 Derive Key',
    supported: true,
    build: () => deriveKey(''),
  },
  {
    op: 'ReKey',
    category: 'Cryptographic Services',
    spec: '§6.1.51 Re-key',
    supported: true,
    build: () => rekey(''),
  },
  {
    op: 'ReKeyKeyPair',
    category: 'Cryptographic Services',
    spec: '§6.1.52 Re-key Key Pair',
    supported: true,
    build: () => rekeyKeyPair(''),
  },

  // 5. RNG & PKCS#11 Passthrough
  {
    op: 'RNGRetrieve',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.56 RNG Retrieve',
    supported: true,
    build: () => rngRetrieve(),
  },
  {
    op: 'RNGSeed',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.57 RNG Seed',
    supported: true,
    build: () => rngSeed('00112233'),
  },
  {
    op: 'PKCS_11',
    category: 'RNG & PKCS#11 Passthrough',
    spec: '§6.1.63 PKCS#11 passthrough',
    supported: true,
    build: () => pkcs11(),
  },

  // 6. Certificate Services (not in this build)
  {
    op: 'Validate',
    category: 'Certificate Services (not in this build)',
    spec: '§6.1.62 Validate',
    supported: false,
    build: () => validate(),
  },
  {
    op: 'Certify',
    category: 'Certificate Services (not in this build)',
    spec: '§6.1.6 Certify',
    supported: false,
    build: () => certify(),
  },
  {
    op: 'ReCertify',
    category: 'Certificate Services (not in this build)',
    spec: '§6.1.50 Re-certify',
    supported: false,
    build: () => reCertify(),
  },

  // 7. Advertised-only / Not Implemented
  {
    op: 'ObtainLease',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Obtain Lease (advertised, unimplemented)',
    supported: false,
    build: () => obtainLease(),
  },
  {
    op: 'Poll',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Poll (advertised, unimplemented)',
    supported: false,
    build: () => poll(),
  },
  {
    op: 'Notify',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Notify (advertised, unimplemented)',
    supported: false,
    build: () => notify(),
  },
  {
    op: 'Put',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Put (advertised, unimplemented)',
    supported: false,
    build: () => put(),
  },
  {
    op: 'CreateSplitKey',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Create Split Key (advertised, unimplemented)',
    supported: false,
    build: () => createSplitKey(),
  },
  {
    op: 'SetConstraints',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Set Constraints (advertised, unimplemented)',
    supported: false,
    build: () => setConstraints(),
  },
  {
    op: 'QueryAsynchronousRequests',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Query Asynchronous Requests (advertised, unimplemented)',
    supported: false,
    build: () => queryAsynchronousRequests(),
  },
  {
    op: 'Process',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Process (advertised, unimplemented)',
    supported: false,
    build: () => process(),
  },
  {
    op: 'Cancel',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Cancel (advertised, unimplemented)',
    supported: false,
    build: () => cancel(),
  },
  {
    op: 'JoinSplitKey',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Join Split Key (advertised, unimplemented)',
    supported: false,
    build: () => joinSplitKey(),
  },
  {
    op: 'DelegatedLogin',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Delegated Login (advertised, unimplemented)',
    supported: false,
    build: () => delegatedLogin(),
  },
  {
    op: 'Re-Provision',
    category: 'Advertised-only / Not Implemented',
    spec: '§11 Re-Provision (advertised, unimplemented)',
    supported: false,
    build: () => reProvision(),
  },
]
