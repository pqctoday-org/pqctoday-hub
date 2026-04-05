# IKEv2 ↔ softhsmv3 PKCS#11 RPC — Detailed Implementation Plan

## Problem Statement

The VPN simulation runs a full IKEv2 handshake in WASM with ECDH + RNG routed through
softhsmv3 via PKCS#11. However, the **PKCS#11 log panel and Keys section are empty** because:

- charon's pkcs11 plugin calls the **statically-linked** softhsmv3 inside the Web Worker (C→C)
- The PKCS#11 log panel is fed by the **JS RPC handler** on the main thread
- These are **two different softhsmv3 instances** that never interact

The `[PKCS11] C_GenerateKeyPair`, `C_DeriveKey`, `C_GenerateRandom` lines in the charon log
ARE from real softhsmv3 calls (via EM_ASM logging wrapper). But they're in the wrong panel.

## Goal

Replace the static C-to-C PKCS#11 path with **SAB-based RPC** so every `C_*` call from
charon goes through the main thread's softhsmv3 module. This:

1. Populates the PKCS#11 log panel with real entries (via `addHsmLog`)
2. Shows generated keys in the Keys section (via `C_FindObjects` on the shared instance)
3. Uses the **same softhsmv3 instance** as the rest of the HSM Playground
4. Every log entry is from a real softhsmv3 call — zero synthetic/fake data

## Feasibility Assessment: CONFIRMED

### Proven Patterns Already in Codebase

| Pattern                    | Where Used                                | Reusable?                       |
| -------------------------- | ----------------------------------------- | ------------------------------- |
| SAB + Atomics.wait/notify  | `socket_wasm.c` (network I/O)             | Yes — identical blocking model  |
| CK_FUNCTION_LIST wrapper   | `pkcs11_log_wasm.c` (28 functions)        | Yes — replace log with RPC      |
| JS RPC handler for PKCS#11 | `VpnSimulationPanel.tsx:240-810`          | Yes — already handles 70+ ops   |
| PKCS11_RPC bridge routing  | `bridge.ts:87-95`                         | Yes — already routes to handler |
| Worker ↔ Main thread SAB   | `bridge.ts:159-166` (pkcs11Sab allocated) | Yes — SABs already exist        |

### Performance

| Metric                           | Value          | Impact               |
| -------------------------------- | -------------- | -------------------- |
| Atomics.wait/notify round-trip   | ~100-500ns     | Negligible           |
| SAB memcpy (small payload)       | ~1-10μs per KB | Negligible           |
| EC keygen (P-256)                | ~5-20ms        | Dominant             |
| ECDH derive                      | ~2-10ms        | Dominant             |
| RSA-3072 sign                    | ~50-100ms      | Dominant             |
| Total overhead per IKE handshake | ~10-50μs       | <0.1% of crypto time |

### Limitations

| Operation                   | Difficulty                               | Mitigation                                         |
| --------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `C_GetOperationState`       | Not serializable (internal pointers)     | Not needed — `use_hasher=no` avoids streaming hash |
| `C_SetOperationState`       | Same                                     | Same                                               |
| `C_InitToken`               | Runs before charon via `wasm_hsm_init.c` | Already handled in pre-init phase                  |
| `C_WrapKey` / `C_UnwrapKey` | Not in RPC handler                       | Not used by strongSwan IKE                         |

## Architecture

### Current (broken for log panel)

```
Worker                                          Main Thread
┌──────────────────────┐                       ┌──────────────────────┐
│ charon               │                       │ VpnSimulationPanel   │
│   ↓                  │                       │                      │
│ pkcs11 plugin        │   (no connection)     │ RPC Handler          │
│   ↓                  │                       │   ↓                  │
│ pkcs11_log_wasm.c    │                       │ softhsmv3 (JS WASM)  │
│   ↓                  │                       │   ↓                  │
│ softhsmv3 (C static) │ ← logs to charon.log │ PKCS#11 log panel ← │
│                      │   NOT to log panel    │ Keys section     ← │
└──────────────────────┘                       └──────────────────────┘
```

### Target (RPC-based)

