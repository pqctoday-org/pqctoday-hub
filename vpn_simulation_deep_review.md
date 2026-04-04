# StrongSwan VPN PQC Simulation — Deep Code Review
**Date:** 2026-04-03  
**Scope:** `strongswan_worker.js`, `bridge.ts`, `VpnSimulationPanel.tsx`  
**Focus:** Root-cause analysis for "stuck at Awaiting Negotiation"

---

## EXECUTIVE SUMMARY — WHY IT STAYS STUCK

There are **6 distinct bugs** that combine to prevent the IKEv2 handshake from progressing. The most critical are listed first.

---

## 🔴 ROOT CAUSE #1: `C_GetMechanismInfo` returns flags=0 — charon rejects every mechanism

**File:** `strongswan_worker.js` line 379  
**What happens:** When charon queries `C_GetMechanismInfo` for any mechanism (RSA, ML-KEM, etc.), the stub returns `flags = 0`. The comment says `CKF_HW | CKF_SIGN = 0x200 | 0x0200` but the actual code writes `0`.

**Why this blocks:** StrongSwan's pkcs11 plugin checks mechanism flags to determine capabilities. With no `CKF_SIGN` (0x2000), `CKF_VERIFY` (0x4000), `CKF_ENCRYPT` (0x100), or `CKF_GENERATE_KEY_PAIR` (0x10000) flags set, charon concludes the token offers **zero usable operations** and skips every loaded key/mechanism. The IKE negotiation never starts because no authentication method is available.

**The fix value should be:** At minimum `0x10301` for generic operations, or mechanism-specific flags:
- RSA signing mechanisms: `CKF_SIGN | CKF_VERIFY | CKF_HW` = `0x6001`
- Key pair generation: `CKF_GENERATE_KEY_PAIR | CKF_HW` = `0x10001`
- ML-KEM: `CKF_DERIVE | CKF_HW` = `0x80001` (or encapsulate-specific flags)

---

## 🔴 ROOT CAUSE #2: Both workers share a SINGLE SoftHSMv3 WASM instance — PKCS#11 session state collides

**File:** `VpnSimulationPanel.tsx` lines 266-744  
**What happens:** The `setRpcHandler` callback on the main thread calls `M._C_OpenSession()`, `M._C_FindObjects()`, `M._C_Sign()` etc. on the **same** `moduleRef.current` Emscripten module. When both the initiator and responder worker fire `PKCS11_RPC` messages, the main thread services them **sequentially on the same WASM state machine**.

**Why this blocks:** SoftHSMv3's session objects, find-cursors, and sign-init state are **per-session in WASM memory**. If the initiator's `C_FindObjectsInit` → `C_FindObjects` sequence is interrupted by the responder's `C_FindObjectsInit` on the same WASM session handle, the cursor is **reset** and the initiator gets zero results or wrong-role results. Since both workers spin up simultaneously, this race is practically guaranteed.

**Specific collision paths:**
- Initiator calls `C_SignInit` → responder calls `C_SignInit` on same hSession → initiator's `C_Sign` fails with `CKR_OPERATION_NOT_INITIALIZED`
- Initiator calls `C_FindObjectsInit` → responder calls `C_FindObjectsInit` → initiator's cursor is destroyed

---

## 🔴 ROOT CAUSE #3: `C_GetAttributeValue` always uses `hSessionRef.current` instead of the RPC session

**File:** `VpnSimulationPanel.tsx` lines 393, 405  
**What happens:** The handler reads `p[0]` as the hSession from charon, but then ignores it and calls:
```
M._C_GetAttributeValue(hSessionRef.current, hObj, tpl1, attrCount)
```
This always uses the **client UI session** (slot 0), not the session charon opened via `C_OpenSession`. When charon tries to read attributes for a key on slot 1 (server), it fails silently because `hSessionRef.current` doesn't have access to slot 1 objects.

---

## 🟡 ROOT CAUSE #4: `C_VerifyInit` writes `paramLen` as the mechanism parameter pointer instead of copying bytes

**File:** `VpnSimulationPanel.tsx` lines 564-567  
**What happens:**
```js
M.setValue(mechPtr48, mechType48, 'i32')
M.setValue(mechPtr48 + 4, 0, 'i32')       // pParameter = NULL
M.setValue(mechPtr48 + 8, paramLen48, 'i32')  // ulParameterLen = paramLen48
```
The `pParameter` field is set to 0 (NULL), but `ulParameterLen` is set to a non-zero value. SoftHSMv3 will reject this combination with `CKR_MECHANISM_PARAM_INVALID` for any mechanism that validates parameter consistency. Compare with `C_SignInit` (line 512-518) which correctly allocates and copies param bytes.

