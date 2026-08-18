// strongswan-v2-bob-worker.js — Web Worker for the VPN panel's
// cross-Worker v2 KEM demo. Runs its OWN strongswan-v2.wasm instance
// (independent softhsmv3 state). Receives Alice's ML-KEM-768 public key
// from the main thread, calls C_EncapsulateKey through softhsmv3, ships
// ciphertext + derived secret back.

importScripts('/wasm/strongswan-v2.js')

let mod = null

async function ensureBoot() {
  if (mod) return mod
  mod = await StrongswanV2({
    onVpnEvent: (type, payload) => self.postMessage({ kind: 'event', role: 'bob', type, payload }),
    locateFile: (f) => `/wasm/${f}`,
  })
  mod.ccall('wasm_vpn_boot', 'number', [], [])
  return mod
}

self.onmessage = async (ev) => {
  if (ev.data?.kind !== 'alice_pub') return

  const m = await ensureBoot()
  const alicePub = new Uint8Array(ev.data.bytes)
  const pubPtr = m._malloc(alicePub.length)
  m.HEAPU8.set(alicePub, pubPtr)

  const ctCap = 2048
  const ctPtr = m._malloc(ctCap)
  const ctLen = m.ccall(
    'wasm_vpn_kem_bob_encap',
    'number',
    ['number', 'number', 'number', 'number'],
    [pubPtr, alicePub.length, ctPtr, ctCap]
  )

  const secPtr = m._malloc(64)
  const secLen = m.ccall('wasm_vpn_kem_get_secret', 'number', ['number', 'number'], [secPtr, 64])

  if (ctLen <= 0 || secLen <= 0) {
    self.postMessage({ kind: 'bob_error', ctLen, secLen })
    return
  }

  const ct = new Uint8Array(m.HEAPU8.subarray(ctPtr, ctPtr + ctLen)).slice(0)
  const secret = new Uint8Array(m.HEAPU8.subarray(secPtr, secPtr + secLen)).slice(0)

  m._free(pubPtr)
  m._free(ctPtr)
  m._free(secPtr)

  self.postMessage({ kind: 'bob_ct', ct, bobSecret: secret }, [ct.buffer, secret.buffer])
}
