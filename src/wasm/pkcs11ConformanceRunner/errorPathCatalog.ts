// SPDX-License-Identifier: GPL-3.0-only
//
// errorPathCatalog — the TABLE behind the error-path probes (plan WS-G G-8
// negative/error-path coverage, G-2 required-operation probes, G-5 citations).
//
// Pure data + one expansion function, no engine import: the static test
// registry (src/data/validation/testRegistry.ts) expands it from the committed
// mechanism inventory, and the runtime runner (errorPathProbes.ts) expands it
// from the inventory it captures from the running engine — the same function,
// so the registered cases and the executed cases cannot drift apart.
//
// Expansion: advertised (mechanism × required operation) from the inventory
//   × probe kinds that apply to that operation's family (PROBE_KINDS)
//   — only for mechanisms that have a RECIPE (how to get a key, a valid
//   mechanism parameter and valid input for that mechanism). A mechanism with
//   no recipe is not probed; its cells stay untested/waived and are listed by
//   `unrecipedMechanisms()` so the gap is visible, never silently dropped.
//
// One registered case = one (mechanism, operation, probe kind). It exercises
// every (parameter set, sign variant) cell the recipe probes for that
// mechanism, and passes on an engine only when EVERY one of those sub-runs the
// engine advertises returns the expected CK_RV — a failure in one parameter
// set fails the case (conservative; never inflates).
//
// Every expected return value is a PKCS #11 v3.2 value with a section cited in
// the kind's `citation`. Where the specification leaves the choice open (e.g.
// C_WrapKey does not list CKR_KEY_FUNCTION_NOT_PERMITTED although it requires
// CKA_WRAP=CK_TRUE) there is NO probe — an exact assertion must come from the
// text, not from what an engine happens to return.
import capabilityMap from '../../data/validation/capability-map.json'

export const ERROR_PATH_SPEC =
  'OASIS PKCS #11 Specification Version 3.2 (pkcs11-spec-v3.2-os, 03 June 2026)'

// ── CK_RV values used as expectations (pkcs11t.h v3.2) ──────────────────────

export const RV = {
  CKR_OK: 0x0,
  CKR_ARGUMENTS_BAD: 0x7,
  CKR_KEY_HANDLE_INVALID: 0x60,
  CKR_KEY_TYPE_INCONSISTENT: 0x63,
  CKR_KEY_FUNCTION_NOT_PERMITTED: 0x68,
  CKR_KEY_UNEXTRACTABLE: 0x6a,
  CKR_MECHANISM_INVALID: 0x70,
  CKR_MECHANISM_PARAM_INVALID: 0x71,
  CKR_OPERATION_ACTIVE: 0x90,
  CKR_OPERATION_NOT_INITIALIZED: 0x91,
  CKR_SESSION_HANDLE_INVALID: 0xb3,
  CKR_SESSION_READ_ONLY: 0xb5,
  CKR_TEMPLATE_INCONSISTENT: 0xd1,
  CKR_UNWRAPPING_KEY_HANDLE_INVALID: 0xf0,
  CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT: 0xf2,
  CKR_WRAPPING_KEY_HANDLE_INVALID: 0x113,
  CKR_WRAPPING_KEY_TYPE_INCONSISTENT: 0x115,
  CKR_BUFFER_TOO_SMALL: 0x150,
} as const
export type RvName = keyof typeof RV

/** Name for any CK_RV the probes may observe (unknown values print as hex). */
export const rvName = (rv: number): string => {
  const known = Object.entries(RV).find(([, v]) => v === rv)?.[0]
  if (known) return known
  const extra: Record<number, string> = {
    0x5: 'CKR_GENERAL_ERROR',
    0x6: 'CKR_FUNCTION_FAILED',
    0x7: 'CKR_ARGUMENTS_BAD',
    0x10: 'CKR_ATTRIBUTE_READ_ONLY',
    0x12: 'CKR_ATTRIBUTE_TYPE_INVALID',
    0x13: 'CKR_ATTRIBUTE_VALUE_INVALID',
    0x20: 'CKR_DATA_INVALID',
    0x21: 'CKR_DATA_LEN_RANGE',
    0x40: 'CKR_ENCRYPTED_DATA_INVALID',
    0x41: 'CKR_ENCRYPTED_DATA_LEN_RANGE',
    0x54: 'CKR_FUNCTION_NOT_SUPPORTED',
    0x62: 'CKR_KEY_SIZE_RANGE',
    0x82: 'CKR_OBJECT_HANDLE_INVALID',
    0xb0: 'CKR_SESSION_CLOSED',
    0xc0: 'CKR_SIGNATURE_INVALID',
    0xc1: 'CKR_SIGNATURE_LEN_RANGE',
    0xd0: 'CKR_TEMPLATE_INCOMPLETE',
    0x101: 'CKR_USER_NOT_LOGGED_IN',
    0x110: 'CKR_WRAPPED_KEY_INVALID',
    0x140: 'CKR_CURVE_NOT_SUPPORTED',
    0x209: 'CKR_PARAMETER_SET_NOT_SUPPORTED',
  }
  return extra[rv] ?? `0x${rv.toString(16)}` // eslint-disable-line security/detect-object-injection
}

// ── Operations and their PKCS #11 functions ─────────────────────────────────

export const ERROR_PATH_OPS = [
  'generate-key',
  'generate-key-pair',
  'encrypt',
  'decrypt',
  'sign',
  'verify',
  'sign-recover',
  'verify-recover',
  'digest',
  'derive',
  'wrap',
  'unwrap',
  'encapsulate',
  'decapsulate',
  'message-encrypt',
  'message-decrypt',
  'message-sign',
  'message-verify',
] as const
export type ErrorPathOp = (typeof ERROR_PATH_OPS)[number]

export type OpStyle = 'init' | 'message' | 'single' | 'keygen'

export interface OpSpec {
  family: string
  style: OpStyle
  /** Init function (init/message styles). */
  init?: string
  initSection?: string
  /** The call that performs / terminates the operation. */
  call: string
  callSection: string
  /** Message style: the function that ends the message-based operation. */
  final?: string
  finalSection?: string
  /** The call writes its output with the §5.2 variable-length-buffer convention. */
  output: boolean
  /** Key attribute that MUST be CK_TRUE (keyed init styles). */
  usageAttr?: string
  keyed: boolean
}

