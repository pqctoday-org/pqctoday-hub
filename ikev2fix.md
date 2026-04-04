# IKEv2 In-Browser Loopback — Implementation Plan

## Problem

Charon (strongSwan WASM) is a real IKEv2 stack. It sends real UDP packets to 192.168.0.2:500
and waits for responses. There is no responder, so it retransmits indefinitely. The PKCS#11
bridge works; the network layer does not.

## Solution

Run **two charon workers** — initiator (192.168.0.1) and responder (192.168.0.2) — and
implement a **JavaScript in-memory UDP loopback** between them. No browser networking.
No packet parsing. Each side handles its own IKEv2 logic; the JS layer just routes bytes.

```
Worker A: initiator (192.168.0.1)      Worker B: responder (192.168.0.2)
  charon _main()                          charon _main()
    ↓ syscall_sendto(fd, buf)               ↓ syscall_poll → Atomics.wait(netSAB-B)
  imports.env.m override                  imports.env.A override
    ↓ postMessage(PACKET_OUT, pkt)        ← Atomics.notify from main thread
         ↓                                   ↑
         └─────────── Main Thread ───────────┘
                   receives PACKET_OUT
                   writes pkt into netSAB-B
                   Atomics.store(netSAB-B, STATE=1)
                   Atomics.notify(netSAB-B)
```

Same path in reverse for B→A.

---

## Confirmed WASM Import Keys (from strongswan.js wasmImports)

These are the minified keys in `imports.env.*` that we intercept via `instantiateWasm`:

| Key | Syscall             | Why we intercept                              |
|-----|---------------------|-----------------------------------------------|
| `f` | `___syscall_socket` | Detect IKE socket creation; return fake fd    |
| `q` | `___syscall_bind`   | Note bound address/port; return 0             |
| `p` | `___syscall_connect`| No-op (UDP connect just sets default dest)    |
| `m` | `___syscall_sendto` | Capture outbound IKE packet → main thread     |
| `n` | `___syscall_recvfrom`| Deliver buffered inbound packet; block if none|
| `A` | `___syscall_poll`   | Block on Atomics.wait until packet arrives    |
| `j` | `___syscall_ioctl`  | Return 0 (FIONBIO no-op)                      |

