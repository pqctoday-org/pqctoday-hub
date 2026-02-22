import { openSSLService } from '@/services/crypto/OpenSSLService'
import { generateX25519KeyPair, deriveSharedSecret, hkdfExtract } from '@/utils/webCrypto'

export interface KeyGenResult {
  algorithm: string
  pemOutput: string
  keyInfo: string
  timingMs: number
  fileData?: { name: string; data: Uint8Array }
  error?: string
}

export interface KemResult {
  ciphertextHex: string
  sharedSecretHex: string
  timingMs: number
  ctFileData?: { name: string; data: Uint8Array }
  error?: string
}

export interface SignVerifyResult {
  signatureHex: string
  verified: boolean
  timingMs: number
  sigFileData?: { name: string; data: Uint8Array }
  error?: string
}

export interface HybridKemResult {
  pqcSecretHex: string
  classicalSecretHex: string
  combinedSecretHex: string
  pqcCiphertextHex: string
  classicalEphemeralPubHex: string
  pqcSecretsMatch: boolean
  keyGenMs: number
  encapMs: number
  decapMs: number
  hkdfMs: number
  totalMs: number
  error?: string
}

export interface CertResult {
  pem: string
  parsed: string
  timingMs: number
  error?: string
}

export class HybridCryptoService {
  private getGenCommand(algorithm: string, filename: string): string {
    if (algorithm === 'EC') {
      return `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ${filename}`
    }
    return `openssl genpkey -algorithm ${algorithm} -out ${filename}`
  }

