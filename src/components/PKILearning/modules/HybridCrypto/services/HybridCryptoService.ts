// SPDX-License-Identifier: GPL-3.0-only
import type { HsmFamily, HsmKeyRole } from '@/components/Playground/hsm/HsmContext'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { generateX25519KeyPair, deriveSharedSecret, hkdfExtract } from '@/utils/webCrypto'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateSLHDSAKeyPair,
  hsm_generateEdDSAKeyPair,
  hsm_generateRSAKeyPair,
  hsm_extractKeyValue,
  hsm_extractECPoint,
  hsm_extractRSAPublicKeyDer,
  hsm_generateMLKEMKeyPair,
  hsm_getKeyAttributes,
  hsm_signBytesMLDSA,
  hsm_signBytesECDSA,
  hsm_signBytesSLHDSA,
  hsm_signBytesEdDSA,
  hsm_signBytesRSA,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA384,
  CKM_SHA256_RSA_PKCS_PSS,
} from '@/wasm/softhsm'
import {
  buildCompositeCertDraft19,
  ecdsaRawSignatureToDer,
  COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512,
  ML_DSA_44_OID_STR,
  ML_DSA_87_OID_STR,
  type CompositeProfileDraft19,
  buildCompositeKEMCert,
  buildAltSigCert,
  buildRelatedCertificates,
  buildChameleonCert,
  buildWorkshopCA,
  issueCertificate,
  ecP256SpkiAlgId,
  EC_PUBLIC_KEY_OID_STR,
  ECDSA_SHA256_OID_STR,
  SLH_DSA_SHA2_128S_OID_STR,
  type CertIssuer,
  derToPem,
  buildParsedText,
  ML_DSA_65_OID_STR,
  COMPOSITE_KEM_MLKEM768_X25519_OID_STR,
  type SignerFn,
  type CompositeMLDSASignerFn,
} from './certBuilder'
import {
  checkProfile,
  parseCertificate,
  verifyAltSigCert,
  verifyChameleonCert,
  verifyIssuedBy,
  verifyRelatedCertificate,
  type VerificationCheck,
} from './certVerifier'

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

/** One certificate a format produced, ready to display and download. */
export interface IssuedCertView {
  label: string
  pem: string
  parsed: string
  type: 'classical' | 'pqc'
  /** 'ca' = the workshop CA that issued the subject; 'existing' = RFC 9763 Cert A */
  role: 'ca' | 'subject' | 'existing'
}

/**
 * Everything one hybrid-certificate format produced: the certificates
 * (issuer first), the verification checks run over them by an implementation
 * other than the HSM that signed them, and format-specific extras.
 */
export interface FormatOutput {
  certs: IssuedCertView[]
  checks: VerificationCheck[]
  timingMs: number
  /** RFC 9763: hex hash of Cert A, as stored in Cert B */
  bindingHash?: string
  error?: string
}

const ML_KEM_768_OID_STR = '2.16.840.1.101.3.4.4.2'
const SANDBOX_OU = 'Hybrid Certificate Sandbox'