Already intercepted (PKCS#11 bridge):

| Key | Syscall          |
|-----|------------------|
| `l` | `wasm_dlopen`    |
| `k` | `wasm_dlsym`     |

---

## SharedArrayBuffer Layouts

### Network Inbox SAB (one per worker, 64 KB)

Passed in `INIT` message alongside the existing PKCS#11 SAB.

```
Offset  Size  Field
0       4     state: 0=EMPTY, 1=PACKET_READY, 2=CONSUMED (Int32)
4       4     pktLen: byte length of packet in data area (Int32)
8       4     srcIp: IPv4 as uint32 big-endian (Int32)
12      4     srcPort: UDP port (Int32)
16      65519 data: raw IKEv2 UDP payload
```

**Main thread → worker delivery sequence:**
```js
netInboxI32[1] = pkt.length
netInboxI32[2] = srcIp
netInboxI32[3] = srcPort
netInboxBytes.set(pkt, 16)          // write packet
Atomics.store(netInboxI32, 0, 1)    // mark PACKET_READY
Atomics.notify(netInboxI32, 0, 1)   // wake blocked poll/recvfrom
```

**Worker read sequence (inside recvfrom override):**
```js
Atomics.wait(netInboxI32, 0, 0)       // block until != EMPTY
const len = netInboxI32[1]
const pkt = netInboxBytes.slice(16, 16 + len)
Atomics.store(netInboxI32, 0, 0)      // mark EMPTY → ready for next
return len
```

### PKCS#11 RPC SAB (unchanged, one per worker)

Layout is the same as today: `[0]=cmdId [1]=state [2]=rv`, payload at byte 48.
Each worker gets its own SAB so their PKCS#11 calls don't collide.

---

## New Worker Message Protocol

### Main → Worker

| type            | payload                          | meaning                        |
|-----------------|----------------------------------|--------------------------------|
| `INIT`          | `{ configs, pkcs11Sab, netSab, role }` | existing + new fields    |

`role`: `'initiator'` or `'responder'` — used for logging only.

### Worker → Main

| type         | payload                                         | meaning                     |
|--------------|-------------------------------------------------|-----------------------------|
| `LOG`        | `{ level, text }`                               | unchanged                   |
| `PKCS11_RPC` | —                                               | unchanged                   |
| `READY`      | —                                               | unchanged                   |
| `ERROR`      | string                                          | unchanged                   |
| `PACKET_OUT` | `{ destIp, destPort, srcIp, srcPort, data: ArrayBuffer }` | outbound IKE packet |

---

## File Changes

### 1. `public/wasm/strongswan_worker.js`

Add network state variables at the top:

```js
let netInboxSab = null      // network inbox SAB (main→worker delivery)
let netInboxI32 = null      // Int32Array view of netInboxSab
let netInboxBytes = null    // Uint8Array view of netInboxSab
let ikeSocketFd = -1        // fd charon assigned to IKE UDP socket
let boundIp = 0             // our bound IPv4 (from bind() call)
let boundPort = 0           // our bound port (500 or 4500)
```

In the `INIT` handler, extract `netSab`:

```js
if (initPayload.netSab) {
  netInboxSab = initPayload.netSab
  netInboxI32   = new Int32Array(netInboxSab, 0, 4)
  netInboxBytes = new Uint8Array(netInboxSab, 0)
}
```

In `instantiateWasm`, after the existing dlopen/dlsym overrides, add:

```js
// ── socket (imports.env.f) ─────────────────────────────────────────
// domain=2=AF_INET, type=2=SOCK_DGRAM → IKE UDP socket
imports.env.f = (domain, type, _protocol) => {
  if (domain === 2 && type === 2) {
    ikeSocketFd = 42          // fake fd; consistent across all syscalls
    self.postMessage({ type: 'LOG', payload: { level: 'info',
      text: `[NET] socket(AF_INET, SOCK_DGRAM) → fd=${ikeSocketFd}` }})
    return ikeSocketFd
  }
  return -1  // ENOTSUP for anything else
}

// ── bind (imports.env.q) ──────────────────────────────────────────
// struct sockaddr_in: family[2] port[2BE] addr[4] pad[8]
imports.env.q = (fd, addrPtr, _addrLen) => {
  if (fd !== ikeSocketFd) return -1
  try {
    const heap8 = self.Module.HEAPU8
    boundPort = (heap8[addrPtr + 2] << 8) | heap8[addrPtr + 3]
    boundIp   = (heap8[addrPtr + 4] << 24) | (heap8[addrPtr + 5] << 16)
              | (heap8[addrPtr + 6] << 8)  |  heap8[addrPtr + 7]
    self.postMessage({ type: 'LOG', payload: { level: 'info',
      text: `[NET] bind fd=${fd} port=${boundPort}` }})
  } catch(_) {}
  return 0
}

// ── connect (imports.env.p) ───────────────────────────────────────
imports.env.p = (fd, _addr, _addrLen) => fd === ikeSocketFd ? 0 : -1

// ── ioctl (imports.env.j) ─────────────────────────────────────────
imports.env.j = (_fd, _req, _arg) => 0

// ── sendto (imports.env.m) ────────────────────────────────────────
// Capture outbound IKE packet and post to main thread for routing.
imports.env.m = (fd, bufPtr, len, _flags, destAddrPtr, _destAddrLen) => {
  if (fd !== ikeSocketFd) return -1
  try {
    const heap8 = self.Module.HEAPU8
    let destIp = 0, destPort = 0
    if (destAddrPtr) {
      destPort = (heap8[destAddrPtr + 2] << 8) | heap8[destAddrPtr + 3]
      destIp   = (heap8[destAddrPtr + 4] << 24) | (heap8[destAddrPtr + 5] << 16)
               | (heap8[destAddrPtr + 6] << 8)  |  heap8[destAddrPtr + 7]
    }
    const data = heap8.slice(bufPtr, bufPtr + len)  // copy before WASM heap moves
    self.postMessage({ type: 'PACKET_OUT',
      payload: { srcIp: boundIp, srcPort: boundPort, destIp, destPort,
                 data: data.buffer } }, [data.buffer])
    self.postMessage({ type: 'LOG', payload: { level: 'info',
      text: `[NET] sendto fd=${fd} len=${len} destPort=${destPort}` }})
  } catch(e) {
    self.postMessage({ type: 'LOG', payload: { level: 'error',
      text: `[NET] sendto error: ${e}` }})
  }
  return len
}

// ── recvfrom (imports.env.n) ──────────────────────────────────────
// Block until netInboxSab has a packet (state=1), then copy to WASM heap.
imports.env.n = (fd, bufPtr, len, _flags, srcAddrPtr, srcAddrLenPtr) => {
  if (fd !== ikeSocketFd || !netInboxI32) return -1
  // Block until PACKET_READY
  Atomics.wait(netInboxI32, 0, 0)  // wait while state === 0 (EMPTY)
  const pktLen = netInboxI32[1]
  const srcIp  = netInboxI32[2] >>> 0
  const srcPort = netInboxI32[3] >>> 0
  const copyLen = Math.min(pktLen, len)
  const heap8 = self.Module.HEAPU8
  heap8.set(netInboxBytes.subarray(16, 16 + copyLen), bufPtr)
  if (srcAddrPtr) {
    heap8[srcAddrPtr]     = 0;  heap8[srcAddrPtr + 1] = 2  // AF_INET
    heap8[srcAddrPtr + 2] = (srcPort >> 8) & 0xff
    heap8[srcAddrPtr + 3] = srcPort & 0xff
    heap8[srcAddrPtr + 4] = (srcIp >> 24) & 0xff
    heap8[srcAddrPtr + 5] = (srcIp >> 16) & 0xff
    heap8[srcAddrPtr + 6] = (srcIp >> 8)  & 0xff
    heap8[srcAddrPtr + 7] = srcIp & 0xff
    if (srcAddrLenPtr) self.Module.setValue(srcAddrLenPtr, 16, 'i32')
  }
  Atomics.store(netInboxI32, 0, 0)  // mark EMPTY → ready for next delivery
  self.postMessage({ type: 'LOG', payload: { level: 'info',
    text: `[NET] recvfrom → ${pktLen} bytes from port ${srcPort}` }})
  return copyLen
}

// ── poll (imports.env.A) ──────────────────────────────────────────
// fds points to array of struct pollfd { fd:i32, events:i16, revents:i16 }
// Block until packet arrives or timeout expires.
imports.env.A = (fdsPtr, nfds, timeout) => {
  if (!netInboxI32) return 0
  // Check if any polled fd is our IKE socket
  let hasIkeFd = false
  for (let i = 0; i < nfds; i++) {
    const fd = self.Module.getValue(fdsPtr + i * 8, 'i32')
    if (fd === ikeSocketFd) { hasIkeFd = true; break }
  }
  if (!hasIkeFd) return 0

  // If already have a packet, return immediately
  if (Atomics.load(netInboxI32, 0) === 1) {
    // Mark POLLIN on our fd's revents
    for (let i = 0; i < nfds; i++) {
      const fd = self.Module.getValue(fdsPtr + i * 8, 'i32')
      if (fd === ikeSocketFd) {
        self.Module.setValue(fdsPtr + i * 8 + 6, 1, 'i16')  // revents = POLLIN
      }
    }
    return 1
  }

  // Block with timeout (timeout=-1 means infinite)
  const waitMs = timeout < 0 ? 'infinite' : timeout
  const result = timeout < 0
    ? Atomics.wait(netInboxI32, 0, 0)
    : Atomics.wait(netInboxI32, 0, 0, timeout)

  if (result === 'ok' && Atomics.load(netInboxI32, 0) === 1) {
    for (let i = 0; i < nfds; i++) {
      const fd = self.Module.getValue(fdsPtr + i * 8, 'i32')
      if (fd === ikeSocketFd) {
        self.Module.setValue(fdsPtr + i * 8 + 6, 1, 'i16')  // revents = POLLIN
      }
    }
    return 1
  }
  return 0  // timeout
}
```

---

### 2. `src/wasm/strongswan/bridge.ts`

Replace the single-worker `StrongSwanEngine` with a dual-worker design.

**New state type:**

```ts
export type StrongSwanState = 'UNINITIALIZED' | 'LOADING' | 'READY' | 'RUNNING' | 'ERROR'
// 'READY' = both workers initialized, waiting to start IKE
// 'RUNNING' = IKE exchange in progress
```

**Class changes:**

```ts
export class StrongSwanEngine {
  private initWorker: Worker | null = null   // 192.168.0.1
  private respWorker: Worker | null = null   // 192.168.0.2

  // PKCS#11 SABs (one per worker, same layout as today)
  private initPkcs11Sab: SharedArrayBuffer | null = null
  private respPkcs11Sab: SharedArrayBuffer | null = null

  // Network inbox SABs (one per worker; main thread writes, worker reads)
  private initNetSab: SharedArrayBuffer | null = null  // packets TO initiator
  private respNetSab: SharedArrayBuffer | null = null  // packets TO responder

  // Packet counters for UI
  public packetCount = 0

  // rpcHandler now receives (sab, workerRole)
  private rpcHandler: ((sab: SharedArrayBuffer, role: 'initiator'|'responder') => void) | null = null
```

**Packet routing (inside `worker.onmessage`):**

```ts
case 'PACKET_OUT': {
  const { destIp, destPort, srcIp, srcPort, data } = payload
  const destIsResponder = (destIp >>> 0) === RESPONDER_IP_U32  // 0xC0A80002
  const targetSab = destIsResponder ? this.respNetSab : this.initNetSab
  if (!targetSab) break

  const i32 = new Int32Array(targetSab, 0, 4)
  const bytes = new Uint8Array(targetSab)
  const pkt = new Uint8Array(data)

  i32[1] = pkt.length
  i32[2] = srcIp
  i32[3] = srcPort
  bytes.set(pkt, 16)
  Atomics.store(i32, 0, 1)      // PACKET_READY
  Atomics.notify(i32, 0, 1)     // wake blocked poll/recvfrom
  this.packetCount++
  break
}
```

**init() becomes dual-worker:**

```ts
public init(initConfigs: Record<string, string>, respConfigs: Record<string, string>) {
  if (this.initWorker) return
  this.setState('LOADING')

  this.initPkcs11Sab = new SharedArrayBuffer(65536)
  this.respPkcs11Sab = new SharedArrayBuffer(65536)
  this.initNetSab    = new SharedArrayBuffer(65536)
  this.respNetSab    = new SharedArrayBuffer(65536)

  this.initWorker = this._spawnWorker(initConfigs, this.initPkcs11Sab, this.initNetSab, 'initiator')
  this.respWorker = this._spawnWorker(respConfigs, this.respPkcs11Sab, this.respNetSab, 'responder')
}
```

**Track READY from both workers before transitioning to RUNNING:**

```ts
private _readyCount = 0

// in onmessage READY handler:
case 'READY':
  this._readyCount++
  if (this._readyCount === 2) this.setState('RUNNING')
  break
```

**rpcHandler dispatch per worker:**

```ts
case 'PKCS11_RPC':
  const sab = isInitiatorWorker ? this.initPkcs11Sab : this.respPkcs11Sab
  if (this.rpcHandler && sab) this.rpcHandler(sab, role)
  break
```

---

### 3. `src/components/Playground/hsm/VpnSimulationPanel.tsx`

**Two configs — initiator and responder:**

```ts
const initiatorConfig = `charon {
  plugins {
    pkcs11 {
      modules {
        client {
          path = libsofthsmv3.so
          slot = 0
        }
        server {
          path = libsofthsmv3.so
          slot = 1
        }
      }
    }
  }
  filelog {
    stderr {
      time_format = %H:%M:%S
      default = 2
      ike = 2
    }
  }
}`

const responderConfig = `charon {
  plugins {
    pkcs11 {
      modules {
        server {
          path = libsofthsmv3.so
          slot = 0
        }
        client {
          path = libsofthsmv3.so
          slot = 1
        }
      }
    }
  }
  filelog {
    stderr {
      time_format = %H:%M:%S
      default = 2
      ike = 2
    }
  }
}`
```

**Two ipsec.conf files:**

```
# initiator ipsec.conf
conn host-host
  left=192.168.0.1
  leftauth=pubkey
  leftsigkey=%smartcard1     # client module, slot 0
  right=192.168.0.2
  rightauth=pubkey
  rightsigkey=%smartcard2    # server module, slot 1
  ike=aes256-sha256-modp3072!
  auto=start                 # initiates connection

# responder ipsec.conf
conn host-host
  left=192.168.0.2
  leftauth=pubkey
  leftsigkey=%smartcard1     # server module, slot 0 (from responder's perspective)
  right=192.168.0.1
  rightauth=pubkey
  rightsigkey=%smartcard2    # client module, slot 1
  ike=aes256-sha256-modp3072!
  auto=route                 # waits for incoming connection
```

**Updated rpcHandler signature:**

```ts
strongSwanEngine.setRpcHandler((sab, role) => {
  const M = moduleRef.current
  if (!M) return
  // ... existing switch/case logic unchanged ...
  // role distinguishes which side's keys to look up in C_FindObjects
})
```

**Startup sequence:**

```ts
// Responder must bind before initiator sends IKE_SA_INIT.
// Both workers start simultaneously; the READY gate (both workers ready)
// ensures the responder is listening before the initiator's IKE_SA_INIT fires.
strongSwanEngine.init(
  { 'strongswan.conf': initiatorConfig, 'ipsec.conf': initiatorIpsec },
  { 'strongswan.conf': responderConfig, 'ipsec.conf': responderIpsec }
)
```

---

## IP Constants

```ts
const INITIATOR_IP = '192.168.0.1'
const RESPONDER_IP = '192.168.0.2'
const IKE_PORT     = 500

// As uint32 (big-endian for comparison with what charon reports):
const RESPONDER_IP_U32 = 0xC0A80002  // 192.168.0.2
const INITIATOR_IP_U32 = 0xC0A80001  // 192.168.0.1
```

---

## IKEv2 Handshake Flow (what we expect to see)

```
Initiator                              Responder
   ├─ IKE_SA_INIT (HDR, SAi1, KEi, Ni) ──────────────────────────────→
   │     sendto → PACKET_OUT → routing → respNetSab → recvfrom
   │
   │                           ←───────── IKE_SA_INIT response (HDR, SAr1, KEr, Nr, CERTREQ)
   │                                 sendto → PACKET_OUT → routing → initNetSab → recvfrom
   │
   ├─ IKE_AUTH (HDR, SK{IDi, CERT, AUTH, SAi2, TSi, TSr}) ─────────→
   │     ← C_Sign (signs IKE_AUTH with client privkey)
   │                            PKCS#11 calls on responder side
   │                           ←───────── IKE_AUTH response (HDR, SK{IDr, CERT, AUTH, SAr2})
   │                                  ← C_Sign (signs with server privkey)
   │
   └─ Tunnel ESTABLISHED ✓
```

### PKCS#11 calls expected per side:

**Initiator (client module / slot 0):**
- `C_Initialize` → CKR_OK
- `C_GetSlotList` → [0, 1]
- `C_GetTokenInfo` slotId=0
- `C_OpenSession` → hSession
- `C_FindObjectsInit` / `C_FindObjects` → clientPriv handle
- `C_GetAttributeValue` → reads RSA modulus/exponent (for identity)
- `C_SignInit` / `C_Sign` → signs IKE_AUTH

**Responder (server module / slot 0 from its perspective):**
- Same sequence, using serverPriv for signing
- `C_FindObjects` for client's PUBLIC key (for verification)

---

## Implementation Order

### Phase 1 — Network interception (no responder yet)

1. Add network variables and SAB wiring to worker `INIT` handler
2. Add `socket`, `bind`, `connect`, `ioctl` overrides in `instantiateWasm`
3. Add `sendto` override → posts `PACKET_OUT` to main thread
4. Verify: starting daemon logs `[NET] socket(AF_INET, SOCK_DGRAM) → fd=42` and `[NET] bind fd=42 port=500`
5. Verify: `[NET] sendto fd=42 len=NNN destPort=500` appears (IKE_SA_INIT being sent)

### Phase 2 — Add poll/recvfrom (delivery side)

6. Add `poll` and `recvfrom` overrides in `instantiateWasm`
7. Pass `netSab` in INIT message from bridge
8. Test: manually deliver a dummy packet from browser console → worker should wake from poll

### Phase 3 — Dual worker bridge

9. Update `bridge.ts` to spawn two workers with separate SABs
10. Implement `PACKET_OUT` routing in bridge (destIp → select target netSab)
11. Update `StrongSwanEngine.init()` to accept two config maps
12. Track `_readyCount` → transition to RUNNING when both workers ready

### Phase 4 — Responder config + PKCS#11

13. Add responder config (swapped left/right, `auto=route`)
14. Update rpcHandler to handle `role` parameter
15. Ensure C_FindObjects returns correct handles for each role
16. Start both workers; observe IKE_SA_INIT packet routing in logs

### Phase 5 — Full handshake

17. Watch charon logs from both sides
18. If IKE_AUTH fails: check C_Sign return values, key handle correctness
19. On success: `[NET]` logs will show 4 packets (IKE_SA_INIT ×2, IKE_AUTH ×2)
20. Transition simulation UI to ESTABLISHED state on tunnel up

---

## Known Risks / Pre-flight Checks

| Risk | Mitigation |
|------|-----------|
| Emscripten validates fd before syscall | fd=42 is arbitrary; test that sendto/poll actually receive fd=42 |
| poll() struct pollfd size wrong | struct is 8 bytes (fd:4, events:2, revents:2); verify with actual charon call |
| Initiator sends before responder is listening | READY gate (both workers → RUNNING) ensures responder is bound first |
| IKEv2 retransmit floods before response arrives | Routing is synchronous; response delivers in same JS task as send |
| Two PKCS#11 RPCs race (both workers call simultaneously) | Each has its own SAB; main thread handles them independently |
| `Atomics.wait` timeout units | timeout in `poll()` is milliseconds; `Atomics.wait` also takes ms — no conversion needed |
| WASM heap grows and invalidates heap8 slice | Use `heap8.slice()` (copies) in sendto before any async; use `subarray` (live view) only in recvfrom |

---

## Files to Touch

```
public/wasm/strongswan_worker.js          ← add network syscall overrides (~150 lines)
src/wasm/strongswan/bridge.ts             ← dual worker + packet routing (~80 lines changed)
src/components/Playground/hsm/
  VpnSimulationPanel.tsx                  ← dual config + rpcHandler role param (~60 lines)
```

No new files. No new dependencies. No new WASM builds.

---

## Definition of Done

- [ ] `[NET] socket`, `bind`, `sendto` log lines appear when daemon starts
- [ ] `[NET] recvfrom` appears in responder log when initiator sends IKE_SA_INIT
- [ ] `[WASM DLOPEN]` appears in BOTH worker logs
- [ ] `[RPC] C_Initialize`, `C_OpenSession`, `C_Sign` appear for BOTH sides
- [ ] 4 IKE packets total routed (SA_INIT ×2, AUTH ×2)
- [ ] Tunnel statistics show `STATUS: ESTABLISHED`
- [ ] No `[WASM] charon ABORTED` errors
