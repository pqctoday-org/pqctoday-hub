# Combined Spec — ML-KEM + ML-DSA in the VPN Simulator

> Status: **Working end-to-end** as of pqctoday-hub `3.5.20` / pqctoday-hsm `v0.4.29`.
> Verified by [e2e/vpn-rust-module.spec.ts](e2e/vpn-rust-module.spec.ts): all 3 modes (classical / hybrid / pure-pqc) × ML-DSA dual auth reach ESTABLISHED.
>
> The canonical single-algorithm spec is [vpnsimulationmldsa.md](vpnsimulationmldsa.md). This file documents the combined flow only.

## What "combined" means

`mode=pure-pqc` + `auth=dual`:

- **IKE_SA_INIT**: ML-KEM-768 key exchange (replaces classical DH entirely)
- **IKE_AUTH**: ML-DSA-65 certificate authentication (replaces PSK or RSA cert)

Both run inside the same `strongswan.wasm` workers. No SAB-RPC panel detour for either algorithm. Everything is in-process.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Main thread (panel)                                               │
│                                                                    │
│  generateCertsViaWorker()                                          │
│   1. Pre-generate 20-byte CKA_IDs (BEFORE engine.init)            │
│   2. engine.init({phase:'spawn-only', authMode:'dual',             │
│                    keyIds:{initKeyId, respKeyId}})                 │
│   3. PANEL_PKCS11 RPC → per-worker in-process softhsm:            │
│        C_GetSlotList, C_OpenSession, C_Login,                      │
│        C_GenerateKeyPair_MLDSA(ckaId), C_GetAttributeValue,        │
│        C_Sign_MLDSA (for cert TBS)                                 │
│   4. WRITE_FILES → cert PEMs land in each worker's FS              │
│   5. engine.start() → START message launches charon                │
└──────────────────┬─────────────────────────────────────────────────┘
                   │ postMessage (worker bridge)
       ┌───────────┴────────────┐
       ▼                        ▼
┌───────────────┐         ┌───────────────┐
│ Worker A      │         │ Worker B      │
│ (initiator)   │         │ (responder)   │
│  charon       │         │  charon       │
│  softhsmv3    │         │  softhsmv3    │
│  (in-process  │         │  (in-process  │
│   statically  │         │   statically  │
│   linked)     │         │   linked)     │
│               │         │               │
│  ML-DSA keys  │         │  ML-DSA keys  │
│  (provisioned │         │  (provisioned │
│   via panel   │         │   via panel   │
│   PKCS11 RPC) │         │   PKCS11 RPC) │
└───────────────┘         └───────────────┘
       ▲                        ▲
       └────────── SAB ─────────┘
       (cross-worker UDP loopback for IKE packets)
