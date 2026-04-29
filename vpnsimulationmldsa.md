# ML-DSA-65 Dual-Auth IKEv2 in WASM — Working Spec

> Status: **Working end-to-end** as of pqctoday-hub `3.5.20` / pqctoday-hsm `v0.4.28`.
> Verified by [e2e/\_vpn-mldsa.spec.ts](e2e/_vpn-mldsa.spec.ts): `IKE_SA wasm[1] state change: CONNECTING => ESTABLISHED` in 2.6 s, headless Chromium.

## TL;DR

Pure-pqc IKEv2 with ML-DSA-65 cert auth and ML-KEM-768 key exchange completes end-to-end in browser WASM. No PSK fallback. Both peers sign and verify each other's `IKE_AUTH` payload via real PKCS#11 ML-DSA on the in-process softhsmv3 statically linked into `strongswan.wasm`.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Main thread (panel)                                               │
│                                                                    │
│  generateCertsViaWorker()                                          │
│   1. Generate 20-byte CKA_IDs (BEFORE engine.init — critical)      │
│   2. engine.init({phase:'spawn-only', authMode:'dual',             │
│                    keyIds:{initKeyId, respKeyId}})                 │
│   3. PANEL_PKCS11 ops drive worker-side softhsm via promise RPC:   │
│        C_GetSlotList, C_OpenSession, C_Login,                      │
│        C_GenerateKeyPair_MLDSA(ckaId), C_GetAttributeValue,        │
│        C_Sign_MLDSA (for cert TBS)                                 │
│   4. WRITE_FILES lands cert PEMs in worker FS                      │
│   5. engine.start() — START message launches charon                │
└──────────────────┬─────────────────────────────────────────────────┘
                   │ postMessage (worker bridge)
       ┌───────────┴────────────┐
       ▼                        ▼
┌───────────────┐         ┌───────────────┐
│ Worker A      │         │ Worker B      │
│ (initiator)   │         │ (responder)   │
│  + charon     │         │  + charon     │
│  + softhsmv3  │         │  + softhsmv3  │
│  (statically  │         │  (statically  │
│   linked into │         │   linked into │
│   strongswan  │         │   strongswan  │
│   .wasm)      │         │   .wasm)      │
└───────────────┘         └───────────────┘
       ▲                        ▲
       └────────── SAB ─────────┘
       (cross-worker UDP loopback for IKE packets,
        plus pkcs11 RPC for ML-KEM ops)
```

**Key property**: each worker has its OWN softhsmv3 instance (statically linked). The panel reaches it via `PANEL_PKCS11` postMessage RPC. Charon's pkcs11 plugin reaches the same instance via the standard PKCS#11 API. Both views are coherent — the keys provisioned via PANEL_PKCS11 are visible to charon's plugin.

## End-to-end flow

### 1. Slot/token init (per worker, via `wasm_hsm_init`)

```
C_Initialize → C_GetSlotList → C_InitToken → C_OpenSession → C_Login(SO)
              → C_InitPIN("1234") → C_Logout → C_Login(USER, "1234")
```

`wasm_hsm_init` is invoked from the worker's `GEN_KEYS` handler with `algType=2` (ML-DSA / token-only init, no RSA keygen).

### 2. ML-DSA keypair generation (panel-driven via `PANEL_PKCS11`)

```
panel: const ckaId = crypto.getRandomValues(new Uint8Array(20))
       // generated BEFORE engine.init so it lands in INIT payload → preRun ENV
       engine.pkcs11(role, 'C_GenerateKeyPair_MLDSA', { hSess, variant:65, ckaId })

worker: C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN,
                          pub:[CLASS=PUBLIC, KEY_TYPE=ML_DSA, TOKEN=TRUE,
                               VERIFY=TRUE, PARAMETER_SET=2, ID=ckaId],
                          priv:[CLASS=PRIVATE, KEY_TYPE=ML_DSA, TOKEN=TRUE,
                                PRIVATE=TRUE, SENSITIVE=TRUE, EXTRACTABLE=FALSE,
                                SIGN=TRUE, ID=ckaId])
        → returns hPub, hPri