---

## 🟡 ROOT CAUSE #5: Packet delivery race — initiator fires `IKE_SA_INIT` before responder's `poll()` is blocking

**File:** `bridge.ts` lines 88-90, `strongswan_worker.js` lines 191-228  
**What happens:** The `READY` gate waits for both workers to fire `onRuntimeInitialized`. But `onRuntimeInitialized` fires **before** `_main()` runs. After `_main()` starts, charon goes through:
1. Load configs → parse ipsec.conf  
2. Initialize pkcs11 plugin → PKCS11 RPC calls (C_Initialize, C_GetSlotList, etc.)  
3. Create socket → bind → **start IKE negotiation** (initiator sends IKE_SA_INIT)

The responder must reach step 3 (`poll()` blocking on the net SAB) **before** the initiator reaches step 3 (`sendto()`). But the `READY` count gate in `bridge.ts` only ensures both runtimes are initialized — not that both have reached the network-listening state. If the initiator's PKCS11 bootstrap completes faster, the `PACKET_OUT` for IKE_SA_INIT arrives **before** the responder has allocated its socket, and the packet is written to `respNetSab` while the responder is still in PKCS11 initialization — nobody is calling `Atomics.wait()` on it yet.

**Mitigating factor:** Since `Atomics.store` persists the state=1 flag, when the responder eventually calls `poll()`, it **should** see the packet. However, if the responder's charon calls `poll()` **before** the packet arrives (checking state, seeing 0, and blocking), but the initiator's packet arrival `Atomics.notify` fires **between** the responder's `Atomics.load` check and `Atomics.wait` call — the notification is lost. This is a classic ABA problem with the wait/notify pattern.

---

## 🟡 ROOT CAUSE #6: `C_OpenSession` always opens on SoftHSMv3 slot 0 regardless of charon's requested slotId

**File:** `VpnSimulationPanel.tsx` line 343  
```js
const r12 = M._C_OpenSession(0, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, sessPtr) >>> 0
```
The handler maps the logical `slotId12` from charon but then hardcodes `0` in the actual `M._C_OpenSession()` call. Both client and server tokens are forced onto SoftHSMv3's physical slot 0. This means:
- All sessions see ALL objects (both client and server keys)
- The `C_FindObjects` slot-filtering logic (lines 469-487) must compensate for this by filtering post-hoc using `hsmKeysRef`, but this is fragile and depends on the UI key-generation state being perfectly synchronized

---

## STRENGTHS

| Area | Assessment |
|------|-----------|
| **RPC Wire Protocol** | The `SharedArrayBuffer` + `Atomics.wait/notify` pattern is correct and avoids Asyncify overhead. The flag layout `[cmdId, state, rv]` with payload at byte 48 is clean. |
| **Syscall Interception** | The `sendto`/`recvfrom`/`poll` overrides correctly parse `sockaddr_in` structs and handle the lifecycle. The `heap8.slice()` in sendto (copy before heap moves) is a critical correctness detail done right. |
| **PKCS11 Template Serialization** | The `C_FindObjectsInit` (both worker-side and main-thread-side) correctly serializes/deserializes `CK_ATTRIBUTE` templates with byte blobs, handling variable-length attribute values. |
| **Dual Worker Architecture** | Each worker gets independent PKCS11 and Network SABs. The IP-based routing in `PACKET_OUT` is clean. The transferable ArrayBuffer optimization (`[data.buffer]`) avoids copies. |
| **Error Boundary** | The catch-all in the RPC handler returns `CKR_FUNCTION_NOT_SUPPORTED` (0x50) on exceptions, preventing worker deadlocks from uncaught errors. |

---

## GAPS & TECHNICAL DEBT

### Session Isolation (Critical)
Both workers route all PKCS#11 calls to the **same** SoftHSMv3 WASM module on the main thread. There is no mutex, semaphore, or session partitioning. If both workers have active RPC calls in-flight simultaneously, state corruption is inevitable.

### Missing PKCS#11 Functions
The following functions are **not implemented** but charon may call them depending on the IKE configuration:
- `C_DigestInit` / `C_Digest` (offset 34/35) — needed for IKEv2 PRF calculations when using PKCS#11 for HMAC
- `C_WrapKey` / `C_UnwrapKey` (offset 60/61) — needed for some key exchange methods
- `C_SeedRandom` / `C_GenerateRandom` (offset 64/65) — charon calls these if the token advertises `CKF_RNG`

