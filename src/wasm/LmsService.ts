// Interface for the Emscripten module
interface LmsModule {
  _generate_keypair_wasm: (
    pubPtr: number,
    privPtr: number,
    lmsType: number,
    lmotsType: number
  ) => number
  _sign_message_wasm: (
    privPtr: number,
    pubPtr: number,
    msgPtr: number,
    msgLen: number,
    sigPtr: number
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

declare global {
  function createLmsModule(): Promise<LmsModule>
}

export class LmsService {
  private module: LmsModule | null = null
  private isInitializing = false

  async init(): Promise<void> {
    if (this.module) return
    if (this.isInitializing) {
      // Simple wait loop
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 100))
      }
      return
    }

    this.isInitializing = true
    try {
      // Load the script if not present
      if (!document.getElementById('lms-wasm-script')) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.id = 'lms-wasm-script'
          script.src = '/wasm/lms.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load lms.js'))
          document.body.appendChild(script)
        })
      }

      // Initialize module
      // emscripten creates a global function createLmsModule based on EXPORT_NAME
      // But we need to make sure it's available
      if (typeof window.createLmsModule !== 'function') {
        throw new Error('createLmsModule not found. WASM script failed to export correctly.')
      }

      this.module = await window.createLmsModule()
      console.log('LMS WASM Module Initialized:', this.module)
      console.log('Module keys:', Object.keys(this.module))
      if (!this.module.HEAPU8) {
        console.error('HEAPU8 is missing from module!')
      }
    } catch (e) {
      console.error('LMS Init Error:', e)
      throw e
    } finally {
      this.isInitializing = false
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

    const PRIV_LEN = privateKey.length
    const MSG_LEN = message.length
    // HSS signatures are large, max ~5KB usually covers reasonable parameter sets
    const SIG_MAX_LEN = 5000

    const privPtr = m._malloc(PRIV_LEN)
    m.HEAPU8.set(privateKey, privPtr)

    const pubPtr = m._malloc(64) // Dummy
    const msgPtr = m._malloc(MSG_LEN)
    m.HEAPU8.set(message, msgPtr)

    const sigPtr = m._malloc(SIG_MAX_LEN)

    // Zero out signature buffer to assist with length finding if needed (though we rely on max for now)
    m.HEAPU8.fill(0, sigPtr, sigPtr + SIG_MAX_LEN)

    try {
      const res = m._sign_message_wasm(privPtr, pubPtr, msgPtr, MSG_LEN, sigPtr)
      if (res !== 0) {
        throw new Error('Signing failed')
      }

      // Capture the updated private key state
      const updatedPrivateKey = new Uint8Array(
        m.HEAPU8.subarray(privPtr, privPtr + PRIV_LEN)
      ).slice()

      // Capture signature and trim trailing zeros
      // The C code doesn't return actual signature length, so we find it by trimming zeros
      const fullSig = new Uint8Array(m.HEAPU8.subarray(sigPtr, sigPtr + SIG_MAX_LEN))
      let actualLen = SIG_MAX_LEN
      // Find last non-zero byte (LMS sigs don't end with many zeros)
      while (actualLen > 0 && fullSig[actualLen - 1] === 0) {
        actualLen--
      }
      // Safety: ensure we have at least some data
      if (actualLen < 100) {
        console.warn('LMS signature unexpectedly short, using full buffer')
        actualLen = SIG_MAX_LEN
      }
      const signature = fullSig.slice(0, actualLen)
      console.log(`LMS Signature: trimmed from ${SIG_MAX_LEN} to ${actualLen} bytes`)

      return { signature, updatedPrivateKey }
    } finally {
      m._free(privPtr)
      m._free(pubPtr)
      m._free(msgPtr)
      m._free(sigPtr)
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