```

Note: `CKA_PRIVATE` defaults to `FALSE` for public keys per PKCS#11 v3.2 §4.5 — softhsm honors this, so the pubkey is findable from a no-login session (the path strongswan-pkcs11 uses at IKE_AUTH).

### 3. Self-signed cert build (panel + worker)

Panel reads pubkey bytes via `C_GetAttributeValue(CKA_VALUE)`, builds the TBSCertificate ASN.1 structure with the same `ckaId` stamped into the `SubjectKeyIdentifier` extension, then delegates the TBS signature to the worker via `C_Sign_MLDSA`. The cert PEM lands in both workers at `/etc/ipsec.d/certs/{initiator,responder}.crt` via `WRITE_FILES`.

### 4. Charon startup — `wasm_setup_config` (in `wasm_backend.c`)

For `wasm_auth_mode == 1` (dual):

a. **Load my cert** from `/etc/ipsec.d/certs/<role>.crt` via `lib->creds->create(CRED_CERTIFICATE, CERT_X509, BUILD_FROM_FILE, ...)`.

b. **★ Load my private key explicitly via `BUILD_PKCS11_KEYID`** — decode `WASM_LOCAL_KEYID` env var hex into a `chunk_t`, call:

```c
private_key_t *priv = lib->creds->create(lib->creds,
    CRED_PRIVATE_KEY, KEY_ANY,
    BUILD_PKCS11_KEYID, keyid_chunk,
    BUILD_END);
mem_cred_t *creds = mem_cred_create();
creds->add_key(creds, priv);
lib->credmgr->add_set(lib->credmgr, &creds->set);
```

This step is **required** because upstream `pkcs11_creds.c:241` wires `create_private_enumerator = enumerator_create_empty`, so credmgr's `get_private_by_keyid` always returns NULL unless the private key was previously loaded into a `mem_cred`. Real strongSwan deployments do this in stroke/vici/nm config plugins; the WASM build has none of those, so we do it inline.

c. **Load peer cert as trust anchor** — read peer's cert from `/etc/ipsec.d/certs/<peer>.crt`, register via `mem_cred->add_cert(creds, /*trusted=*/TRUE, peer_cert)`. For self-signed certs the cert IS the anchor.

d. **Build auth_cfg** with `AUTH_CLASS_PUBKEY`, `AUTH_RULE_SUBJECT_CERT = my_cert`, and `AUTH_RULE_IDENTITY = ID_KEY_ID(@#<keyid_hex>)`.

e. **Set `peer_data.cert_policy = CERT_ALWAYS_SEND`** so the cert goes on the wire even when the peer doesn't send `CERTREQ`.

### 5. IKE_SA_INIT — ML-KEM-768 key exchange

Standard charon flow. ML-KEM keypair generated inside the in-process softhsm via `C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN)`. Encap on the responder, decap on the initiator. Shared secret derives SKEYSEED.

### 6. IKE_AUTH — ML-DSA cert auth

```
INIT → C_SignInit(CKM_ML_DSA, hKey=privkey) → C_Sign(tbs) → CKR_OK, sigLen=3309
INIT sends: [ IDi CERT N(INIT_CONTACT) IDr AUTH ... ]   // ~9 KB
RESP receives, builds peer's pubkey from cert, verifies:
   C_VerifyInit(CKM_ML_DSA, hKey=peer_pub) → C_Verify(data, sig) → CKR_OK
RESP signs back the same way → CKR_OK
INIT verifies → CKR_OK
Both sides: IKE_SA wasm[1] state change: CONNECTING => ESTABLISHED
```

## The four bugs that had to be fixed (chained)

Each one alone was insufficient. Order discovered, not order severity.

### Bug 1 — Emscripten `getenv()` timing (panel-side, hub repo)

`engine.start(keyIds)` set `ENV['WASM_LOCAL_KEYID']` _after_ `Module` had already been instantiated. Emscripten snapshots `ENV` during `preRun`; later mutations don't reach C-side `getenv()`.

Symptom: `WASM: local identity = ID_KEY_ID @#…` log never appeared. `wasm_setup_config`'s `getenv("WASM_LOCAL_KEYID")` returned NULL → identity defaulted to cert subject DN → `find_lib_by_keyid` searched a different value than was stored.

Fix in [VpnSimulationPanel.tsx::generateCertsViaWorker](src/components/Playground/hsm/VpnSimulationPanel.tsx): pre-generate the 20-byte CKA_IDs _before_ `engine.init`, pass them in `options.keyIds` so they land in the INIT payload → preRun seeds the C env table → `getenv()` returns the correct hex at `_main` time.

### Bug 2 — Empty `create_private_enumerator` (HSM repo)

`strongswan-pkcs11/pkcs11_creds.c:241` wires:

```c
.create_private_enumerator = (void*)enumerator_create_empty,
```

Means credmgr's `get_private_by_keyid` always returns NULL for PKCS#11 keys. Real deployments use stroke/vici/nm to load private keys via `BUILD_PKCS11_KEYID` builder + `mem_cred`. WASM has none of those.

Symptom: `no private key found for '<keyid hex>'` at IKE_AUTH despite the keys being present and findable in softhsm.

Fix in `strongswan-wasm-shims/wasm_backend.c`: explicit `lib->creds->create(BUILD_PKCS11_KEYID, ...)` + `mem_cred->add_key` + `lib->credmgr->add_set` in `wasm_setup_config` (dual-auth branch).

### Bug 3 — `cert_policy = CERT_SEND_IF_ASKED` (HSM repo)

Default policy keeps the cert off the wire when the peer doesn't include a `CERTREQ` (which our self-signed flow doesn't).