export const OP_SPECS: Record<ErrorPathOp, OpSpec> = {
  'generate-key': {
    family: 'key generation',
    style: 'keygen',
    call: 'C_GenerateKey',
    callSection: '§5.18.1',
    output: false,
    keyed: false,
  },
  'generate-key-pair': {
    family: 'key generation',
    style: 'keygen',
    call: 'C_GenerateKeyPair',
    callSection: '§5.18.2',
    output: false,
    keyed: false,
  },
  encrypt: {
    family: 'encrypt / decrypt',
    style: 'init',
    init: 'C_EncryptInit',
    initSection: '§5.8.1',
    call: 'C_Encrypt',
    callSection: '§5.8.2',
    output: true,
    usageAttr: 'CKA_ENCRYPT',
    keyed: true,
  },
  decrypt: {
    family: 'encrypt / decrypt',
    style: 'init',
    init: 'C_DecryptInit',
    initSection: '§5.10.1',
    call: 'C_Decrypt',
    callSection: '§5.10.2',
    output: true,
    usageAttr: 'CKA_DECRYPT',
    keyed: true,
  },
  sign: {
    family: 'sign / verify',
    style: 'init',
    init: 'C_SignInit',
    initSection: '§5.13.1',
    call: 'C_Sign',
    callSection: '§5.13.2',
    output: true,
    usageAttr: 'CKA_SIGN',
    keyed: true,
  },
  verify: {
    family: 'sign / verify',
    style: 'init',
    init: 'C_VerifyInit',
    initSection: '§5.15.1',
    call: 'C_Verify',
    callSection: '§5.15.2',
    output: false,
    usageAttr: 'CKA_VERIFY',
    keyed: true,
  },
  'sign-recover': {
    family: 'sign / verify with recovery',
    style: 'init',
    init: 'C_SignRecoverInit',
    initSection: '§5.13.5',
    call: 'C_SignRecover',
    callSection: '§5.13.6',
    output: true,
    usageAttr: 'CKA_SIGN_RECOVER',
    keyed: true,
  },
  'verify-recover': {
    family: 'sign / verify with recovery',
    style: 'init',
    init: 'C_VerifyRecoverInit',
    initSection: '§5.15.5',
    call: 'C_VerifyRecover',
    callSection: '§5.15.6',
    output: true,
    usageAttr: 'CKA_VERIFY_RECOVER',
    keyed: true,
  },
  digest: {
    family: 'digest',
    style: 'init',
    init: 'C_DigestInit',
    initSection: '§5.12.1',
    call: 'C_Digest',
    callSection: '§5.12.2',
    output: true,
    keyed: false,
  },
  derive: {
    family: 'derive',
    style: 'single',
    call: 'C_DeriveKey',
    callSection: '§5.18.5',
    output: false,
    keyed: true,
  },
  wrap: {
    family: 'wrap / unwrap',
    style: 'single',
    call: 'C_WrapKey',
    callSection: '§5.18.3',
    output: true,
    keyed: true,
  },
  unwrap: {
    family: 'wrap / unwrap',
    style: 'single',
    call: 'C_UnwrapKey',
    callSection: '§5.18.4',
    output: false,
    keyed: true,
  },
  encapsulate: {
    family: 'encapsulate / decapsulate',
    style: 'single',
    call: 'C_EncapsulateKey',
    callSection: '§5.18.8',
    output: true,
    keyed: true,
  },
  decapsulate: {
    family: 'encapsulate / decapsulate',
    style: 'single',
    call: 'C_DecapsulateKey',
    callSection: '§5.18.9',
    output: false,
    keyed: true,
  },
  'message-encrypt': {
    family: 'message-based encrypt / decrypt',
    style: 'message',
    init: 'C_MessageEncryptInit',
    initSection: '§5.9.1',
    call: 'C_EncryptMessage',
    callSection: '§5.9.2',
    final: 'C_MessageEncryptFinal',
    finalSection: '§5.9.5',
    output: true,
    usageAttr: 'CKA_ENCRYPT',
    keyed: true,
  },
  'message-decrypt': {
    family: 'message-based encrypt / decrypt',
    style: 'message',
    init: 'C_MessageDecryptInit',
    initSection: '§5.11.1',
    call: 'C_DecryptMessage',
    callSection: '§5.11.2',
    final: 'C_MessageDecryptFinal',
    finalSection: '§5.11.5',
    output: true,
    usageAttr: 'CKA_DECRYPT',
    keyed: true,
  },
  'message-sign': {
    family: 'message-based sign / verify',
    style: 'message',
    init: 'C_MessageSignInit',
    initSection: '§5.14.1',
    call: 'C_SignMessage',
    callSection: '§5.14.2',
    final: 'C_MessageSignFinal',
    finalSection: '§5.14.5',
    output: true,
    usageAttr: 'CKA_SIGN',
    keyed: true,
  },
  'message-verify': {
    family: 'message-based sign / verify',
    style: 'message',
    init: 'C_MessageVerifyInit',
    initSection: '§5.16.1',
    call: 'C_VerifyMessage',
    callSection: '§5.16.2',
    final: 'C_MessageVerifyFinal',
    finalSection: '§5.16.5',
    output: false,
    usageAttr: 'CKA_VERIFY',
    keyed: true,
  },
}

// ── Probe kinds ──────────────────────────────────────────────────────────────

export type ProbeClass = 'required-operation' | 'invalid-state' | 'invalid-parameter'

export const PROBE_KIND_IDS = [
  'executes',
  'operation-active',
  'terminated-after-final',
  'null-mechanism-terminates',
  'key-function-not-permitted',
  'session-closed',
  'read-only-session',
  'key-unextractable',
  'key-type-inconsistent',
  'key-handle-invalid',
  'buffer-too-small',
  'mechanism-param-invalid',
  'null-handle-pointer',
  'wrong-function',
  'template-inconsistent',
] as const
export type ProbeKindId = (typeof PROBE_KIND_IDS)[number]

