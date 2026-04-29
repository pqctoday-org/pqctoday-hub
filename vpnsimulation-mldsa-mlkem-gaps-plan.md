# VPN Simulator — ML-DSA + ML-KEM Co-Existence: Gap Analysis & Plan

> Goal: get `mode=pure-pqc` (or `hybrid`) **with** `auth=dual` (ML-DSA cert auth) working end-to-end, with ML-KEM-768 in IKE_SA_INIT and ML-DSA in IKE_AUTH, in the same handshake.

References:

- [vpnsimulationmldsa.md](./vpnsimulationmldsa.md) — working ML-DSA at commit `1ab19fa4`
- [vpnsimulationmlkem.md](./vpnsimulationmlkem.md) — working ML-KEM on `main`

---

## Executive Summary

**ML-KEM and ML-DSA are architecturally compatible** — both working specs use the **same panel-side softhsmv3 + SAB-RPC** architecture. There is no fundamental conflict.

**Surprise finding**: the working 1ab19fa4 ML-DSA flow (`generateCerts` + `provisionKeys`) **still exists intact** in [src/components/Playground/hsm/VpnSimulationPanel.tsx:2445–2620](src/components/Playground/hsm/VpnSimulationPanel.tsx#L2445-L2620). It was never removed.

The only reason ML-DSA + ML-KEM doesn't work today is a **2-line UI routing decision** at [VpnSimulationPanel.tsx:3775–3777](src/components/Playground/hsm/VpnSimulationPanel.tsx#L3775-L3777) that diverts `dual + ML-DSA` to a broken `generateCertsViaWorker` flow. Plus an additional secondary path that was added to support that broken flow.

**Bottom line**: the fix is a **revert/route-restore + cleanup**, not new feature work. Estimated 1–2 hours including verification, vs the open-ended diagnostic dive currently underway.

---

## Side-by-Side Architecture Comparison

| Aspect                     | ML-DSA spec (1ab19fa4)                                                     | ML-KEM spec (main)                                                                                | Currently broken `generateCertsViaWorker`                                                                   |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| softhsm location           | Panel (main thread)                                                        | Panel (main thread)                                                                               | One per worker (in-process w/ charon)                                                                       |
| Charon → PKCS#11 transport | SAB-RPC into panel softhsm                                                 | SAB-RPC into panel softhsm                                                                        | In-process (linked into strongswan.wasm)                                                                    |
| Provisioning UI flow       | `generateCerts` → `provisionKeys` → `hsm_generateMLDSAKeyPair(..., keyId)` | `generateCerts` (RSA path) — but ML-KEM keys are gen'd by charon at IKE time, not pre-provisioned | `generateCertsViaWorker` → `PANEL_PKCS11` messages → worker softhsm                                         |
| CKA_ID source              | `crypto.getRandomValues(20)`                                               | n/a                                                                                               | `SHA-1(C_GetAttributeValue(CKA_VALUE))`                                                                     |
| CKA_ID set when            | At keygen, in template                                                     | n/a                                                                                               | Post-hoc via `C_SetAttributeValue`                                                                          |
| Cert linkage               | SKID extension == CKA_ID                                                   | n/a                                                                                               | (SKID extension stamped, but lookup uses fingerprint chain)                                                 |
| Strongswan lookup path     | `find_lib_and_keyid_by_skid` → C_FindObjects(CKA_ID)                       | n/a (KEM uses mech-driven dispatch)                                                               | `KEYID_PUBKEY_SHA1` → `pkcs11_public_key_load` → `find_ml_dsa_key`(CKA_VALUE) → `find_lib_by_keyid`(CKA_ID) |
| Status                     | ✅ Worked at 1ab19fa4                                                      | ✅ Works on main                                                                                  | ❌ `no private key found`                                                                                   |

**Key insight**: The two **working** specs share an architecture (column 1 ≈ column 2). The **broken** flow (column 3) departed from it.

---

## Gaps (vs current code on `main`)

### Gap 1 — ML-DSA UI routes to broken worker-side flow

**Location**: [VpnSimulationPanel.tsx:3775–3777](src/components/Playground/hsm/VpnSimulationPanel.tsx#L3775-L3777)

```tsx
onClick={
  authMode === 'dual' && clientAlg === 'ML-DSA' && serverAlg === 'ML-DSA'
    ? generateCertsViaWorker          // ← BROKEN
    : generateCerts                    // ← WORKING (1ab19fa4 flow intact)
}
```

When the user picks `dual + ML-DSA`, the UI invokes `generateCertsViaWorker` (worker-side softhsm provisioning, SHA-1 fingerprint approach). For any other combination it invokes `generateCerts` (the 1ab19fa4 panel-RPC flow). The 1ab19fa4 flow handles ML-DSA correctly — there is no reason to route around it.

**Severity**: blocker. This is the single decision that makes ML-DSA + ML-KEM impossible.

### Gap 2 — `generateCertsViaWorker` adds parallel state that conflicts with `generateCerts`

**Location**: [VpnSimulationPanel.tsx:2630–2845](src/components/Playground/hsm/VpnSimulationPanel.tsx#L2630-L2845) + [public/wasm/strongswan_worker.js:140–510](public/wasm/strongswan_worker.js)

`generateCertsViaWorker` introduces:

- `dualWorkerReadyRef` — flag whose presence skips re-init in the Start Daemon click path ([VpnSimulationPanel.tsx:3939](src/components/Playground/hsm/VpnSimulationPanel.tsx#L3939))
- `PANEL_PKCS11` worker message protocol (parallel to the SAB-RPC dispatcher)
- `_C_SetAttributeValue` exported from `strongswan.wasm` (we added it to `EXPORTED_FUNCTIONS`)
- `C_FindObjects_ByKeyId` worker-side handler (recently added by this session)

None of this is needed if the routing change in Gap 1 is reverted. It also fights with the working `generateCerts` flow — both can't be the source of truth for what's in softhsm.

**Severity**: cleanup. Remove after Gap 1 is fixed.

### Gap 3 — `_wasm_set_auth_mode` may be unnecessary

**Location**: [pqctoday-hsm/scripts/build-strongswan-wasm.sh:556](../pqctoday-hsm/scripts/build-strongswan-wasm.sh#L556) + [public/wasm/strongswan_worker.js:84–92](public/wasm/strongswan_worker.js)

This was added in the current session to force charon's auth mode to PUBKEY (otherwise it fell back to PSK). At commit 1ab19fa4 there was no such flag — charon picked PUBKEY auth from `leftauth=pubkey` in ipsec.conf alone.

**Open question**: was the PSK-fallback regression caused by some other change between 1ab19fa4 and main? Or did the auth-mode flag mask a different bug? **Action**: check `git log` on the strongswan-wasm patches and ipsec.conf parsing between those two commits. If 1ab19fa4 worked without `_wasm_set_auth_mode`, removing the flag (and rebuilding without that export) is the goal.

**Severity**: investigate. Don't assume it's safe to remove without checking.

### Gap 4 — softhsm engine selection (Rust vs C++)

**Location**: [VpnSimulationPanel.tsx:2450, 3844](src/components/Playground/hsm/VpnSimulationPanel.tsx#L2450)

Both call sites currently use `getSoftHSMRustModule()`. The project memory `project-mlkem-ike-handshake.md` records that the Rust module **fails in browser RPC context** (wasm-bindgen env checks) and **lacks `'i8'` in `setValue`**, and the fix was to switch to `getSoftHSMCppModule()`. The current code does NOT reflect that fix at these call sites — meaning either:

(a) the memory note is from a branch that was reverted, or
(b) the same regression is latent and ML-KEM in `pure-pqc` mode currently fails for the user (worth verifying empirically).

**Severity**: verify. If ML-KEM `pure-pqc` runs work today against the Rust module, Gap 4 is a documentation-only issue. If they fail, this is a real second-order blocker that must be fixed alongside Gap 1.

### Gap 5 — `provisionKeys` only handles RSA + ML-DSA; ML-KEM keys are NOT pre-provisioned

This is **by design**, not a gap. ML-KEM is generated by charon at IKE_SA_INIT time via the RPC dispatcher (case 59). No pre-provisioning needed. Documented here so the plan doesn't accidentally try to provision ML-KEM keys.

### Gap 6 — `engine: 'rust'` label hard-coded in `addHsmKey` calls

**Location**: [VpnSimulationPanel.tsx:2553](src/components/Playground/hsm/VpnSimulationPanel.tsx#L2553)

Cosmetic — if Gap 4 is resolved by switching to C++ module, this label should change to `'cpp'`. Non-blocking.

---

## Plan

### Phase 0 — Verify current ML-KEM still works (sanity check)

Before changing anything, confirm the baseline.

```bash
npm run dev
# Open in browser:
# /playground/hsm?tab=vpn_sim&vpnMode=pure-pqc&vpnAuth=psk&vpnAutostart=1&vpnRpc=1
# Expected: ESTABLISHED, "ML-KEM shared secret (32B): …" in panel logs
```

If this fails, **stop** and fix Gap 4 first (switch to `getSoftHSMCppModule`). If it works, proceed.

### Phase 1 — Restore ML-DSA UI routing (the one-line fix)

Edit [VpnSimulationPanel.tsx:3775–3777](src/components/Playground/hsm/VpnSimulationPanel.tsx#L3775-L3777):

```tsx
// BEFORE
onClick={
  authMode === 'dual' && clientAlg === 'ML-DSA' && serverAlg === 'ML-DSA'
    ? generateCertsViaWorker
    : generateCerts
}

// AFTER
onClick={generateCerts}
```

That's the entire functional fix. `generateCerts` already handles RSA, ML-DSA-44/65/87 via `provisionKeys`. It already stamps random CKA_ID at keygen and into cert SKID. The strongswan-pkcs11 plugin's `find_lib_and_keyid_by_skid` path (proven at 1ab19fa4) handles the lookup.

### Phase 2 — Verify ML-DSA + PSK works (no KEM, baseline)

```bash
# /playground/hsm?tab=vpn_sim&vpnMode=classical&vpnAuth=dual&vpnAutostart=1&vpnRpc=1
# Click Generate Certs (with clientAlg=ML-DSA-65, serverAlg=ML-DSA-65), then Start Daemon
# Expected: ESTABLISHED, C_SignInit(mech=0x1d) in logs, NO "pre-shared key" auth
```

If this fails, the regression is independent of Gap 1 — likely `_wasm_set_auth_mode` (Gap 3) or a strongswan-pkcs11 plugin change post-1ab19fa4. Investigate before continuing.

### Phase 3 — Verify ML-DSA + ML-KEM works together (the goal)

```bash
# /playground/hsm?tab=vpn_sim&vpnMode=pure-pqc&vpnAuth=dual&vpnAutostart=1&vpnRpc=1
# Same Generate Certs + Start Daemon flow
# Expected:
#   [RPC] C_GenerateKeyPair mech=0xf → rv=0x0           (ML-KEM keypair, IKE_SA_INIT)
#   [RPC] C_EncapsulateKey  → rv=0x0 len=1088           (responder)
#   [RPC] C_DecapsulateKey  → rv=0x0                    (initiator)
#   [RPC] ML-KEM shared secret (32B): 0x…
#   [RPC] C_FindObjects (CKA_ID match) → 1               (cert SKID lookup, IKE_AUTH)
#   [RPC] C_SignInit mech=0x1d → rv=0x0                 (ML-DSA sign)
#   [RPC] C_Sign → rv=0x0 sigLen=…
#   ESTABLISHED
```

For `hybrid` mode, also expect ECDH `C_DeriveKey` (case 91) between ML-KEM and IKE_AUTH.

### Phase 4 — Cleanup (remove parallel broken path)

Once Phase 3 passes, delete dead code:

| File                                                                                                       | Action                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [VpnSimulationPanel.tsx](src/components/Playground/hsm/VpnSimulationPanel.tsx)                             | Delete `generateCertsViaWorker` (~lines 2630–2845), `dualWorkerReadyRef` declarations and reads, the cert-autostart effect's references to `generateCertsViaWorker`   |
| [VpnSimulationPanel.tsx:3939–3946](src/components/Playground/hsm/VpnSimulationPanel.tsx#L3939)             | Delete the `if (dualWorkerReadyRef.current)` early-START branch — `generateCerts` doesn't spawn workers                                                               |
| [public/wasm/strongswan_worker.js](public/wasm/strongswan_worker.js)                                       | Delete the entire `if (type === 'PANEL_PKCS11' …)` block (~lines 134–510) and the new `C_FindObjects_ByKeyId` handler I just added                                    |
| [public/wasm/strongswan_worker.js:84–92](public/wasm/strongswan_worker.js)                                 | Optionally delete `_wasm_set_auth_mode` invocation (only if Gap 3 confirms it's unnecessary)                                                                          |
| [pqctoday-hsm/scripts/build-strongswan-wasm.sh:556](../pqctoday-hsm/scripts/build-strongswan-wasm.sh#L556) | Remove `_C_SetAttributeValue` and `_wasm_set_auth_mode` from `EXPORTED_FUNCS` (only if Gap 3 confirms); rebuild WASM                                                  |
| [src/wasm/strongswan/bridge.ts](src/wasm/strongswan/bridge.ts)                                             | Remove `panelPkcs11Pending` map and `pkcs11()` public method if no other caller; remove `auth: authMode` from worker INIT message if `_wasm_set_auth_mode` is dropped |

### Phase 5 — E2E test

The existing test [e2e/vpn-rust-module.spec.ts](e2e/vpn-rust-module.spec.ts) already covers `mode × dual` for all 3 modes. Re-run after Phase 4:

```bash
npx playwright test e2e/vpn-rust-module.spec.ts --project=chromium
```

All 6 tests (3 modes × {psk, dual}) should pass.

### Phase 6 — Commit

```bash
git commit -m "fix(vpn-sim): restore ML-DSA panel-RPC provisioning, drop broken worker-side path

The ML-DSA dual-auth path was rerouted to a worker-side softhsm
provisioning flow (generateCertsViaWorker) that introduced SHA-1
fingerprint CKA_ID, post-hoc C_SetAttributeValue, and PANEL_PKCS11
worker messages — none of which line up with the strongswan-pkcs11
plugin's actual cert→key lookup behavior.

Restored the working 1ab19fa4 panel-side flow (generateCerts +
provisionKeys + hsm_generateMLDSAKeyPair with random 20-byte CKA_ID
in the keygen template, same bytes stamped into cert SKID extension).
This is fully compatible with ML-KEM-768 in IKE_SA_INIT — both share
the same panel-RPC softhsm.

ML-DSA + ML-KEM now work in pure-pqc and hybrid modes.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Risk Register

| Risk                                                                              | Likelihood | Impact                                                               | Mitigation                                                                                                                                  |
| --------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateCerts` ML-DSA broken on main (regressed since 1ab19fa4)                  | Medium     | Phase 2 fails                                                        | If so, `git diff 1ab19fa4 HEAD -- src/wasm/softhsm/pqc.ts src/components/Playground/hsm/VpnSimulationPanel.tsx`; restore the regressed bits |
| `_wasm_set_auth_mode` actually IS necessary (Gap 3)                               | Medium     | Phase 2 fails with PSK fallback                                      | Keep the flag; only Phase 4 cleanup of `_C_SetAttributeValue` is safe                                                                       |
| Rust softhsm fails in RPC context (Gap 4)                                         | Unknown    | Phase 0 fails                                                        | Switch both call sites to `getSoftHSMCppModule` per project memory                                                                          |
| strongswan-pkcs11 in worker wasm now expects in-process softhsm even with rpcMode | Low        | Phase 2 logs show "C_FindObjects → 0 matches" despite correct CKA_ID | Diff strongswan-pkcs11 `pkcs11_library.c` between 1ab19fa4-era WASM and current; check `g_pkcs11_rpc_mode` wiring is intact                 |
| Removing `dualWorkerReadyRef` early-start branch breaks the autostart effect      | Low        | Cert autostart never clicks Start Daemon                             | The autostart effect already polls for the button; the early-start short-circuit was an optimization, not required                          |

---

## Why This Plan vs Continuing the Diagnostic Dive

The current session has been investigating _why_ `find_lib_by_keyid` doesn't find the SHA-1-fingerprinted CKA_ID, with progressively deeper code reading and three rounds of WASM rebuilds. The remaining theories are:

- public-key `CKA_PRIVATE` default in softhsm (ruled out — defaults to FALSE for `C_GenerateKeyPair`)
- `C_SetAttributeValue` not actually committing (would require runtime tracing)
- slot enumeration mismatch between provisioning and charon (would require runtime tracing)

Each theory adds another diagnostic round. Meanwhile, **a known-working flow already exists in the same file** and just needs to be re-enabled by changing one ternary expression.

The diagnostic effort has educational value (understanding the strongswan-pkcs11 plugin internals) but is not on the critical path to the user's goal ("get ML-DSA + ML-KEM working").

**Recommendation**: execute this plan. Park the SHA-1-fingerprint investigation as a future task if the panel-RPC architecture ever needs to be replaced.
