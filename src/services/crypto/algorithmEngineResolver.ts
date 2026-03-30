// SPDX-License-Identifier: GPL-3.0-only

/**
 * Algorithm Engine Resolver — maps algorithm names to the best available
 * crypto engine and provides a uniform benchmark API.
 *
 * Engine priority: softhsmv3 → liboqs → OpenSSL → WebCrypto
 * softhsmv3 covers all except: FN-DSA, HQC, Classic-McEliece, FrodoKEM, LMS, XMSS
 */

export type CryptoEngine = 'softhsm' | 'liboqs' | 'webcrypto' | 'noble'

export interface BenchmarkResult {
  engine: CryptoEngine
  keyGenMs: number
  signEncapsMs: number
  verifyDecapsMs: number
  publicKeyBytes: number
  privateKeyBytes: number
  sigCiphertextBytes: number | null
  sharedSecretBytes: number | null
}

// ── Algo → Engine mapping ──

const LIBOQS_ONLY = new Set([
  'FN-DSA-512',
  'FN-DSA-1024',
  'HQC-128',
  'HQC-192',
  'HQC-256',
  'FrodoKEM-640',
  'FrodoKEM-976',
  'FrodoKEM-1344',
  'Classic-McEliece-348864',
  'Classic-McEliece-460896',
  'Classic-McEliece-8192128',
])

const LMS_ALGOS = new Set(['LMS-SHA256 (H20/W8)', 'XMSS-SHA2_20'])

const WEBCRYPTO_SIGS = new Set(['ECDSA P-256', 'ECDSA P-384', 'ECDSA P-521', 'Ed25519'])

const WEBCRYPTO_KEMS = new Set(['ECDH P-256', 'ECDH P-384', 'ECDH P-521', 'X25519'])

const NOBLE_SIGS = new Set(['secp256k1'])

// Algorithms with no portable browser engine available
const NOT_BENCHMARKABLE = new Set(['Ed448', 'X448', 'DH (Diffie-Hellman)'])

const RSA_ALGOS = new Set(['RSA-2048', 'RSA-3072', 'RSA-4096'])

const HYBRID_KEMS = new Set(['X25519MLKEM768', 'SecP256r1MLKEM768', 'SecP384r1MLKEM1024'])

export function resolveEngine(algoName: string): CryptoEngine | null {
  if (LIBOQS_ONLY.has(algoName)) return 'liboqs'
  if (LMS_ALGOS.has(algoName)) return null // LmsService not wired for benchmarking yet
  if (HYBRID_KEMS.has(algoName)) return null // No standalone benchmark for hybrids
  if (NOT_BENCHMARKABLE.has(algoName)) return null // No portable browser engine
  // SLH-DSA → liboqs (simpler API than PKCS#11 for benchmarking)
  if (algoName.startsWith('SLH-DSA')) return 'liboqs'
  // ML-KEM, ML-DSA → softhsmv3
  if (algoName.startsWith('ML-KEM') || algoName.startsWith('ML-DSA')) return 'softhsm'
  if (RSA_ALGOS.has(algoName)) return 'webcrypto'
  if (WEBCRYPTO_SIGS.has(algoName)) return 'webcrypto'
  if (WEBCRYPTO_KEMS.has(algoName)) return 'webcrypto'
  if (NOBLE_SIGS.has(algoName)) return 'noble'
  return null
}

export function getEngineLabel(engine: CryptoEngine): string {
  switch (engine) {
    case 'softhsm':
      return 'SoftHSM'
    case 'liboqs':
      return 'liboqs'
    case 'webcrypto':
      return 'WebCrypto'
    case 'noble':
      return '@noble'
  }
}

// ── Lazy engine loaders ──

let hsmSession: { M: unknown; hSession: number } | null = null

async function getHsmSession() {
  if (hsmSession) return hsmSession
  const {
    getSoftHSMCppModule,
    hsm_initialize,
    hsm_getFirstSlot,
    hsm_initToken,
    hsm_openUserSession,
  } = await import('../../wasm/softhsm')
  const M = await getSoftHSMCppModule()
  hsm_initialize(M)
  const slot = hsm_getFirstSlot(M)
  hsm_initToken(M, slot, 'bench-so-pin', 'BenchToken')
  const hSession = hsm_openUserSession(M, slot, 'bench-so-pin', 'bench-user-pin')
  hsmSession = { M, hSession }
  return hsmSession
}

// ── Benchmark runners per engine ──

