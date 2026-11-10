// SPDX-License-Identifier: AGPL-3.0-only
import { LMS_ARTIFACT } from './lmsArtifact.generated'

// Interface for the Emscripten module
interface LmsModule {
  _generate_keypair_wasm: (
    pubPtr: number,
    privPtr: number,
    lmsType: number,
    lmotsType: number
  ) => number
  _get_signature_length_wasm: (privatePtr: number, privateCapacity: number) => number
  _sign_message_bounded_wasm: (
    privatePtr: number,
    privateCapacity: number,
    messagePtr: number,
    messageLength: number,
    signaturePtr: number,
    signatureCapacity: number,
    writtenPtr: number
  ) => number
  _verify_wasm: (
    pubPtr: number,
    msgPtr: number,
    msgLen: number,
    sigPtr: number,
    sigLen: number
  ) => number
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  HEAPU8: Uint8Array
}

type LmsFactory = (options: {
  wasmBinary: ArrayBuffer
  locateFile: (name: string) => string
}) => Promise<LmsModule>

export class LmsService {
  private module: LmsModule | null = null
  private initializing: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.module) return
    if (this.initializing) return this.initializing
    const pending = this.initializePair()
    this.initializing = pending
    try {
      await pending
    } finally {
      if (this.initializing === pending) this.initializing = null
    }
  }

  private async initializePair(): Promise<void> {
    let script: HTMLScriptElement | null = null
    try {
      if (!globalThis.crypto?.subtle)
        throw new Error('LMS resource integrity verification is unavailable')
      const response = await fetch(LMS_ARTIFACT.wasmUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error('LMS immutable WASM resource is missing')
      const binary = await response.arrayBuffer()
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', binary)), (b) =>
        b.toString(16).padStart(2, '0')
      ).join('')
      if (hash !== LMS_ARTIFACT.wasmSha256) throw new Error('LMS WASM resource integrity mismatch')
      const previous = Reflect.get(window, LMS_ARTIFACT.factoryName)
      script = document.createElement('script')
      if (!('integrity' in script))
        throw new Error('LMS script integrity verification is unavailable')
      script.src = LMS_ARTIFACT.jsUrl
      script.integrity = LMS_ARTIFACT.jsIntegrity
      script.crossOrigin = 'anonymous'
      script.dataset.lmsBuild = LMS_ARTIFACT.buildId
      const owned = script
      await new Promise<void>((resolve, reject) => {
        owned.onload = () => resolve()
        owned.onerror = () =>
          reject(new Error('LMS immutable JS resource failed integrity/loading'))
        document.body.appendChild(owned)
      })
      const value: unknown = Reflect.get(window, LMS_ARTIFACT.factoryName)
      if (typeof value !== 'function' || value === previous)
        throw new Error('Verified LMS factory was not newly published')
      const factory = value as LmsFactory
      const expectedName = LMS_ARTIFACT.wasmUrl.split('/').at(-1)
      const module = await factory({
        wasmBinary: binary,
        locateFile: (name) => {
          if (name !== expectedName) throw new Error('Unexpected LMS resource request')
          return LMS_ARTIFACT.wasmUrl
        },
      })
      if (
        !module.HEAPU8 ||
        typeof module._get_signature_length_wasm !== 'function' ||
        typeof module._sign_message_bounded_wasm !== 'function' ||
        typeof module._generate_keypair_wasm !== 'function' ||
        typeof module._verify_wasm !== 'function' ||
        typeof module._malloc !== 'function' ||
        typeof module._free !== 'function'
      ) {
        throw new Error('Verified LMS pair does not provide the required bounded ABI')
      }
      this.module = module
    } catch (error) {
      script?.remove()
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      if (script) {
        script.onload = null
        script.onerror = null
      }
    }
  }

  async generateKeypair(
    lmsType: number,
    lmotsType: number
  ): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    await this.init()
    const m = this.module!

    // Output buffers
    // Max pub key size ~64 bytes
    // Max priv key size ~64 bytes (seed form) or larger?
    // In our C wrapper, we allocated 64 bytes for public key.
    // Private key... hss_generate_private_key uses secure storage callback or writes to context.
    // We need to check what length we expect.
    // HSS_MAX_PRIVATE_KEY_LEN is small (approx 48-64 bytes) for the SEED representation.
    // But the WORKING key is huge.
    // We are exporting the persistent private key (seed).

    const PUB_LEN = 64
    const PRIV_LEN = 128 // Safe margin

    const pubPtr = m._malloc(PUB_LEN)
    const privPtr = m._malloc(PRIV_LEN)

    try {
      const res = m._generate_keypair_wasm(pubPtr, privPtr, lmsType, lmotsType)
      if (res !== 0) {
        throw new Error('Key generation failed')
      }

      // We need to know actual lengths.
      // For now, assuming standard LMS/HSS encoding lengths.
      // HSS/LMS keys usually have length embedded or fixed by param.
      // But to be safe, we can read a fixed amount or parse it.
      // Pub key typically lms_pub_key_len.

      // For this MVP, we copy the max buffer or try to determine length.
      // Let's assume the wrapper zeroed the buffer or filled it relative to the beginning.
      // LMS Public Key: u32 type || u32 ots_type || I || K (approx 4+4+16+32 = 56 bytes for SHA256)

      // Private Key: u32 type || ... (approx similar size for seed)

      const pubKey = new Uint8Array(m.HEAPU8.subarray(pubPtr, pubPtr + PUB_LEN)).slice() // Copy
      const privKey = new Uint8Array(m.HEAPU8.subarray(privPtr, privPtr + PRIV_LEN)).slice() // Copy

      return { publicKey: pubKey, privateKey: privKey }
    } finally {
      m._free(pubPtr)
      m._free(privPtr)
    }
  }

  async sign(
    privateKey: Uint8Array,
    message: Uint8Array
  ): Promise<{ signature: Uint8Array; updatedPrivateKey: Uint8Array }> {
    await this.init()
    const m = this.module!
    const allocations: number[] = []
    const allocate = (size: number) => {
      const pointer = m._malloc(Math.max(size, 1))
      if (!pointer) throw new Error('LMS allocation failed')
      allocations.push(pointer)
      return pointer
    }
    try {
      const privatePtr = allocate(privateKey.length)
      m.HEAPU8.set(privateKey, privatePtr)
      const required = m._get_signature_length_wasm(privatePtr, privateKey.length)
      if (!Number.isSafeInteger(required) || required <= 0)
        throw new Error('LMS key parameters or required signature length are invalid')
      const messagePtr = allocate(message.length)
      m.HEAPU8.set(message, messagePtr)
      const signaturePtr = allocate(required)
      const writtenPtr = allocate(4)
      m.HEAPU8.fill(0, writtenPtr, writtenPtr + 4)
      const result = m._sign_message_bounded_wasm(
        privatePtr,
        privateKey.length,
        messagePtr,
        message.length,
        signaturePtr,
        required,
        writtenPtr
      )
      if (result !== 0)
        throw new Error(
          result === -2
            ? 'LMS signature capacity was insufficient; signing did not complete'
            : 'LMS signing did not complete'
        )
      const written = new DataView(m.HEAPU8.buffer).getUint32(writtenPtr, true)
      if (written !== required) throw new Error('LMS returned an invalid exact signature length')
      return {
        signature: m.HEAPU8.slice(signaturePtr, signaturePtr + written),
        updatedPrivateKey: m.HEAPU8.slice(privatePtr, privatePtr + privateKey.length),
      }
    } finally {
      for (const pointer of allocations) m._free(pointer)
    }
  }

  async verify(
    publicKey: Uint8Array,
    message: Uint8Array,
    signature: Uint8Array
  ): Promise<boolean> {
    await this.init()
    const m = this.module!

    const PUB_LEN = publicKey.length
    const MSG_LEN = message.length
    const SIG_LEN = signature.length

    const pubPtr = m._malloc(PUB_LEN)
    m.HEAPU8.set(publicKey, pubPtr)

    const msgPtr = m._malloc(MSG_LEN)
    m.HEAPU8.set(message, msgPtr)

    const sigPtr = m._malloc(SIG_LEN)
    m.HEAPU8.set(signature, sigPtr)

    try {
      // Verify
      const res = m._verify_wasm(pubPtr, msgPtr, MSG_LEN, sigPtr, SIG_LEN)
      // Returns 1 on success
      return res === 1
    } finally {
      m._free(pubPtr)
      m._free(msgPtr)
      m._free(sigPtr)
    }
  }
}

export const lmsService = new LmsService()