export interface ProbeKind {
  id: ProbeKindId
  probeClass: ProbeClass
  /** Coverage-matrix polarity: G-2 probes are positive, G-8 probes state-error. */
  polarity: 'positive' | 'state-error'
  applies: (op: ErrorPathOp, r: Recipe) => boolean
  /** The CK_RV the specification requires (sub-steps may assert more; see `steps`). */
  expected: (op: ErrorPathOp) => RvName
  title: (op: ErrorPathOp) => string
  /** The call sequence, in words, with the value asserted at each step. */
  steps: (op: ErrorPathOp) => string
  citation: (op: ErrorPathOp) => string
  /** G-5: why no existing ACVP / KAT / OASIS / profile / product probe covers this. */
  whyNotCovered: string
}

const s = (op: ErrorPathOp) => OP_SPECS[op] // eslint-disable-line security/detect-object-injection
const INIT_STYLES: OpStyle[] = ['init', 'message']
const WHY_STATE =
  'Every registered ACVP / KAT / round-trip case drives a correctly sequenced call on a valid key and asserts the output value; the OASIS mandatory cases and the generated profile-condition probes assert session/login/object behaviour, never the operation state machine of this mechanism. Before G-8 no registered case asserted this return value for this mechanism.'
const WHY_PARAM =
  'The ACVP / KAT / round-trip cases pass only well-formed keys, parameters and buffers (they allocate the exact output size after a length query or use a fixed size), so an argument error is never provoked; no OASIS or profile probe calls this function with this mechanism. Before G-8 no registered case asserted this return value for this mechanism.'