export type KeyTracker = (
  handle: number,
  family: HsmFamily,
  label: string,
  role?: HsmKeyRole
) => void

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

  async generateCACert(
    algorithm: string,
    label: string
  ): Promise<CertResult & { keyFileData?: { name: string; data: Uint8Array } }> {
    const start = performance.now()
    const prefix = algorithm === 'EC' ? 'ca_ec' : 'ca_pqc'
    try {
      const keyResult = await this.generateKey(algorithm, `${prefix}_key.pem`)
      if (keyResult.error || !keyResult.fileData) {
        return {
          pem: '',
          parsed: '',
          timingMs: performance.now() - start,
          error: keyResult.error || 'CA key generation failed',
        }
      }

      const subj = `/CN=${label} Root CA/O=PQC Today/OU=Hybrid Certificate Sandbox`
      const certResult = await openSSLService.execute(
        `openssl req -new -x509 -key ${prefix}_key.pem -out ${prefix}_cert.pem -days 365 -subj "${subj}"`,
        [keyResult.fileData]
      )
      if (certResult.error) {
        return { pem: '', parsed: '', timingMs: performance.now() - start, error: certResult.error }
      }

      const certFileData = certResult.files.find((f) => f.name === `${prefix}_cert.pem`)
      const pem = certFileData ? new TextDecoder().decode(certFileData.data) : ''

      const parsedResult = await openSSLService.execute(
        `openssl x509 -in ${prefix}_cert.pem -text -noout`,
        certFileData ? [{ name: `${prefix}_cert.pem`, data: certFileData.data }] : []
      )

      return {
        pem,
        parsed: parsedResult.stdout || parsedResult.stderr || '',
        timingMs: performance.now() - start,
        keyFileData: keyResult.fileData,
      }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'CA certificate generation failed',
      }
    }
  }

  async generateRelatedCertPair(): Promise<{
    classical: CertResult
    pqc: CertResult
    bindingHash: string
    totalMs: number
    error?: string
  }> {
    const start = performance.now()
    const empty: CertResult = { pem: '', parsed: '', timingMs: 0 }
    try {
      // Generate classical cert
      const ecKey = await this.generateKey('EC', 'rel_ec_key.pem')
      if (ecKey.error || !ecKey.fileData) {
        return {
          classical: empty,
          pqc: empty,
          bindingHash: '',
          totalMs: performance.now() - start,
          error: ecKey.error,
        }
      }
      const ecCert = await this.generateSelfSignedCert(
        'rel_ec_key.pem',
        'rel_ec_cert.pem',
        '/CN=Related Cert A (Classical)/O=PQC Today/OU=Hybrid Certificate Sandbox',
        ecKey.fileData
      )

      // Generate PQC cert
      const pqcKey = await this.generateKey('ML-DSA-65', 'rel_pqc_key.pem')
      if (pqcKey.error || !pqcKey.fileData) {
        return {
          classical: empty,
          pqc: empty,
          bindingHash: '',
          totalMs: performance.now() - start,
          error: pqcKey.error,
        }
      }
      const pqcCert = await this.generateSelfSignedCert(
        'rel_pqc_key.pem',
        'rel_pqc_cert.pem',
        '/CN=Related Cert B (PQC)/O=PQC Today/OU=Hybrid Certificate Sandbox',
        pqcKey.fileData
      )

      if (ecCert.error || pqcCert.error) {
        return {
          classical: ecCert,
          pqc: pqcCert,
          bindingHash: '',
          totalMs: performance.now() - start,
          error: ecCert.error || pqcCert.error,
        }
      }

      // Simulate binding hash: SHA-256 of the partner cert PEM
      const encoder = new TextEncoder()
      const pqcHash = await crypto.subtle.digest('SHA-256', encoder.encode(pqcCert.pem))
      const bindingHash = Array.from(new Uint8Array(pqcHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(':')

      return {
        classical: ecCert,
        pqc: pqcCert,
        bindingHash,
        totalMs: performance.now() - start,
      }
    } catch (e) {
      return {
        classical: empty,
        pqc: empty,
        bindingHash: '',
        totalMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Related cert pair generation failed',
      }
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
  // -----------------------------------------------------------------------
  // Real certificate generation methods (software mode: liboqs + Web Crypto)
  // -----------------------------------------------------------------------

  /**
   * Generate an ECDSA P-256 key pair + signer function via SoftHSM PKCS#11.
   * C_GenerateKeyPair → CKA_EC_POINT for public key, C_Sign for signature.
   */
  private async generateECKeyPairForCert(
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker,
    mechType: number = CKM_ECDSA_SHA256,
    curve: 'P-256' | 'P-384' = 'P-256'
  ): Promise<{
    publicKeyRaw: Uint8Array
    signerFn: SignerFn
    /**
     * Same key, but the signature is re-encoded as a DER Ecdsa-Sig-Value.
     * Composite requires this; the legacy formats below expect the raw form.
     */
    derSignerFn: SignerFn
  }> {
    const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve, false, 'sign')
    if (onKey) onKey(privHandle, 'ecdsa', `ECDSA ${curve} (Cert Gen)`, 'private')
    if (onKey) onKey(pubHandle, 'ecdsa', `ECDSA ${curve} Public (Cert Gen)`, 'public')
    const ecPoint = hsm_extractECPoint(M, hSession, pubHandle)
    // CKA_EC_POINT is a DER OCTET STRING wrapping the uncompressed point.
    // Strip the 2-byte header by comparing against the expected point length
    // rather than sniffing the first byte — an uncompressed point ALSO starts
    // with 0x04, so a tag check cannot tell wrapper from payload.
    const pointLen = curve === 'P-384' ? 97 : 65
    const rawPub = ecPoint.length === pointLen + 2 ? ecPoint.slice(2) : ecPoint
    const signerFn: SignerFn = async (tbs: Uint8Array) => {
      return hsm_signBytesECDSA(M, hSession, privHandle, tbs, mechType)
    }
    // PKCS#11 C_Sign returns raw r||s. draft §4.1 requires an Ecdsa-Sig-Value.
    const derSignerFn: SignerFn = async (tbs: Uint8Array) => {
      return ecdsaRawSignatureToDer(await signerFn(tbs))
    }
    return { publicKeyRaw: rawPub, signerFn, derSignerFn }
  }

  /**
   * Generate an Ed25519 key pair + signer via SoftHSM PKCS#11, for the
   * composite profiles whose traditional half is Ed25519 (.39 and .48).
   *
   * CKM_EDDSA (not CKM_EDDSA_PH) is deliberate: composite signs the message
   * representative M' directly as PureEdDSA per RFC 8032 §5.1. Pre-hashing
   * would implement Ed25519ph, which the draft does not specify here.
   */
  private async generateEd25519KeyPairForCert(
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<{ publicKeyRaw: Uint8Array; signerFn: SignerFn }> {
    const { pubHandle, privHandle } = hsm_generateEdDSAKeyPair(M, hSession, 'Ed25519', false)
    if (onKey) onKey(privHandle, 'eddsa', 'Ed25519 (Cert Gen)', 'private')
    if (onKey) onKey(pubHandle, 'eddsa', 'Ed25519 Public (Cert Gen)', 'public')
    // Unlike an EC point, softhsm returns the Ed25519 public key as the bare
    // 32 raw bytes RFC 8410 specifies — no OCTET STRING wrapper to strip.
    const publicKeyRaw = hsm_extractECPoint(M, hSession, pubHandle)
    const signerFn: SignerFn = async (mprime: Uint8Array) =>
      hsm_signBytesEdDSA(M, hSession, privHandle, mprime)
    return { publicKeyRaw, signerFn }
  }

  /**
   * Generate an RSA key pair + RSASSA-PSS signer via SoftHSM PKCS#11, for the
   * composite profiles whose traditional half is RSA (.37 at 2048, .41 at 3072).
   *
   * CKM_SHA256_RSA_PKCS_PSS matches draft §6.1 Table 2 exactly — SHA-256 digest,
   * MGF1-SHA-256, 32-byte salt — for BOTH key sizes. Note that .41's pre-hash is
   * SHA-512 while its PSS hash stays SHA-256; the mechanism here follows Table 2,
   * not the profile name.
   */
  private async generateRSAKeyPairForCert(
    M: SoftHSMModule,
    hSession: number,
    modulusBits: 2048 | 3072,
    onKey?: KeyTracker
  ): Promise<{ publicKeyDer: Uint8Array; signerFn: SignerFn }> {
    const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, modulusBits)
    if (onKey) onKey(privHandle, 'rsa', `RSA-${modulusBits} (Cert Gen)`, 'private')
    if (onKey) onKey(pubHandle, 'rsa', `RSA-${modulusBits} Public (Cert Gen)`, 'public')
    // draft §4.1 carries the RSA tradPK as a DER RSAPublicKey, not an SPKI.
    const publicKeyDer = hsm_extractRSAPublicKeyDer(M, hSession, pubHandle)
    const signerFn: SignerFn = async (mprime: Uint8Array) =>
      hsm_signBytesRSA(M, hSession, privHandle, mprime, CKM_SHA256_RSA_PKCS_PSS)
    return { publicKeyDer, signerFn }
  }

  /**
   * Generate the traditional half for any composite profile, dispatching on the
   * profile's §6 classical descriptor. Returns the public key already in the
   * encoding §4.1 requires, and a signer producing the encoding §4.1 requires.
   */
  private async generateClassicalForProfile(
    profile: CompositeProfileDraft19,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<{ publicKey: Uint8Array; signerFn: SignerFn }> {
    const spec = profile.classical
    switch (spec.kind) {
      case 'ecdsa': {
        const mech = spec.tradHash === 'SHA-384' ? CKM_ECDSA_SHA384 : CKM_ECDSA_SHA256
        const ec = await this.generateECKeyPairForCert(M, hSession, onKey, mech, spec.curve)
        return { publicKey: ec.publicKeyRaw, signerFn: ec.derSignerFn }
      }
      case 'ed25519': {
        const ed = await this.generateEd25519KeyPairForCert(M, hSession, onKey)
        return { publicKey: ed.publicKeyRaw, signerFn: ed.signerFn }
      }
      case 'rsa-pss': {
        const rsa = await this.generateRSAKeyPairForCert(M, hSession, spec.modulusBits, onKey)
        return { publicKey: rsa.publicKeyDer, signerFn: rsa.signerFn }
      }
    }
  }

  /**
   * Generate an ML-DSA-65 key pair + signer function via SoftHSM PKCS#11.
   * C_GenerateKeyPair → CKA_VALUE for public key, C_MessageSign for signature.
   */
  private async generateMLDSAKeyPairForCert(
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker,
    paramSet: 44 | 65 | 87 = 65
  ): Promise<{
    publicKey: Uint8Array
    signerFn: SignerFn
    compositeSignerFn: CompositeMLDSASignerFn
  }> {
    const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, paramSet)
    if (onKey) onKey(privHandle, 'ml-dsa', `ML-DSA-${paramSet} (Cert Gen)`, 'private')
    if (onKey) onKey(pubHandle, 'ml-dsa', `ML-DSA-${paramSet} Public (Cert Gen)`, 'public')
    const publicKey = hsm_extractKeyValue(M, hSession, pubHandle)
    const signerFn: SignerFn = async (tbs: Uint8Array) => {
      return hsm_signBytesMLDSA(M, hSession, privHandle, tbs)
    }
    // Composite ML-DSA signs M' with ctx = the profile's signature label
    // (FIPS 204 Algorithm 2), carried as the PKCS#11 v3.2 context string.
    // Omitting ctx yields signatures a composite verifier rejects.
    const compositeSignerFn: CompositeMLDSASignerFn = async (
      mprime: Uint8Array,
      mldsaCtx: Uint8Array
    ) => {
      return hsm_signBytesMLDSA(M, hSession, privHandle, mprime, { context: mldsaCtx })
    }
    return { publicKey, signerFn, compositeSignerFn }
  }

  /**
   * A workshop root CA in the HSM. ML-DSA-65 by default; SLH-DSA-SHA2-128s
   * for the SLH-DSA example so that card still shows an SLH-DSA signature.
   */
  private async createWorkshopCA(
    M: SoftHSMModule,
    hSession: number,
    onKey: KeyTracker | undefined,
    alg: 'ML-DSA-65' | 'SLH-DSA-SHA2-128s' = 'ML-DSA-65'
  ): Promise<CertIssuer> {
    const subject = `/CN=PQC Today Workshop CA (${alg})/O=PQC Today/OU=${SANDBOX_OU}`
    if (alg === 'SLH-DSA-SHA2-128s') {
      const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession)
      if (onKey) onKey(privHandle, 'slh-dsa', 'SLH-DSA-128s Workshop CA', 'private')
      if (onKey) onKey(pubHandle, 'slh-dsa', 'SLH-DSA-128s Workshop CA Public', 'public')
      return buildWorkshopCA({
        subject,
        keyOid: SLH_DSA_SHA2_128S_OID_STR,
        publicKey: hsm_extractKeyValue(M, hSession, pubHandle),
        signerFn: async (tbs) => hsm_signBytesSLHDSA(M, hSession, privHandle, tbs),
      })
    }
    const ca = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
    return buildWorkshopCA({
      subject,
      keyOid: ML_DSA_65_OID_STR,
      publicKey: ca.publicKey,
      signerFn: ca.signerFn,
    })
  }

  /** Display view for a certificate. */
  private view(
    der: Uint8Array,
    label: string,
    type: IssuedCertView['type'],
    role: IssuedCertView['role'],
    hint?: string
  ): IssuedCertView {
    const now = new Date()
    return {
      label,
      pem: derToPem(der, 'CERTIFICATE'),
      parsed: buildParsedText(der, '', now, now, hint),
      type,
      role,
    }
  }

  /** Signature + name chain + CA checks for an end entity and its CA. */
  private chainChecks(subjectDer: Uint8Array, caDer: Uint8Array): VerificationCheck[] {
    const ee = parseCertificate(subjectDer)
    const ca = parseCertificate(caDer)
    return [
      ...verifyIssuedBy(ca, ca).map((c) => ({ ...c, name: `CA: ${c.name}` })),
      ...checkProfile(ca, { keyUsage: ['keyCertSign', 'cRLSign'], cA: true }).map((c) => ({
        ...c,
        name: `CA: ${c.name}`,
      })),
      ...verifyIssuedBy(ee, ca),
    ]
  }

  private failed(start: number, e: unknown, fallback: string): FormatOutput {
    return {
      certs: [],
      checks: [],
      timingMs: performance.now() - start,
      error: e instanceof Error ? e.message : fallback,
    }
  }

  /**
   * Pure PQC: an ML-DSA-65 end-entity certificate (RFC 9881) issued by an
   * ML-DSA-65 workshop CA. Empty context, parameters absent, critical
   * keyUsage = digitalSignature.
   */
  async generatePurePQCCertMLDSA(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const ca = await this.createWorkshopCA(M, hSession, onKey)
      const ee = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
      const { der } = await issueCertificate({
        subject,
        subjectKeyOid: ML_DSA_65_OID_STR,
        subjectPublicKey: ee.publicKey,
        issuer: ca,
        isCA: false,
        keyUsage: ['digitalSignature'],
      })
      const checks = [
        ...this.chainChecks(der, ca.certDer),
        ...checkProfile(parseCertificate(der), { keyUsage: ['digitalSignature'], cA: false }),
        { name: 'ML-DSA-65 public key is 1,952 bytes', ok: ee.publicKey.length === 1952 },
      ]
      return {
        certs: [
          this.view(ca.certDer, 'Workshop CA (ML-DSA-65)', 'pqc', 'ca'),
          this.view(
            der,
            'ML-DSA-65 end-entity certificate (RFC 9881)',
            'pqc',
            'subject',
            'pure-pqc'
          ),
        ],
        checks,
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'ML-DSA-65 certificate generation failed')
    }
  }

  /**
   * Composite certificate: ML-DSA-65 + ECDSA P-256 (draft-ietf-lamps-pq-composite-sigs).
   * Real DER-encoded X.509 with composite OID 1.3.6.1.5.5.7.6.45.
   *
   * Uses the current LAMPS serialization (§4): both the public key and the
   * signature are RAW CONCATENATIONS with the ML-DSA component FIRST, carried
   * directly in the BIT STRING with no further ASN.1 wrapping (§5.1). Both
   * components sign the message representative
   *   M' = Prefix || Label || len(ctx) || ctx || PH(TBS)
   * and ML-DSA takes the signature label as its FIPS 204 ctx.
   */
  async generateCompositeCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker,
    /**
     * Which draft §6 profile to mint. Defaults to id-MLDSA65-ECDSA-P256-SHA512,
     * the profile §10.4 calls the "best overall balance of performance and
     * security" — and the previous hard-coded behaviour, so existing callers
     * are unaffected.
     */
    profile: CompositeProfileDraft19 = COMPOSITE_PROFILE_MLDSA65_ECDSA_P256_SHA512
  ): Promise<CertResult> {
    const start = performance.now()
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      // Every per-profile fact — ML-DSA parameter set, classical family, curve,
      // RSA size, traditional hash — comes from the profile's draft §6
      // descriptor. Nothing about the algorithm choice is decided here, so
      // adding a profile needs no change to this method.
      //
      // The traditional hash in particular is NOT the SHAxxx in the profile
      // name: for id-MLDSA65-ECDSA-P256-SHA512 draft §6 gives "Traditional
      // Signature Algorithm: ecdsa-with-SHA256" — the ECDSA hash tracks the
      // CURVE, and the name's SHA512 is the pre-hash PH applied to the message.
      // Corrected 2026-08-17; the previous SHA-512 choice produced certificates
      // that verified against our own verifier and would be rejected by every
      // conformant implementation.
      const mldsaParamSet =
        profile.mldsaOid === ML_DSA_44_OID_STR
          ? 44
          : profile.mldsaOid === ML_DSA_87_OID_STR
            ? 87
            : 65
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey, mldsaParamSet)
      const classical = await this.generateClassicalForProfile(profile, M, hSession, onKey)

      const derBytes = await buildCompositeCertDraft19(
        profile,
        mldsa.publicKey,
        classical.publicKey,
        mldsa.compositeSignerFn,
        classical.signerFn,
        subject
      )
      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter, 'composite', profile)
      return { pem, parsed, timingMs: performance.now() - start }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Composite certificate generation failed',
      }
    }
  }

  /**
   * Alt-Sig / Catalyst certificate (ITU-T X.509 (10/2019) §7.2.2, §9.8).
   * ECDSA P-256 primary (DER Ecdsa-Sig-Value) with ML-DSA-65 in extensions
   * 2.5.29.72/73/74. Self-signed: it demonstrates the extension mechanism.
   */
  async generateAltSigCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey)
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
      const der = await buildAltSigCert(
        ec.publicKeyRaw,
        ec.derSignerFn,
        mldsa.publicKey,
        mldsa.signerFn,
        subject
      )
      return {
        certs: [
          this.view(
            der,
            'Alt-Sig certificate: ECDSA primary + ML-DSA-65 extensions',
            'classical',
            'subject',
            'alt-sig'
          ),
        ],
        checks: verifyAltSigCert(parseCertificate(der)),
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'Alt-Sig certificate generation failed')
    }
  }

  /**
   * Related Certificates (RFC 9763). An existing ECDSA Cert A is issued first
   * and never modified; the requester proves possession of Cert A's key in a
   * relatedCertRequest; the ML-DSA-65 workshop CA verifies that proof and
   * issues Cert B carrying a hash of the complete final Cert A.
   */
  async generateRelatedCertPairReal(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey)
      const { der: certA } = await issueCertificate({
        subject: subject.replace(/CN=([^/]+)/, 'CN=$1 (Existing classical)'),
        subjectKeyOid: EC_PUBLIC_KEY_OID_STR,
        subjectAlgId: ecP256SpkiAlgId(),
        subjectPublicKey: ec.publicKeyRaw,
        issuer: null,
        selfSigner: { signatureOid: ECDSA_SHA256_OID_STR, signerFn: ec.derSignerFn },
        isCA: false,
        keyUsage: ['digitalSignature'],
      })
      const ca = await this.createWorkshopCA(M, hSession, onKey)
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
      const related = await buildRelatedCertificates({
        certA,
        certASignerFn: ec.derSignerFn,
        locationInfo: 'urn:pqctoday:workshop:related-cert-a',
        certBSubject: subject.replace(/CN=([^/]+)/, 'CN=$1 (New PQC)'),
        certBKeyOid: ML_DSA_65_OID_STR,
        certBPublicKey: mldsa.publicKey,
        issuer: ca,
      })
      const certAParsed = parseCertificate(certA)
      const certBParsed = parseCertificate(related.certB)
      const checks: VerificationCheck[] = [
        ...verifyIssuedBy(certAParsed, certAParsed).map((c) => ({
          ...c,
          name: `Cert A: ${c.name}`,
        })),
        {
          name: 'CA verified the relatedCertRequest proof of possession of Cert A',
          ok: related.requestVerified,
        },
        ...this.chainChecks(related.certB, ca.certDer).map((c) => ({
          ...c,
          name: c.name.startsWith('CA:') ? c.name : `Cert B: ${c.name}`,
        })),
        verifyRelatedCertificate(certBParsed, certA),
      ]
      return {
        certs: [
          this.view(certA, 'Cert A — existing ECDSA P-256 certificate', 'classical', 'existing'),
          this.view(ca.certDer, 'Workshop CA (ML-DSA-65)', 'pqc', 'ca'),
          this.view(
            related.certB,
            'Cert B — new ML-DSA-65 certificate referencing Cert A',
            'pqc',
            'subject'
          ),
        ],
        checks,
        bindingHash: related.bindingHash,
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'Related certificate generation failed')
    }
  }

  /**
   * Chameleon certificate — HISTORICAL (draft-bonnell-lamps-chameleon-certs-07,
   * expired individual draft). ML-DSA-65 primary with a DeltaCertificateDescriptor
   * holding a DER-encoded ECDSA delta signature; the delta certificate is
   * reconstructed from the descriptor and verified.
   */
  async generateChameleonCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey)
      const der = await buildChameleonCert(
        mldsa.publicKey,
        mldsa.signerFn,
        ec.publicKeyRaw,
        ec.derSignerFn,
        subject
      )
      return {
        certs: [
          this.view(
            der,
            'Chameleon: ML-DSA-65 primary + ECDSA delta',
            'pqc',
            'subject',
            'chameleon'
          ),
        ],
        checks: verifyChameleonCert(parseCertificate(der)),
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'Chameleon certificate generation failed')
    }
  }

  /**
   * Pure PQC: an SLH-DSA-SHA2-128s end-entity certificate (RFC 9909) issued by
   * an SLH-DSA workshop CA. C_GenerateKeyPair(CKM_SLH_DSA_KEY_PAIR_GEN) +
   * C_MessageSign(CKM_SLH_DSA).
   */
  async generateSelfSignedCertSLHDSA(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const ca = await this.createWorkshopCA(M, hSession, onKey, 'SLH-DSA-SHA2-128s')
      const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession)
      if (onKey) onKey(privHandle, 'slh-dsa', 'SLH-DSA-128s (Cert Gen)', 'private')
      if (onKey) onKey(pubHandle, 'slh-dsa', 'SLH-DSA-128s Public (Cert Gen)', 'public')
      const publicKey = hsm_extractKeyValue(M, hSession, pubHandle)
      const { der } = await issueCertificate({
        subject,
        subjectKeyOid: SLH_DSA_SHA2_128S_OID_STR,
        subjectPublicKey: publicKey,
        issuer: ca,
        isCA: false,
        keyUsage: ['digitalSignature'],
      })
      return {
        certs: [
          this.view(ca.certDer, 'Workshop CA (SLH-DSA-SHA2-128s)', 'pqc', 'ca'),
          this.view(
            der,
            'SLH-DSA-128s end-entity certificate (RFC 9909)',
            'pqc',
            'subject',
            'pure-pqc-slh'
          ),
        ],
        checks: [
          ...this.chainChecks(der, ca.certDer),
          ...checkProfile(parseCertificate(der), { keyUsage: ['digitalSignature'], cA: false }),
        ],
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'SLH-DSA certificate generation failed')
    }
  }

  /** ML-KEM-768 key pair in the HSM, with its PKCS#11 usage attributes checked. */
  private generateMLKEMForCert(
    M: SoftHSMModule,
    hSession: number,
    onKey: KeyTracker | undefined
  ): { publicKey: Uint8Array; checks: VerificationCheck[] } {
    const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(M, hSession, 768)
    if (onKey) onKey(privHandle, 'ml-kem', 'ML-KEM-768 (Cert Gen)', 'private')
    if (onKey) onKey(pubHandle, 'ml-kem', 'ML-KEM-768 Public (Cert Gen)', 'public')
    const publicKey = hsm_extractKeyValue(M, hSession, pubHandle)
    const pub = hsm_getKeyAttributes(M, hSession, pubHandle)
    const prv = hsm_getKeyAttributes(M, hSession, privHandle)
    return {
      publicKey,
      checks: [
        { name: 'ML-KEM-768 public key is 1,184 bytes', ok: publicKey.length === 1184 },
        {
          name: 'ML-KEM public key: CKA_ENCAPSULATE set, no CKA_VERIFY',
          ok: pub.ckEncapsulate === true && pub.ckVerify !== true,
        },
        {
          name: 'ML-KEM private key: CKA_DECAPSULATE set, no CKA_SIGN',
          ok: prv.ckDecapsulate === true && prv.ckSign !== true,
        },
      ],
    }
  }

  /**
   * Pure PQC KEM: an ML-KEM-768 end-entity certificate (RFC 9935) issued by an
   * ML-DSA-65 workshop CA. The subject key performs encapsulation and
   * decapsulation; only the issuer key signs. keyUsage = keyEncipherment only.
   * Runs on the playground HSM — the same runtime as every other format.
   */
  async generatePurePQCCertMLKEM(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const ca = await this.createWorkshopCA(M, hSession, onKey)
      const kem = this.generateMLKEMForCert(M, hSession, onKey)
      const { der } = await issueCertificate({
        subject,
        subjectKeyOid: ML_KEM_768_OID_STR,
        subjectPublicKey: kem.publicKey,
        issuer: ca,
        isCA: false,
        keyUsage: ['keyEncipherment'],
      })
      return {
        certs: [
          this.view(ca.certDer, 'Workshop CA (ML-DSA-65)', 'pqc', 'ca'),
          this.view(der, 'ML-KEM-768 end-entity certificate (RFC 9935)', 'pqc', 'subject'),
        ],
        checks: [
          ...this.chainChecks(der, ca.certDer),
          ...checkProfile(parseCertificate(der), { keyUsage: ['keyEncipherment'], cA: false }),
          ...kem.checks,
        ],
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'ML-KEM-768 certificate generation failed')
    }
  }

  /**
   * Composite KEM certificate (draft-ietf-lamps-pq-composite-kem-21):
   * id-MLKEM768-X25519-SHA3-256 (1.3.6.1.5.5.7.6.58), subjectPublicKey =
   * mlkem768PK (1184 B) ‖ x25519PK (32 B), ML-KEM first. Both keys live in the
   * playground HSM; the certificate is issued by the ML-DSA-65 workshop CA.
   * This shows the certificate ENCODING only — it does not run composite
   * encapsulation, the KEM combiner, or decapsulation.
   */
  async generateCompositeKEMCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<FormatOutput> {
    const start = performance.now()
    try {
      const ca = await this.createWorkshopCA(M, hSession, onKey)
      const kem = this.generateMLKEMForCert(M, hSession, onKey)
      const x = hsm_generateECKeyPair(M, hSession, 'X25519')
      if (onKey) onKey(x.privHandle, 'ecdh', 'X25519 (Composite KEM)', 'private')
      if (onKey) onKey(x.pubHandle, 'ecdh', 'X25519 Public (Composite KEM)', 'public')
      const point = hsm_extractECPoint(M, hSession, x.pubHandle)
      // CKA_EC_POINT may arrive DER-wrapped (04 20 || 32 bytes); the composite
      // key carries the raw 32-byte X25519 public key (RFC 7748).
      const x25519Pub =
        point.length === 34 && point[0] === 0x04 && point[1] === 0x20 ? point.slice(2) : point
      if (x25519Pub.length !== 32)
        throw new Error(`unexpected X25519 public key length ${x25519Pub.length}`)
      const compositePub = new Uint8Array([...kem.publicKey, ...x25519Pub])
      const der = await buildCompositeKEMCert(
        compositePub,
        COMPOSITE_KEM_MLKEM768_X25519_OID_STR,
        ca,
        subject
      )
      return {
        certs: [
          this.view(ca.certDer, 'Workshop CA (ML-DSA-65)', 'pqc', 'ca'),
          this.view(
            der,
            'Composite KEM certificate: ML-KEM-768 + X25519 (encoding only)',
            'pqc',
            'subject'
          ),
        ],
        checks: [
          ...this.chainChecks(der, ca.certDer),
          ...checkProfile(parseCertificate(der), { keyUsage: ['keyEncipherment'], cA: false }),
          ...kem.checks,
          {
            name: 'Composite public key is 1,216 bytes, ML-KEM component first',
            ok:
              compositePub.length === 1216 && kem.publicKey.every((b, i) => compositePub[i] === b),
          },
        ],
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return this.failed(start, e, 'Composite KEM certificate generation failed')
    }
  }
}

export const hybridCryptoService = new HybridCryptoService()
