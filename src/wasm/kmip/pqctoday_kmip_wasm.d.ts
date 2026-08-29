/* tslint:disable */
/* eslint-disable */

/**
 * One in-browser KMIP control plane: a policy engine, an in-memory KMIP object
 * store, an audit ring, and a live `softhsmrustv3` engine session — the exact
 * `Deps` bundle the native server builds, minus the network.
 */
export class KmipPlayground {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Modular-policy plan (2026-08-28) — activate ONE scoped module
     * alongside whatever else is already active, instead of replacing the
     * whole engine state. Multiple modules (e.g. a policy split into
     * `-signing.yaml`/`-key-establishment.yaml`/`-encryption.yaml`/
     * `-global.yaml`) compose into one working policy. Returns
     * `{ ok, warnings, error? }`. Refused (ok:false) if the file has no
     * `metadata.scopes`, if a legacy ([`load_policy`](Self::load_policy))
     * policy is active, or if its scope is already claimed by a
     * differently-named module — call
     * [`clear_policy_modules`](Self::clear_policy_modules) first to switch
     * presets.
     */
    activate_policy_module(yaml: string): string;
    /**
     * The most recent `limit` cross-plane audit events as a JSON array
     * (each: `{ ts, plane, correlation_id, event }`).
     */
    audit_snapshot(limit: number): string;
    /**
     * Clear the audit ring (UI "reset trace" button).
     */
    clear_audit(): void;
    /**
     * Deactivate every module (does not touch a legacy
     * [`load_policy`](Self::load_policy) policy). Call before activating a
     * different multi-file preset.
     */
    clear_policy_modules(): void;
    /**
     * Deactivate one named module. Returns `{ ok }` — `ok:false` means no
     * module by that name was active.
     */
    deactivate_policy_module(name: string): string;
    /**
     * Plane-1 "policy decision tester" (dry-run): evaluate what the active
     * policy WOULD decide for an operation, without executing it or touching the
     * store. Unlike the REST facade's dry-run (which uses a minimal request that
     * can never produce a rekey or min-key-length decision), this passes the
     * full request fields (WP4b: date, custom attrs, usage mask, mechanism
     * params, and key activation date, so temporal / attribute / mechanism
     * rules evaluate exactly like the production dispatcher path). spec:
     * `{"op":"Sign","algorithm":"ML-DSA-65","length":?,"currentAlgorithm":"ECDSA-P256",
     *   "state":"Active","date":"2027-06-01","attrs":{"pqctoday-purpose":"research"},
     *   "usageMask":["Sign","Verify"],"activationDate":"2026-01-15",
     *   "mechanism":{"hash":"SHA-256","blockMode":"GCM","padding":"OAEP",
     *                "deterministic":true,"mech":"CKM_AES_GCM"}}`
     * Names resolve through the SAME tables the policy loader validates against
     * (`policy::hash_name_to_code` etc.) — never a second hand-rolled mapping.
     * Returns `{ kind: Allow|Deny|Rekey, algorithm?, from?, to?, rule?, reason? }`.
     */
    dry_run(spec_json: string): string;
    /**
     * WP-3 showcase — read back a Certificate object's REAL engine-side
     * PKCS#11 attributes (not the KMIP store record) by its KMIP uid:
     * `CKA_ID`, `CKA_VALUE` length, `CKA_SUBJECT`/`CKA_ISSUER` DER
     * lengths, `CKA_SERIAL_NUMBER`, and a human-readable Subject CN
     * (re-derived from `CKA_VALUE` — the same DER the engine actually
     * holds, not the request that created it).
     */
    engine_certificate_attributes(certificate_uid: string): string;
    /**
     * C3 (2026-08-28 gaps-remediation plan) — every value-level lint finding
     * for a policy draft, fatal and advisory alike (not just the first fatal
     * one `load_policy` itself stops at). Structural failures (bad YAML,
     * unknown top-level field, bad schema version) still come back as a
     * single `{ ok: false, error }` — those are genuinely single-valued (no
     * "second" malformed document) and the visual editor's own generator
     * never produces one anyway. Returns
     * `{ ok: true, findings: [{ ruleIndex, field, value, fatal, message }] }`.
     */
    lint_policy_draft(yaml: string): string;
    /**
     * Every object in the KMIP store (Plane 2 keystore view) as a JSON array.
     */
    list_objects(): string;
    /**
     * Activate a crypto-agility policy from YAML (Plane 1). Returns
     * `{ ok, warnings, error? }`. Subsequent ops are gated/auto-substituted
     * by this policy until another is loaded.
     */
    load_policy(yaml: string): string;
    /**
     * Boot a fresh control plane: a `softhsmrustv3` token + user session on
     * `slot` (real crypto; omitted/`undefined` → slot 0, the single-tab
     * default every existing caller uses), the built-in permissive policy
     * wired to the audit ring (so Plane-1 decisions are visible), and a
     * volatile `MemoryStore`.
     *
     * The engine's token/slot storage is a `HashMap<u32, TokenState>`
     * (`rust/src/state.rs`), not a single fixed slot — so a second
     * `KmipPlayground` in the SAME wasm module instance (e.g. the OASIS
     * corpus replay booting one engine per test) needs its own slot;
     * reusing slot 0 while an earlier instance's session on it is still
     * open fails bootstrap (confirmed empirically: `CK_RV=0x000000b6`).
     * The engine boots single-slot (only slot 0 pre-registered) —
     * `state::ensure_slot` is "the multi-slot configuration surface"
     * (its own doc comment) that brings a new slot online before
     * `C_InitToken` will accept it; skipping this for a non-zero slot
     * fails with `CKR_SLOT_ID_INVALID` (confirmed empirically).
     * `rng_seed_mode` — the server's §6.1.57 RNG Seed policy choice
     * (`RngSeedMode`): `"full-consume"` (default) / `"partial-consume"` /
     * `"ignore"` / `"deny"`. Server-chosen and mutually exclusive per the
     * spec, so it's a CONSTRUCTOR parameter, not per-request — exposed so
     * the in-browser OASIS corpus replay can boot each CS-RNG-O variant
     * test on an engine pinned to that test's mode, exactly as the native
     * harness constructs per-test `Deps`.
     */
    constructor(slot?: number | null, rng_seed_mode?: string | null);
    /**
     * Every currently-active module: `{ modules: [{ name, fingerprint,
     * scopes, rules, enabled }], uncoveredOps }`.
     */
    policy_modules_status(): string;
    /**
     * The currently-active policy (Plane 1): `{ active, name, fingerprint,
     * source, rules }`.
     */
    policy_status(): string;
    /**
     * WP-4 showcase — bypass the KMIP dispatcher and CACP policy plane
     * entirely, calling straight into the engine's native PKCS#11 Encrypt
     * path against a KMIP object's own engine handle. Demonstrates that
     * PKCS#11 v3.2 §4.8 Table 13 (`CKA_ALLOWED_MECHANISMS`) — derived from
     * the key's `CryptographicUsageMask` at `CreateKeyPair` time — is
     * enforced by the engine ITSELF, not just by KMIP/CACP's policy layer,
     * which this call never touches. RSA public keys default to
     * `CKA_ENCRYPT=true` in PKCS#11 regardless of KMIP usage (§4.8's own
     * key-generation defaults), so a boolean-flag check alone would NOT
     * catch a Sign/Verify-only key being used to encrypt — only the
     * mechanism whitelist does, which is exactly what this probes.
     */
    raw_pkcs11_encrypt_probe(public_key_uid: string): string;
    /**
     * WP-3 showcase — register a caller-supplied X.509 certificate (DER,
     * hex-encoded) linked to an existing KMIP public key, and project it
     * onto the engine as a real `CKO_CERTIFICATE` object sharing that
     * key's `CKA_ID` (the strongSwan cert-to-key matching pattern).
     * Native CA issuance (`Certify`) isn't reachable in wasm (its
     * rcgen/aws_lc_rs backend doesn't cross-compile to wasm32 — see this
     * crate's doc comment), so this exercises `Register`'s
     * wasm-reachable certificate projection instead, on a certificate
     * the caller already holds — exactly how a raw PKCS#11 client like
     * strongSwan would present one, not a full in-browser CA workflow.
     */
    register_certificate_demo(linked_public_key_uid: string, cert_der_hex: string): string;
    /**
     * Release the legacy single-policy slot ([`load_policy`](Self::load_policy))
     * without loading a replacement. [`activate_policy_module`](Self::activate_policy_module)
     * refuses while it is occupied — the playground boots with a legacy
     * permissive policy active, so switching to a multi-file modular preset
     * must call this first.
     */
    release_legacy_policy(): void;
    /**
     * High-level **batch** driver: build ONE KMIP 3.0 `Request Message` carrying
     * many operations and dispatch it through the identical decode → dispatch →
     * encode path `submit`/`run_op` use. This is a *real* on-the-wire batch (one
     * request, N `Batch Item`s), not N separate requests. `spec_json`:
     *
     * ```json
     * {
     *   "errorContinuation": "Stop" | "Continue" | "Undo",   // optional, default Stop
     *   "items": [
     *     {"op":"CreateKeyPair","intent":"sign"},
     *     {"op":"Activate","uid":"$IDPlaceholder"},
     *     {"op":"Sign","uid":"$IDPlaceholder","text":"hello"}
     *   ]
     * }
     * ```
     *
     * `$IDPlaceholder` in any `uid` resolves to the UID the previous
     * UID-producing item created (KMIP §6.1 preamble ID Placeholder) — so Create →
     * Activate → Sign chains in a single round trip. `errorContinuation`
     * controls failure handling (§9.5): `Continue` runs every item, `Stop`
     * halts after the first failure, `Undo` halts AND rolls earlier successes
     * back (reported as `OperationUndone`).
     *
     * Returns `{ ok, errorContinuation, requested, returned, items[], audit,
     * requestWireHex, requestWireLen, responseWireHex, responseWireLen,
     * responseTree }` where each `items[]` entry mirrors a `run_op` result
     * minus the wire (the wire is the one shared Request + Response Message —
     * the actual "N operations, ONE request" proof).
     */
    run_batch(spec_json: string): string;
    /**
     * High-level driver the UI uses. `spec_json` is a small object the UI
     * builds from friendly controls, e.g.:
     *
     * ```json
     * {"op":"CreateKeyPair","algorithm":"ML-DSA-65"}
     * {"op":"Activate","uid":"…"}
     * {"op":"Sign","uid":"…","text":"hello"}
     * {"op":"Encapsulate","uid":"…"}
     * {"op":"Create","algorithm":"AES","length":256}
     * ```
     *
     * Returns a JSON string: `{ ok, operation, status, resultReason, message,
     * summary, responseWireHex, responseWireLen, responseTree, audit }`.
     * `audit` is the list of Plane-1/2/3 events this op emitted.
     */
    run_op(spec_json: string): string;
    /**
     * Enable/disable one active module without unloading it — a disabled
     * module's rules are skipped during evaluation but stay activated (its
     * scope stays claimed). Returns `{ ok }` — `ok:false` means no module
     * by that name was active.
     */
    set_policy_module_enabled(name: string, enabled: boolean): string;
    /**
     * Set what the engine does with a request whose op no active module's
     * scope covers (modular mode only) — `mode` is `"deny"` (fail closed,
     * the server default) or `"allow"` (fail open; playground/incremental
     * adoption only). Returns `{ ok, error? }`.
     */
    set_uncovered_ops(mode: string): string;
    /**
     * WP5 — "Set up demo CA" affordance for the Certificate Services
     * teaching flow: generate a fresh keypair of `algorithm` in the
     * engine, self-sign it into a CA certificate via the SAME production
     * `certify::bootstrap_ca_certificate` path the native server's
     * `--ca-key` bootstrap uses (not a wasm-only shortcut), and
     * designate it on this session's `Deps` so subsequent Certify /
     * Re-certify calls (via [`submit`](KmipPlayground::submit) /
     * [`run_op`](KmipPlayground::run_op)) have a signer. `algorithm` ∈
     * `RSA-2048 | ECDSA-P256 | ML-DSA-65 | SLH-DSA-SHA2-128f`; empty
     * `subject_cn` defaults to "Playground Demo CA". Returns
     * `{ ok, privateKeyUid, certificateUid, certificateDerHex,
     * algorithm }` on success, `{ ok: false, error }` on failure — never
     * partially designates a CA it failed to fully mint.
     */
    setup_demo_ca(algorithm: string, subject_cn: string): string;
    /**
     * Raw entry: one KMIP 3.0 `Request Message` (TTLV wire bytes) → encoded
     * `Response Message` (TTLV wire bytes). The identical decode → dispatch →
     * encode path the TLS listener runs per connection. A wire-decode failure
     * returns a spec-shaped error `Response Message`, never throws.
     */
    submit(ttlv: Uint8Array): Uint8Array;
}