export const PROBE_KINDS: readonly ProbeKind[] = [
  {
    id: 'executes',
    probeClass: 'required-operation',
    polarity: 'positive',
    applies: () => true,
    expected: () => 'CKR_OK',
    title: (op) => `${s(op).call} executes with a generated key (behaviour only)`,
    steps: (op) =>
      s(op).init
        ? `${s(op).init} → CKR_OK; ${s(op).call} (length query, then output) → CKR_OK${s(op).final ? `; ${s(op).final} → CKR_OK` : ''}`
        : `${s(op).call} → CKR_OK and returns a new object handle`,
    citation: (op) =>
      `PKCS #11 v3.2 ${[s(op).initSection, s(op).callSection].filter(Boolean).join(', ')} — the CKF_ flag advertised by C_GetMechanismInfo (§5.5.6) says the mechanism supports this function`,
    whyNotCovered:
      'G-2 required-operation probe: the mechanism advertises the CKF_ flag for this operation but no registered test drives the operation with it. Behaviour only — asserts CKR_OK, never an output value, so it is never algorithm-correctness evidence.',
  },
  {
    id: 'operation-active',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) => INIT_STYLES.includes(s(op).style),
    expected: () => 'CKR_OPERATION_ACTIVE',
    title: (op) => `second ${s(op).init} while one is active → CKR_OPERATION_ACTIVE`,
    steps: (op) =>
      `${s(op).init} → CKR_OK; ${s(op).init} again on the same session → CKR_OPERATION_ACTIVE`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).initSection} (return values), §5.1.6 CKR_OPERATION_ACTIVE ("an active operation … prevents Cryptoki from activating the specified operation")`,
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'terminated-after-final',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) => INIT_STYLES.includes(s(op).style),
    expected: () => 'CKR_OPERATION_NOT_INITIALIZED',
    title: (op) =>
      s(op).style === 'message'
        ? `${s(op).call} after ${s(op).final} → CKR_OPERATION_NOT_INITIALIZED`
        : `${s(op).call} after a completed ${s(op).call} → CKR_OPERATION_NOT_INITIALIZED`,
    steps: (op) =>
      s(op).style === 'message'
        ? `${s(op).init} → CKR_OK; ${s(op).call} → CKR_OK; ${s(op).final} → CKR_OK; ${s(op).call} → CKR_OPERATION_NOT_INITIALIZED`
        : `${s(op).init} → CKR_OK; ${s(op).call} ${op === 'verify' ? 'with a valid signature' : 'with a full-size output buffer'} → CKR_OK; ${s(op).call} again → CKR_OPERATION_NOT_INITIALIZED`,
    citation: (op) =>
      s(op).style === 'message'
        ? `PKCS #11 v3.2 ${s(op).finalSection} (${s(op).final} finishes the message-based operation), ${s(op).callSection} (return values), §5.1.6 CKR_OPERATION_NOT_INITIALIZED`
        : `PKCS #11 v3.2 ${s(op).callSection} ("A call to ${s(op).call} always terminates the active … operation" unless it is a length query or returns CKR_BUFFER_TOO_SMALL), §5.1.6 CKR_OPERATION_NOT_INITIALIZED`,
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'null-mechanism-terminates',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) => s(op).style === 'init',
    expected: () => 'CKR_OPERATION_NOT_INITIALIZED',
    title: (op) =>
      `${s(op).init}(pMechanism = NULL_PTR) terminates the active operation → next ${s(op).call} is CKR_OPERATION_NOT_INITIALIZED`,
    steps: (op) =>
      `${s(op).init} → CKR_OK; ${s(op).init} with pMechanism = NULL_PTR → CKR_OK; ${s(op).call} → CKR_OPERATION_NOT_INITIALIZED`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).initSection} ("${s(op).init} can be called with pMechanism set to NULL_PTR to terminate an active … operation"), §5.1.6 CKR_OPERATION_NOT_INITIALIZED`,
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'key-function-not-permitted',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) => INIT_STYLES.includes(s(op).style) && s(op).keyed,
    expected: () => 'CKR_KEY_FUNCTION_NOT_PERMITTED',
    title: (op) =>
      `${s(op).init} with a key whose ${s(op).usageAttr} is CK_FALSE → CKR_KEY_FUNCTION_NOT_PERMITTED`,
    steps: (op) =>
      `key of the correct type generated with ${s(op).usageAttr} = CK_FALSE; ${s(op).init} → CKR_KEY_FUNCTION_NOT_PERMITTED`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).initSection} ("The ${s(op).usageAttr} attribute of the … key … MUST be CK_TRUE"; return values), §5.1.6 CKR_KEY_FUNCTION_NOT_PERMITTED`,
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'session-closed',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) => ['single', 'keygen'].includes(s(op).style),
    expected: () => 'CKR_SESSION_HANDLE_INVALID',
    title: (op) => `${s(op).call} on a closed session → CKR_SESSION_HANDLE_INVALID`,
    steps: (op) =>
      `C_OpenSession → CKR_OK; C_CloseSession → CKR_OK; ${s(op).call} with otherwise valid arguments on that handle → CKR_SESSION_HANDLE_INVALID`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).callSection} (return values), §5.1.2 CKR_SESSION_HANDLE_INVALID, §5.1.7 (§5.1.2 errors take precedence over §5.1.6 errors)`,
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'read-only-session',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) =>
      [
        'generate-key',
        'generate-key-pair',
        'derive',
        'unwrap',
        'encapsulate',
        'decapsulate',
      ].includes(op),
    expected: () => 'CKR_SESSION_READ_ONLY',
    title: (op) =>
      `${s(op).call} creating a token object (CKA_TOKEN = CK_TRUE) in a read-only session → CKR_SESSION_READ_ONLY`,
    steps: (op) =>
      `C_OpenSession without CKF_RW_SESSION → CKR_OK; ${s(op).call} with CKA_TOKEN = CK_TRUE in the new-object template → CKR_SESSION_READ_ONLY`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).callSection} (return values), §5.1.6 CKR_SESSION_READ_ONLY ("unable to accomplish the desired action because it is a read-only session")`,
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'key-unextractable',
    probeClass: 'invalid-state',
    polarity: 'state-error',
    applies: (op) => op === 'wrap',
    expected: () => 'CKR_KEY_UNEXTRACTABLE',
    title: () => 'C_WrapKey of a key whose CKA_EXTRACTABLE is CK_FALSE → CKR_KEY_UNEXTRACTABLE',
    steps: () =>
      'secret key generated with CKA_EXTRACTABLE = CK_FALSE; C_WrapKey with a valid wrapping key → CKR_KEY_UNEXTRACTABLE',
    citation: () =>
      'PKCS #11 v3.2 §5.18.3 ("The CKA_EXTRACTABLE attribute of the key to be wrapped MUST also be CK_TRUE"; return values), §5.1.6 CKR_KEY_UNEXTRACTABLE',
    whyNotCovered: WHY_STATE,
  },
  {
    id: 'key-type-inconsistent',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    // Not for C_DecapsulateKey: §5.18.9 lists CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT (which §5.1.6
    // says only C_UnwrapKey returns) and not CKR_KEY_TYPE_INCONSISTENT — the text gives no single value.
    applies: (op, r) =>
      s(op).keyed &&
      r.key !== 'none' &&
      op !== 'decapsulate' &&
      !(op === 'derive' && r.baseKeyless),
    expected: (op) =>
      op === 'wrap'
        ? 'CKR_WRAPPING_KEY_TYPE_INCONSISTENT'
        : op === 'unwrap'
          ? 'CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT'
          : 'CKR_KEY_TYPE_INCONSISTENT',
    title: (op) =>
      `${s(op).init ?? s(op).call} with a key of the wrong type → ${op === 'wrap' ? 'CKR_WRAPPING_KEY_TYPE_INCONSISTENT' : op === 'unwrap' ? 'CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT' : 'CKR_KEY_TYPE_INCONSISTENT'}`,
    steps: (op) =>
      `valid mechanism and parameter, key of another key type (secret-key mechanisms get an EC key, asymmetric mechanisms an AES key); ${s(op).init ?? s(op).call} → ${op === 'wrap' ? 'CKR_WRAPPING_KEY_TYPE_INCONSISTENT' : op === 'unwrap' ? 'CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT' : 'CKR_KEY_TYPE_INCONSISTENT'}`,
    citation: (op) =>
      op === 'wrap'
        ? 'PKCS #11 v3.2 §5.18.3 (return values), §5.1.6 CKR_WRAPPING_KEY_TYPE_INCONSISTENT'
        : op === 'unwrap'
          ? 'PKCS #11 v3.2 §5.18.4 (return values), §5.1.6 CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT'
          : `PKCS #11 v3.2 ${s(op).initSection ?? s(op).callSection} (return values), §5.1.6 CKR_KEY_TYPE_INCONSISTENT ("has a higher priority than CKR_KEY_FUNCTION_NOT_PERMITTED")`,
    whyNotCovered: WHY_PARAM,
  },
  {
    id: 'key-handle-invalid',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    // Not for C_DecapsulateKey: §5.18.9 lists CKR_UNWRAPPING_KEY_HANDLE_INVALID, not
    // CKR_KEY_HANDLE_INVALID, while §5.1.6 reserves the former for C_UnwrapKey — no single value.
    applies: (op, r) =>
      s(op).style === 'single' && op !== 'decapsulate' && !(op === 'derive' && r.baseKeyless),
    expected: (op) =>
      op === 'wrap'
        ? 'CKR_WRAPPING_KEY_HANDLE_INVALID'
        : op === 'unwrap'
          ? 'CKR_UNWRAPPING_KEY_HANDLE_INVALID'
          : 'CKR_KEY_HANDLE_INVALID',
    title: (op) =>
      `${s(op).call} with key handle 0 → ${op === 'wrap' ? 'CKR_WRAPPING_KEY_HANDLE_INVALID' : op === 'unwrap' ? 'CKR_UNWRAPPING_KEY_HANDLE_INVALID' : 'CKR_KEY_HANDLE_INVALID'}`,
    steps: (op) =>
      `valid mechanism and parameter, ${op === 'wrap' ? 'hWrappingKey' : op === 'unwrap' ? 'hUnwrappingKey' : op === 'derive' ? 'hBaseKey' : 'the key handle'} = 0; ${s(op).call} → ${op === 'wrap' ? 'CKR_WRAPPING_KEY_HANDLE_INVALID' : op === 'unwrap' ? 'CKR_UNWRAPPING_KEY_HANDLE_INVALID' : 'CKR_KEY_HANDLE_INVALID'}`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).callSection} (return values), §5.1.6 ${op === 'wrap' ? 'CKR_WRAPPING_KEY_HANDLE_INVALID' : op === 'unwrap' ? 'CKR_UNWRAPPING_KEY_HANDLE_INVALID' : 'CKR_KEY_HANDLE_INVALID ("0 is never a valid key handle")'}`,
    whyNotCovered: WHY_PARAM,
  },
  {
    id: 'buffer-too-small',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    applies: (op) => s(op).output,
    expected: () => 'CKR_BUFFER_TOO_SMALL',
    title: (op) =>
      `${s(op).call} into a 1-byte buffer → CKR_BUFFER_TOO_SMALL, required length returned, operation still active`,
    steps: (op) =>
      s(op).style === 'single'
        ? `${s(op).call} with a NULL output buffer → CKR_OK and length L ≥ 1; ${s(op).call} with a 1-byte buffer → CKR_BUFFER_TOO_SMALL and *pul…Len ≥ 2`
        : `${s(op).init} → CKR_OK; ${s(op).call} with a NULL output buffer → CKR_OK and length L ≥ 1; ${s(op).call} with a 1-byte buffer → CKR_BUFFER_TOO_SMALL and *pul…Len ≥ 2; ${s(op).call} with an L-byte buffer → CKR_OK (the operation stayed active)`,
    citation: (op) =>
      `PKCS #11 v3.2 §5.2 (variable-length output convention: NULL buffer → CKR_OK + length; buffer too small → CKR_BUFFER_TOO_SMALL and the length needed)${s(op).style === 'single' ? '' : `, ${s(op).callSection} (CKR_BUFFER_TOO_SMALL does not terminate the operation)`}`,
    whyNotCovered: WHY_PARAM,
  },
  {
    id: 'mechanism-param-invalid',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    applies: (op, r) =>
      r.paramRequired === true &&
      op !== 'digest' &&
      s(op).style !== 'message' &&
      // ECDH used as a KEM takes no CK_ECDH1_DERIVE_PARAMS (§6.3.17 Table 78)
      !(r.param === 'ecdh1' && (op === 'encapsulate' || op === 'decapsulate')),
    expected: () => 'CKR_MECHANISM_PARAM_INVALID',
    title: (op) =>
      `${s(op).init ?? s(op).call} with a 1-byte mechanism parameter → CKR_MECHANISM_PARAM_INVALID`,
    steps: (op) =>
      `valid key; the mechanism's required parameter replaced by a single byte (ulParameterLen = 1); ${s(op).init ?? s(op).call} → CKR_MECHANISM_PARAM_INVALID`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).initSection ?? s(op).callSection} (return values), §5.1.6 CKR_MECHANISM_PARAM_INVALID ("Invalid parameters were supplied to the mechanism"); the mechanism's section in chapter 6 defines the parameter structure`,
    whyNotCovered: WHY_PARAM,
  },
  {
    id: 'null-handle-pointer',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    // C_DecapsulateKey only: its key-handle / key-type codes are not specified
    // unambiguously (see key-handle-invalid), so this is its argument probe.
    applies: (op) => op === 'decapsulate',
    expected: () => 'CKR_ARGUMENTS_BAD',
    title: () => 'C_DecapsulateKey with phKey = NULL_PTR → CKR_ARGUMENTS_BAD',
    steps: () =>
      'valid private key and ciphertext (from C_EncapsulateKey); C_DecapsulateKey with phKey = NULL_PTR → CKR_ARGUMENTS_BAD',
    citation: () =>
      'PKCS #11 v3.2 §5.18.9 (phKey "points to the location that receives the handle"; return values), §5.1.6 CKR_ARGUMENTS_BAD ("the arguments supplied to the Cryptoki function were in some way not appropriate")',
    whyNotCovered: WHY_PARAM,
  },
  {
    id: 'wrong-function',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    applies: (op) => s(op).style === 'keygen',
    expected: () => 'CKR_MECHANISM_INVALID',
    title: (op) =>
      op === 'generate-key'
        ? 'C_GenerateKeyPair with this secret-key generation mechanism → CKR_MECHANISM_INVALID'
        : 'C_GenerateKey with this key-pair generation mechanism → CKR_MECHANISM_INVALID',
    steps: (op) =>
      op === 'generate-key'
        ? 'C_GenerateKeyPair(mechanism) with empty templates → CKR_MECHANISM_INVALID'
        : 'C_GenerateKey(mechanism) with an empty template → CKR_MECHANISM_INVALID',
    citation: (op) =>
      `PKCS #11 v3.2 ${op === 'generate-key' ? '§5.18.2' : '§5.18.1'} (return values), §5.1.6 CKR_MECHANISM_INVALID ("…if the mechanism specified cannot be used in the selected token with the selected function")`,
    whyNotCovered: WHY_PARAM,
  },
  {
    id: 'template-inconsistent',
    probeClass: 'invalid-parameter',
    polarity: 'state-error',
    applies: (op) => s(op).style === 'keygen',
    expected: () => 'CKR_TEMPLATE_INCONSISTENT',
    title: (op) =>
      `${s(op).call} with a CKA_KEY_TYPE inconsistent with the mechanism → CKR_TEMPLATE_INCONSISTENT`,
    steps: (op) =>
      `${s(op).call} with an otherwise valid template whose CKA_KEY_TYPE names a different key type → CKR_TEMPLATE_INCONSISTENT`,
    citation: (op) =>
      `PKCS #11 v3.2 ${s(op).callSection} ("If … a key type which is inconsistent with the … generation mechanism … fails and returns the error code CKR_TEMPLATE_INCONSISTENT")`,
    whyNotCovered: WHY_PARAM,
  },
]