```
Worker                          SAB                    Main Thread
┌──────────────────────┐    (Atomics)     ┌──────────────────────────┐
│ charon               │                  │ VpnSimulationPanel       │
│   ↓                  │                  │                          │
│ pkcs11 plugin        │                  │ RPC Handler              │
│   ↓                  │                  │   ↓                      │
│ pkcs11_rpc_wasm.c    │  1. cmd+args →   │ Read SAB                 │
│   rpc_C_Sign()       │  2. wait...      │ Call softhsmv3 (JS WASM) │
│     blocks on SAB    │  ← 3. rv+result  │ M._C_Sign(...)           │
│     reads result     │  ← 4. notify     │ addHsmLog(entry)    ──► PKCS#11 log panel │
│   returns to caller  │                  │ Keys auto-refresh   ──► Keys section      │
└──────────────────────┘                  └──────────────────────────┘
```

Both workers (initiator + responder) have their own PKCS#11 SAB (already allocated).
The main thread's softhsmv3 is shared with the rest of the Playground.

## SAB Layout

Reuse the existing layout from VpnSimulationPanel.tsx RPC handler:

```
Offset   Size   Name          Description
──────   ────   ────          ───────────
0        4      flag[0]       Command ID (cmdId: 0=C_Initialize, 42=C_SignInit, etc.)
4        4      flag[1]       State (0=idle, 1=worker-ready, 2=main-done)
8        4      flag[2]       Return value (CK_RV)
12       36     flag[3-11]    Reserved (future use)
48       4      p[0]          First int32 parameter (e.g., hSession)
52       4      p[1]          Second int32 parameter
56       4      p[2]          Third int32 parameter
...      ...    ...           More int32 parameters
varies   varies payload       Binary data (signatures, ciphertexts, keys)
```

Total SAB size: 65536 bytes (already allocated). Sufficient for:

- RSA-3072 signatures: 384 bytes
- ML-DSA-65 signatures: 3309 bytes
- EC public keys: 65 bytes
- ML-KEM ciphertexts: 1088 bytes

## Command ID Mapping

Must match VpnSimulationPanel.tsx RPC handler's switch cases:

| cmdId | PKCS#11 Function      | Used by IKE | Parameters (SAB layout)                                    |
| ----- | --------------------- | ----------- | ---------------------------------------------------------- |
| 0     | `C_Initialize`        | Startup     | (none)                                                     |
| 1     | `C_Finalize`          | Shutdown    | (none)                                                     |
| 4     | `C_GetSlotList`       | Plugin init | p[0]=tokenPresent, p[1]=maxSlots, p[2]=wantList            |
| 6     | `C_GetTokenInfo`      | Plugin init | p[0]=slotId                                                |
| 7     | `C_GetMechanismList`  | Plugin init | p[0]=slotId                                                |
| 12    | `C_OpenSession`       | Every op    | p[0]=slotId, p[1]=flags                                    |
| 13    | `C_CloseSession`      | Every op    | p[0]=hSession                                              |
| 18    | `C_Login`             | DH keygen   | p[0]=hSession, p[1]=userType, p[2]=pinLen                  |
| 19    | `C_Logout`            | Cleanup     | p[0]=hSession                                              |
| 24    | `C_GetAttributeValue` | Key extract | p[0]=hSession, p[1]=hObject, p[2]=attrType, p[3]=bufLen    |
| 26    | `C_FindObjectsInit`   | Key lookup  | p[0]=hSession, p[1]=attrCount, payload=template            |
| 27    | `C_FindObjects`       | Key lookup  | p[0]=hSession, p[1]=maxObjects                             |
| 28    | `C_FindObjectsFinal`  | Key lookup  | p[0]=hSession                                              |
| 42    | `C_SignInit`          | Pubkey auth | p[0]=hSession, p[1]=mechType, p[2]=hKey                    |
| 43    | `C_Sign`              | Pubkey auth | p[0]=hSession, p[1]=dataLen, payload=data                  |
| 48    | `C_VerifyInit`        | Pubkey auth | p[0]=hSession, p[1]=mechType, p[2]=hKey                    |
| 49    | `C_Verify`            | Pubkey auth | p[0]=hSession, p[1]=dataLen, p[2]=sigLen                   |
| 59    | `C_GenerateKeyPair`   | ECDH        | p[0]=hSession, p[1]=mechType, payload=templates            |
| 90    | `C_GenerateRandom`    | Nonces, IVs | p[0]=hSession, p[1]=len                                    |
| 91    | `C_DeriveKey`         | ECDH secret | p[0]=hSession, p[1]=mechType, p[2]=baseKey, payload=params |