### C_GetTokenInfo Struct Alignment
The `CK_TOKEN_INFO` struct is written starting at `payload[4]` with a `DataView` offset of `48 + 4`. But the TOKEN_INFO struct is 160 bytes and the DataView field offsets (lines 310-320) write to offsets 96-136 **within the DataView** — which corresponds to bytes `48+4+96 = 148` to `48+4+136 = 188` in the SAB. This is correct, but the `payloadView.fill(0x20, 4, 100)` only pads 96 bytes while the string fields in TOKEN_INFO span exactly 96 bytes (label[32] + mfr[32] + model[16] + serial[16]). This is correct by coincidence but undocumented.

### 64KB SharedArrayBuffer Ceiling
ML-DSA-87 signatures are 4627 bytes. ML-DSA-65 signatures are 3309 bytes. SPHINCS+-SHA2-256f signatures are 49856 bytes. The 64KB SAB `(65536 - 48 = 65488 bytes usable)` can hold these, but an ML-KEM-1024 ciphertext (1568 bytes) plus PKCS11 template serialization overhead could exceed the payload area for complex `C_GenerateKeyPair` calls with many attributes.

### Configuration Validity
The `ipsec.conf` uses `ike=aes256-mlkem768-sha384!` but StrongSwan's parser expects specific proposal syntax. If the charon WASM binary doesn't have the ML-KEM plugin compiled in, this proposal string will be rejected silently and charon falls back to no valid proposal — which means IKE_SA_INIT is never sent.

---

## RPC DISPATCH MATRIX

| cmdId | PKCS#11 Function | Worker Stub | Main Handler | Correctness |
|:---:|:---|:---:|:---:|:---:|
| 0 | C_Initialize | ✅ | ✅ | ✅ |
| 1 | C_Finalize | ✅ | ✅ stub | ✅ |
| 2 | C_GetInfo | ✅ local | — | ✅ |
| 4 | C_GetSlotList | ✅ | ✅ hardcoded | ⚠️ |
| 5 | C_GetSlotInfo | ✅ local | — | ✅ |
| 6 | C_GetTokenInfo | ✅ | ✅ | ✅ |
| 7 | C_GetMechanismList | ✅ | ✅ | ✅ |
| 8 | C_GetMechanismInfo | ✅ local | — | 🔴 flags=0 |
| 12 | C_OpenSession | ✅ | ✅ | ⚠️ hardcoded slot 0 |
| 13 | C_CloseSession | ✅ | ✅ | ✅ |
| 15 | C_GetSessionInfo | ✅ local | — | ✅ |
| 18 | C_Login | ✅ | ✅ stub | ✅ |
| 19 | C_Logout | ✅ | ✅ | ✅ |
| 24 | C_GetAttributeValue | ✅ | ✅ | 🔴 wrong session |
| 26 | C_FindObjectsInit | ✅ | ✅ | ✅ |
| 27 | C_FindObjects | ✅ | ✅ filtered | ⚠️ race-prone |
| 28 | C_FindObjectsFinal | ✅ | ✅ | ✅ |
| 42 | C_SignInit | ✅ | ✅ | ✅ |
| 43 | C_Sign | ✅ | ✅ | ✅ |
| 48 | C_VerifyInit | ✅ | ✅ | 🟡 param bug |
| 49 | C_Verify | ✅ | ✅ | ✅ |
| 59 | C_GenerateKeyPair | ✅ | ✅ | ✅ |
| 62 | C_DeriveKey | ✅ stub | — | ⚠️ 0x50 |
| 68 | C_EncapsulateKey | ✅ | ✅ | ✅ |
| 69 | C_DecapsulateKey | ✅ | ✅ | ✅ |

---

## PRIORITY FIX ORDER

1. **`C_GetMechanismInfo` flags = 0** → Set proper capability flags. This alone may unblock the entire handshake.
2. **`C_GetAttributeValue` uses wrong session** → Use `p[0]` (the hSession from charon) instead of `hSessionRef.current`.
3. **`C_VerifyInit` param/pointer mismatch** → Copy param bytes like `C_SignInit` does.
4. **`C_OpenSession` slot hardcoding** → Map slotId from charon to actual SoftHSMv3 slots.
5. **Session collision** → Serialize RPC handling or use separate SoftHSMv3 sessions per worker.
6. **Packet delivery timing** → Add explicit "poll-ready" signal from responder before initiator starts.