/**
 * Minimum timing window (ms). Browsers coarsen performance.now() to ~0.1-1ms
 * (Spectre mitigation), so sub-millisecond ops read as 0ms. When the first
 * single-shot run falls below this threshold we automatically re-run enough
 * iterations to fill the window and return the per-op average.
 */
const MIN_BENCH_WINDOW_MS = 10

function timeMs(fn: () => void): number {
  const t0 = performance.now()
  fn()
  const elapsed = performance.now() - t0
  if (elapsed >= MIN_BENCH_WINDOW_MS) return elapsed
  const iters = Math.ceil(MIN_BENCH_WINDOW_MS / Math.max(elapsed, 0.1))
  const t1 = performance.now()
  for (let i = 0; i < iters; i++) fn()
  return (performance.now() - t1) / iters
}

async function timeMsAsync(fn: () => Promise<void>): Promise<number> {
  const t0 = performance.now()
  await fn()
  const elapsed = performance.now() - t0
  if (elapsed >= MIN_BENCH_WINDOW_MS) return elapsed
  const iters = Math.ceil(MIN_BENCH_WINDOW_MS / Math.max(elapsed, 0.1))
  const t1 = performance.now()
  for (let i = 0; i < iters; i++) await fn()
  return (performance.now() - t1) / iters
}

async function benchmarkSoftHsm(algoName: string): Promise<BenchmarkResult> {
  const { M, hSession } = await getHsmSession()
  const softhsm = await import('../../wasm/softhsm')
  const mod = M as Parameters<typeof softhsm.hsm_generateMLKEMKeyPair>[0]

  let publicKeyBytes = 0
  let privateKeyBytes = 0
  let sigCiphertextBytes: number | null = null
  let sharedSecretBytes: number | null = null
  let keyGenMs = 0
  let signEncapsMs = 0
  let verifyDecapsMs = 0

  if (algoName.startsWith('ML-KEM')) {
    const variant = parseInt(algoName.replace('ML-KEM-', '')) as 512 | 768 | 1024
    let result: ReturnType<typeof softhsm.hsm_generateMLKEMKeyPair>
    keyGenMs = timeMs(() => {
      result = softhsm.hsm_generateMLKEMKeyPair(mod, hSession, variant, true)
    })
    // Extract public key to measure size
    const pubBytes = softhsm.hsm_extractKeyValue(mod, hSession, result!.pubHandle)
    publicKeyBytes = pubBytes.length
    const privBytes = softhsm.hsm_extractKeyValue(mod, hSession, result!.privHandle)
    privateKeyBytes = privBytes.length

    let encResult: ReturnType<typeof softhsm.hsm_encapsulate>
    signEncapsMs = timeMs(() => {
      encResult = softhsm.hsm_encapsulate(mod, hSession, result!.pubHandle, variant)
    })
    sigCiphertextBytes = encResult!.ciphertextBytes.length
    sharedSecretBytes = 32 // ML-KEM shared secret is always 32 bytes (FIPS 203)

    verifyDecapsMs = timeMs(() => {
      softhsm.hsm_decapsulate(
        mod,
        hSession,
        result!.privHandle,
        encResult!.ciphertextBytes,
        variant
      )
    })
  } else if (algoName.startsWith('ML-DSA')) {
    const variant = parseInt(algoName.replace('ML-DSA-', '')) as 44 | 65 | 87
    let result: ReturnType<typeof softhsm.hsm_generateMLDSAKeyPair>
    keyGenMs = timeMs(() => {
      result = softhsm.hsm_generateMLDSAKeyPair(mod, hSession, variant, true)
    })
    const pubBytes = softhsm.hsm_extractKeyValue(mod, hSession, result!.pubHandle)
    publicKeyBytes = pubBytes.length
    const privBytes = softhsm.hsm_extractKeyValue(mod, hSession, result!.privHandle)
    privateKeyBytes = privBytes.length

    const msg = new Uint8Array(32)
    crypto.getRandomValues(msg)
    let sig: Uint8Array
    signEncapsMs = timeMs(() => {
      sig = softhsm.hsm_signBytesMLDSA(mod, hSession, result!.privHandle, msg)
    })
    sigCiphertextBytes = sig!.length

    verifyDecapsMs = timeMs(() => {
      softhsm.hsm_verifyBytes(mod, hSession, result!.pubHandle, msg, sig!)
    })
  }

  return {
    engine: 'softhsm',
    keyGenMs,
    signEncapsMs,
    verifyDecapsMs,
    publicKeyBytes,
    privateKeyBytes,
    sigCiphertextBytes,
    sharedSecretBytes,
  }
}