**New command IDs needed** (not in current handler):

| cmdId | Function         | Needed for         |
| ----- | ---------------- | ------------------ |
| 92    | `C_DigestInit`   | Future: use_hasher |
| 93    | `C_Digest`       | Future: use_hasher |
| 94    | `C_DigestUpdate` | Future: use_hasher |
| 95    | `C_DigestFinal`  | Future: use_hasher |

## Detailed Implementation

### File 1: `pkcs11_rpc_wasm.c` (NEW — replaces `pkcs11_log_wasm.c`)

**Location:** `/tmp/strongswan-build/strongswan-6.0.5/src/libstrongswan/plugins/pkcs11/`

**Purpose:** Wrap every CK_FUNCTION_LIST entry with an RPC call that:

1. Serializes arguments into the PKCS#11 SAB
2. Posts `PKCS11_RPC` message to main thread via `postMessage`
3. Blocks on `Atomics.wait` until main thread processes and replies
4. Deserializes return value and output parameters from SAB

**Key design decisions:**

- Use `EM_ASM` for `postMessage` (triggers bridge → RPC handler)
- Use `emscripten_atomic_wait_u32` for blocking (Emscripten's Atomics.wait wrapper)
- SAB pointer stored in a global `g_pkcs11_sab` set by `pkcs11_set_rpc_sab()`
- Binary data (signatures, public keys) copied to/from SAB payload area at byte 48+

**Critical functions to implement (IKE handshake path):**

```
MUST HAVE (used during current IKE handshake):
  rpc_C_Initialize          — cmdId 0
  rpc_C_GetSlotList         — cmdId 4
  rpc_C_GetTokenInfo        — cmdId 6
  rpc_C_GetMechanismList    — cmdId 7
  rpc_C_OpenSession         — cmdId 12
  rpc_C_CloseSession        — cmdId 13
  rpc_C_Login               — cmdId 18
  rpc_C_GenerateRandom      — cmdId 90
  rpc_C_GenerateKeyPair     — cmdId 59
  rpc_C_GetAttributeValue   — cmdId 24
  rpc_C_DeriveKey           — cmdId 91
  rpc_C_FindObjectsInit     — cmdId 26
  rpc_C_FindObjects         — cmdId 27
  rpc_C_FindObjectsFinal    — cmdId 28

NICE TO HAVE (for pubkey auth):
  rpc_C_SignInit            — cmdId 42
  rpc_C_Sign                — cmdId 43
  rpc_C_VerifyInit          — cmdId 48
  rpc_C_Verify              — cmdId 49

PASSTHROUGH (delegate to static softhsmv3 for now):
  All other C_* functions → call real_fl->C_Xxx() directly
```

**Example implementation pattern:**

```c
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/atomic.h>

static uint8_t *g_pkcs11_sab = NULL;
static CK_FUNCTION_LIST *real_fl = NULL;

// Helper: trigger RPC and wait for result
static CK_RV rpc_call(int cmdId) {
    int32_t *flag = (int32_t *)g_pkcs11_sab;

    // Write command ID
    __c11_atomic_store((_Atomic int32_t *)&flag[0], cmdId, __ATOMIC_SEQ_CST);

    // Signal ready
    __c11_atomic_store((_Atomic int32_t *)&flag[1], 1, __ATOMIC_SEQ_CST);

    // Notify main thread via postMessage
    EM_ASM({
        postMessage({type: 'PKCS11_RPC'});
    });

    // Block until main thread sets flag[1] = 2
    emscripten_atomic_wait_u32((int32_t *)&flag[1], 1, -1);

    // Read return value
    CK_RV rv = (CK_RV)__c11_atomic_load((_Atomic int32_t *)&flag[2], __ATOMIC_SEQ_CST);

    // Reset state
    __c11_atomic_store((_Atomic int32_t *)&flag[1], 0, __ATOMIC_SEQ_CST);

    return rv;
}

static CK_RV rpc_C_GenerateRandom(CK_SESSION_HANDLE h, CK_BYTE_PTR data, CK_ULONG len) {
    int32_t *p = (int32_t *)(g_pkcs11_sab + 48);
    p[0] = (int32_t)h;
    p[1] = (int32_t)len;

    CK_RV rv = rpc_call(90);  // CMD_C_GenerateRandom

    if (rv == CKR_OK && data) {
        memcpy(data, g_pkcs11_sab + 48 + 8, len);  // Read random bytes from payload
    }
    return rv;
}

// ... similar for each function
#endif
```

### File 2: `pkcs11_library.c` (MODIFY)

**Change:** Replace logging wrapper call with RPC wrapper call.

```c
#ifdef __EMSCRIPTEN__
{
    // OLD: extern CK_FUNCTION_LIST *pkcs11_wasm_wrap_function_list(CK_FUNCTION_LIST *orig);
    // NEW:
    extern CK_FUNCTION_LIST *pkcs11_wasm_rpc_function_list(CK_FUNCTION_LIST *orig);
    this->public.f = pkcs11_wasm_rpc_function_list(this->public.f);
    DBG1(DBG_CFG, "WASM: wrapped PKCS#11 function list with RPC interceptor");
}
#endif
```

### File 3: `strongswan_worker.js` (MODIFY)

**Changes:**

1. After WASM initialization, pass PKCS#11 SAB pointer to C:

```javascript
// In onRuntimeInitialized or after successCallback:
if (self.Module._pkcs11_set_rpc_sab && pkcs11Sab) {
  // Can't pass SAB directly to C — store on Module for EM_ASM access
  self.Module._pkcs11_rpc_sab = pkcs11Sab
  // Tell C code where the SAB is (pass buffer address in WASM memory)
  // NOTE: SAB is NOT in WASM memory — it's a JS SharedArrayBuffer.
  // The C code accesses it via EM_ASM which can read JS globals.
}
```

**Important design note:** The PKCS#11 SAB is a JS `SharedArrayBuffer`, NOT in WASM linear
memory. The C RPC wrappers must use `EM_ASM` to read/write it, similar to how `socket_wasm.c`
uses `EM_JS` to access `Module._wasm_net_sab`. This means:

- `g_pkcs11_sab` in C is NOT a C pointer — it's accessed via `EM_ASM`
- All SAB reads/writes happen in embedded JS blocks
- This is the same pattern as `wasm_net_receive`/`wasm_net_send` in `socket_wasm.c`

### File 4: `bridge.ts` (VERIFY — likely no change)

The bridge already handles `PKCS11_RPC`:

```typescript
case 'PKCS11_RPC':
    if (this.rpcHandler) {
        this.rpcHandler(pkcs11Sab, role)
    }
```

The RPC handler in VpnSimulationPanel.tsx reads the command from the SAB, dispatches
to softhsmv3, writes the result, and calls `Atomics.notify`. No changes needed.

### File 5: `VpnSimulationPanel.tsx` (MINOR — add missing cmdIds)

The RPC handler needs new command IDs for operations not currently supported:

| cmdId | Operation            | Handler code                                             |
| ----- | -------------------- | -------------------------------------------------------- |
| 90    | `C_GenerateRandom`   | `M._C_GenerateRandom(hSess, buf, len)` → copy to SAB     |
| 91    | `C_DeriveKey`        | `M._C_DeriveKey(hSess, mech, baseKey, tpl, cnt, newKey)` |
| 7     | `C_GetMechanismList` | `M._C_GetMechanismList(slot, list, count)`               |
| 6     | `C_GetTokenInfo`     | `M._C_GetTokenInfo(slot, info)`                          |

Some of these may already be handled; need to verify and add any missing ones.

## Synchronization Protocol

### Worker → Main Thread → Worker

```
Step  Worker (C/EM_ASM)              SAB state           Main Thread (JS)
────  ──────────────────             ─────────           ────────────────
1     Write cmdId to flag[0]         [cmd, 0, 0]
2     Write args to p[0..n]          [cmd, 0, 0, args]
3     Store flag[1] = 1              [cmd, 1, 0, args]   (sees flag[1]=1)
4     postMessage('PKCS11_RPC')                           bridge routes to handler
5     Atomics.wait(flag[1], 1)       BLOCKED              handler reads cmd + args
6                                                         calls softhsmv3 C_Xxx()
7                                                         writes rv to flag[2]
8                                                         writes result to payload
9                                    [cmd, 2, rv, result] stores flag[1] = 2
10                                                         Atomics.notify(flag[1])
11    wakes up                       [cmd, 2, rv, result]
12    reads flag[2] (rv)
13    reads result from payload
14    stores flag[1] = 0             [cmd, 0, rv, result] (idle)
15    returns rv to caller
```

### Concurrency Safety

- Each worker has its own PKCS#11 SAB (initiator vs responder)
- Only one PKCS#11 call active per worker at a time (strongSwan is single-threaded)
- Main thread processes one RPC at a time per SAB (handler is synchronous)
- No lock contention possible

## What Does NOT Change (hard-won stability)

Everything below was debugged over a full day and MUST NOT be touched:

- **Plugin load order:** `pkcs11 nonce aes sha1 sha2 hmac kdf` — dependency ordering is critical
- **Plugin constructor registration:** 9 explicit `plugin_constructor_register()` calls in charon.c (Emscripten dlsym doesn't work)
- **Config injection:** `STRONGSWAN_CONF_DATA` via ENV → `load_string()` in library.c
- **EMULATE_FUNCTION_POINTER_CASTS=1** in Makefile — required for strongSwan's vtable pattern
- **USE_IKEV2** in config.h
- **All pthread guards:** sender.c, receiver.c, daemon.c, socket_manager.c, processor.c, scheduler.c
- **Inline job execution:** processor.c `queue_job` + scheduler.c timed job drop
- **Synchronous initiate:** charon.c NULL callback
- **socket_wasm.c:** EM_JS network I/O with 24-byte SAB header
- **pkcs11_dh.c:** RW session + C_Login + contiguous ECDH1_DERIVE_PARAMS allocation
- **IKE proposal:** `aes256-sha256-ecp256` (no MODP groups — softhsmv3 lacks CKM_DH_PKCS_DERIVE)

The ONLY change point is `pkcs11_library.c:1143-1149` — swapping which wrapper function is called on the CK_FUNCTION_LIST pointer. This happens AFTER all plugin loading is complete.

## Risks and Mitigations

| Risk                                         | Probability | Impact | Mitigation                                                                              |
| -------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------- |
| SAB size overflow (large signature/key data) | Low         | High   | Assert payload size < 60KB; increase SAB if needed                                      |
| Deadlock if main thread blocks on same SAB   | None        | —      | Main thread never calls Atomics.wait on PKCS#11 SAB                                     |
| `postMessage` delay in high-load scenarios   | Low         | Low    | postMessage is async but handler runs synchronously                                     |
| `Atomics.wait` not available in main thread  | N/A         | —      | Main thread uses `Atomics.notify` only; wait is worker-side                             |
| Token not initialized when RPC arrives       | Low         | Medium | `wasm_hsm_init.c` runs before charon; tokens exist                                      |
| Session handle mismatch between instances    | Medium      | High   | Main thread softhsmv3 opens its own sessions; C-side session handles are RPC-translated |

### Session Handle Translation (Important)

The statically-linked softhsmv3 and the main thread softhsmv3 are **separate instances**
with different session handle spaces. The RPC handler must:

1. Open its own sessions on the main thread softhsmv3 (via `C_OpenSession`)
2. Map worker-side session handles to main-thread session handles
3. This is already done in the current RPC handler (cmdId 12 auto-opens sessions)

Alternatively: the RPC handler can maintain a single persistent session per slot
and ignore the worker-side session handle entirely.

## Testing Plan

### Functional Tests

1. Start daemon → PKCS#11 log panel shows:
   - `C_Initialize` (startup)
   - `C_GetSlotList` / `C_GetTokenInfo` / `C_GetMechanismList` (discovery)
   - `C_Login` (authentication)
   - `C_GenerateKeyPair` (ECDH keygen, both sides)
   - `C_DeriveKey` (ECDH shared secret, both sides)
   - `C_GenerateRandom` (nonces, IVs)
2. Keys section shows EC key pairs and RSA keys
3. IKE_SA established (4 packets, PSK auth)
4. No `[PKCS11]` entries in charon.log (all routed through RPC)

### Performance Tests

- Handshake completes in <5 seconds (same as current)
- No visible UI lag during crypto operations

### Regression Tests

- Other Playground tabs (HsmKeyInspector, KEM, Sign/Verify) still work
- softhsmv3 shared instance not corrupted by VPN operations

## Estimated Effort

| Phase                         | Effort         | Files                                     |
| ----------------------------- | -------------- | ----------------------------------------- |
| Phase 1: `pkcs11_rpc_wasm.c`  | 4-6 hours      | 1 new C file (~500 LOC)                   |
| Phase 2: Wire SAB             | 1 hour         | `pkcs11_library.c`, worker JS             |
| Phase 3: Worker trigger       | 1 hour         | `strongswan_worker.js`                    |
| Phase 4: Command ID alignment | 2 hours        | `VpnSimulationPanel.tsx`, verify existing |
| WASM rebuild + test           | 1-2 hours      | Build + deploy + debug                    |
| **Total**                     | **9-12 hours** |                                           |

## Toggle Design: Default (Static) vs RPC Mode

The RPC model is implemented as an **opt-in toggle**, not a replacement. The current
static C→C path remains the default. Users can enable RPC mode via a UI toggle.

### Default Mode (Static — current, proven)

- charon calls statically-linked softhsmv3 directly in the worker
- PKCS#11 calls logged via EM_ASM to charon.log panel
- PKCS#11 log panel empty (different softhsmv3 instance)
- Keys section empty
- IKE_SA establishes reliably

### RPC Mode (opt-in toggle)

- charon calls RPC wrappers that route through SAB to main thread
- Main thread's softhsmv3 processes calls
- PKCS#11 log panel populated with real entries
- Keys section shows HSM keys
- May have edge cases (session mapping, timing)

### Implementation

- UI: Toggle switch in VPN panel toolbar (next to PSK input)
- State: `rpcMode` boolean in VpnSimulationPanel
- Bridge: `strongSwanEngine.init(..., { rpcMode: true/false })`
- Worker: passes `rpcMode` flag in INIT payload
- C layer: `pkcs11_library.c` checks a global flag set from JS:
  - `rpcMode=false` → install logging wrapper (current `pkcs11_log_wasm.c`)
  - `rpcMode=true` → install RPC wrapper (new `pkcs11_rpc_wasm.c`)
- Both wrappers use the same `pkcs11_wasm_wrap_function_list` signature

### Rollback safety

If RPC mode fails, user toggles back to default. No daemon restart needed —
toggle takes effect on next "Start Daemon" click (fresh worker pair).

## Open Questions

1. **Should `wasm_hsm_init.c` keygen also go through RPC?** Currently it runs before
   charon and calls softhsmv3 directly in C. If routed through RPC, the token setup
   would also appear in the log panel. But this requires the RPC infrastructure to be
   available before `_main()` is called.

2. **Should the static softhsmv3 be removed from the WASM binary?** If ALL PKCS#11
   calls go through RPC, the statically-linked softhsmv3 is dead code (~2MB). Removing
   it reduces binary size but requires reworking `wasm_hsm_init.c` to also use RPC.

3. **Persistent sessions vs per-call sessions?** The RPC handler currently opens/closes
   sessions per operation. For performance, keeping a persistent session per slot
   (opened once at init) would reduce round-trips.
