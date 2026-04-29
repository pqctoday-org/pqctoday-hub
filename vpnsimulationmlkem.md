# VPN Simulator — ML-KEM-768 IKEv2 Key Exchange Implementation Spec

> Source: currently working code on `main`. Verified end-to-end in browser WASM April 2026.

## Context

This spec captures the **currently working** ML-KEM-768 IKEv2 key-exchange implementation. Source of truth:

- The panel's RPC dispatcher in `VpnSimulationPanel.tsx` (cases 59, 68, 69, 92, 93)
- The strongswan-pkcs11 plugin patches in `~/antigravity/pqctoday-hsm/strongswan-pkcs11/pkcs11_kem.c`
- softhsmv3 patches in `~/antigravity/pqctoday-hsm/src/lib/SoftHSM_kem.cpp`

This is the **same panel-side softhsmv3 + SAB-RPC architecture** described in [`vpnsimulationmldsa.md`](./vpnsimulationmldsa.md). All ML-KEM operations charon issues are round-tripped through the panel's softhsm via SharedArrayBuffer.

---

## Mode Selection

The VPN simulator UI lets the user pick:

- `classical` — `aes256-sha256-modp3072!` (no PQC)
- `pure-pqc` — `aes256-sha384-mlkem768!` (ML-KEM-768 only, IKE_SA_INIT)
- `hybrid` — `aes256-sha384-mlkem768-ke1_ecp256!` (ML-KEM in IKE_SA_INIT, then ECP-256 in IKE_INTERMEDIATE per RFC 9242 / 9370)

`proposalMode` is threaded from the panel through `bridge.ts:init()` → worker → `_wasm_set_proposal_mode(N)` before `_main()`.

| `proposalMode` | Meaning                                       |
| -------------- | --------------------------------------------- |
| `0`            | classical (modp3072) — no ML-KEM              |
| `1`            | pure-pqc / hybrid — ML-KEM-768 in IKE_SA_INIT |

---

## End-to-End Flow

### Step 1 — IKE_SA_INIT (initiator, ML-KEM keypair gen)

Charon's `pkcs11_kem.c` in the initiator worker calls:

- `C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN, pubTpl={CKA_DERIVE=TRUE, CKA_ENCAPSULATE=TRUE}, prvTpl={CKA_DERIVE=TRUE, CKA_DECAPSULATE=TRUE})`

The call lands in panel RPC dispatcher **case 59** (`VpnSimulationPanel.tsx:1583`). The panel:

1. Detects `mech == 0x0F` (ML-KEM keypair gen)
2. **Injects `CKA_PARAMETER_SET = CKP_ML_KEM_768 (2)` into the public key template** — charon doesn't supply this; panel adds it because softhsmv3 requires it under the `ck3` flag (MUST be in generate template, `OBJECT_OP_GENERATE`).
3. Calls `M._C_GenerateKeyPair(...)` against the panel's softhsm
4. Surfaces `{pubHandle, prvHandle}` back into the SAB payload
5. Adds keys to `HsmKeyInspector` panel as `ML-KEM-768 Public/Private Key`

**Critical strongswan-pkcs11 patch** (`pkcs11_kem.c`):

```c
// Public key import template MUST include CKA_ENCAPSULATE = TRUE
// Private key gen template MUST include CKA_DECAPSULATE = TRUE
// Without these, C_EncapsulateKey/DecapsulateKey reject the handle
```

### Step 2 — Initiator sends KE payload

Charon serializes the public key bytes (via `C_GetAttributeValue(CKA_VALUE)`) into the IKE KE payload (group `MLKEM768`, charon group ID matches RFC draft). Sent over SAB-routed UDP loopback to the responder worker.

### Step 3 — Responder imports initiator pubkey + encapsulates

Responder charon:

1. `C_CreateObject` for the initiator's pubkey — lands in panel **case 30** (RPC dispatcher) which adds `CKA_ENCAPSULATE = TRUE` and writes via `M._C_CreateObject`
2. `C_EncapsulateKey(CKM_ML_KEM, hPubKey, ...)` — lands in panel **case 92** (PKCS#11 v3.0 cmdId) or **case 68** (newer dispatch)

### Step 4 — `C_EncapsulateKey` (the critical 8-arg call)

Panel **case 68** (`VpnSimulationPanel.tsx:1751`):

```ts
// softhsmv3 PKCS#11 v3.2: 8 parameters
//   (hSess, pMech, hPubKey, pTemplate, ulAttrCount,
//    pCiphertext, pulCtLen, phKey)
M._C_EncapsulateKey(
  hSess,
  mechPtr,
  hPubKey,
  kemTmpl.tpl,
  kemTmpl.count,
  ctBufPtr,
  ctLenPtr,
  hSecretKeyPtr
)
```

Where `kemTmpl` is built by the helper `buildKemSecretKeyTmpl(M)` at `VpnSimulationPanel.tsx:198`:

```ts
// 2-attribute template required by softhsmv3:
//   CKA_VALUE_LEN  = 32   (ML-KEM-768 shared secret = 32 bytes;
//                          required by ck3 OBJECT_OP_GENERATE)
//   CKA_EXTRACTABLE = TRUE (P11AttrExtractable::setDefault() = FALSE,
//                           so we MUST override; otherwise the resulting
//                           secret-key handle is unreadable)
const tmpl = M._malloc(24) // 2 × CK_ATTRIBUTE (12 bytes each)
M.setValue(tmpl + 0, 0x161, 'i32') // CKA_VALUE_LEN
M.setValue(tmpl + 4, pValLen, 'i32') // → 32
M.setValue(tmpl + 8, 4, 'i32')
M.setValue(tmpl + 12, 0x162, 'i32') // CKA_EXTRACTABLE
M.setValue(tmpl + 16, bTrue, 'i32') // → 1
M.setValue(tmpl + 20, 1, 'i32')
```

The shared secret is created as a `CKK_GENERIC_SECRET` softhsm object; `hSecretKeyPtr` returns its handle.

### Step 5 — Size query path (must pass non-NULL phKey)

When charon queries the ciphertext length first (`pCiphertext = NULL`), softhsmv3 still validates `phKey != NULL_PTR` (`SoftHSM_kem.cpp:126`). Panel sends a `dummyKeyPtr` allocation even on the size-query call:

```ts
const dummyKeyPtr68 = M._malloc(4) // phKey must be non-NULL even for size query
M._C_EncapsulateKey(
  hSess68,
  mechPtr68,
  hKey68,
  0,
  0, // pTemplate=NULL, ulAttrCount=0
  0, // pCiphertext=NULL
  ctLenPtr,
  dummyKeyPtr68 // phKey ≠ NULL even though we don't use it
)
```

### Step 6 — Responder sends ciphertext to initiator

Responder pulls the ciphertext bytes out of `ctBufPtr` and packs them into the response IKE KE payload. Routed back through SAB.

### Step 7 — Initiator decapsulates (case 69)

Initiator charon:

1. `C_DecapsulateKey(CKM_ML_KEM, hPrvKey, ciphertext, ctLen, ...)` — panel **case 69** (`VpnSimulationPanel.tsx:1825`)

```ts
// 8-param softhsmv3 v3.2 dispatch
M._C_DecapsulateKey(
  hSess,
  mechPtr,
  hPrvKey,
  kemTmpl.tpl,
  kemTmpl.count,
  ctBufPtr,
  ctLen,
  hSecretKeyPtr
)
```

Same 2-attribute template. Returns a handle to the decapsulated 32-byte shared secret.

### Step 8 — SKEYSEED derivation

Both sides now hold a `CKK_GENERIC_SECRET` handle. Because the secret was created with `CKA_SENSITIVE = FALSE` and `CKA_EXTRACTABLE = TRUE`, charon reads the plaintext shared secret via `C_GetAttributeValue(CKA_VALUE)` and feeds it into the IKE SKEYSEED HKDF. The panel logs both initiator and responder secrets so the user can see they match.

### Step 9 — Hybrid mode IKE_INTERMEDIATE

When `mode === 'hybrid'`, charon (RFC 9242) inserts an IKE_INTERMEDIATE exchange after IKE_SA_INIT to negotiate the secondary KE (ECP-256). Panel handles this via the standard `C_DeriveKey` ECDH path (case 91 — ECDH shared secret) using openssl plugin's group ECP_256.

### Step 10 — IKE_AUTH

Once both shared secrets are mixed into SKEYSEED, charon proceeds to IKE_AUTH:

- `pure-pqc` + `psk` mode (current default): PSK auth, IKE_SA reaches `ESTABLISHED`
- `dual` mode: ML-DSA cert auth (see [`vpnsimulationmldsa.md`](./vpnsimulationmldsa.md))

---

## Critical Fixes Recap (in chronological order)

These were all required to make ML-KEM work; recorded in the project memory `project-mlkem-ike-handshake.md`:

1. **`pkcs11_kem.c` — pubkey import template**: add `CKA_ENCAPSULATE=TRUE`
2. **`pkcs11_kem.c` — private gen template**: add `CKA_DECAPSULATE=TRUE`
3. **Panel cases 92/93/68/69**: 6-arg → 8-arg `C_EncapsulateKey`/`C_DecapsulateKey` (PKCS#11 v3.2 signature change)
4. **Size-query phKey guard**: `SoftHSM_kem.cpp:126` requires `phKey != NULL_PTR` even on size-query path. Panel passes a dummy non-NULL pointer.
5. **`CKA_VALUE_LEN = 32`**: required by `ck3` flag for `OBJECT_OP_GENERATE` of `CKK_GENERIC_SECRET`. ML-KEM-768 shared secret is 32 bytes.
6. **`CKA_EXTRACTABLE = TRUE`**: `P11AttrExtractable::setDefault()` sets `FALSE`. Panel must override; otherwise the secret can't be read out for SKEYSEED.
7. **Rust softhsm fallback regression**: `getSoftHSMRustModule()` fails in browser RPC context (wasm-bindgen env checks) and lacks `'i8'` in `setValue`. Both fallback sites must use `getSoftHSMCppModule()`.
8. **`C_EncapsulateKey` fall-through bug** (softhsmv3 commit `f001794`): `SoftHSM_kem.cpp` switch-case for `CKA_CLASS`/`TOKEN`/`PRIVATE`/`KEY_TYPE` fell through to `case CKA_VALUE: return CKR_ATTRIBUTE_VALUE_INVALID`. Any template containing those attrs returned `0x13`. Fixed by adding `continue` before `case CKA_VALUE`.

---

## Critical Files

| File                                                             | Role                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/components/Playground/hsm/VpnSimulationPanel.tsx:198–215`   | `buildKemSecretKeyTmpl` — 2-attr template for ML-KEM secret keys            |
| `src/components/Playground/hsm/VpnSimulationPanel.tsx:1583–1750` | RPC case 59 — `C_GenerateKeyPair` with ML-KEM `CKA_PARAMETER_SET` injection |
| `src/components/Playground/hsm/VpnSimulationPanel.tsx:1751–1822` | RPC case 68 — `C_EncapsulateKey` (size + exec)                              |
| `src/components/Playground/hsm/VpnSimulationPanel.tsx:1824–1870` | RPC case 69 — `C_DecapsulateKey`                                            |
| `src/components/Playground/hsm/VpnSimulationPanel.tsx:2041–2150` | RPC case 92 — `C_EncapsulateKey` (PKCS#11 v3.0 cmdId, redundant alias)      |
| `src/wasm/strongswan/bridge.ts:391–451`                          | `setKeySpec` + `init({ proposalMode })` — threads mode to workers           |
| `public/wasm/strongswan_worker.js:79–83`                         | Calls `_wasm_set_proposal_mode(N)` before `_main()`                         |
| `~/antigravity/pqctoday-hsm/strongswan-pkcs11/pkcs11_kem.c`      | `CKA_ENCAPSULATE`/`CKA_DECAPSULATE` template patches                        |
| `~/antigravity/pqctoday-hsm/src/lib/SoftHSM_kem.cpp`             | softhsm KEM impl; size-query phKey guard, `f001794` fall-through fix        |

---

## Mechanism / Constant Reference

| Symbol                        | Value           | Notes                                      |
| ----------------------------- | --------------- | ------------------------------------------ |
| `CKM_ML_KEM_KEY_PAIR_GEN`     | `0x0000000F`    | softhsmv3 vendor numeric                   |
| `CKM_ML_KEM`                  | `0x00000017`    | softhsmv3 vendor numeric                   |
| `CKK_ML_KEM`                  | (per softhsmv3) | key type for ML-KEM keys                   |
| `CKP_ML_KEM_768`              | `2`             | parameter-set selector for ML-KEM-768      |
| `CKA_PARAMETER_SET`           | `0x0000061D`    | required in pub gen template               |
| `CKA_ENCAPSULATE`             | (per pkcs11.h)  | required TRUE on pub key                   |
| `CKA_DECAPSULATE`             | (per pkcs11.h)  | required TRUE on prv key                   |
| `CKA_VALUE_LEN`               | `0x00000161`    | required in secret-key gen template        |
| `CKA_EXTRACTABLE`             | `0x00000162`    | must be TRUE so charon can read the secret |
| ML-KEM-768 pubkey size        | 1184 bytes      |                                            |
| ML-KEM-768 ciphertext size    | 1088 bytes      |                                            |
| ML-KEM-768 shared secret size | 32 bytes        |                                            |

---

## Verification

```bash
# Run dev server
npm run dev

# Open VPN simulator with pure-pqc + PSK
open 'http://localhost:5175/playground/hsm?tab=vpn_sim&vpnMode=pure-pqc&vpnAuth=psk&vpnAutostart=1&vpnRpc=1'

# Expected logs in panel:
#   [RPC] C_GenerateKeyPair hSess=… mech=0xf → rv=0x0
#   [RPC] C_EncapsulateKey SizeQuery … → rv=0x0 len=1088
#   [RPC] C_EncapsulateKey Exec     … → rv=0x0 len=1088 secKey=…
#   [RPC] C_DecapsulateKey Exec     … → rv=0x0 secKey=…
#   [RPC] ML-KEM shared secret (32B): 0x… | FP: 0x…
#   ESTABLISHED

# Hybrid (ML-KEM + ECP-256 via IKE_INTERMEDIATE)
open 'http://localhost:5175/playground/hsm?tab=vpn_sim&vpnMode=hybrid&vpnAuth=psk&vpnAutostart=1&vpnRpc=1'

# E2E test (Playwright)
npx playwright test e2e/vpn-rust-module.spec.ts --project=chromium --grep "PSK"
```

Self-test selftest card (UI button "Run ML-DSA + ML-KEM selftest" — `VpnSimulationPanel.tsx:625`) verifies sizes match without running a full IKE handshake:

- ML-KEM pub size = 1184 bytes
- ML-KEM ct size = 1088 bytes

---

## Open Questions

None. This implementation is currently working in production. Spec is descriptive, not prescriptive.

---

## Cross-reference

ML-DSA cert auth (working state at commit `1ab19fa4`, before ML-KEM was wired) is documented in [`vpnsimulationmldsa.md`](./vpnsimulationmldsa.md). It uses the same panel-RPC softhsm architecture described here.