async function benchmarkLiboqs(algoName: string): Promise<BenchmarkResult> {
  const isKEM =
    algoName.startsWith('HQC') ||
    algoName.startsWith('FrodoKEM') ||
    algoName.startsWith('Classic-McEliece')

  if (isKEM) {
    const kem = await import('../../wasm/liboqs_kem')
    let keys: Awaited<ReturnType<typeof kem.generateKey>>
    const keyGenMs = await timeMsAsync(async () => {
      keys = await kem.generateKey({ name: algoName })
    })
    const publicKeyBytes = keys!.publicKey.length
    const privateKeyBytes = keys!.secretKey.length

    let encResult: Awaited<ReturnType<typeof kem.encapsulateBits>>
    const signEncapsMs = await timeMsAsync(async () => {
      encResult = await kem.encapsulateBits({ name: algoName }, keys!.publicKey)
    })

    const verifyDecapsMs = await timeMsAsync(async () => {
      await kem.decapsulateBits({ name: algoName }, keys!.secretKey, encResult!.ciphertext)
    })

    return {
      engine: 'liboqs',
      keyGenMs,
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes,
      privateKeyBytes,
      sigCiphertextBytes: encResult!.ciphertext.length,
      sharedSecretBytes: encResult!.sharedKey.length,
    }
  } else {
    // Signature algorithms: FN-DSA (Falcon), SLH-DSA
    const sig = await import('../../wasm/liboqs_sig')
    let keys: Awaited<ReturnType<typeof sig.generateKey>>
    const keyGenMs = await timeMsAsync(async () => {
      keys = await sig.generateKey({ name: algoName })
    })
    const publicKeyBytes = keys!.publicKey.length
    const privateKeyBytes = keys!.secretKey.length

    const msg = new Uint8Array(32)
    crypto.getRandomValues(msg)
    let signature: Uint8Array
    const signEncapsMs = await timeMsAsync(async () => {
      signature = await sig.sign(msg, keys!.secretKey, algoName)
    })

    const verifyDecapsMs = await timeMsAsync(async () => {
      await sig.verify(signature!, msg, keys!.publicKey, algoName)
    })

    return {
      engine: 'liboqs',
      keyGenMs,
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes,
      privateKeyBytes,
      sigCiphertextBytes: signature!.length,
      sharedSecretBytes: null,
    }
  }
}