Symptom: peer received `[ IDi N(INIT_CONTACT) IDr AUTH ... ]` with no `CERT` payload, so couldn't get our pubkey to verify the signature → `IKE_AUTH response 1 [ N(AUTH_FAILED) ]`.

Fix: `peer_data.cert_policy = CERT_ALWAYS_SEND` for `wasm_auth_mode == 1`. With this, IKE_AUTH carries `[ IDi CERT N(INIT_CONTACT) IDr AUTH ... ]` (~9 KB).

### Bug 4 — No trust anchor for self-signed peer cert (HSM repo)

Even with the cert on the wire, the verifier needs to trust the issuer. For self-signed certs the cert IS the anchor.

Symptom: `IKE_AUTH response 1 [ N(AUTH_FAILED) ]` — the cert arrived but the verifier rejected the trust chain.

Fix: each worker now also loads the _peer's_ cert from `/etc/ipsec.d/certs/<peer>.crt` (already written by the panel via `WRITE_FILES`) and registers it via `mem_cred->add_cert(creds, /*trusted=*/TRUE, peer_cert)` in a separate set.

## Files involved

### pqctoday-hub

- [src/components/Playground/hsm/VpnSimulationPanel.tsx::generateCertsViaWorker](src/components/Playground/hsm/VpnSimulationPanel.tsx) — ckaId pre-generation, PANEL_PKCS11 RPC, cert build, WRITE_FILES, engine.start
- [src/wasm/strongswan/bridge.ts](src/wasm/strongswan/bridge.ts) — `engine.pkcs11(role, op, args)`, `engine.writeFiles(role, files)`, `engine.start(keyIds)`, `phase: 'spawn-only'` init
- [public/wasm/strongswan_worker.js](public/wasm/strongswan_worker.js) — `PANEL_PKCS11` handler with C_GenerateKeyPair_MLDSA / C_Sign_MLDSA / etc., `WRITE_FILES` handler, INIT-time `WASM_LOCAL_KEYID` / `WASM_REMOTE_KEYID` env-var setup
- [public/wasm/strongswan.{js,wasm}](public/wasm/) — rebuilt with HSM-side fixes (13.84 MB)
- [e2e/\_vpn-mldsa.spec.ts](e2e/_vpn-mldsa.spec.ts) — full Generate Certs → Start Daemon → ESTABLISHED chain

### pqctoday-hsm

- `strongswan-wasm-shims/wasm_backend.c::wasm_setup_config` — Bug 2/3/4 fixes
- `p11_v32_compliance_test.cpp::test_cka_id_retrieval` — 6 CKA_ID retrieval tests under category `cka-id`

## Verification

```bash
# Run dev server
npm run dev

# Run the working ML-DSA dual-auth E2E
npx playwright test e2e/_vpn-mldsa.spec.ts --project=chromium

# Or manually:
# Open /playground/hsm?tab=vpn_sim&vpnMode=pure-pqc&vpnAuth=dual&vpnRpc=1
# Set both Client and Server "Authentication Key Type" to ML-DSA
# Click Generate Certs → wait for "ML-DSA-65 certs provisioned" log
# Click Start Daemon
# Expected: "IKE_SA wasm[1] state change: CONNECTING => ESTABLISHED"
#           with "C_SignInit mech=CKM_ML_DSA → CKR_OK" + "C_Sign sigLen=3309 → CKR_OK"
#           NO "no private key found" / "AUTH_FAILED" / "pre-shared key" markers
```

Native softhsm regression suite (CKA_ID retrieval coverage):

```bash
cd ../pqctoday-hsm
./build_fresh/p11_v32_compliance_test \
  --engine ./build_fresh/src/lib/libsofthsmv3.dylib \
  --category cka-id
# Expected: 6 PASS
```

## Cosmetic remainder

Post-establish, charon's task scheduler re-runs the `CHILD_CREATE` task (queued at IKE_SA creation regardless of `CHILDLESS_FORCE`), which trips on `unable to allocate SPI from kernel` since the WASM build has no kernel IPSec backend → `IKE_SA wasm[1] state change: ESTABLISHED => DESTROYING`.

The IKE_SA itself reaches ESTABLISHED with full ML-DSA cert auth before this happens. The panel renders simulated `[SIM] CREATE_CHILD_SA` events for the visualization. As of v0.4.29 the `wasm_setup_config` no longer attaches the child_cfg to the peer_cfg, suppressing the post-establish CHILD_CREATE re-run.