export const probeKind = (id: ProbeKindId): ProbeKind => {
  const k = PROBE_KINDS.find((p) => p.id === id)
  if (!k) throw new Error(`errorPathCatalog: unknown probe kind ${id}`)
  return k
}

// ── Recipes ──────────────────────────────────────────────────────────────────

/** Key family a recipe generates; the parameter set (if any) picks the size / curve. */
export type KeyKind =
  | 'none'
  | 'rsa'
  | 'ec'
  | 'ed'
  | 'x'
  | 'mldsa'
  | 'slhdsa'
  | 'mlkem'
  | 'aes'
  | 'aes-xts'
  | 'generic'
  | 'chacha20'

/** Mechanism-parameter builder the runtime maps to bytes (errorPathProbes.ts). */
export type ParamKind =
  | 'iv16'
  | 'ctr'
  | 'gcm'
  | 'gcm-message'
  | 'ccm'
  | 'chacha20'
  | 'chacha20-poly1305'
  | 'pss'
  | 'oaep'
  | 'mac-general'
  | 'sign-context'
  | 'hash-sign-context'
  | 'ecdh1'
  | 'concat-key'
  | 'string-data'
  | 'aes-cbc-encrypt-data'
  | 'hkdf-derive'
  | 'hkdf-data'

/** Input the operation consumes. */
export type DataKind = 'msg' | 'msg13' | 'block32' | 'rsa-raw' | 'digest32' | 'mu64'

