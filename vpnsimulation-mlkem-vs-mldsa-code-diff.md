# ML-KEM (works) vs ML-DSA (broken) — actual code differences

> Pure code comparison. No commit-message claims, no speculation. Source of truth: `src/components/Playground/hsm/VpnSimulationPanel.tsx` and `src/wasm/softhsm/pqc.ts` on the current `main` branch.

## TL;DR

|                             | ML-KEM (works)                                                                                            | ML-DSA (broken)                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Where keygen runs**       | RPC dispatcher case 59, triggered by **charon's** `C_GenerateKeyPair` call over SAB                       | Panel function `hsm_generateMLDSAKeyPair`, called BEFORE charon starts                            |
| **Whose session**           | `hSess59 = p[0]` — **charon's** PKCS#11 session handle, passed in from the worker                         | `hSession` arg — **panel's** session opened earlier via `hsm_openUserSession`                     |
| **Whose slot**              | Whatever slot **charon** opened the session on (after charon's pkcs11_manager enumeration)                | Whatever slot **panel** initialized via `hsm_initToken`                                           |
| **Who holds `hPub`/`hPri`** | Charon directly receives them as the return of `C_GenerateKeyPair`                                        | Panel holds them; charon never sees them                                                          |
| **Lookup later**            | None needed — charon uses the handles it received for `C_EncapsulateKey`/`C_DecapsulateKey` (cases 68/69) | Charon must `C_FindObjects(CKA_ID = SHA-1(pubkey))` at IKE_AUTH — and that lookup currently fails |

The deciding factor: **ML-KEM keys live in the slot charon's pkcs11_manager already knows about**. ML-DSA keys live in slots the panel created which charon may not enumerate.

---

## Side-by-side code

### ML-KEM keygen — `VpnSimulationPanel.tsx` case 59 (works)

```ts
case 59: {
  const hSess59 = p[0] >>> 0      // ← CHARON's session, passed via SAB
  const mechType59 = p[1] >>> 0    // 0x000F = CKM_ML_KEM_KEY_PAIR_GEN
  const pubCount59 = p[2] >>> 0
  const privCount59 = p[3] >>> 0
  // ...templates deserialized from charon's SAB payload...

  // Inject CKA_TOKEN = TRUE on BOTH templates
  const extPub  = injectTokenFlag(pubTpl.tplPtr,  pubCount59)
  const extPriv = injectTokenFlag(privTpl.tplPtr, privCount59)

  // ML-KEM only: inject CKA_PARAMETER_SET = CKP_ML_KEM_768 (= 2)
  if (mechType59 === 0x000f) { ... append CKA_PARAMETER_SET=2 ... }

  M._C_GenerateKeyPair(
    hSess59,           // ← CHARON's session
    mechPtr59,
    finalPubPtr, finalPubCount,
    extPriv.extTplPtr, privCount59 + 1,
    pubKeyPtr, privKeyPtr
  )
  // pubKeyPtr / privKeyPtr → charon owns these handles
}
```

### ML-DSA keygen — `pqc.ts::hsm_generateMLDSAKeyPair` (broken in this flow)

```ts
export const hsm_generateMLDSAKeyPair = (
  M,
  hSession,
  variant,
  extractable = false,
  token = false,
  keyId?
): { pubHandle; privHandle } => {
  // mech = CKM_ML_DSA_KEY_PAIR_GEN
  const pubDefs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: token }, // = true
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
    { type: CKA_PARAMETER_SET, ulongVal: ps }, // CKP_ML_DSA_44|65|87
    ...(keyId ? [{ type: CKA_ID, bytesPtr, bytesLen }] : []),
  ]
  const prvDefs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: token }, // = true
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
    ...(keyId ? [{ type: CKA_ID, bytesPtr, bytesLen }] : []),
  ]

  M._C_GenerateKeyPair(
    hSession, // ← PANEL's session (opened panel-side via hsm_openUserSession)
    mech,
    pubTpl.ptr,
    pubDefs.length,
    prvTpl.ptr,
    prvDefs.length,
    pubHPtr,
    prvHPtr
  )
  // Returned to PANEL, which then builds cert + writes cert PEM to charon's filesystem
}
```

---

## What's actually different in the runtime behavior

1. **Slot membership in charon's pkcs11_manager**
   - ML-KEM: charon's pkcs11_manager enumerates slots BEFORE keygen. When charon calls `C_GenerateKeyPair`, the keys land in a slot charon's manager already tracks. Lookup is trivial because charon uses the returned handles directly.
   - ML-DSA: keys are placed by the panel into slots created by `hsm_initToken`. When charon's pkcs11_manager later enumerates with `C_GetSlotList(tokenPresent=true)`, it MAY or MAY NOT see those slots (depending on softhsm's slot list behavior + whether login attempts succeed). The runtime log shows charon finds only `softhsm:2`, not the panel's freshly-created VPN slots. **This is the root cause.**

