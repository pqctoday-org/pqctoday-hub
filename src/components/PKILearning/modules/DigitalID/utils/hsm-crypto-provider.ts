// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey, KeyAlgorithm, KeyCurve } from '../types'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  hsm_generateECKeyPair,
  hsm_extractECPoint,
  hsm_ecdsaSign,
  hsm_ecdsaVerify,
  hsm_digest,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
} from '@/wasm/softhsm'

export const bytesToBase64 = (bytes: Uint8Array): string => {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('')
  return btoa(binString)
}
const toBase64Url = (bytes: Uint8Array): string => {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
const base64ToBytes = (base64: string): Uint8Array => {
  const binString = atob(base64)
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!)
}

export class SoftHSMCryptoProvider implements CryptoProvider {
  module: SoftHSMModule
  hSession: number
  keyRegistry: { addKey: (k: any) => void } // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(
    module: SoftHSMModule,
    hSession: number,
    keyRegistry: { addKey: (k: any) => void } // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.module = module
    this.hSession = hSession
    this.keyRegistry = keyRegistry
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateKeyPair(
    alg: KeyAlgorithm,
    curve: KeyCurve,
    onLog?: (log: string) => void
  ): Promise<CryptoKey> {
    const safeCurve = curve === 'Ed25519' ? 'P-256' : curve
    const { pubHandle, privHandle } = hsm_generateECKeyPair(
      this.module,
      this.hSession,
      safeCurve as 'P-256' | 'P-384',
      false,
      'sign'
    )

    // Extract public curve points format (simulated PEM/Hex string for the UI)
    const pubPoint = hsm_extractECPoint(this.module, this.hSession, pubHandle)
    const pubHex = Array.from(pubPoint)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const ts = new Date().toISOString()
    const id = `hsm-${curve.replace('-', '')}-${Date.now()}`

    this.keyRegistry.addKey({
      handle: pubHandle,
      label: `DigitalID Key (${curve})`,
      family: 'ecdsa',
      role: 'public',
      generatedAt: ts,
    })

    this.keyRegistry.addKey({
      handle: privHandle,
      label: `DigitalID Key (${curve})`,
      family: 'ecdsa',
      role: 'private',
      generatedAt: ts,
    })

    return {
      id,
      type: curve as 'P-256' | 'P-384' | 'Ed25519',
      algorithm: alg,
      curve: curve,
      publicKey: pubHex,
      privateKey: `[PKCS#11 handle: ${privHandle}]`, // SoftHSM handles
      meta: { pubHandle },
      created: ts,
      usage: 'SIGN',
      status: 'ACTIVE',
    }
  }

  async signData(
    key: CryptoKey,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<string> {
    const rawSig = await this.signRaw(
      key,
      typeof data === 'string' ? new TextEncoder().encode(data) : data,
      onLog
    )
    return toBase64Url(rawSig)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signRaw(
    key: CryptoKey,
    tbs: Uint8Array,
    onLog?: (log: string) => void
  ): Promise<Uint8Array> {
    if (!key.privateKey || !key.privateKey.startsWith('[PKCS#11 handle:')) {
      throw new Error('SoftHSMCryptoProvider requires a PKCS#11 handle in the privateKey field')
    }
    const privHandle = parseInt(key.privateKey.match(/handle:\s*(\d+)/)?.[1] || '0', 10)

    const mechanism = key.curve === 'P-384' ? CKM_ECDSA_SHA384 : CKM_ECDSA_SHA256
    const sigBytes = hsm_ecdsaSign(
      this.module,
      this.hSession,
      privHandle,
      tbs as Uint8Array,
      mechanism
    )

    return sigBytes as Uint8Array
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifySignature(
    key: CryptoKey,
    signature: string,
    data: string | Uint8Array,
    onLog?: (log: string) => void
  ): Promise<boolean> {
    const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const sigBytes = base64ToBytes(signature.replace(/-/g, '+').replace(/_/g, '/'))

    // Reverse lookup handle from stored UI keys if we need to.
    // Wait, hsm_ecdsaVerify requires the pubHandle!
    // But CryptoKey object doesn't store pubHandle, it stores the raw public point hex.
    // Let's find pubHandle via C_FindObjects or assume it was saved in key.meta?
    // As a hack to align with standard web flows, if we can't find it easily we can
    // import the generic mechanism.
    // Let's modify generateKeyPair to store the pubHandle in key.meta

    let pubHandle = 0
    if (key.meta && typeof key.meta === 'object' && 'pubHandle' in key.meta) {
      pubHandle = (key.meta as Record<string, unknown>).pubHandle as number
    } else {
      throw new Error(
        'SoftHSMCryptoProvider requires pubHandle stored in key.meta to perform C_Verify'
      )
    }

    const mechanism = key.curve === 'P-384' ? CKM_ECDSA_SHA384 : CKM_ECDSA_SHA256
    return hsm_ecdsaVerify(
      this.module,
      this.hSession,
      pubHandle,
      dataBytes as Uint8Array,
      sigBytes as Uint8Array,
      mechanism
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sha256Hash(data: string | Uint8Array, onLog?: (log: string) => void): Promise<string> {
    const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const hashBytes = hsm_digest(this.module, this.hSession, dataBytes as Uint8Array)
    return toBase64Url(hashBytes as Uint8Array)
  }
}