export interface Recipe {
  key: KeyKind
  param?: ParamKind
  /** The mechanism REQUIRES a parameter (mechanism-param-invalid applies). */
  paramRequired?: boolean
  /** Hash that parameterizes PSS / HashML-DSA parameters (a PKCS #11 CKM_ digest name). */
  hash?: string
  data?: DataKind
  /** Operations of the mechanism this recipe probes (default: all advertised). */
  ops?: ErrorPathOp[]
  /** Derive: the mechanism takes no base-key handle semantics worth probing. */
  baseKeyless?: boolean
  /** Derive: CKA_VALUE_LEN of the derived secret (omitted when the mechanism fixes it). */
  deriveLen?: number | null
}

const rsaHashSign = (hash: string): Recipe => ({ key: 'rsa', hash })
const rsaPss = (hash: string): Recipe => ({ key: 'rsa', param: 'pss', paramRequired: true, hash })
const ecdsa = (): Recipe => ({ key: 'ec' })
const mldsaHash = (hash: string): Recipe => ({ key: 'mldsa', param: 'sign-context', hash })
const slhHash = (hash: string): Recipe => ({ key: 'slhdsa', param: 'sign-context', hash })
const digest = (): Recipe => ({ key: 'none' })
const hmac = (): Recipe => ({ key: 'generic' })
const hmacGeneral = (): Recipe => ({ key: 'generic', param: 'mac-general', paramRequired: true })
const hashKdf = (len: number): Recipe => ({ key: 'generic', deriveLen: len })
const aesIv = (data: DataKind): Recipe => ({ key: 'aes', param: 'iv16', paramRequired: true, data })

const HASHES = [
  'SHA224',
  'SHA256',
  'SHA384',
  'SHA512',
  'SHA3_224',
  'SHA3_256',
  'SHA3_384',
  'SHA3_512',
]

/**
 * mechanism name → how to drive it. Mechanisms absent here are not probed
 * (listed by unrecipedMechanisms()). Stateful hash-based signatures (HSS,
 * XMSS, XMSS^MT), vendor KEMs (FrodoKEM, Classic McEliece), BIP32, KMAC,
 * EdDSA-ph, SP 800-108, PBKDF2 and the External-Mu generator need inputs a
 * generic probe cannot fabricate honestly; they stay dispositioned by the
 * existing tests or waivers.
 */