2. **Lookup mechanism**
   - ML-KEM: zero lookup. `C_GenerateKeyPair` returns `hPub`/`hPri` → `C_EncapsulateKey`/`C_DecapsulateKey` use them directly.
   - ML-DSA: `credential_manager.c::get_private_by_cert` → `pkcs11_public_key.c::encode_ml_dsa` → `pkcs11_private_key.c::find_lib_by_keyid(SHA-1(pubkey), CKO_PUBLIC_KEY)`. This iterates `manager->create_token_enumerator(manager)` — i.e., **only the slots charon's pkcs11_manager has tracked**. If panel's VPN slots aren't in that set, the search fails.

3. **`CKA_KEY_TYPE` on private template**
   - ML-KEM panel case 59: doesn't add it (charon's incoming template handles it).
   - ML-DSA pqc.ts: explicitly adds `CKA_KEY_TYPE: CKK_ML_DSA` on private template (line 421). softhsmv3's `generateMLDSA` already injects this default (line 4623 in `SoftHSM_keygen.cpp`), so the duplicate may be harmless but is redundant.

---

## What the dev specs need to correct

### `vpnsimulationmldsa.md` — current claims that runtime invalidates

| Claim in spec                                                                            | Runtime reality                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Strongswan reads the cert's `SubjectKeyIdentifier` extension (RFC 5280)"                | Strongswan reads the cert's SPKI raw pubkey bytes, computes `SHA-1(pubkey)`. SKID extension is not consulted in `find_lib_by_keyid`.                                                                                                                                       |
| "Strongswan lookup: `find_lib_and_keyid_by_skid` ... uses cert's `SubjectKeyIdentifier`" | `find_lib_and_keyid_by_skid` (despite its name) actually iterates **certificate objects in PKCS#11** and matches by **certificate subject DN**, not by SKID extension. The PRIMARY path used is `find_lib_by_keyid(KEYID_PUBKEY_SHA1, CKO_PUBLIC_KEY)`.                    |
| "Random 20-byte CKA_ID set at keygen + matching SKID extension makes lookup work"        | Does NOT work with the current strongswan-pkcs11 plugin. The plugin needs `CKA_ID == SHA-1(raw_pubkey_bytes)`.                                                                                                                                                             |
| "1ab19fa4 was the working state for ML-DSA cert auth"                                    | The 1ab19fa4 commit message claimed this, but the strongswan-pkcs11 plugin in `~/antigravity/pqctoday-hsm/strongswan-pkcs11/` does NOT support that lookup pattern. Either the plugin was different at that historical moment or the commit message overstated the status. |

### `vpnsimulationmlkem.md` — accuracy check

The ML-KEM spec is essentially accurate as of this session:

- ✅ Uses panel-side softhsmv3 + SAB-RPC (matches actual code)
- ✅ Cases 59/68/69 in the dispatcher (matches `VpnSimulationPanel.tsx`)
- ✅ 8-arg `C_EncapsulateKey`/`C_DecapsulateKey` (matches code)
- ✅ Injects `CKA_PARAMETER_SET = CKP_ML_KEM_768 (2)` for mech=0x0F (matches line 1579-1593)
- ✅ The 2-attribute KEM secret template (matches `buildKemSecretKeyTmpl`)

One omission worth adding: the spec doesn't explicitly state that ML-KEM works **because charon owns the keys directly** (returned by `C_GenerateKeyPair`), avoiding the cert-driven lookup chain that ML-DSA must go through. Adding this clarifies why the same panel-RPC architecture works for KEM but breaks for DSA cert auth.

---

## What to actually try next (parallel to ML-KEM)

The architectural hint from ML-KEM: **make charon own the ML-DSA keys the same way it owns ML-KEM keys**.

Two options:

### Option A — Add an `pkcs11_*` keygen flow charon can drive

Modify the strongswan-pkcs11 plugin (or add a startup shim) so that charon calls `C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN)` itself at daemon startup BEFORE IKE_AUTH. The keys then live in charon's session. Panel reads `CKA_VALUE` afterward to build the cert and writes the cert to the worker filesystem.

- Pro: Truly parallel to ML-KEM. No lookup-by-CKA_ID needed.
- Con: Requires plugin / WASM code changes.

### Option B — Co-locate panel's keys in the slot charon will enumerate

Before charon starts, identify the slot charon's pkcs11_manager will pick (the lowest-numbered token-present slot that accepts pin=1234). Pre-provision ML-DSA keys directly into THAT slot via panel's existing `hsm_generateMLDSAKeyPair`, then post-set `CKA_ID = SHA-1(pubkey)` via `C_SetAttributeValue` (requires C++ softhsm).

- Pro: No plugin changes. Reuses existing code.
- Con: Fragile — depends on slot enumeration order. Doesn't address why charon currently sees only `softhsm:2` instead of all our slots.

### Option C — Diagnose why charon's pkcs11_manager only enumerates `softhsm:2`

Add a panel diagnostic that, after provisioning, calls `M._C_GetSlotList(true, ...)` and logs every slot ID + token label. Confirm whether our 2 VPN slots are even in the panel softhsm's list. If they are but charon doesn't enumerate them, the issue is in the strongswan pkcs11_manager init logic. If they aren't, it's a panel slot-creation bug.

- Pro: Cheap. 30 lines of code.
- Con: Diagnostic only — doesn't fix anything by itself.

**Recommendation**: Do Option C first (5 minutes, definitive answer), then choose A or B based on what we learn.
