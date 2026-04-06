# StrongSwan VPN PQC Simulation Review

**Date:** 2026-04-03
**Focus:** `charon` WASM, PKCS#11 JS RPC Bridge, SoftHSMv3 PQC, Network Loopback.

## 1. Strengths

- **Fully Zero-Latency IKEv2 Network Engine:** The dual-worker emulation (Initiator on `192.168.0.1`, Responder on `192.168.0.2`) leverages intercepted C-level syscalls (`socket`, `bind`, `sendto`, `recvfrom`, `poll`). Routing occurs flawlessly natively via `SharedArrayBuffer` memory mapping. No DOM interactions or HTTP overhead slows down the IKEv2 handshake simulation.
- **Synchronous RPC Execution without Asyncify:** By passing 64KB PKCS#11 `SharedArrayBuffers` and using `Atomics.wait()`/`Atomics.notify()`, the simulation freezes the `charon` web worker execution safely, punts PKCS#11 structs onto the React main thread to trigger SoftHSMv3 (PQC logic), and then resumes execution. This avoids `emscripten asyncify` bloat completely.
- **State-of-the-art PQC Alignment:** The mechanism list (`C_GetMechanismList`) explicitly includes `CKM_ML_KEM` (`0x1058`), allowing the unmodified StrongSwan binary to negotiate NIST-standard Hybrid ML-KEM + ECDH encapsulations securely bridging directly into the `hsm_` WASM libraries natively through `C_EncapsulateKey`.

## 2. Weaknesses

- **God-Key Constraints & Brittle Key Filtering:** Currently, PKCS#11 Slot matching relies entirely on UI heuristics filtering the returned handles within `C_FindObjects` by determining the `workerRole` (`init` vs `resp`). While it works, doing deep integration where `C_FindObjectsInit` translates fully nested filter matrices is ignored for simplicity.
- **Spoofed X.509 Identities:** Because PQC X.509 cert chains are difficult to generate natively in a browser context across composite keys, `ipsec.conf` uses `%smartcard1` / `leftauth=pubkey`. StrongSwan skips certificate chain building and "blindly trusts" the Public keys extracted via `C_GetAttributeValue`.
- **Static IP Routing Assumptions:** The mock networking interface strictly monitors port `500` and the UDP space associated with `192.168.0.1` and `192.168.0.2`. Any changes via `charon` configuration formats would require deep manual edits to `bridge.ts` to accommodate the new destination routing masks.

## 3. Gaps & Technical Debt

- **MTU Buffer Exhaustion (Max 64KB):** Post-Quantum payload matrices (especially when incorporating ML-DSA / SPHINCS+ signatures) are astronomically large.
  - **The Threat:** If an `IKE_AUTH` packet or PKCS#11 payload serialises over 65536 bytes, the `SharedArrayBuffer` (both network and RPC queues) will immediately trigger memory out-of-bounds corruption and cause `charon` to ABORT asynchronously.
- **Hardcoded HSM Security Boundary:** Currently `C_Login` relies on mocked tokens matching `user1234` inside `strongswan_worker.js`. StrongSwan isn't being natively challenged.
- **TypeScript Typings:** `any` types remain littered throughout `VpnSimulationPanel` across the DataViews and pointer marshalling because `SoftHSMModule` does not export deep C-level structure types locally.

## 4. RPC Dispatch Verification Map

| Function                | C-Intercept | React Marshalling Status  | Status |
| :---------------------- | :---------- | :------------------------ | :----: |
| `C_Initialize`          | Supported   | Mapped                    |   ✅   |
| `C_GetTokenInfo`        | Spoofed     | Static DataView           |   ✅   |
| `C_GetMechanismList`    | Supported   | Returns `CKM_ML_KEM`      |   ✅   |
| `C_OpenSession` / Login | Hardcoded   | Fake Pin                  |   ⚠️   |
| `C_FindObjects`         | Supported   | Aliased Slot ID Filtering |   ✅   |
| `C_GetAttributeValue`   | Supported   | 2-pass Malloc Binding     |   ✅   |
| `C_Sign`                | Supported   | Size-Hinting Valid        |   ✅   |
| `C_EncapsulateKey`      | Supported   | Full Pointer Marshaling   |   ✅   |
| `C_DecapsulateKey`      | Supported   | Full Pointer Marshaling   |   ✅   |
