# softhsmrustv3 — PKCS#11 v3.2 Conformance Report (Rust engine)

**Engine:** softhsmrustv3 (Rust), wasm32 build with `--features acvp`
**Harness:** `rust/test_p11_conformance.js` (table-driven negative-path + KAT
matrix asserting exact `CKR_*` codes in spec priority order §5.4/§5.12, plus
PQC keygen/param-set, SP800-108 KBKDF, and message-based-crypto checks).
**Engine commit:** `fc9d303dcbc9` · **Generated:** 2026-09-18T23:01:53.932Z — machine-written
by this harness itself (`writeReport()` in `test_p11_conformance.js`) at the
end of every run, not hand-edited.
**Regenerate:** `scripts/local-gate.sh --rust-p11` (see below), or manually:

```
docker exec pqc-rust bash -c 'cd /ag/pqctoday-hsm/rust && \
  RUSTFLAGS="-C link-arg=-zstack-size=2097152" \
  wasm-pack build --target bundler --out-dir pkg --dev -- --features acvp'
cd rust && node test_p11_conformance.js
```

## Result

**22 passed / 0 failed** across 3 sections in this JS harness.

## Sections covered

- R1.2 — initialization gate (§5.4/§5.6) (4 passed / 0 failed)
- Token init (fixture — before any session, §5.7 C_InitToken) (1 passed / 0 failed)
- Round-2 — SP800-108 CK_PRF_DATA_TYPE completeness (COUNTER, KEY_HANDLE, SUM_OF_SEGMENTS) (17 passed / 0 failed)

## Full transcript

```

── R1.2 — initialization gate (§5.4/§5.6) ──
  ✅ C_GetSlotList before C_Initialize → CRYPTOKI_NOT_INITIALIZED
  ✅ C_Finalize before C_Initialize → CRYPTOKI_NOT_INITIALIZED
  ✅ C_Initialize → OK
  ✅ double C_Initialize → CRYPTOKI_ALREADY_INITIALIZED

── Token init (fixture — before any session, §5.7 C_InitToken) ──
  ✅ C_InitToken → OK

── Round-2 — SP800-108 CK_PRF_DATA_TYPE completeness (COUNTER, KEY_HANDLE, SUM_OF_SEGMENTS) ──
  ✅ import secret key → OK
  ✅ Counter Mode + CK_SP800_108_COUNTER field → MECHANISM_PARAM_INVALID (Table 199)
  ✅ Feedback Mode without CK_SP800_108_COUNTER → OK
  ✅ Feedback Mode with CK_SP800_108_COUNTER → OK (Table 200)
  ✅ CK_SP800_108_COUNTER changes Feedback Mode output (not silently ignored)
  ✅ import secret key → OK
  ✅ import secret key → OK
  ✅ Counter Mode + CK_SP800_108_KEY_HANDLE → OK
  ✅ CK_SP800_108_KEY_HANDLE byte-equals Node-crypto reference (splices CKA_VALUE)
  ✅ CK_SP800_108_KEY_HANDLE with a different key → OK
  ✅ different KEY_HANDLE key values produce different derived output
  ✅ CK_SP800_108_KEY_HANDLE with a bogus handle → KEY_HANDLE_INVALID
  ✅ SUM_OF_KEYS DKM_LENGTH → OK
  ✅ SUM_OF_SEGMENTS DKM_LENGTH → OK
  ✅ SUM_OF_SEGMENTS output differs from SUM_OF_KEYS (L value actually rounds up)
  ✅ SUM_OF_KEYS byte-equals Node-crypto reference (L=160 bits)
  ✅ SUM_OF_SEGMENTS byte-equals Node-crypto reference (L=256 bits, rounded up)

════════ RESULT: 22 passed, 0 failed ════════
```
