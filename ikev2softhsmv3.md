# IKEv2 Crypto Operations — softhsmv3 PKCS#11 Replacement Analysis

## Current State

IKE_SA fully established in browser (strongSwan 6.0.5 charon WASM, 4 packets, PSK auth).
All crypto runs through strongSwan software plugins (openssl, aes, sha2, hmac, random).
softhsmv3 is statically linked and generates keys, but is NOT used for IKE crypto.
PKCS#11 log panel is empty — no real C_Sign, C_Encrypt, C_Digest calls during handshake.

**Selected Proposal:** `IKE:AES_CBC_128/HMAC_SHA2_256_128/PRF_HMAC_SHA2_256/ECP_256`

## strongSwan pkcs11 Plugin Limitation

strongSwan's pkcs11 plugin only implements **4 of 7 crypto categories**. This is by design —
real HSMs don't expose bulk symmetric crypto through PKCS#11 either.

| Crypto Category            | pkcs11 plugin provides?  | Config flag        | Notes                                |
| -------------------------- | ------------------------ | ------------------ | ------------------------------------ |
| **HASHER** (SHA-256)       | YES                      | `use_hasher = yes` | C_DigestInit/C_Digest                |
| **RNG** (random bytes)     | YES                      | `use_rng = yes`    | C_GenerateRandom                     |
| **KE/DH** (ECDH, MODP)     | YES                      | `use_dh = yes`     | C_GenerateKeyPair + C_DeriveKey      |
| **PRIVKEY** (sign/decrypt) | YES                      | always             | C_SignInit/C_Sign (pubkey auth only) |
| **PRF** (HMAC-SHA-256)     | **NO — not implemented** | —                  | Permanently software-only            |
| **SIGNER/MAC** (HMAC)      | **NO — not implemented** | —                  | Permanently software-only            |
| **CRYPTER** (AES-CBC)      | **NO — not implemented** | —                  | Permanently software-only            |

## Crypto Operation Mapping (13 operations)

| #   | IKE Phase   | Operation                                               | Current Engine        | PKCS#11 Mechanism                         | pkcs11 plugin routes? | softhsmv3 supports? | Config Location            |
| --- | ----------- | ------------------------------------------------------- | --------------------- | ----------------------------------------- | --------------------- | ------------------- | -------------------------- |
| 1   | IKE_SA_INIT | Nonce generation (Ni/Nr, 32 bytes)                      | `random` plugin       | `C_GenerateRandom`                        | **YES** (use_rng)     | Yes                 | strongswan.conf            |
| 2   | IKE_SA_INIT | ECDH key pair gen (ECP-256)                             | `openssl` plugin      | `CKM_EC_KEY_PAIR_GEN`                     | **YES** (use_dh)      | Yes                 | IKE proposal in charon.c   |
| 3   | IKE_SA_INIT | ECDH shared secret derivation                           | `openssl` plugin      | `CKM_ECDH1_DERIVE`                        | **YES** (use_dh)      | Yes                 | Same proposal              |
| 4   | IKE_SA_INIT | SKEYSEED = PRF(Ni\|Nr, secret)                          | `hmac`+`sha2` plugins | `CKM_SHA256_HMAC`                         | NO (no PRF)           | Yes                 | PRF in SA proposal         |
| 5   | IKE_SA_INIT | SK_d\|SK_ai\|SK_ar\|SK_ei\|SK_er\|SK_pi\|SK_pr via PRF+ | `hmac`+`sha2` plugins | `CKM_SHA256_HMAC` (iterative)             | NO (no PRF)           | Yes                 | Same PRF                   |
| 6   | IKE_SA_INIT | NAT detection hash (SHA-256)                            | `sha2` plugin         | `CKM_SHA256`                              | **YES** (use_hasher)  | Yes                 | Hardcoded in IKE           |
| 7   | IKE_AUTH    | IV generation (16 bytes for AES-CBC)                    | `random` plugin       | `C_GenerateRandom`                        | **YES** (use_rng)     | Yes                 | strongswan.conf            |
| 8   | IKE_AUTH    | AES-CBC-128 encrypt (IKE_AUTH payload)                  | `aes` plugin          | `CKM_AES_CBC_PAD`                         | NO (no CRYPTER)       | Yes                 | ENCR proposal              |
| 9   | IKE_AUTH    | HMAC-SHA2-256-128 integrity tag                         | `hmac`+`sha2` plugins | `CKM_SHA256_HMAC` (truncated to 128 bits) | NO (no SIGNER)        | Yes                 | AUTH proposal              |
| 10  | IKE_AUTH    | PSK AUTH payload computation                            | `hmac`+`sha2` plugins | `CKM_SHA256_HMAC`                         | NO (no PRF)           | Yes                 | AUTH_CLASS_PSK in charon.c |
| 11  | IKE_AUTH    | PSK AUTH verification                                   | `hmac`+`sha2` plugins | `CKM_SHA256_HMAC`                         | NO (no PRF)           | Yes                 | Same                       |
| 12  | IKE_AUTH    | AES-CBC-128 decrypt (received payload)                  | `aes` plugin          | `CKM_AES_CBC_PAD`                         | NO (no CRYPTER)       | Yes                 | Same ENCR proposal         |
| 13  | IKE_AUTH    | HMAC integrity verify (received)                        | `hmac`+`sha2` plugins | `CKM_SHA256_HMAC`                         | NO (no SIGNER)        | Yes                 | Same AUTH proposal         |