```

**Key property**: each worker has its OWN softhsmv3 instance (statically linked). ML-DSA keys are provisioned into it by the panel via `PANEL_PKCS11` postMessage RPC. ML-KEM is generated entirely in-process by charon at IKE_SA_INIT time — no panel involvement.

## End-to-end flow

### Phase 1 — Cert provisioning (panel → workers, via PANEL_PKCS11 + WRITE_FILES)

See [vpnsimulationmldsa.md §2–3](vpnsimulationmldsa.md) for the full cert provisioning flow. Summary:

1. Panel pre-generates random 20-byte `initCkaId` and `respCkaId`.
2. Workers spawned in `phase:'spawn-only'` mode — `wasm_hsm_init(algType=2)` creates the token slot, no charon yet.
3. Panel drives per-worker PKCS#11 via `engine.pkcs11(role, op, args)`:
   - `C_GenerateKeyPair_MLDSA` with `ckaId` in both pub+priv templates
   - `C_GetAttributeValue(CKA_VALUE)` to extract pubkey bytes
   - `C_Sign_MLDSA` to sign the TBS certificate
4. Self-signed certs built panel-side with `SubjectKeyIdentifier = ckaId`.
5. `engine.writeFiles(role, { '/etc/ipsec.d/certs/...': pem })` writes cert PEMs into each worker's WASM FS.

### Phase 2 — Charon startup (per worker, via `wasm_setup_config`)

Triggered by `engine.start()` → START message → worker reads `WASM_LOCAL_KEYID` env var (hex of its own ckaId, set at INIT time from `options.keyIds`) → calls `_main()` → `wasm_setup_config` runs:

a. Loads own cert from `/etc/ipsec.d/certs/<role>.crt`.

b. Loads private key explicitly via `BUILD_PKCS11_KEYID` → `mem_cred->add_key`:

```c
private_key_t *priv = lib->creds->create(..., BUILD_PKCS11_KEYID, keyid_chunk, BUILD_END);
mem_cred->add_key(creds, priv);
lib->credmgr->add_set(lib->credmgr, &creds->set);
```

Required because `pkcs11_creds.c:241` wires `create_private_enumerator = enumerator_create_empty`.

c. Loads peer's cert as trust anchor via `mem_cred->add_cert(creds, TRUE, peer_cert)`.

d. Builds `auth_cfg` with `AUTH_CLASS_PUBKEY`, identity `ID_KEY_ID(@#<keyid_hex>)`, `CERT_ALWAYS_SEND`.

### Phase 3 — IKE_SA_INIT (ML-KEM-768)

Charon's `pkcs11_kem.c` in the initiator worker calls `C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN)` against its own in-process softhsmv3. No panel involvement, no SAB-RPC. Responder encapsulates, initiator decapsulates. Shared secret derives SKEYSEED.

This is the same flow as the PSK mode — ML-KEM has always been fully in-process. (Earlier plans described SAB-RPC for ML-KEM; that was a different and now-abandoned design.)

### Phase 4 — IKE_AUTH (ML-DSA-65 cert auth)

Standard charon pubkey auth flow, using the keys loaded in Phase 2:

```
INIT: C_SignInit(CKM_ML_DSA, hKey=privkey) → C_Sign(tbs) → sigLen=3309
INIT sends: [ IDi CERT N(INIT_CONTACT) IDr AUTH ... ]   // ~9 KB
RESP: C_VerifyInit + C_Verify → CKR_OK
RESP: C_SignInit + C_Sign → CKR_OK
INIT: C_VerifyInit + C_Verify → CKR_OK
Both: IKE_SA wasm[1] state change: CONNECTING => ESTABLISHED
```

### Post-establish note

Charon's task scheduler re-queues `CHILD_CREATE` (standard IKEv2 behavior). The WASM build has no kernel IPSec backend, so it trips on `unable to allocate SPI from kernel` → `ESTABLISHED => DESTROYING`. The IKE_SA reaches ESTABLISHED with full cert auth before this happens. The panel renders simulated `[SIM] CREATE_CHILD_SA` events for visualization.

## Mode matrix

| mode        | IKE_SA_INIT                  | IKE_AUTH       | E2E status     |
| ----------- | ---------------------------- | -------------- | -------------- |
| `classical` | AES-256 / SHA-384 / modp3072 | ML-DSA-65 cert | ✅ ESTABLISHED |
| `hybrid`    | ML-KEM-768 + ECP-256         | ML-DSA-65 cert | ✅ ESTABLISHED |
| `pure-pqc`  | ML-KEM-768 only              | ML-DSA-65 cert | ✅ ESTABLISHED |

## The four bugs fixed to get here

See [vpnsimulationmldsa.md §"The four bugs"](vpnsimulationmldsa.md) — all four are in the combined path:

1. Emscripten `getenv()` timing (pre-generate CKA_IDs before `engine.init`)
2. Empty `create_private_enumerator` in `pkcs11_creds.c` (explicit `BUILD_PKCS11_KEYID` in `wasm_setup_config`)
3. `CERT_SEND_IF_ASKED` default (changed to `CERT_ALWAYS_SEND`)
4. No trust anchor for self-signed peer cert (`mem_cred->add_cert(trusted=TRUE)`)

## Files involved

### pqctoday-hub

- [src/components/Playground/hsm/VpnSimulationPanel.tsx](src/components/Playground/hsm/VpnSimulationPanel.tsx) — `generateCertsViaWorker`, PANEL_PKCS11 RPC, cert build, WRITE_FILES, `engine.start(keyIds)`
- [src/wasm/strongswan/bridge.ts](src/wasm/strongswan/bridge.ts) — `engine.pkcs11`, `engine.writeFiles`, `engine.start`, `phase:'spawn-only'` init
- [public/wasm/strongswan_worker.js](public/wasm/strongswan_worker.js) — `PANEL_PKCS11` handler, `WRITE_FILES` handler, INIT-time env var setup
- [public/wasm/strongswan.{js,wasm}](public/wasm/) — rebuilt with HSM-side fixes
- [e2e/vpn-rust-module.spec.ts](e2e/vpn-rust-module.spec.ts) — 3 × PSK + 3 × ML-DSA dual auth matrix

### pqctoday-hsm

- `strongswan-wasm-shims/wasm_backend.c::wasm_setup_config` — Bug 2/3/4 fixes, `BUILD_PKCS11_KEYID`, `CERT_ALWAYS_SEND`, peer trust anchor

## Verification

```bash
npm run dev

# Single test (pure-pqc + ML-DSA dual):
npx playwright test e2e/vpn-rust-module.spec.ts \
  --grep "pure-pqc.*ML-DSA dual"

# Full 6-test matrix (3 × PSK + 3 × dual):
npx playwright test e2e/vpn-rust-module.spec.ts

# Manual:
# /playground/hsm?tab=vpn_sim&vpnMode=pure-pqc&vpnAuth=dual&vpnRpc=1
# Set both Client + Server "Authentication Key Type" to ML-DSA
# Generate Certs → "ML-DSA-65 certs provisioned"
# Start Daemon → "IKE_SA wasm[1] state change: CONNECTING => ESTABLISHED"
```