export class SoftHsmRust {
    free(): void;
    [Symbol.dispose](): void;
    aes_ctr_decrypt(key_handle: number, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array;
    aes_ctr_encrypt(key_handle: number, iv: Uint8Array, plaintext: Uint8Array): Uint8Array;
    generate_aes_key(key_size: number): number;
    init_token(slot_id: number, pin: string, label: string): boolean;
    constructor();
}

export function _C_AsyncComplete(_h_session: number, _p_function_name: number, _p_result: number): number;

export function _C_AsyncGetID(_h_session: number, _p_function_name: number, _pul_id: number): number;

export function _C_AsyncJoin(_h_session: number, _p_function_name: number, _ul_id: number, _p_data: number, _ul_data_len: number): number;

/**
 * §5.21 (legacy) — always CKR_FUNCTION_NOT_PARALLEL per spec.
 */
export function _C_CancelFunction(_h_session: number): number;

/**
 * PKCS#11 v3.2 §5.6 — close every session on the slot (op-state cleanup +
 * session-object destruction per C_CloseSession semantics).
 */
export function _C_CloseAllSessions(slot_id: number): number;

export function _C_CloseSession(h_session: number): number;

export function _C_CopyObject(h_session: number, h_object: number, p_template: number, ul_count: number, ph_new_object: number): number;

export function _C_CreateObject(_h_session: number, p_template: number, count: number, ph_object: number): number;

export function _C_DecapsulateKey(h_session: number, p_mechanism: number, h_private_key: number, p_template: number, ul_attribute_count: number, p_ciphertext: number, ul_ciphertext_len: number, ph_key: number): number;

export function _C_Decrypt(h_session: number, p_encrypted_data: number, ul_encrypted_data_len: number, p_data: number, pul_data_len: number): number;

export function _C_DecryptDigestUpdate(h_session: number, p_encrypted_part: number, ul_encrypted_part_len: number, p_part: number, pul_part_len: number): number;

export function _C_DecryptFinal(h_session: number, p_last_part: number, pul_last_part_len: number): number;

export function _C_DecryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_DecryptMessage(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number, p_ciphertext: number, ul_ciphertext_len: number, p_plaintext: number, pul_plaintext_len: number): number;

export function _C_DecryptMessageBegin(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number): number;

export function _C_DecryptMessageNext(h_session: number, p_parameter: number, _ul_parameter_len: number, p_ciphertext_part: number, ul_ciphertext_part_len: number, p_plaintext_part: number, pul_plaintext_part_len: number, flags: number): number;

export function _C_DecryptUpdate(h_session: number, p_encrypted_part: number, ul_encrypted_part_len: number, p_part: number, pul_part_len: number): number;

export function _C_DecryptVerifyUpdate(h_session: number, p_encrypted_part: number, ul_encrypted_part_len: number, p_part: number, pul_part_len: number): number;

export function _C_DeriveKey(_h_session: number, p_mechanism: number, h_base_key: number, p_template: number, ul_attribute_count: number, ph_key: number): number;

export function _C_DestroyObject(h_session: number, h_object: number): number;

export function _C_Digest(h_session: number, p_data: number, ul_data_len: number, p_digest: number, pul_digest_len: number): number;

export function _C_DigestEncryptUpdate(h_session: number, p_part: number, ul_part_len: number, p_encrypted_part: number, pul_encrypted_part_len: number): number;

export function _C_DigestFinal(h_session: number, p_digest: number, pul_digest_len: number): number;

export function _C_DigestInit(h_session: number, p_mechanism: number): number;

export function _C_DigestKey(_h_session: number, _h_key: number): number;

export function _C_DigestUpdate(h_session: number, p_part: number, ul_part_len: number): number;

export function _C_EncapsulateKey(h_session: number, p_mechanism: number, h_key: number, p_template: number, ul_attribute_count: number, p_ciphertext: number, pul_ciphertext_len: number, ph_key: number): number;

export function _C_Encrypt(h_session: number, p_data: number, ul_data_len: number, p_encrypted_data: number, pul_encrypted_data_len: number): number;

export function _C_EncryptFinal(h_session: number, p_last_encrypted_part: number, pul_last_encrypted_part_len: number): number;

export function _C_EncryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_EncryptMessage(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number, p_plaintext: number, ul_plaintext_len: number, p_ciphertext: number, pul_ciphertext_len: number): number;

export function _C_EncryptMessageBegin(h_session: number, p_parameter: number, _ul_parameter_len: number, p_associated_data: number, ul_associated_data_len: number): number;

export function _C_EncryptMessageNext(h_session: number, p_parameter: number, _ul_parameter_len: number, p_plaintext_part: number, ul_plaintext_part_len: number, p_ciphertext_part: number, pul_ciphertext_part_len: number, flags: number): number;

export function _C_EncryptUpdate(h_session: number, p_part: number, ul_part_len: number, p_encrypted_part: number, pul_encrypted_part_len: number): number;

export function _C_Finalize(p_reserved: number): number;

export function _C_FindObjects(h_session: number, ph_object: number, ul_max_object_count: number, pul_object_count: number): number;

export function _C_FindObjectsFinal(h_session: number): number;

export function _C_FindObjectsInit(h_session: number, p_template: number, ul_count: number): number;

export function _C_GenerateKey(_h_session: number, p_mechanism: number, p_template: number, ul_count: number, ph_key: number): number;

export function _C_GenerateKeyPair(h_session: number, p_mechanism: number, p_public_key_template: number, ul_public_key_attribute_count: number, p_private_key_template: number, ul_private_key_attribute_count: number, ph_public_key: number, ph_private_key: number): number;

export function _C_GenerateRandom(_h_session: number, p_random_data: number, ul_random_len: number): number;

export function _C_GetAttributeValue(h_session: number, h_object: number, p_template: number, count: number): number;

/**
 * §5.21 (legacy) — always CKR_FUNCTION_NOT_PARALLEL per spec.
 */
export function _C_GetFunctionStatus(_h_session: number): number;

/**
 * CK_INFO: cryptokiVersion(2) + manufacturerID(32) + flags(4) + libraryDescription(32) + libraryVersion(2) = 72 bytes
 */
export function _C_GetInfo(p_info: number): number;

/**
 * §5.5 — C_GetInterface. NULL name/version match the default interface.
 * Callable BEFORE C_Initialize (§5.4 — same pre-init surface as
 * C_GetFunctionList / C_GetInterfaceList).
 */
export function _C_GetInterface(p_interface_name: number, p_version: number, pp_interface: number, _flags: number): number;

/**
 * C_GetSlotInfo: returns basic slot info for slot 0.
 * CK_SLOT_INFO: slotDescription(64) + manufacturerID(32) + flags(4) + hardwareVersion(2) + firmwareVersion(2) = 104 bytes
 * PKCS#11 v3.2 §5.5 — C_GetInterfaceList. Reports one interface,
 * "PKCS 11" version 3.2. Callable BEFORE C_Initialize (§5.4: the
 * function-list/interface getters are exempt from the init gate;
 * CKR_CRYPTOKI_NOT_INITIALIZED is not in this function's return list).
 * wasm constraint: exported functions are not
 * addressable as C function pointers in linear memory, so pFunctionList
 * points to a CK_VERSION{3,2} header only; symbol binding happens in the
 * JS shim (each `_C_*` export), which is the function table for every
 * real consumer of this engine. CK_INTERFACE (wasm32, 12 B):
 * pInterfaceName, pFunctionList, flags.
 */
export function _C_GetInterfaceList(p_interfaces_list: number, pul_count: number): number;

export function _C_GetMechanismInfo(slot_id: number, mech_type: number, p_info: number): number;

/**
 * PKCS#11 v3.2 §5.5 — C_GetMechanismList. Gated on library initialization
 * (§5.4), validates the slot (CKR_SLOT_ID_INVALID, mirroring
 * C_GetTokenInfo) and the required `pulCount` out-param
 * (CKR_ARGUMENTS_BAD). NULL `pMechanismList` is the §5.2 size query.
 */
export function _C_GetMechanismList(slot_id: number, p_mechanism_list: number, pul_count: number): number;

/**
 * PKCS#11 v3.2 §5.7.4 — "an estimate of the amount of storage the object
 * occupies". Honest estimate: Σ(stored attribute value lengths) + a fixed
 * 12-byte per-attribute header ([`OBJECT_SIZE_ATTR_OVERHEAD`]). The
 * engine-internal CKA_PRIV_* bookkeeping attrs (≥0xFFFF_0000) are excluded —
 * they are implementation plumbing, not object storage the client created.
 */
export function _C_GetObjectSize(h_session: number, h_object: number, pul_size: number): number;

export function _C_GetOperationState(_h_session: number, _p_operation_state: number, _pul_operation_state_len: number): number;

export function _C_GetSessionInfo(h_session: number, p_info: number): number;

export function _C_GetSessionValidationFlags(h_session: number, type_: number, p_flags: number): number;

export function _C_GetSlotInfo(slot_id: number, p_info: number): number;

export function _C_GetSlotList(token_present: number, p_slot_list: number, pul_count: number): number;

export function _C_GetTokenInfo(slot_id: number, p_info: number): number;

export function _C_InitPIN(h_session: number, p_pin: number, ul_pin_len: number): number;

export function _C_InitToken(slot_id: number, p_pin: number, ul_pin_len: number, p_label: number): number;

export function _C_Initialize(p_init_args: number): number;

export function _C_Login(h_session: number, user_type: number, p_pin: number, ul_pin_len: number): number;

/**
 * PKCS#11 v3.0+ §5.6 — C_Login with a username. This single-user token
 * accepts only an empty username (delegates to C_Login); anything else is
 * CKR_OPERATION_NOT_SUPPORTED... which v3.2 spells CKR_FUNCTION_NOT_SUPPORTED
 * for an unsupported variant.
 */
export function _C_LoginUser(h_session: number, user_type: number, p_pin: number, ul_pin_len: number, _p_username: number, _ul_username_len: number): number;

export function _C_Logout(h_session: number): number;

export function _C_MessageDecryptFinal(h_session: number): number;

export function _C_MessageDecryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_MessageEncryptFinal(h_session: number): number;

export function _C_MessageEncryptInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_MessageSignFinal(h_session: number): number;

export function _C_MessageSignInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_MessageVerifyFinal(h_session: number): number;

export function _C_MessageVerifyInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_OpenSession(slot_id: number, flags: number, _p_application: number, _notify: number, ph_session: number): number;

export function _C_SeedRandom(_h_session: number, _p_seed: number, _ul_seed_len: number): number;

/**
 * PKCS#11 v3.0+ §5.6 — cancel active operations selected by `flags`
 * (CKF_ENCRYPT 0x100, CKF_DECRYPT 0x200, CKF_DIGEST 0x400, CKF_SIGN 0x800,
 * CKF_VERIFY 0x2000, CKF_FIND_OBJECTS 0x40, CKF_MESSAGE_ENCRYPT 0x2,
 * CKF_MESSAGE_DECRYPT 0x4, CKF_MESSAGE_SIGN 0x8, CKF_MESSAGE_VERIFY 0x10).
 * flags == 0 cancels nothing.
 */
export function _C_SessionCancel(h_session: number, flags: number): number;

export function _C_SetAttributeValue(h_session: number, h_object: number, p_template: number, ul_count: number): number;

export function _C_SetOperationState(_h_session: number, _p_operation_state: number, _ul_operation_state_len: number, _h_encryption_key: number, _h_authentication_key: number): number;

/**
 * PKCS#11 v3.2 §5.6.7 — C_SetPIN rotates the PIN of the user that is
 * currently logged in (SO session → SO PIN; user session OR public session →
 * the normal user PIN, per the spec's session-state table). Works only from
 * a R/W session; the old PIN is verified against the stored PBKDF2 hash and
 * the new PIN is re-salted and re-hashed (`state::hash_pin`).
 */
export function _C_SetPIN(h_session: number, p_old_pin: number, ul_old_len: number, p_new_pin: number, ul_new_len: number): number;

export function _C_Sign(h_session: number, p_data: number, ul_data_len: number, p_signature: number, pul_signature_len: number): number;

export function _C_SignEncryptUpdate(h_session: number, p_part: number, ul_part_len: number, p_encrypted_part: number, pul_encrypted_part_len: number): number;

export function _C_SignFinal(h_session: number, p_signature: number, pul_signature_len: number): number;

export function _C_SignInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_SignMessage(h_session: number, _p_param: number, _ul_param_len: number, p_data: number, ul_data_len: number, p_signature: number, pul_signature_len: number): number;

/**
 * §5.14 — start one multipart message inside an active message-sign op.
 */
export function _C_SignMessageBegin(h_session: number, _p_param: number, _ul_param_len: number): number;

/**
 * §5.14 — feed a message part. `pulSignatureLen == NULL` marks a non-final
 * part; non-NULL marks the final part (then NULL `pSignature` is the §5.2
 * length query, which does not consume the accumulated message).
 */
export function _C_SignMessageNext(h_session: number, _p_param: number, _ul_param_len: number, p_part: number, ul_part_len: number, p_signature: number, pul_signature_len: number): number;

export function _C_SignRecover(h_session: number, p_data: number, ul_data_len: number, p_signature: number, pul_signature_len: number): number;

export function _C_SignRecoverInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_SignUpdate(h_session: number, p_part: number, ul_part_len: number): number;

export function _C_UnwrapKey(_h_session: number, p_mechanism: number, h_unwrapping_key: number, p_wrapped_key: number, ul_wrapped_key_len: number, p_template: number, ul_attribute_count: number, ph_key: number): number;

export function _C_UnwrapKeyAuthenticated(_h_session: number, p_mechanism: number, h_unwrapping_key: number, p_wrapped_key: number, ul_wrapped_key_len: number, p_template: number, ul_attribute_count: number, p_associated_data: number, ul_associated_data_len: number, ph_key: number): number;

export function _C_Verify(h_session: number, p_data: number, ul_data_len: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifyFinal(h_session: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifyInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_VerifyMessage(h_session: number, _p_param: number, _ul_param_len: number, p_data: number, ul_data_len: number, p_signature: number, ul_signature_len: number): number;

/**
 * §5.15 — start one multipart message inside an active message-verify op.
 */
export function _C_VerifyMessageBegin(h_session: number, _p_param: number, _ul_param_len: number): number;

/**
 * §5.15 — feed a message part. NULL `pSignature` marks a non-final part;
 * non-NULL carries the signature and finalizes the message.
 */
export function _C_VerifyMessageNext(h_session: number, _p_param: number, _ul_param_len: number, p_part: number, ul_part_len: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifyRecover(h_session: number, p_signature: number, ul_signature_len: number, p_data: number, pul_data_len: number): number;

export function _C_VerifyRecoverInit(h_session: number, p_mechanism: number, h_key: number): number;

export function _C_VerifySignature(h_session: number, p_data: number, ul_data_len: number): number;

export function _C_VerifySignatureFinal(h_session: number): number;

export function _C_VerifySignatureInit(h_session: number, p_mechanism: number, h_key: number, p_signature: number, ul_signature_len: number): number;

export function _C_VerifySignatureUpdate(h_session: number, p_part: number, ul_part_len: number): number;

export function _C_VerifyUpdate(h_session: number, p_part: number, ul_part_len: number): number;

/**
 * §5.5 — no slot events exist on this soft token. Non-blocking poll gets
 * CKR_NO_EVENT; a blocking wait would never return, so refuse it.
 */
export function _C_WaitForSlotEvent(flags: number, _p_slot: number, _p_reserved: number): number;

export function _C_WrapKey(_h_session: number, p_mechanism: number, h_wrapping_key: number, h_key: number, p_wrapped_key: number, pul_wrapped_key_len: number): number;

export function _C_WrapKeyAuthenticated(_h_session: number, p_mechanism: number, h_wrapping_key: number, h_key: number, p_associated_data: number, ul_associated_data_len: number, p_wrapped_key: number, pul_wrapped_key_len: number): number;

export function _free(ptr: number, _js_size: number): void;

export function _malloc(size: number): number;

export function _set_kat_seed(seed_ptr: number, seed_len: number): void;

/**
 * Decode any KMIP TTLV frame (request or response wire bytes) to a JSON tree
 * the UI renders as the "wire view" and turns into plain English. Free
 * function — does not need an engine instance.
 */
export function decode_ttlv(bytes: Uint8Array): string;

/**
 * Encode a JSON tree (`{tag, type, value?, children?}` — the exact shape
 * `decode_ttlv` emits) to KMIP TTLV wire bytes. The inverse of `decode_ttlv`;
 * lets a caller build an arbitrary request by hand (any of the 66 KMIP 3.0
 * operations, not just the ones `run_op`'s friendly `build_payload` below
 * covers) and hand the resulting bytes to `submit`, which dispatches them
 * through the exact same path a real request takes. Malformed input here is
 * a caller bug (a hand-built tree or a corpus-port bug), not a KMIP-protocol
 * outcome, so it throws rather than returning the `{ok:false,...}` JSON
 * convention `dry_run`/`load_policy` use.
 */
export function encode_ttlv(tree_json: string): Uint8Array;

export function wasm_start(): void;