export const RECIPES: Readonly<Record<string, Recipe>> = {
  // key generation
  CKM_RSA_PKCS_KEY_PAIR_GEN: { key: 'rsa' },
  CKM_EC_KEY_PAIR_GEN: { key: 'ec' },
  CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS: { key: 'ec' },
  CKM_EC_EDWARDS_KEY_PAIR_GEN: { key: 'ed' },
  CKM_EC_MONTGOMERY_KEY_PAIR_GEN: { key: 'x' },
  CKM_ML_DSA_KEY_PAIR_GEN: { key: 'mldsa' },
  CKM_SLH_DSA_KEY_PAIR_GEN: { key: 'slhdsa' },
  CKM_ML_KEM_KEY_PAIR_GEN: { key: 'mlkem' },
  CKM_AES_KEY_GEN: { key: 'aes' },
  CKM_AES_XTS_KEY_GEN: { key: 'aes-xts' },
  CKM_GENERIC_SECRET_KEY_GEN: { key: 'generic' },
  CKM_CHACHA20_KEY_GEN: { key: 'chacha20' },
  // RSA
  CKM_RSA_PKCS: { key: 'rsa' },
  CKM_RSA_X_509: { key: 'rsa', data: 'rsa-raw' },
  CKM_RSA_PKCS_OAEP: { key: 'rsa', param: 'oaep', paramRequired: true, hash: 'SHA256' },
  CKM_RSA_PKCS_PSS: {
    key: 'rsa',
    param: 'pss',
    paramRequired: true,
    hash: 'SHA256',
    data: 'digest32',
  },
  CKM_MD5_RSA_PKCS: rsaHashSign('MD5'),
  CKM_SHA1_RSA_PKCS: rsaHashSign('SHA_1'),
  CKM_SHA1_RSA_PKCS_PSS: rsaPss('SHA_1'),
  ...Object.fromEntries(
    HASHES.flatMap((h) => [
      [`CKM_${h}_RSA_PKCS`, rsaHashSign(h)],
      [`CKM_${h}_RSA_PKCS_PSS`, rsaPss(h)],
    ])
  ),
  // ECDSA / EdDSA
  CKM_ECDSA: { key: 'ec', data: 'digest32' },
  CKM_ECDSA_SHA1: ecdsa(),
  ...Object.fromEntries(HASHES.map((h) => [`CKM_ECDSA_${h}`, ecdsa()])),
  CKM_EDDSA: { key: 'ed' },
  // ML-DSA / SLH-DSA
  CKM_ML_DSA: { key: 'mldsa', param: 'sign-context' },
  CKM_HASH_ML_DSA: {
    key: 'mldsa',
    param: 'hash-sign-context',
    paramRequired: true,
    hash: 'SHA256',
    data: 'digest32',
  },
  CKM_ML_DSA_EXTERNAL_MU: { key: 'mldsa', param: 'sign-context', data: 'mu64' },
  CKM_SLH_DSA: { key: 'slhdsa', param: 'sign-context' },
  CKM_HASH_SLH_DSA: {
    key: 'slhdsa',
    param: 'hash-sign-context',
    paramRequired: true,
    hash: 'SHA256',
    data: 'digest32',
  },
  ...Object.fromEntries(
    [...HASHES, 'SHAKE128', 'SHAKE256'].flatMap((h) => [
      [`CKM_HASH_ML_DSA_${h}`, mldsaHash(h)],
      [`CKM_HASH_SLH_DSA_${h}`, slhHash(h)],
    ])
  ),
  // ML-KEM
  CKM_ML_KEM: { key: 'mlkem' },
  // digests
  CKM_MD5: digest(),
  CKM_SHA_1: digest(),
  CKM_RIPEMD160: digest(),
  CKM_SHA512_224: digest(),
  CKM_SHA512_256: digest(),
  CKM_KECCAK_256: digest(),
  ...Object.fromEntries(HASHES.map((h) => [`CKM_${h}`, digest()])),
  // HMAC
  CKM_MD5_HMAC: hmac(),
  CKM_MD5_HMAC_GENERAL: hmacGeneral(),
  CKM_SHA_1_HMAC: hmac(),
  CKM_SHA_1_HMAC_GENERAL: hmacGeneral(),
  CKM_RIPEMD160_HMAC: hmac(),
  CKM_RIPEMD160_HMAC_GENERAL: hmacGeneral(),
  CKM_SHA512_224_HMAC: hmac(),
  CKM_SHA512_224_HMAC_GENERAL: hmacGeneral(),
  CKM_SHA512_256_HMAC: hmac(),
  CKM_SHA512_256_HMAC_GENERAL: hmacGeneral(),
  ...Object.fromEntries(
    HASHES.flatMap((h) => [
      [`CKM_${h}_HMAC`, hmac()],
      [`CKM_${h}_HMAC_GENERAL`, hmacGeneral()],
    ])
  ),
  // AES / ChaCha20
  CKM_AES_ECB: { key: 'aes', data: 'block32' },
  CKM_AES_CBC: aesIv('block32'),
  CKM_AES_CBC_PAD: aesIv('msg13'),
  CKM_AES_OFB: aesIv('msg13'),
  CKM_AES_CFB8: aesIv('msg13'),
  CKM_AES_CFB128: aesIv('msg13'),
  CKM_AES_CFB1: aesIv('msg13'),
  CKM_AES_CTR: { key: 'aes', param: 'ctr', paramRequired: true, data: 'msg13' },
  CKM_AES_GCM: { key: 'aes', param: 'gcm', paramRequired: true, data: 'msg13' },
  CKM_AES_CCM: { key: 'aes', param: 'ccm', paramRequired: true, data: 'msg13' },
  CKM_AES_XTS: { key: 'aes-xts', param: 'iv16', paramRequired: true, data: 'block32' },
  CKM_AES_CMAC: { key: 'aes' },
  CKM_AES_GMAC: { key: 'aes', param: 'gcm', paramRequired: true },
  CKM_AES_KEY_WRAP: { key: 'aes' },
  CKM_AES_KEY_WRAP_PAD: { key: 'aes' },
  CKM_AES_KEY_WRAP_KWP: { key: 'aes' },
  CKM_CHACHA20: { key: 'chacha20', param: 'chacha20', paramRequired: true, data: 'msg13' },
  CKM_CHACHA20_POLY1305: {
    key: 'chacha20',
    param: 'chacha20-poly1305',
    paramRequired: true,
    data: 'msg13',
  },
  // key derivation
  CKM_ECDH1_DERIVE: { key: 'ec', param: 'ecdh1', paramRequired: true, deriveLen: 32 },
  CKM_ECDH1_COFACTOR_DERIVE: { key: 'ec', param: 'ecdh1', paramRequired: true, deriveLen: 32 },
  CKM_CONCATENATE_BASE_AND_KEY: {
    key: 'generic',
    param: 'concat-key',
    paramRequired: true,
    deriveLen: null,
  },
  CKM_CONCATENATE_BASE_AND_DATA: {
    key: 'generic',
    param: 'string-data',
    paramRequired: true,
    deriveLen: null,
  },
  CKM_CONCATENATE_DATA_AND_BASE: {
    key: 'generic',
    param: 'string-data',
    paramRequired: true,
    deriveLen: null,
  },
  CKM_SHA256_KEY_DERIVATION: hashKdf(16),
  CKM_SHA384_KEY_DERIVATION: hashKdf(16),
  CKM_SHA512_KEY_DERIVATION: hashKdf(16),
  CKM_SHA512_224_KEY_DERIVATION: hashKdf(16),
  CKM_SHA512_256_KEY_DERIVATION: hashKdf(16),
  CKM_SHA3_256_KEY_DERIVATION: hashKdf(16),
  CKM_SHA3_384_KEY_DERIVATION: hashKdf(16),
  CKM_SHA3_512_KEY_DERIVATION: hashKdf(16),
  CKM_SHAKE_256_KEY_DERIVATION: hashKdf(16),
  CKM_HKDF_DERIVE: { key: 'generic', param: 'hkdf-derive', paramRequired: true, deriveLen: 32 },
  CKM_AES_ECB_ENCRYPT_DATA: {
    key: 'aes',
    param: 'string-data',
    paramRequired: true,
    deriveLen: 16,
  },
  CKM_AES_CBC_ENCRYPT_DATA: {
    key: 'aes',
    param: 'aes-cbc-encrypt-data',
    paramRequired: true,
    deriveLen: 16,
  },
}

// ── Parameter-set policy ─────────────────────────────────────────────────────

interface CapMapShape {
  parameterSetGroups: Record<string, { sets: { id: string; keySize: number }[] }>
  mechanisms: Record<string, { parameterSets?: string; signVariants?: string[] }>
  signVariantOperations: string[]
}
const CAP = capabilityMap as unknown as CapMapShape