async function benchmarkWebCrypto(algoName: string): Promise<BenchmarkResult> {
  const wc = await import('../../utils/webCrypto')

  if (algoName.startsWith('RSA')) {
    const bits = parseInt(algoName.replace('RSA-', '')) as 2048 | 3072 | 4096
    let kp: Awaited<ReturnType<typeof wc.generateRSAKeyPair>>
    const keyGenMs = await timeMsAsync(async () => {
      kp = await wc.generateRSAKeyPair(bits)
    })

    const msg = new Uint8Array(32)
    crypto.getRandomValues(msg)
    let sig: Uint8Array
    const signEncapsMs = await timeMsAsync(async () => {
      sig = await wc.signRSA(kp!.privateKey, msg)
    })
    const verifyDecapsMs = await timeMsAsync(async () => {
      await wc.verifyRSA(kp!.publicKey, sig!, msg)
    })

    return {
      engine: 'webcrypto',
      keyGenMs,
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes: kp!.publicKeyHex.length / 2,
      privateKeyBytes: kp!.privateKeyHex.length / 2,
      sigCiphertextBytes: sig!.length,
      sharedSecretBytes: null,
    }
  }

  if (algoName.startsWith('ECDSA') || algoName === 'secp256k1') {
    const curve = algoName.replace('ECDSA ', '') as 'P-256' | 'P-384' | 'P-521'
    let kp: Awaited<ReturnType<typeof wc.generateECDSAKeyPair>>
    const keyGenMs = await timeMsAsync(async () => {
      kp = await wc.generateECDSAKeyPair(curve)
    })

    const msg = new Uint8Array(32)
    crypto.getRandomValues(msg)
    let sig: Uint8Array
    const signEncapsMs = await timeMsAsync(async () => {
      sig = await wc.signECDSA(kp!.privateKey, msg)
    })
    const verifyDecapsMs = await timeMsAsync(async () => {
      await wc.verifyECDSA(kp!.publicKey, sig!, msg)
    })

    return {
      engine: 'webcrypto',
      keyGenMs,
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes: kp!.publicKeyHex.length / 2,
      privateKeyBytes: kp!.privateKeyHex.length / 2,
      sigCiphertextBytes: sig!.length,
      sharedSecretBytes: null,
    }
  }

  if (algoName === 'Ed25519' || algoName === 'Ed448') {
    let kp: Awaited<ReturnType<typeof wc.generateEd25519KeyPair>>
    const keyGenMs = await timeMsAsync(async () => {
      kp = await wc.generateEd25519KeyPair()
    })

    const msg = new Uint8Array(32)
    crypto.getRandomValues(msg)
    let sig: Uint8Array
    const signEncapsMs = await timeMsAsync(async () => {
      sig = await wc.signEd25519(kp!.privateKey, msg)
    })
    const verifyDecapsMs = await timeMsAsync(async () => {
      await wc.verifyEd25519(kp!.publicKey, sig!, msg)
    })

    return {
      engine: 'webcrypto',
      keyGenMs,
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes: kp!.publicKeyHex.length / 2,
      privateKeyBytes: kp!.privateKeyHex.length / 2,
      sigCiphertextBytes: sig!.length,
      sharedSecretBytes: null,
    }
  }

  if (algoName.startsWith('ECDH') || algoName === 'X25519' || algoName === 'X448') {
    const isX = algoName === 'X25519' || algoName === 'X448'
    let kp1: Awaited<ReturnType<typeof wc.generateECDHKeyPair>>
    let kp2: Awaited<ReturnType<typeof wc.generateECDHKeyPair>>

    const curve = isX ? undefined : (algoName.replace('ECDH ', '') as 'P-256' | 'P-384' | 'P-521')
    const keyGenMs = await timeMsAsync(async () => {
      if (isX) {
        kp1 = await wc.generateX25519KeyPair()
        kp2 = await wc.generateX25519KeyPair()
      } else {
        kp1 = await wc.generateECDHKeyPair(curve)
        kp2 = await wc.generateECDHKeyPair(curve)
      }
    })

    let secret: Uint8Array
    const signEncapsMs = await timeMsAsync(async () => {
      secret = await wc.deriveSharedSecret(kp1!.privateKey, kp2!.publicKey)
    })
    const verifyDecapsMs = await timeMsAsync(async () => {
      await wc.deriveSharedSecret(kp2!.privateKey, kp1!.publicKey)
    })

    return {
      engine: 'webcrypto',
      keyGenMs: keyGenMs / 2, // two keypairs generated
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes: kp1!.publicKeyHex.length / 2,
      privateKeyBytes: kp1!.privateKeyHex.length / 2,
      sigCiphertextBytes: null,
      sharedSecretBytes: secret!.length,
    }
  }

  throw new Error(`No WebCrypto support for ${algoName}`)
}

async function benchmarkNoble(algoName: string): Promise<BenchmarkResult> {
  if (algoName === 'secp256k1') {
    const { secp256k1 } = await import('@noble/curves/secp256k1.js')
    const { sha256 } = await import('@noble/hashes/sha2.js')

    let privKey: Uint8Array
    let pubKey: Uint8Array
    const keyGenMs = timeMs(() => {
      privKey = secp256k1.utils.randomSecretKey()
      pubKey = secp256k1.getPublicKey(privKey)
    })

    const msg = new Uint8Array(32)
    crypto.getRandomValues(msg)
    const msgHash = sha256(msg)

    let sigBytes: Uint8Array
    const signEncapsMs = timeMs(() => {
      sigBytes = secp256k1.sign(msgHash, privKey!)
    })

    const verifyDecapsMs = timeMs(() => {
      secp256k1.verify(sigBytes!, msgHash, pubKey!)
    })

    return {
      engine: 'noble',
      keyGenMs,
      signEncapsMs,
      verifyDecapsMs,
      publicKeyBytes: pubKey!.length,
      privateKeyBytes: privKey!.length,
      sigCiphertextBytes: sigBytes!.length,
      sharedSecretBytes: null,
    }
  }

  throw new Error(`No @noble support for ${algoName}`)
}

// ── Public API ──

export async function runBenchmark(algoName: string): Promise<BenchmarkResult> {
  const engine = resolveEngine(algoName)
  if (!engine) throw new Error(`No engine available for ${algoName}`)

  switch (engine) {
    case 'softhsm':
      return benchmarkSoftHsm(algoName)
    case 'liboqs':
      return benchmarkLiboqs(algoName)
    case 'webcrypto':
      return benchmarkWebCrypto(algoName)
    case 'noble':
      return benchmarkNoble(algoName)
  }
}