  private toHex(data: Uint8Array): string {
    return Array.from(data)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async generateKey(algorithm: string, filename: string): Promise<KeyGenResult> {
    const start = performance.now()
    try {
      const genResult = await openSSLService.execute(this.getGenCommand(algorithm, filename))
      if (genResult.error) {
        return {
          algorithm,
          pemOutput: '',
          keyInfo: '',
          timingMs: performance.now() - start,
          error: genResult.error,
        }
      }

      // Look for the key file in output; fallback to stdout if WASM wrote there instead
      let keyFile = genResult.files.find((f) => f.name === filename)
      if (!keyFile && genResult.stdout && genResult.stdout.includes('-----BEGIN')) {
        keyFile = { name: filename, data: new TextEncoder().encode(genResult.stdout) }
      }
      if (!keyFile) {
        const detail = genResult.stderr?.trim()
        return {
          algorithm,
          pemOutput: '',
          keyInfo: '',
          timingMs: performance.now() - start,
          error: detail
            ? `Key generation failed: ${detail}`
            : `Algorithm "${algorithm}" is not supported for standalone key generation in this OpenSSL WASM build`,
        }
      }

      const readResult = await openSSLService.execute(`openssl pkey -in ${filename} -text -noout`, [
        keyFile,
      ])
      const pemResult = await openSSLService.execute(`openssl pkey -in ${filename}`, [keyFile])

      return {
        algorithm,
        pemOutput: pemResult.stdout || '',
        keyInfo: readResult.stdout || '',
        timingMs: performance.now() - start,
        fileData: keyFile,
      }
    } catch (e) {
      return {
        algorithm,
        pemOutput: '',
        keyInfo: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Key generation failed',
      }
    }
  }

  async extractPublicKey(
    privKeyFile: string,
    pubKeyFile: string,
    privKeyData?: { name: string; data: Uint8Array }
  ): Promise<{ fileData?: { name: string; data: Uint8Array }; error?: string }> {
    try {
      const result = await openSSLService.execute(
        `openssl pkey -in ${privKeyFile} -pubout -out ${pubKeyFile}`,
        privKeyData ? [privKeyData] : []
      )
      if (result.error) return { error: result.error }
      const pubFile = result.files.find((f) => f.name === pubKeyFile)
      return { fileData: pubFile, error: undefined }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Public key extraction failed' }
    }
  }

  async kemEncapsulate(
    pubKeyFile: string,
    prefix: string,
    pubKeyData?: { name: string; data: Uint8Array }
  ): Promise<KemResult> {
    const start = performance.now()
    const ctFile = `${prefix}_ct.bin`
    const ssFile = `${prefix}_ss.bin`
    try {
      const result = await openSSLService.execute(
        `openssl pkeyutl -encap -pubin -inkey ${pubKeyFile} -out ${ctFile} -secret ${ssFile}`,
        pubKeyData ? [pubKeyData] : []
      )
      if (result.error) {
        return {
          ciphertextHex: '',
          sharedSecretHex: '',
          timingMs: performance.now() - start,
          error: result.error,
        }
      }

      const ctData = result.files.find((f) => f.name === ctFile)
      const ssData = result.files.find((f) => f.name === ssFile)

      return {
        ciphertextHex: ctData ? this.toHex(ctData.data) : '',
        sharedSecretHex: ssData ? this.toHex(ssData.data) : '',
        ctFileData: ctData,
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return {
        ciphertextHex: '',
        sharedSecretHex: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Encapsulation failed',
      }
    }
  }

  async kemDecapsulate(
    privKeyFile: string,
    ctFile: string,
    prefix: string,
    inputFiles?: { name: string; data: Uint8Array }[]
  ): Promise<KemResult> {
    const start = performance.now()
    const ssFile = `${prefix}_ss_dec.bin`
    try {
      const result = await openSSLService.execute(
        `openssl pkeyutl -decap -inkey ${privKeyFile} -in ${ctFile} -secret ${ssFile}`,
        inputFiles || []
      )
      if (result.error) {
        return {
          ciphertextHex: '',
          sharedSecretHex: '',
          timingMs: performance.now() - start,
          error: result.error,
        }
      }

      const ssData = result.files.find((f) => f.name === ssFile)

      return {
        ciphertextHex: '',
        sharedSecretHex: ssData ? this.toHex(ssData.data) : '',
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return {
        ciphertextHex: '',
        sharedSecretHex: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Decapsulation failed',
      }
    }
  }

  async signData(
    privKeyFile: string,
    message: string,
    prefix: string,
    privKeyData?: { name: string; data: Uint8Array }
  ): Promise<SignVerifyResult> {
    const start = performance.now()
    const msgFile = `${prefix}_msg.bin`
    const sigFile = `${prefix}_sig.bin`
    try {
      const inputFiles: { name: string; data: Uint8Array }[] = [
        { name: msgFile, data: new TextEncoder().encode(message) },
      ]
      if (privKeyData) inputFiles.push(privKeyData)

      const result = await openSSLService.execute(
        `openssl pkeyutl -sign -inkey ${privKeyFile} -in ${msgFile} -out ${sigFile}`,
        inputFiles
      )
      if (result.error) {
        return {
          signatureHex: '',
          verified: false,
          timingMs: performance.now() - start,
          error: result.error,
        }
      }

      const sigData = result.files.find((f) => f.name === sigFile)

      return {
        signatureHex: sigData ? this.toHex(sigData.data) : '',
        verified: false,
        sigFileData: sigData,
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return {
        signatureHex: '',
        verified: false,
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Signing failed',
      }
    }
  }

  async verifySignature(
    pubKeyFile: string,
    message: string,
    sigFile: string,
    prefix: string,
    inputFiles?: { name: string; data: Uint8Array }[]
  ): Promise<SignVerifyResult> {
    const start = performance.now()
    const msgFile = `${prefix}_msg_v.bin`
    try {
      const files: { name: string; data: Uint8Array }[] = [
        { name: msgFile, data: new TextEncoder().encode(message) },
        ...(inputFiles || []),
      ]
      const result = await openSSLService.execute(
        `openssl pkeyutl -verify -pubin -inkey ${pubKeyFile} -in ${msgFile} -sigfile ${sigFile}`,
        files
      )

      const verified = (result.stdout || '').includes('Signature Verified Successfully')

      return {
        signatureHex: '',
        verified,
        timingMs: performance.now() - start,
        error: result.error || undefined,
      }
    } catch (e) {
      return {
        signatureHex: '',
        verified: false,
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Verification failed',
      }
    }
  }

  async hybridKemEncapDecap(): Promise<HybridKemResult> {
    const start = performance.now()
    try {
      // 1. ML-KEM-768 keygen via OpenSSL
      const keyGenStart = performance.now()
      const pqcKey = await this.generateKey('ML-KEM-768', 'hybrid_pqc_key.pem')
      if (pqcKey.error || !pqcKey.fileData) {
        return this.hybridKemError(start, pqcKey.error || 'PQC key generation failed')
      }
      const pubResult = await this.extractPublicKey(
        'hybrid_pqc_key.pem',
        'hybrid_pqc_pub.pem',
        pqcKey.fileData
      )
      if (pubResult.error || !pubResult.fileData) {
        return this.hybridKemError(start, pubResult.error || 'PQC public key extraction failed')
      }
      const keyGenMs = performance.now() - keyGenStart

      // 2. ML-KEM-768 encap + X25519 ECDH
      const encapStart = performance.now()
      const encapResult = await this.kemEncapsulate(
        'hybrid_pqc_pub.pem',
        'hybrid_pqc',
        pubResult.fileData
      )
      if (encapResult.error) {
        return this.hybridKemError(start, encapResult.error)
      }

      // X25519 ECDH: generate ephemeral pair and derive shared secret against itself
      // (self-agreement demo — shows the mechanism)
      const x25519Sender = await generateX25519KeyPair()
      const x25519Receiver = await generateX25519KeyPair()
      const classicalSecret = await deriveSharedSecret(
        x25519Sender.privateKey,
        x25519Receiver.publicKey
      )
      const classicalSecretVerify = await deriveSharedSecret(
        x25519Receiver.privateKey,
        x25519Sender.publicKey
      )
      const encapMs = performance.now() - encapStart

      // 3. ML-KEM-768 decap
      const decapStart = performance.now()
      const ctFile = 'hybrid_pqc_ct.bin'
      const decapInputFiles: { name: string; data: Uint8Array }[] = []
      if (pqcKey.fileData) decapInputFiles.push(pqcKey.fileData)
      if (encapResult.ctFileData) decapInputFiles.push(encapResult.ctFileData)
      const decapResult = await this.kemDecapsulate(
        'hybrid_pqc_key.pem',
        ctFile,
        'hybrid_pqc',
        decapInputFiles
      )
      const decapMs = performance.now() - decapStart

      const pqcSecretsMatch =
        encapResult.sharedSecretHex === decapResult.sharedSecretHex &&
        encapResult.sharedSecretHex.length > 0

      // 4. Combine PQC + classical secrets via HKDF-Extract
      const hkdfStart = performance.now()
      const pqcSecretBytes = new Uint8Array(
        (encapResult.sharedSecretHex.match(/.{2}/g) || []).map((b) => parseInt(b, 16))
      )
      const combined = new Uint8Array(classicalSecret.length + pqcSecretBytes.length)
      combined.set(classicalSecret)
      combined.set(pqcSecretBytes, classicalSecret.length)
      const hybridSecret = await hkdfExtract(new Uint8Array(0), combined, 'SHA-256')
      const hkdfMs = performance.now() - hkdfStart

      // Verify classical ECDH round-trip
      const classicalMatch = classicalSecret.every(
        // eslint-disable-next-line security/detect-object-injection
        (b, i) => b === classicalSecretVerify[i]
      )

      return {
        pqcSecretHex: encapResult.sharedSecretHex,
        classicalSecretHex: this.toHex(classicalSecret),
        combinedSecretHex: this.toHex(hybridSecret),
        pqcCiphertextHex: encapResult.ciphertextHex,
        classicalEphemeralPubHex: x25519Sender.publicKeyHex,
        pqcSecretsMatch: pqcSecretsMatch && classicalMatch,
        keyGenMs,
        encapMs,
        decapMs,
        hkdfMs,
        totalMs: performance.now() - start,
      }
    } catch (e) {
      return this.hybridKemError(start, e instanceof Error ? e.message : 'Hybrid KEM failed')
    }
  }

  private hybridKemError(start: number, error: string): HybridKemResult {
    return {
      pqcSecretHex: '',
      classicalSecretHex: '',
      combinedSecretHex: '',
      pqcCiphertextHex: '',
      classicalEphemeralPubHex: '',
      pqcSecretsMatch: false,
      keyGenMs: 0,
      encapMs: 0,
      decapMs: 0,
      hkdfMs: 0,
      totalMs: performance.now() - start,
      error,
    }
  }

  async generateSelfSignedCert(
    keyFile: string,
    certFile: string,
    subject?: string,
    keyFileData?: { name: string; data: Uint8Array }
  ): Promise<CertResult> {
    const start = performance.now()
    const subj = subject || '/CN=Hybrid Crypto Demo/O=PQC Today'
    try {
      const result = await openSSLService.execute(
        `openssl req -new -x509 -key ${keyFile} -out ${certFile} -days 365 -subj "${subj}"`,
        keyFileData ? [keyFileData] : []
      )
      if (result.error) {
        return { pem: '', parsed: '', timingMs: performance.now() - start, error: result.error }
      }

      // Get PEM directly from FILE_CREATED event — more reliable than reading stdout
      const certFileData = result.files.find((f) => f.name === certFile)
      const pem = certFileData ? new TextDecoder().decode(certFileData.data) : ''

      // Parse certificate by passing cert data as explicit input (avoids FS persistence dependency)
      const parsedResult = await openSSLService.execute(
        `openssl x509 -in ${certFile} -text -noout`,
        certFileData ? [{ name: certFile, data: certFileData.data }] : []
      )
      const parsed = parsedResult.stdout || parsedResult.stderr || ''

      return {
        pem,
        parsed,
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Certificate generation failed',
      }
    }
  }
}

export const hybridCryptoService = new HybridCryptoService()