/**
 * Which declared parameter sets a probe runs. SLH-DSA is limited to the two
 * fast (…-128f) sets: every other SLH-DSA set's state-error cells stay
 * untested and are counted as such — a probe of one set is not evidence for
 * another. Every other group runs all its declared sets.
 */
export const PARAMETER_SET_POLICY: Readonly<Record<string, readonly string[]>> = {
  'SLH-DSA': ['SLH-DSA-SHA2-128f', 'SLH-DSA-SHAKE-128f'],
}

/** Only these parameter sets are generated for a key family (ECDH group mixes curve kinds). */
const KEY_KIND_SETS: Partial<Record<KeyKind, readonly string[]>> = {
  ec: ['P-256', 'P-384', 'P-521', 'secp256k1'],
}

// ── Expansion ────────────────────────────────────────────────────────────────

/** The inventory fields the expansion reads (committed file or a runtime capture). */
export interface InventoryMechLike {
  name: string | null
  ulMinKeySize: number
  ulMaxKeySize: number
  requiredOperations: readonly string[]
}

export interface ProbeCell {
  parameterSet: string
  variant: string
}

export interface ErrorPathCase {
  /** RegisteredTest id: errpath.<op>.<kind> */
  testId: string
  /** Registered case id: local:errpath.<op>.<kind>/<mechanism> */
  caseId: string
  mechanism: string
  op: ErrorPathOp
  kind: ProbeKindId
  /** Cells the case exercises (all parameter sets × variants it runs). */
  cells: ProbeCell[]
}

export const errorPathTestId = (op: ErrorPathOp, kind: ProbeKindId) => `errpath.${op}.${kind}`

const isOp = (op: string): op is ErrorPathOp => (ERROR_PATH_OPS as readonly string[]).includes(op)

/**
 * Cells a recipe probes for (mechanism, op) on ONE engine's inventory record:
 * declared parameter sets inside the engine-reported key-size range, filtered
 * by the parameter-set policy, × declared sign variants for sign operations.
 */
export function probeCellsFor(m: InventoryMechLike, op: ErrorPathOp): ProbeCell[] {
  const name = m.name
  if (!name) return []
  const decl = CAP.mechanisms[name] // eslint-disable-line security/detect-object-injection
  const recipe = RECIPES[name] // eslint-disable-line security/detect-object-injection
  if (!recipe) return []
  const groupName = decl?.parameterSets
  const group = groupName ? CAP.parameterSetGroups[groupName] : undefined // eslint-disable-line security/detect-object-injection
  const rangeReported = !(m.ulMinKeySize === 0 && m.ulMaxKeySize === 0)
  let sets: string[] = ['*']
  if (group) {
    const policy = PARAMETER_SET_POLICY[groupName!] // eslint-disable-line security/detect-object-injection
    const kindSets = KEY_KIND_SETS[recipe.key]
    sets = group.sets
      .filter(
        (ps) => !rangeReported || (ps.keySize >= m.ulMinKeySize && ps.keySize <= m.ulMaxKeySize)
      )
      .map((ps) => ps.id)
      .filter((id) => !policy || policy.includes(id))
      .filter((id) => !kindSets || kindSets.includes(id))
  }
  const variants =
    decl?.signVariants && CAP.signVariantOperations.includes(op) ? decl.signVariants : ['*']
  return sets.flatMap((ps) => variants.map((v) => ({ parameterSet: ps, variant: v })))
}

/**
 * Expand the probe cases for a set of inventory records (one engine, or the
 * union of both — duplicates by caseId merge their cells). `skipExecutes`
 * names `mechanism|op` pairs whose positive cell another registered test
 * already drives (G-2 probes are generated only where no test exists).
 */
export function expandErrorPathCases(
  inventories: readonly (readonly InventoryMechLike[])[],
  opts: { skipExecutes?: ReadonlySet<string> } = {}
): ErrorPathCase[] {
  const byId = new Map<string, ErrorPathCase>()
  for (const inv of inventories) {
    for (const m of inv) {
      if (!m.name) continue
      const recipe = RECIPES[m.name]
      if (!recipe) continue
      for (const rawOp of m.requiredOperations) {
        if (!isOp(rawOp)) continue
        const op = rawOp
        if (recipe.ops && !recipe.ops.includes(op)) continue
        const cells = probeCellsFor(m, op)
        if (cells.length === 0) continue
        for (const kind of PROBE_KINDS) {
          if (!kind.applies(op, recipe)) continue
          if (kind.id === 'executes' && opts.skipExecutes?.has(`${m.name}|${op}`)) continue
          const testId = errorPathTestId(op, kind.id)
          const caseId = `local:${testId}/${m.name}`
          const prev = byId.get(caseId)
          if (prev) {
            for (const c of cells) {
              if (
                !prev.cells.some(
                  (p) => p.parameterSet === c.parameterSet && p.variant === c.variant
                )
              )
                prev.cells.push(c)
            }
            continue
          }
          byId.set(caseId, {
            testId,
            caseId,
            mechanism: m.name,
            op,
            kind: kind.id,
            cells: [...cells],
          })
        }
      }
    }
  }
  const opIdx = (op: ErrorPathOp) => ERROR_PATH_OPS.indexOf(op)
  const kindIdx = (k: ProbeKindId) => PROBE_KIND_IDS.indexOf(k)
  return [...byId.values()].sort(
    (a, b) =>
      opIdx(a.op) - opIdx(b.op) ||
      kindIdx(a.kind) - kindIdx(b.kind) ||
      a.mechanism.localeCompare(b.mechanism)
  )
}

/** Advertised mechanisms with an operation this catalog could probe but no recipe. */
export function unrecipedMechanisms(
  inventories: readonly (readonly InventoryMechLike[])[]
): string[] {
  const out = new Set<string>()
  for (const inv of inventories)
    for (const m of inv)
      if (m.name && !RECIPES[m.name] && m.requiredOperations.some(isOp)) out.add(m.name)
  return [...out].sort()
}
