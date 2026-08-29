/**
 * One in-browser KMIP control plane: a policy engine, an in-memory KMIP object
 * store, an audit ring, and a live `softhsmrustv3` engine session — the exact
 * `Deps` bundle the native server builds, minus the network.
 */
export class KmipPlayground {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KmipPlaygroundFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_kmipplayground_free(ptr, 0);
    }
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
     * @param {string} yaml
     * @returns {string}
     */
    activate_policy_module(yaml) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_activate_policy_module(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * The most recent `limit` cross-plane audit events as a JSON array
     * (each: `{ ts, plane, correlation_id, event }`).
     * @param {number} limit
     * @returns {string}
     */
    audit_snapshot(limit) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.kmipplayground_audit_snapshot(this.__wbg_ptr, limit);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Clear the audit ring (UI "reset trace" button).
     */
    clear_audit() {
        wasm.kmipplayground_clear_audit(this.__wbg_ptr);
    }
    /**
     * Deactivate every module (does not touch a legacy
     * [`load_policy`](Self::load_policy) policy). Call before activating a
     * different multi-file preset.
     */
    clear_policy_modules() {
        wasm.kmipplayground_clear_policy_modules(this.__wbg_ptr);
    }
    /**
     * Deactivate one named module. Returns `{ ok }` — `ok:false` means no
     * module by that name was active.
     * @param {string} name
     * @returns {string}
     */
    deactivate_policy_module(name) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_deactivate_policy_module(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
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
     * @param {string} spec_json
     * @returns {string}
     */
    dry_run(spec_json) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(spec_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_dry_run(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * WP-3 showcase — read back a Certificate object's REAL engine-side
     * PKCS#11 attributes (not the KMIP store record) by its KMIP uid:
     * `CKA_ID`, `CKA_VALUE` length, `CKA_SUBJECT`/`CKA_ISSUER` DER
     * lengths, `CKA_SERIAL_NUMBER`, and a human-readable Subject CN
     * (re-derived from `CKA_VALUE` — the same DER the engine actually
     * holds, not the request that created it).
     * @param {string} certificate_uid
     * @returns {string}
     */
    engine_certificate_attributes(certificate_uid) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(certificate_uid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_engine_certificate_attributes(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * C3 (2026-08-28 gaps-remediation plan) — every value-level lint finding
     * for a policy draft, fatal and advisory alike (not just the first fatal
     * one `load_policy` itself stops at). Structural failures (bad YAML,
     * unknown top-level field, bad schema version) still come back as a
     * single `{ ok: false, error }` — those are genuinely single-valued (no
     * "second" malformed document) and the visual editor's own generator
     * never produces one anyway. Returns
     * `{ ok: true, findings: [{ ruleIndex, field, value, fatal, message }] }`.
     * @param {string} yaml
     * @returns {string}
     */
    lint_policy_draft(yaml) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_lint_policy_draft(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Every object in the KMIP store (Plane 2 keystore view) as a JSON array.
     * @returns {string}
     */
    list_objects() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.kmipplayground_list_objects(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Activate a crypto-agility policy from YAML (Plane 1). Returns
     * `{ ok, warnings, error? }`. Subsequent ops are gated/auto-substituted
     * by this policy until another is loaded.
     * @param {string} yaml
     * @returns {string}
     */
    load_policy(yaml) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(yaml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_load_policy(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
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
     * @param {number | null} [slot]
     * @param {string | null} [rng_seed_mode]
     */
    constructor(slot, rng_seed_mode) {
        var ptr0 = isLikeNone(rng_seed_mode) ? 0 : passStringToWasm0(rng_seed_mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.kmipplayground_new(isLikeNone(slot) ? 0x100000001 : (slot) >>> 0, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        KmipPlaygroundFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Every currently-active module: `{ modules: [{ name, fingerprint,
     * scopes, rules, enabled }], uncoveredOps }`.
     * @returns {string}
     */
    policy_modules_status() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.kmipplayground_policy_modules_status(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The currently-active policy (Plane 1): `{ active, name, fingerprint,
     * source, rules }`.
     * @returns {string}
     */
    policy_status() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.kmipplayground_policy_status(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
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
     * @param {string} public_key_uid
     * @returns {string}
     */
    raw_pkcs11_encrypt_probe(public_key_uid) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(public_key_uid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_raw_pkcs11_encrypt_probe(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
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
     * @param {string} linked_public_key_uid
     * @param {string} cert_der_hex
     * @returns {string}
     */
    register_certificate_demo(linked_public_key_uid, cert_der_hex) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(linked_public_key_uid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(cert_der_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_register_certificate_demo(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            deferred3_0 = ret[0];
            deferred3_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Release the legacy single-policy slot ([`load_policy`](Self::load_policy))
     * without loading a replacement. [`activate_policy_module`](Self::activate_policy_module)
     * refuses while it is occupied — the playground boots with a legacy
     * permissive policy active, so switching to a multi-file modular preset
     * must call this first.
     */
    release_legacy_policy() {
        wasm.kmipplayground_release_legacy_policy(this.__wbg_ptr);
    }
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
     * @param {string} spec_json
     * @returns {string}
     */
    run_batch(spec_json) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(spec_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_run_batch(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
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
     * @param {string} spec_json
     * @returns {string}
     */
    run_op(spec_json) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(spec_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_run_op(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Enable/disable one active module without unloading it — a disabled
     * module's rules are skipped during evaluation but stay activated (its
     * scope stays claimed). Returns `{ ok }` — `ok:false` means no module
     * by that name was active.
     * @param {string} name
     * @param {boolean} enabled
     * @returns {string}
     */
    set_policy_module_enabled(name, enabled) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_set_policy_module_enabled(this.__wbg_ptr, ptr0, len0, enabled);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Set what the engine does with a request whose op no active module's
     * scope covers (modular mode only) — `mode` is `"deny"` (fail closed,
     * the server default) or `"allow"` (fail open; playground/incremental
     * adoption only). Returns `{ ok, error? }`.
     * @param {string} mode
     * @returns {string}
     */
    set_uncovered_ops(mode) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_set_uncovered_ops(this.__wbg_ptr, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
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
     * @param {string} algorithm
     * @param {string} subject_cn
     * @returns {string}
     */
    setup_demo_ca(algorithm, subject_cn) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(subject_cn, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.kmipplayground_setup_demo_ca(this.__wbg_ptr, ptr0, len0, ptr1, len1);
            deferred3_0 = ret[0];
            deferred3_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Raw entry: one KMIP 3.0 `Request Message` (TTLV wire bytes) → encoded
     * `Response Message` (TTLV wire bytes). The identical decode → dispatch →
     * encode path the TLS listener runs per connection. A wire-decode failure
     * returns a spec-shaped error `Response Message`, never throws.
     * @param {Uint8Array} ttlv
     * @returns {Uint8Array}
     */
    submit(ttlv) {
        const ptr0 = passArray8ToWasm0(ttlv, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.kmipplayground_submit(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
}
if (Symbol.dispose) KmipPlayground.prototype[Symbol.dispose] = KmipPlayground.prototype.free;

export class SoftHsmRust {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SoftHsmRustFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_softhsmrust_free(ptr, 0);
    }
    /**
     * @param {number} key_handle
     * @param {Uint8Array} iv
     * @param {Uint8Array} ciphertext
     * @returns {Uint8Array}
     */
    aes_ctr_decrypt(key_handle, iv, ciphertext) {
        const ptr0 = passArray8ToWasm0(iv, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.softhsmrust_aes_ctr_decrypt(this.__wbg_ptr, key_handle, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {number} key_handle
     * @param {Uint8Array} iv
     * @param {Uint8Array} plaintext
     * @returns {Uint8Array}
     */
    aes_ctr_encrypt(key_handle, iv, plaintext) {
        const ptr0 = passArray8ToWasm0(iv, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(plaintext, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.softhsmrust_aes_ctr_encrypt(this.__wbg_ptr, key_handle, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {number} key_size
     * @returns {number}
     */
    generate_aes_key(key_size) {
        const ret = wasm.softhsmrust_generate_aes_key(this.__wbg_ptr, key_size);
        return ret >>> 0;
    }
    /**
     * @param {number} slot_id
     * @param {string} pin
     * @param {string} label
     * @returns {boolean}
     */
    init_token(slot_id, pin, label) {
        const ptr0 = passStringToWasm0(pin, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.softhsmrust_init_token(this.__wbg_ptr, slot_id, ptr0, len0, ptr1, len1);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.softhsmrust_new();
        this.__wbg_ptr = ret >>> 0;
        SoftHsmRustFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) SoftHsmRust.prototype[Symbol.dispose] = SoftHsmRust.prototype.free;

/**
 * @param {number} _h_session
 * @param {number} _p_function_name
 * @param {number} _p_result
 * @returns {number}
 */
export function _C_AsyncComplete(_h_session, _p_function_name, _p_result) {
    const ret = wasm._C_AsyncComplete(_h_session, _p_function_name, _p_result);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_function_name
 * @param {number} _pul_id
 * @returns {number}
 */
export function _C_AsyncGetID(_h_session, _p_function_name, _pul_id) {
    const ret = wasm._C_AsyncGetID(_h_session, _p_function_name, _pul_id);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_function_name
 * @param {number} _ul_id
 * @param {number} _p_data
 * @param {number} _ul_data_len
 * @returns {number}
 */
export function _C_AsyncJoin(_h_session, _p_function_name, _ul_id, _p_data, _ul_data_len) {
    const ret = wasm._C_AsyncJoin(_h_session, _p_function_name, _ul_id, _p_data, _ul_data_len);
    return ret >>> 0;
}

/**
 * §5.21 (legacy) — always CKR_FUNCTION_NOT_PARALLEL per spec.
 * @param {number} _h_session
 * @returns {number}
 */
export function _C_CancelFunction(_h_session) {
    const ret = wasm._C_CancelFunction(_h_session);
    return ret >>> 0;
}

/**
 * PKCS#11 v3.2 §5.6 — close every session on the slot (op-state cleanup +
 * session-object destruction per C_CloseSession semantics).
 * @param {number} slot_id
 * @returns {number}
 */
export function _C_CloseAllSessions(slot_id) {
    const ret = wasm._C_CloseAllSessions(slot_id);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_CloseSession(h_session) {
    const ret = wasm._C_CloseSession(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} h_object
 * @param {number} p_template
 * @param {number} ul_count
 * @param {number} ph_new_object
 * @returns {number}
 */
export function _C_CopyObject(h_session, h_object, p_template, ul_count, ph_new_object) {
    const ret = wasm._C_CopyObject(h_session, h_object, p_template, ul_count, ph_new_object);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_template
 * @param {number} count
 * @param {number} ph_object
 * @returns {number}
 */
export function _C_CreateObject(_h_session, p_template, count, ph_object) {
    const ret = wasm._C_CreateObject(_h_session, p_template, count, ph_object);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_private_key
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} p_ciphertext
 * @param {number} ul_ciphertext_len
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_DecapsulateKey(h_session, p_mechanism, h_private_key, p_template, ul_attribute_count, p_ciphertext, ul_ciphertext_len, ph_key) {
    const ret = wasm._C_DecapsulateKey(h_session, p_mechanism, h_private_key, p_template, ul_attribute_count, p_ciphertext, ul_ciphertext_len, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_encrypted_data
 * @param {number} ul_encrypted_data_len
 * @param {number} p_data
 * @param {number} pul_data_len
 * @returns {number}
 */
export function _C_Decrypt(h_session, p_encrypted_data, ul_encrypted_data_len, p_data, pul_data_len) {
    const ret = wasm._C_Decrypt(h_session, p_encrypted_data, ul_encrypted_data_len, p_data, pul_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_encrypted_part
 * @param {number} ul_encrypted_part_len
 * @param {number} p_part
 * @param {number} pul_part_len
 * @returns {number}
 */
export function _C_DecryptDigestUpdate(h_session, p_encrypted_part, ul_encrypted_part_len, p_part, pul_part_len) {
    const ret = wasm._C_DecryptDigestUpdate(h_session, p_encrypted_part, ul_encrypted_part_len, p_part, pul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_last_part
 * @param {number} pul_last_part_len
 * @returns {number}
 */
export function _C_DecryptFinal(h_session, p_last_part, pul_last_part_len) {
    const ret = wasm._C_DecryptFinal(h_session, p_last_part, pul_last_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_DecryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_DecryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @param {number} p_ciphertext
 * @param {number} ul_ciphertext_len
 * @param {number} p_plaintext
 * @param {number} pul_plaintext_len
 * @returns {number}
 */
export function _C_DecryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_ciphertext, ul_ciphertext_len, p_plaintext, pul_plaintext_len) {
    const ret = wasm._C_DecryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_ciphertext, ul_ciphertext_len, p_plaintext, pul_plaintext_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @returns {number}
 */
export function _C_DecryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len) {
    const ret = wasm._C_DecryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_ciphertext_part
 * @param {number} ul_ciphertext_part_len
 * @param {number} p_plaintext_part
 * @param {number} pul_plaintext_part_len
 * @param {number} flags
 * @returns {number}
 */
export function _C_DecryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_ciphertext_part, ul_ciphertext_part_len, p_plaintext_part, pul_plaintext_part_len, flags) {
    const ret = wasm._C_DecryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_ciphertext_part, ul_ciphertext_part_len, p_plaintext_part, pul_plaintext_part_len, flags);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_encrypted_part
 * @param {number} ul_encrypted_part_len
 * @param {number} p_part
 * @param {number} pul_part_len
 * @returns {number}
 */
export function _C_DecryptUpdate(h_session, p_encrypted_part, ul_encrypted_part_len, p_part, pul_part_len) {
    const ret = wasm._C_DecryptUpdate(h_session, p_encrypted_part, ul_encrypted_part_len, p_part, pul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_encrypted_part
 * @param {number} ul_encrypted_part_len
 * @param {number} p_part
 * @param {number} pul_part_len
 * @returns {number}
 */
export function _C_DecryptVerifyUpdate(h_session, p_encrypted_part, ul_encrypted_part_len, p_part, pul_part_len) {
    const ret = wasm._C_DecryptVerifyUpdate(h_session, p_encrypted_part, ul_encrypted_part_len, p_part, pul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_base_key
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_DeriveKey(_h_session, p_mechanism, h_base_key, p_template, ul_attribute_count, ph_key) {
    const ret = wasm._C_DeriveKey(_h_session, p_mechanism, h_base_key, p_template, ul_attribute_count, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} h_object
 * @returns {number}
 */
export function _C_DestroyObject(h_session, h_object) {
    const ret = wasm._C_DestroyObject(h_session, h_object);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_digest
 * @param {number} pul_digest_len
 * @returns {number}
 */
export function _C_Digest(h_session, p_data, ul_data_len, p_digest, pul_digest_len) {
    const ret = wasm._C_Digest(h_session, p_data, ul_data_len, p_digest, pul_digest_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @param {number} p_encrypted_part
 * @param {number} pul_encrypted_part_len
 * @returns {number}
 */
export function _C_DigestEncryptUpdate(h_session, p_part, ul_part_len, p_encrypted_part, pul_encrypted_part_len) {
    const ret = wasm._C_DigestEncryptUpdate(h_session, p_part, ul_part_len, p_encrypted_part, pul_encrypted_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_digest
 * @param {number} pul_digest_len
 * @returns {number}
 */
export function _C_DigestFinal(h_session, p_digest, pul_digest_len) {
    const ret = wasm._C_DigestFinal(h_session, p_digest, pul_digest_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @returns {number}
 */
export function _C_DigestInit(h_session, p_mechanism) {
    const ret = wasm._C_DigestInit(h_session, p_mechanism);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _h_key
 * @returns {number}
 */
export function _C_DigestKey(_h_session, _h_key) {
    const ret = wasm._C_DigestKey(_h_session, _h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @returns {number}
 */
export function _C_DigestUpdate(h_session, p_part, ul_part_len) {
    const ret = wasm._C_DigestUpdate(h_session, p_part, ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} p_ciphertext
 * @param {number} pul_ciphertext_len
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_EncapsulateKey(h_session, p_mechanism, h_key, p_template, ul_attribute_count, p_ciphertext, pul_ciphertext_len, ph_key) {
    const ret = wasm._C_EncapsulateKey(h_session, p_mechanism, h_key, p_template, ul_attribute_count, p_ciphertext, pul_ciphertext_len, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_encrypted_data
 * @param {number} pul_encrypted_data_len
 * @returns {number}
 */
export function _C_Encrypt(h_session, p_data, ul_data_len, p_encrypted_data, pul_encrypted_data_len) {
    const ret = wasm._C_Encrypt(h_session, p_data, ul_data_len, p_encrypted_data, pul_encrypted_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_last_encrypted_part
 * @param {number} pul_last_encrypted_part_len
 * @returns {number}
 */
export function _C_EncryptFinal(h_session, p_last_encrypted_part, pul_last_encrypted_part_len) {
    const ret = wasm._C_EncryptFinal(h_session, p_last_encrypted_part, pul_last_encrypted_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_EncryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_EncryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @param {number} p_plaintext
 * @param {number} ul_plaintext_len
 * @param {number} p_ciphertext
 * @param {number} pul_ciphertext_len
 * @returns {number}
 */
export function _C_EncryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_plaintext, ul_plaintext_len, p_ciphertext, pul_ciphertext_len) {
    const ret = wasm._C_EncryptMessage(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len, p_plaintext, ul_plaintext_len, p_ciphertext, pul_ciphertext_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @returns {number}
 */
export function _C_EncryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len) {
    const ret = wasm._C_EncryptMessageBegin(h_session, p_parameter, _ul_parameter_len, p_associated_data, ul_associated_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_parameter
 * @param {number} _ul_parameter_len
 * @param {number} p_plaintext_part
 * @param {number} ul_plaintext_part_len
 * @param {number} p_ciphertext_part
 * @param {number} pul_ciphertext_part_len
 * @param {number} flags
 * @returns {number}
 */
export function _C_EncryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_plaintext_part, ul_plaintext_part_len, p_ciphertext_part, pul_ciphertext_part_len, flags) {
    const ret = wasm._C_EncryptMessageNext(h_session, p_parameter, _ul_parameter_len, p_plaintext_part, ul_plaintext_part_len, p_ciphertext_part, pul_ciphertext_part_len, flags);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @param {number} p_encrypted_part
 * @param {number} pul_encrypted_part_len
 * @returns {number}
 */
export function _C_EncryptUpdate(h_session, p_part, ul_part_len, p_encrypted_part, pul_encrypted_part_len) {
    const ret = wasm._C_EncryptUpdate(h_session, p_part, ul_part_len, p_encrypted_part, pul_encrypted_part_len);
    return ret >>> 0;
}

/**
 * @param {number} p_reserved
 * @returns {number}
 */
export function _C_Finalize(p_reserved) {
    const ret = wasm._C_Finalize(p_reserved);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} ph_object
 * @param {number} ul_max_object_count
 * @param {number} pul_object_count
 * @returns {number}
 */
export function _C_FindObjects(h_session, ph_object, ul_max_object_count, pul_object_count) {
    const ret = wasm._C_FindObjects(h_session, ph_object, ul_max_object_count, pul_object_count);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_FindObjectsFinal(h_session) {
    const ret = wasm._C_FindObjectsFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_template
 * @param {number} ul_count
 * @returns {number}
 */
export function _C_FindObjectsInit(h_session, p_template, ul_count) {
    const ret = wasm._C_FindObjectsInit(h_session, p_template, ul_count);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} p_template
 * @param {number} ul_count
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_GenerateKey(_h_session, p_mechanism, p_template, ul_count, ph_key) {
    const ret = wasm._C_GenerateKey(_h_session, p_mechanism, p_template, ul_count, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} p_public_key_template
 * @param {number} ul_public_key_attribute_count
 * @param {number} p_private_key_template
 * @param {number} ul_private_key_attribute_count
 * @param {number} ph_public_key
 * @param {number} ph_private_key
 * @returns {number}
 */
export function _C_GenerateKeyPair(h_session, p_mechanism, p_public_key_template, ul_public_key_attribute_count, p_private_key_template, ul_private_key_attribute_count, ph_public_key, ph_private_key) {
    const ret = wasm._C_GenerateKeyPair(h_session, p_mechanism, p_public_key_template, ul_public_key_attribute_count, p_private_key_template, ul_private_key_attribute_count, ph_public_key, ph_private_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_random_data
 * @param {number} ul_random_len
 * @returns {number}
 */
export function _C_GenerateRandom(_h_session, p_random_data, ul_random_len) {
    const ret = wasm._C_GenerateRandom(_h_session, p_random_data, ul_random_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} h_object
 * @param {number} p_template
 * @param {number} count
 * @returns {number}
 */
export function _C_GetAttributeValue(h_session, h_object, p_template, count) {
    const ret = wasm._C_GetAttributeValue(h_session, h_object, p_template, count);
    return ret >>> 0;
}

/**
 * §5.21 (legacy) — always CKR_FUNCTION_NOT_PARALLEL per spec.
 * @param {number} _h_session
 * @returns {number}
 */
export function _C_GetFunctionStatus(_h_session) {
    const ret = wasm._C_GetFunctionStatus(_h_session);
    return ret >>> 0;
}

/**
 * CK_INFO: cryptokiVersion(2) + manufacturerID(32) + flags(4) + libraryDescription(32) + libraryVersion(2) = 72 bytes
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetInfo(p_info) {
    const ret = wasm._C_GetInfo(p_info);
    return ret >>> 0;
}

/**
 * §5.5 — C_GetInterface. NULL name/version match the default interface.
 * Callable BEFORE C_Initialize (§5.4 — same pre-init surface as
 * C_GetFunctionList / C_GetInterfaceList).
 * @param {number} p_interface_name
 * @param {number} p_version
 * @param {number} pp_interface
 * @param {number} _flags
 * @returns {number}
 */
export function _C_GetInterface(p_interface_name, p_version, pp_interface, _flags) {
    const ret = wasm._C_GetInterface(p_interface_name, p_version, pp_interface, _flags);
    return ret >>> 0;
}

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
 * @param {number} p_interfaces_list
 * @param {number} pul_count
 * @returns {number}
 */
export function _C_GetInterfaceList(p_interfaces_list, pul_count) {
    const ret = wasm._C_GetInterfaceList(p_interfaces_list, pul_count);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} mech_type
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetMechanismInfo(slot_id, mech_type, p_info) {
    const ret = wasm._C_GetMechanismInfo(slot_id, mech_type, p_info);
    return ret >>> 0;
}

/**
 * PKCS#11 v3.2 §5.5 — C_GetMechanismList. Gated on library initialization
 * (§5.4), validates the slot (CKR_SLOT_ID_INVALID, mirroring
 * C_GetTokenInfo) and the required `pulCount` out-param
 * (CKR_ARGUMENTS_BAD). NULL `pMechanismList` is the §5.2 size query.
 * @param {number} slot_id
 * @param {number} p_mechanism_list
 * @param {number} pul_count
 * @returns {number}
 */
export function _C_GetMechanismList(slot_id, p_mechanism_list, pul_count) {
    const ret = wasm._C_GetMechanismList(slot_id, p_mechanism_list, pul_count);
    return ret >>> 0;
}

/**
 * PKCS#11 v3.2 §5.7.4 — "an estimate of the amount of storage the object
 * occupies". Honest estimate: Σ(stored attribute value lengths) + a fixed
 * 12-byte per-attribute header ([`OBJECT_SIZE_ATTR_OVERHEAD`]). The
 * engine-internal CKA_PRIV_* bookkeeping attrs (≥0xFFFF_0000) are excluded —
 * they are implementation plumbing, not object storage the client created.
 * @param {number} h_session
 * @param {number} h_object
 * @param {number} pul_size
 * @returns {number}
 */
export function _C_GetObjectSize(h_session, h_object, pul_size) {
    const ret = wasm._C_GetObjectSize(h_session, h_object, pul_size);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_operation_state
 * @param {number} _pul_operation_state_len
 * @returns {number}
 */
export function _C_GetOperationState(_h_session, _p_operation_state, _pul_operation_state_len) {
    const ret = wasm._C_GetOperationState(_h_session, _p_operation_state, _pul_operation_state_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetSessionInfo(h_session, p_info) {
    const ret = wasm._C_GetSessionInfo(h_session, p_info);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} type_
 * @param {number} p_flags
 * @returns {number}
 */
export function _C_GetSessionValidationFlags(h_session, type_, p_flags) {
    const ret = wasm._C_GetSessionValidationFlags(h_session, type_, p_flags);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetSlotInfo(slot_id, p_info) {
    const ret = wasm._C_GetSlotInfo(slot_id, p_info);
    return ret >>> 0;
}

/**
 * @param {number} token_present
 * @param {number} p_slot_list
 * @param {number} pul_count
 * @returns {number}
 */
export function _C_GetSlotList(token_present, p_slot_list, pul_count) {
    const ret = wasm._C_GetSlotList(token_present, p_slot_list, pul_count);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} p_info
 * @returns {number}
 */
export function _C_GetTokenInfo(slot_id, p_info) {
    const ret = wasm._C_GetTokenInfo(slot_id, p_info);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @returns {number}
 */
export function _C_InitPIN(h_session, p_pin, ul_pin_len) {
    const ret = wasm._C_InitPIN(h_session, p_pin, ul_pin_len);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @param {number} p_label
 * @returns {number}
 */
export function _C_InitToken(slot_id, p_pin, ul_pin_len, p_label) {
    const ret = wasm._C_InitToken(slot_id, p_pin, ul_pin_len, p_label);
    return ret >>> 0;
}

/**
 * @param {number} p_init_args
 * @returns {number}
 */
export function _C_Initialize(p_init_args) {
    const ret = wasm._C_Initialize(p_init_args);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} user_type
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @returns {number}
 */
export function _C_Login(h_session, user_type, p_pin, ul_pin_len) {
    const ret = wasm._C_Login(h_session, user_type, p_pin, ul_pin_len);
    return ret >>> 0;
}

/**
 * PKCS#11 v3.0+ §5.6 — C_Login with a username. This single-user token
 * accepts only an empty username (delegates to C_Login); anything else is
 * CKR_OPERATION_NOT_SUPPORTED... which v3.2 spells CKR_FUNCTION_NOT_SUPPORTED
 * for an unsupported variant.
 * @param {number} h_session
 * @param {number} user_type
 * @param {number} p_pin
 * @param {number} ul_pin_len
 * @param {number} _p_username
 * @param {number} _ul_username_len
 * @returns {number}
 */
export function _C_LoginUser(h_session, user_type, p_pin, ul_pin_len, _p_username, _ul_username_len) {
    const ret = wasm._C_LoginUser(h_session, user_type, p_pin, ul_pin_len, _p_username, _ul_username_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_Logout(h_session) {
    const ret = wasm._C_Logout(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageDecryptFinal(h_session) {
    const ret = wasm._C_MessageDecryptFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageDecryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageDecryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageEncryptFinal(h_session) {
    const ret = wasm._C_MessageEncryptFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageEncryptInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageEncryptInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageSignFinal(h_session) {
    const ret = wasm._C_MessageSignFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageSignInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageSignInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_MessageVerifyFinal(h_session) {
    const ret = wasm._C_MessageVerifyFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_MessageVerifyInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_MessageVerifyInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} slot_id
 * @param {number} flags
 * @param {number} _p_application
 * @param {number} _notify
 * @param {number} ph_session
 * @returns {number}
 */
export function _C_OpenSession(slot_id, flags, _p_application, _notify, ph_session) {
    const ret = wasm._C_OpenSession(slot_id, flags, _p_application, _notify, ph_session);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_seed
 * @param {number} _ul_seed_len
 * @returns {number}
 */
export function _C_SeedRandom(_h_session, _p_seed, _ul_seed_len) {
    const ret = wasm._C_SeedRandom(_h_session, _p_seed, _ul_seed_len);
    return ret >>> 0;
}

/**
 * PKCS#11 v3.0+ §5.6 — cancel active operations selected by `flags`
 * (CKF_ENCRYPT 0x100, CKF_DECRYPT 0x200, CKF_DIGEST 0x400, CKF_SIGN 0x800,
 * CKF_VERIFY 0x2000, CKF_FIND_OBJECTS 0x40, CKF_MESSAGE_ENCRYPT 0x2,
 * CKF_MESSAGE_DECRYPT 0x4, CKF_MESSAGE_SIGN 0x8, CKF_MESSAGE_VERIFY 0x10).
 * flags == 0 cancels nothing.
 * @param {number} h_session
 * @param {number} flags
 * @returns {number}
 */
export function _C_SessionCancel(h_session, flags) {
    const ret = wasm._C_SessionCancel(h_session, flags);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} h_object
 * @param {number} p_template
 * @param {number} ul_count
 * @returns {number}
 */
export function _C_SetAttributeValue(h_session, h_object, p_template, ul_count) {
    const ret = wasm._C_SetAttributeValue(h_session, h_object, p_template, ul_count);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} _p_operation_state
 * @param {number} _ul_operation_state_len
 * @param {number} _h_encryption_key
 * @param {number} _h_authentication_key
 * @returns {number}
 */
export function _C_SetOperationState(_h_session, _p_operation_state, _ul_operation_state_len, _h_encryption_key, _h_authentication_key) {
    const ret = wasm._C_SetOperationState(_h_session, _p_operation_state, _ul_operation_state_len, _h_encryption_key, _h_authentication_key);
    return ret >>> 0;
}

/**
 * PKCS#11 v3.2 §5.6.7 — C_SetPIN rotates the PIN of the user that is
 * currently logged in (SO session → SO PIN; user session OR public session →
 * the normal user PIN, per the spec's session-state table). Works only from
 * a R/W session; the old PIN is verified against the stored PBKDF2 hash and
 * the new PIN is re-salted and re-hashed (`state::hash_pin`).
 * @param {number} h_session
 * @param {number} p_old_pin
 * @param {number} ul_old_len
 * @param {number} p_new_pin
 * @param {number} ul_new_len
 * @returns {number}
 */
export function _C_SetPIN(h_session, p_old_pin, ul_old_len, p_new_pin, ul_new_len) {
    const ret = wasm._C_SetPIN(h_session, p_old_pin, ul_old_len, p_new_pin, ul_new_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_Sign(h_session, p_data, ul_data_len, p_signature, pul_signature_len) {
    const ret = wasm._C_Sign(h_session, p_data, ul_data_len, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @param {number} p_encrypted_part
 * @param {number} pul_encrypted_part_len
 * @returns {number}
 */
export function _C_SignEncryptUpdate(h_session, p_part, ul_part_len, p_encrypted_part, pul_encrypted_part_len) {
    const ret = wasm._C_SignEncryptUpdate(h_session, p_part, ul_part_len, p_encrypted_part, pul_encrypted_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_SignFinal(h_session, p_signature, pul_signature_len) {
    const ret = wasm._C_SignFinal(h_session, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_SignInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_SignInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_SignMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, pul_signature_len) {
    const ret = wasm._C_SignMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * §5.14 — start one multipart message inside an active message-sign op.
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @returns {number}
 */
export function _C_SignMessageBegin(h_session, _p_param, _ul_param_len) {
    const ret = wasm._C_SignMessageBegin(h_session, _p_param, _ul_param_len);
    return ret >>> 0;
}

/**
 * §5.14 — feed a message part. `pulSignatureLen == NULL` marks a non-final
 * part; non-NULL marks the final part (then NULL `pSignature` is the §5.2
 * length query, which does not consume the accumulated message).
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} p_part
 * @param {number} ul_part_len
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_SignMessageNext(h_session, _p_param, _ul_param_len, p_part, ul_part_len, p_signature, pul_signature_len) {
    const ret = wasm._C_SignMessageNext(h_session, _p_param, _ul_param_len, p_part, ul_part_len, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} pul_signature_len
 * @returns {number}
 */
export function _C_SignRecover(h_session, p_data, ul_data_len, p_signature, pul_signature_len) {
    const ret = wasm._C_SignRecover(h_session, p_data, ul_data_len, p_signature, pul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_SignRecoverInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_SignRecoverInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @returns {number}
 */
export function _C_SignUpdate(h_session, p_part, ul_part_len) {
    const ret = wasm._C_SignUpdate(h_session, p_part, ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_unwrapping_key
 * @param {number} p_wrapped_key
 * @param {number} ul_wrapped_key_len
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_UnwrapKey(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, ph_key) {
    const ret = wasm._C_UnwrapKey(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_unwrapping_key
 * @param {number} p_wrapped_key
 * @param {number} ul_wrapped_key_len
 * @param {number} p_template
 * @param {number} ul_attribute_count
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @param {number} ph_key
 * @returns {number}
 */
export function _C_UnwrapKeyAuthenticated(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, p_associated_data, ul_associated_data_len, ph_key) {
    const ret = wasm._C_UnwrapKeyAuthenticated(_h_session, p_mechanism, h_unwrapping_key, p_wrapped_key, ul_wrapped_key_len, p_template, ul_attribute_count, p_associated_data, ul_associated_data_len, ph_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_Verify(h_session, p_data, ul_data_len, p_signature, ul_signature_len) {
    const ret = wasm._C_Verify(h_session, p_data, ul_data_len, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_VerifyFinal(h_session, p_signature, ul_signature_len) {
    const ret = wasm._C_VerifyFinal(h_session, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_VerifyInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_VerifyInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} p_data
 * @param {number} ul_data_len
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_VerifyMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, ul_signature_len) {
    const ret = wasm._C_VerifyMessage(h_session, _p_param, _ul_param_len, p_data, ul_data_len, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * §5.15 — start one multipart message inside an active message-verify op.
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @returns {number}
 */
export function _C_VerifyMessageBegin(h_session, _p_param, _ul_param_len) {
    const ret = wasm._C_VerifyMessageBegin(h_session, _p_param, _ul_param_len);
    return ret >>> 0;
}

/**
 * §5.15 — feed a message part. NULL `pSignature` marks a non-final part;
 * non-NULL carries the signature and finalizes the message.
 * @param {number} h_session
 * @param {number} _p_param
 * @param {number} _ul_param_len
 * @param {number} p_part
 * @param {number} ul_part_len
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_VerifyMessageNext(h_session, _p_param, _ul_param_len, p_part, ul_part_len, p_signature, ul_signature_len) {
    const ret = wasm._C_VerifyMessageNext(h_session, _p_param, _ul_param_len, p_part, ul_part_len, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @param {number} p_data
 * @param {number} pul_data_len
 * @returns {number}
 */
export function _C_VerifyRecover(h_session, p_signature, ul_signature_len, p_data, pul_data_len) {
    const ret = wasm._C_VerifyRecover(h_session, p_signature, ul_signature_len, p_data, pul_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @returns {number}
 */
export function _C_VerifyRecoverInit(h_session, p_mechanism, h_key) {
    const ret = wasm._C_VerifyRecoverInit(h_session, p_mechanism, h_key);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_data
 * @param {number} ul_data_len
 * @returns {number}
 */
export function _C_VerifySignature(h_session, p_data, ul_data_len) {
    const ret = wasm._C_VerifySignature(h_session, p_data, ul_data_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @returns {number}
 */
export function _C_VerifySignatureFinal(h_session) {
    const ret = wasm._C_VerifySignatureFinal(h_session);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_mechanism
 * @param {number} h_key
 * @param {number} p_signature
 * @param {number} ul_signature_len
 * @returns {number}
 */
export function _C_VerifySignatureInit(h_session, p_mechanism, h_key, p_signature, ul_signature_len) {
    const ret = wasm._C_VerifySignatureInit(h_session, p_mechanism, h_key, p_signature, ul_signature_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @returns {number}
 */
export function _C_VerifySignatureUpdate(h_session, p_part, ul_part_len) {
    const ret = wasm._C_VerifySignatureUpdate(h_session, p_part, ul_part_len);
    return ret >>> 0;
}

/**
 * @param {number} h_session
 * @param {number} p_part
 * @param {number} ul_part_len
 * @returns {number}
 */
export function _C_VerifyUpdate(h_session, p_part, ul_part_len) {
    const ret = wasm._C_VerifyUpdate(h_session, p_part, ul_part_len);
    return ret >>> 0;
}

/**
 * §5.5 — no slot events exist on this soft token. Non-blocking poll gets
 * CKR_NO_EVENT; a blocking wait would never return, so refuse it.
 * @param {number} flags
 * @param {number} _p_slot
 * @param {number} _p_reserved
 * @returns {number}
 */
export function _C_WaitForSlotEvent(flags, _p_slot, _p_reserved) {
    const ret = wasm._C_WaitForSlotEvent(flags, _p_slot, _p_reserved);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_wrapping_key
 * @param {number} h_key
 * @param {number} p_wrapped_key
 * @param {number} pul_wrapped_key_len
 * @returns {number}
 */
export function _C_WrapKey(_h_session, p_mechanism, h_wrapping_key, h_key, p_wrapped_key, pul_wrapped_key_len) {
    const ret = wasm._C_WrapKey(_h_session, p_mechanism, h_wrapping_key, h_key, p_wrapped_key, pul_wrapped_key_len);
    return ret >>> 0;
}

/**
 * @param {number} _h_session
 * @param {number} p_mechanism
 * @param {number} h_wrapping_key
 * @param {number} h_key
 * @param {number} p_associated_data
 * @param {number} ul_associated_data_len
 * @param {number} p_wrapped_key
 * @param {number} pul_wrapped_key_len
 * @returns {number}
 */
export function _C_WrapKeyAuthenticated(_h_session, p_mechanism, h_wrapping_key, h_key, p_associated_data, ul_associated_data_len, p_wrapped_key, pul_wrapped_key_len) {
    const ret = wasm._C_WrapKeyAuthenticated(_h_session, p_mechanism, h_wrapping_key, h_key, p_associated_data, ul_associated_data_len, p_wrapped_key, pul_wrapped_key_len);
    return ret >>> 0;
}

/**
 * @param {number} ptr
 * @param {number} _js_size
 */
export function _free(ptr, _js_size) {
    wasm._free(ptr, _js_size);
}

/**
 * @param {number} size
 * @returns {number}
 */
export function _malloc(size) {
    const ret = wasm._malloc(size);
    return ret >>> 0;
}

/**
 * @param {number} seed_ptr
 * @param {number} seed_len
 */
export function _set_kat_seed(seed_ptr, seed_len) {
    wasm._set_kat_seed(seed_ptr, seed_len);
}

/**
 * Decode any KMIP TTLV frame (request or response wire bytes) to a JSON tree
 * the UI renders as the "wire view" and turns into plain English. Free
 * function — does not need an engine instance.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function decode_ttlv(bytes) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.decode_ttlv(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

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
 * @param {string} tree_json
 * @returns {Uint8Array}
 */
export function encode_ttlv(tree_json) {
    const ptr0 = passStringToWasm0(tree_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.encode_ttlv(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

export function wasm_start() {
    wasm.wasm_start();
}
export function __wbg_Error_2e59b1b37a9a34c3(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return ret;
}
export function __wbg___wbindgen_is_function_49868bde5eb1e745(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
}
export function __wbg___wbindgen_is_object_40c5a80572e8f9d3(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
}
export function __wbg___wbindgen_is_string_b29b5c5a8065ba1a(arg0) {
    const ret = typeof(arg0) === 'string';
    return ret;
}
export function __wbg___wbindgen_is_undefined_c0cca72b82b86f4d(arg0) {
    const ret = arg0 === undefined;
    return ret;
}
export function __wbg___wbindgen_throw_81fc77679af83bc6(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbg_call_d578befcc3145dee() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments); }
export function __wbg_crypto_38df2bab126b63dc(arg0) {
    const ret = arg0.crypto;
    return ret;
}
export function __wbg_error_a6fa202b58aa1cd3(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
}
export function __wbg_getRandomValues_a697888e9ba1eee3() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments); }
export function __wbg_getRandomValues_c44a50d8cfdaebeb() { return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
}, arguments); }
export function __wbg_getRandomValues_cc7f052a444bb2ce() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments); }
export function __wbg_getTime_f6ac312467f7cf09(arg0) {
    const ret = arg0.getTime();
    return ret;
}
export function __wbg_length_0c32cb8543c8e4c8(arg0) {
    const ret = arg0.length;
    return ret;
}
export function __wbg_msCrypto_bd5a034af96bcba6(arg0) {
    const ret = arg0.msCrypto;
    return ret;
}
export function __wbg_new_0_bfa2ef4bc447daa2() {
    const ret = new Date();
    return ret;
}
export function __wbg_new_227d7c05414eb861() {
    const ret = new Error();
    return ret;
}
export function __wbg_new_from_slice_2580ff33d0d10520(arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
    return ret;
}
export function __wbg_new_with_length_9cedd08484b73942(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return ret;
}
export function __wbg_node_84ea875411254db1(arg0) {
    const ret = arg0.node;
    return ret;
}
export function __wbg_process_44c7a14e11e9f69e(arg0) {
    const ret = arg0.process;
    return ret;
}
export function __wbg_prototypesetcall_3e05eb9545565046(arg0, arg1, arg2) {
    Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
}
export function __wbg_randomFillSync_6c25eac9869eb53c() { return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
}, arguments); }
export function __wbg_require_b4edbdcf3e2a1ef0() { return handleError(function () {
    const ret = module.require;
    return ret;
}, arguments); }
export function __wbg_stack_3b0d974bbf31e44f(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
export function __wbg_static_accessor_GLOBAL_THIS_a1248013d790bf5f() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_GLOBAL_f2e0f995a21329ff() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_SELF_24f78b6d23f286ea() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_WINDOW_59fd959c540fe405() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_subarray_0f98d3fb634508ad(arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
    return ret;
}
export function __wbg_versions_276b2795b1c6a219(arg0) {
    const ret = arg0.versions;
    return ret;
}
export function __wbindgen_cast_0000000000000001(arg0, arg1) {
    // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
    const ret = getArrayU8FromWasm0(arg0, arg1);
    return ret;
}
export function __wbindgen_cast_0000000000000002(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
}
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
}
const KmipPlaygroundFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_kmipplayground_free(ptr >>> 0, 1));
const SoftHsmRustFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_softhsmrust_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
