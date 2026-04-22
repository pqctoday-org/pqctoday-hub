// SPDX-License-Identifier: GPL-3.0-only
//
// Thin TypeScript binding around the v2 strongSwan WASM build from
// pqctoday-hsm/strongswan-wasm-v2-shims/. Provides stepwise ML-DSA + ML-KEM
// primitives through softhsmv3 PKCS#11 inside the browser.
//
// Does NOT replace the legacy StrongSwanEngine bridge (still at
// src/wasm/strongswan/bridge.ts) — the two coexist. Gate this binding
// behind VITE_WASM_VPN_V2=1 in VpnSimulationPanel until the full IKE
// transport layer (Phase 3e) lands.

export interface V2Event {
  type: string
  payload: string
}

interface StrongswanV2Module {
  ccall: (fn: string, ret: string | null, argTypes: string[], args: unknown[]) => number
  HEAPU8: Uint8Array
  _malloc: (n: number) => number
  _free: (p: number) => void
  UTF8ToString: (ptr: number) => string
}

type V2Factory = (opts: {
  onVpnEvent?: (type: string, payload: string) => void
  locateFile?: (file: string) => string
}) => Promise<StrongswanV2Module>

let cached: Promise<StrongswanV2Module> | null = null

async function loadV2(onEvent: (e: V2Event) => void): Promise<StrongswanV2Module> {
  if (cached) return cached
  // Vite serves public/wasm/ at /wasm/. Use a dynamic import so the module
  // is only fetched when the v2 flag is actually on.
  cached = (async () => {
    // Emscripten's MODULARIZE-wrapped .js is a UMD-ish factory; fetch as text
    // and eval into a factory reference. Import() on a path inside /public is
    // unreliable across Vite builds, so use fetch + Function-wrap for safety.
    const res = await fetch('/wasm/strongswan-v2.js')
    if (!res.ok) throw new Error(`fetch strongswan-v2.js: ${res.status}`)
    const src = await res.text()
    // eslint-disable-next-line security/detect-eval-with-expression
    const factory = new Function(`${src}; return StrongswanV2;`)() as V2Factory
    return factory({
      onVpnEvent: (type, payload) => onEvent({ type, payload }),
      locateFile: (f) => `/wasm/${f}`,
    })
  })()
  return cached
}

export interface V2SelftestResult {
  mlDsaSigLen: number
  mlKemPub: number
  mlKemCt: number
  mlKemSecret: number
  mlKemMatch: boolean
  events: V2Event[]
}

/** Run ML-DSA-65 sign/verify + ML-KEM-768 loopback round-trip inside a
 *  single WASM instance. Used by the panel's "v2 selftest" action. */
export async function runV2Selftest(
  onEvent: (e: V2Event) => void = () => {}
): Promise<V2SelftestResult> {
  const events: V2Event[] = []
  const capture = (e: V2Event) => {
    events.push(e)
    onEvent(e)
  }

  const mod = await loadV2(capture)
  mod.ccall('wasm_vpn_boot', 'number', [], [])

  const sigLen = mod.ccall('wasm_vpn_ml_dsa_selftest', 'number', [], [])

  const match = mod.ccall('wasm_vpn_ml_kem_selftest', 'number', [], [])
  // Derive sizes from the last ml_kem_selftest event string. Using a manual
  // reverse lookup instead of Array.prototype.findLast so we don't require
  // ES2023 lib target (tsconfig currently targets ES2022).
  let kemLine = ''
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'ml_kem_selftest') {
      kemLine = events[i].payload
      break
    }
  }
  const parseInt10 = (label: string): number => {
    const m = kemLine.match(new RegExp(`${label}=(\\d+)`))
    return m ? Number(m[1]) : 0
  }

  return {
    mlDsaSigLen: sigLen,
    mlKemPub: parseInt10('pub'),
    mlKemCt: parseInt10('ct'),
    mlKemSecret: parseInt10('secret'),
    mlKemMatch: match === 1,
    events,
  }
}

export interface V2TwoWorkerResult {
  alicePub: number
  bobCt: number
  aliceSecret: Uint8Array
  bobSecret: Uint8Array
  secretsMatch: boolean
  events: V2Event[]
}

/** Cross-Worker ML-KEM-768 handshake in the browser. Main thread plays
 *  Alice; a dedicated Web Worker plays Bob with its own WASM instance.
 *  Bytes-only exchange (Alice's 1184 B pubkey out; Bob's 1088 B ciphertext
 *  in). Both derive a 32 B shared secret that must match — the browser
 *  equivalent of the Node Phase 3d test. */