**Summary: 4 of 13 IKE operations can route through PKCS#11 (#1, #2, #3, #6, #7). The remaining 9 must use software plugins.** This matches how real HSM deployments work — HSMs handle key exchange and signing, software handles bulk crypto.

## Config File Locations

| Config                  | File                                           | Parameter                                                                   |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Plugin load list        | `VpnSimulationPanel.tsx:114` → strongswan.conf | `charon.load = openssl random nonce aes sha1 sha2 hmac pkcs11`              |
| PKCS#11 module path     | `VpnSimulationPanel.tsx:121` → strongswan.conf | `plugins.pkcs11.modules.softhsm.path = libsofthsmv3.so`                     |
| PKCS#11 use_hasher      | `VpnSimulationPanel.tsx:118` → strongswan.conf | `plugins.pkcs11.use_hasher = yes`                                           |
| PKCS#11 use_rng         | `VpnSimulationPanel.tsx:119` → strongswan.conf | `plugins.pkcs11.use_rng = yes`                                              |
| IKE proposal            | `charon.c:115`                                 | `proposal_create_default(PROTO_IKE)` — auto-selects from registered plugins |
| Auth mode               | `charon.c:130`                                 | `AUTH_RULE_AUTH_CLASS, AUTH_CLASS_PSK`                                      |
| PSK value               | `charon.c`                                     | `getenv("WASM_PSK")` → set via worker ENV from bridge `pskOpts`             |
| Initiator/Responder IPs | `charon.c:103-104`                             | `192.168.0.1` / `192.168.0.2`                                               |
| Identities              | `charon.c:131-141`                             | `initiator@pqc.wasm` / `responder@pqc.wasm`                                 |

## Plan: Route IKE Crypto Through softhsmv3

### Problem

softhsmv3 is statically linked into charon WASM. When the `pkcs11` plugin calls `C_GetFunctionList`,
it gets the static softhsmv3 function table (patched in `pkcs11_library.c` with `SOFTHSM_STATIC_LINKED`).
These PKCS#11 calls happen entirely in C — they never cross to JS, so the PKCS#11 log panel stays empty.

### Approach: C-side EM_ASM logging in pkcs11 wrapper

Add `EM_ASM` logging calls in strongSwan's `pkcs11_library.c` wrapper so every PKCS#11 operation
posts a message to JS that the log panel can display:

```c
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define PKCS11_LOG(fmt, ...) EM_ASM({ \
    var msg = UTF8ToString($0); \
    postMessage({type:'LOG', payload:{level:'info', text:msg}}); \
}, fmt_buf)
#endif
```

This gives real logs from real softhsmv3 calls — not fake/synthetic.

### Steps

1. Enable `use_dh = yes` in pkcs11 config to route ECDH through PKCS#11
2. Add EM_ASM logging to `pkcs11_library.c` for key operations (C_DigestInit, C_Digest, C_GenerateRandom, C_GenerateKeyPair, C_DeriveKey, C_Sign, C_Verify, C_EncryptInit, C_Encrypt, C_DecryptInit, C_Decrypt)
3. Remove software plugins from load list to force PKCS#11 path where possible
4. Rebuild WASM + deploy

### Integration Notes

- **PRF+ iteration**: strongSwan calls HMAC-SHA-256 multiple times to derive key material. Each call becomes a C_SignInit + C_Sign through PKCS#11.
- **HMAC truncation**: `HMAC_SHA2_256_128` computes full 256-bit HMAC, strongSwan truncates to 128 bits. softhsmv3 returns full output.
- **Session isolation**: Each worker's PKCS#11 operations run in the same process (statically linked). Both use the same softhsmv3 instance. Session handles must not collide between initiator and responder slots.
- **ECDH curve**: Must be P-256 (OID 1.2.840.10045.3.1.1). softhsmv3 Rust engine detects curve from EC parameter in private key object.

### Verification

1. Start daemon → PKCS#11 log panel shows real C_DigestInit, C_Digest, C_GenerateRandom, C_DeriveKey calls
2. IKE_SA still establishes successfully (4 packets, PSK auth)
3. Every log entry corresponds to a real softhsmv3 PKCS#11 call — no synthetic/fake entries
