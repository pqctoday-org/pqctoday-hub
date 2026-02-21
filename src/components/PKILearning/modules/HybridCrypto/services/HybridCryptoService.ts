import { openSSLService } from '@/services/crypto/OpenSSLService'

export interface KeyGenResult {
  algorithm: string
  pemOutput: string
  keyInfo: string
  timingMs: number
  error?: string
}

export interface KemResult {
  ciphertextHex: string
  sharedSecretHex: string
  timingMs: number
  error?: string
}

export interface SignVerifyResult {
  signatureHex: string
  verified: boolean
  timingMs: number
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

      const readResult = await openSSLService.execute(`openssl pkey -in ${filename} -text -noout`)
      const pemResult = await openSSLService.execute(`openssl pkey -in ${filename}`)

      return {
        algorithm,
        pemOutput: pemResult.stdout || '',
        keyInfo: readResult.stdout || '',
        timingMs: performance.now() - start,
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

  async extractPublicKey(privKeyFile: string, pubKeyFile: string): Promise<{ error?: string }> {
    try {
      const result = await openSSLService.execute(
        `openssl pkey -in ${privKeyFile} -pubout -out ${pubKeyFile}`
      )
      return { error: result.error || undefined }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Public key extraction failed' }
    }
  }

  async kemEncapsulate(pubKeyFile: string, prefix: string): Promise<KemResult> {
    const start = performance.now()
    const ctFile = `${prefix}_ct.bin`
    const ssFile = `${prefix}_ss.bin`
    try {
      const result = await openSSLService.execute(
        `openssl pkeyutl -encap -pubin -inkey ${pubKeyFile} -out ${ctFile} -secret ${ssFile}`
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

  async kemDecapsulate(privKeyFile: string, ctFile: string, prefix: string): Promise<KemResult> {
    const start = performance.now()
    const ssFile = `${prefix}_ss_dec.bin`
    try {
      const result = await openSSLService.execute(
        `openssl pkeyutl -decap -inkey ${privKeyFile} -in ${ctFile} -secret ${ssFile}`
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

  async signData(privKeyFile: string, message: string, prefix: string): Promise<SignVerifyResult> {
    const start = performance.now()
    const msgFile = `${prefix}_msg.bin`
    const sigFile = `${prefix}_sig.bin`
    try {
      const result = await openSSLService.execute(
        `openssl pkeyutl -sign -inkey ${privKeyFile} -in ${msgFile} -out ${sigFile}`,
        [{ name: msgFile, data: new TextEncoder().encode(message) }]
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
    prefix: string
  ): Promise<SignVerifyResult> {
    const start = performance.now()
    const msgFile = `${prefix}_msg_v.bin`
    try {
      const result = await openSSLService.execute(
        `openssl pkeyutl -verify -pubin -inkey ${pubKeyFile} -in ${msgFile} -sigfile ${sigFile}`,
        [{ name: msgFile, data: new TextEncoder().encode(message) }]
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

  async generateSelfSignedCert(
    keyFile: string,
    certFile: string,
    subject?: string
  ): Promise<CertResult> {
    const start = performance.now()
    const subj = subject || '/CN=Hybrid Crypto Demo/O=PQC Today'
    try {
      const result = await openSSLService.execute(
        `openssl req -new -x509 -key ${keyFile} -out ${certFile} -days 365 -subj "${subj}"`
      )
      if (result.error) {
        return { pem: '', parsed: '', timingMs: performance.now() - start, error: result.error }
      }

      const pemResult = await openSSLService.execute(`openssl x509 -in ${certFile}`)
      const parsedResult = await openSSLService.execute(`openssl x509 -in ${certFile} -text -noout`)

      return {
        pem: pemResult.stdout || '',
        parsed: parsedResult.stdout || '',
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