export async function runV2KemTwoWorker(
  onEvent: (e: V2Event) => void = () => {}
): Promise<V2TwoWorkerResult> {
  const events: V2Event[] = []
  const capture = (e: V2Event) => {
    events.push(e)
    onEvent(e)
  }

  const alice = await loadV2(capture)
  alice.ccall('wasm_vpn_boot', 'number', [], [])

  // Alice keygen: stage pub into her WASM heap, read out.
  const pubCap = 2048
  const pubPtr = alice._malloc(pubCap)
  const pubLen = alice.ccall(
    'wasm_vpn_kem_alice_init',
    'number',
    ['number', 'number'],
    [pubPtr, pubCap]
  )
  if (pubLen <= 0) throw new Error(`alice keygen rv=${pubLen}`)
  const alicePub = new Uint8Array(alice.HEAPU8.subarray(pubPtr, pubPtr + pubLen)).slice(0)
  alice._free(pubPtr)

  // Spawn Bob worker, hand over Alice's pubkey.
  const bob = new Worker('/wasm/strongswan-v2-bob-worker.js')
  const bobPayload: { ct: Uint8Array; bobSecret: Uint8Array } = await new Promise(
    (resolve, reject) => {
      bob.onmessage = (ev) => {
        const m = ev.data
        if (m?.kind === 'event') capture({ type: `bob:${m.type}`, payload: m.payload })
        else if (m?.kind === 'bob_ct') resolve({ ct: m.ct, bobSecret: m.bobSecret })
        else if (m?.kind === 'bob_error') reject(new Error(`bob err ct=${m.ctLen} sec=${m.secLen}`))
      }
      bob.onerror = (e) => reject(new Error(`bob worker error: ${e.message}`))
      bob.postMessage({ kind: 'alice_pub', bytes: alicePub })
    }
  )

  // Alice decap: push Bob's ciphertext, get secret.
  const ctPtr = alice._malloc(bobPayload.ct.length)
  alice.HEAPU8.set(bobPayload.ct, ctPtr)
  const decapRv = alice.ccall(
    'wasm_vpn_kem_alice_decap',
    'number',
    ['number', 'number'],
    [ctPtr, bobPayload.ct.length]
  )
  alice._free(ctPtr)
  if (decapRv <= 0) throw new Error(`alice decap rv=${decapRv}`)

  const secPtr = alice._malloc(64)
  const secLen = alice.ccall(
    'wasm_vpn_kem_get_secret',
    'number',
    ['number', 'number'],
    [secPtr, 64]
  )
  const aliceSecret = new Uint8Array(alice.HEAPU8.subarray(secPtr, secPtr + secLen)).slice(0)
  alice._free(secPtr)

  bob.terminate()

  const bobSec = bobPayload.bobSecret
  const match = aliceSecret.length === bobSec.length && aliceSecret.every((b, i) => b === bobSec[i])

  return {
    alicePub: pubLen,
    bobCt: bobPayload.ct.length,
    aliceSecret,
    bobSecret: bobSec,
    secretsMatch: match,
    events,
  }
}

// ── Phase 3a validation exports ────────────────────────────────────────────
// These call real charon library functions (proposal_create_from_string,
// lib->creds->create, key_exchange enum) in the WASM binary. They deliver
// plans 1 and 2 at the library-validation level without running a full IKE.

export interface ProposalValidation {
  valid: boolean
  hasMlKem?: boolean
  proposal?: string
  error?: string
}

export interface CertValidation {
  valid: boolean
  keyType?: string
  isMlDsa?: boolean
  error?: string
}

export interface KeyExchangeList {
  mlKem512: number
  mlKem768: number
  mlKem1024: number
  curve25519: number
  ecp256: number
  ecp384: number
}

async function callReturningJson<T>(fn: string, argTypes: string[], args: unknown[]): Promise<T> {
  const mod = await loadV2(() => {})
  mod.ccall('wasm_vpn_boot', 'number', [], [])
  const ptr = mod.ccall(fn, 'number', argTypes, args)
  if (!ptr) throw new Error(`${fn} returned null pointer`)
  const json = mod.UTF8ToString(ptr)
  return JSON.parse(json) as T
}

/** Validate an IKEv2 proposal string via charon's proposal parser. Returns
 *  whether it parses and whether any ML-KEM transform was accepted. */
export async function validateProposal(proposal: string): Promise<ProposalValidation> {
  const mod = await loadV2(() => {})
  mod.ccall('wasm_vpn_boot', 'number', [], [])
  const bytes = new TextEncoder().encode(proposal + '\0')
  const ptr = mod._malloc(bytes.length)
  mod.HEAPU8.set(bytes, ptr)
  const resPtr = mod.ccall('wasm_vpn_validate_proposal', 'number', ['number'], [ptr])
  mod._free(ptr)
  if (!resPtr) return { valid: false, error: 'null_return' }
  return JSON.parse(mod.UTF8ToString(resPtr)) as ProposalValidation
}

/** Validate a PEM-encoded certificate via charon's credential loader. Returns
 *  the recognized key type; reports is_ml_dsa when the cert's SubjectPublicKeyInfo
 *  carries ML-DSA OIDs per RFC 9881. */
export async function validateCert(pem: string): Promise<CertValidation> {
  const mod = await loadV2(() => {})
  mod.ccall('wasm_vpn_boot', 'number', [], [])
  const bytes = new TextEncoder().encode(pem)
  const ptr = mod._malloc(bytes.length)
  mod.HEAPU8.set(bytes, ptr)
  const resPtr = mod.ccall(
    'wasm_vpn_validate_cert',
    'number',
    ['number', 'number'],
    [ptr, bytes.length]
  )
  mod._free(ptr)
  if (!resPtr) return { valid: false, error: 'null_return' }
  return JSON.parse(mod.UTF8ToString(resPtr)) as CertValidation
}

/** Report the numeric IKE transform IDs charon recognizes for ML-KEM and
 *  classical groups. Useful for confirming draft-ietf-ipsecme-ikev2-mlkem
 *  support in the active WASM build. */
export async function listKeyExchanges(): Promise<KeyExchangeList> {
  return callReturningJson<KeyExchangeList>('wasm_vpn_list_key_exchanges', [], [])
}
