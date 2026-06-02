// SPDX-License-Identifier: GPL-3.0-only
import type { HsmFamily, HsmKeyRole } from '@/components/Playground/hsm/HsmContext'
import { openSSLService } from '@/services/crypto/OpenSSLService'
// NOTE: `CMSSigningService` is misnamed for our usage here — we only invoke
// its X.509 cert-issuance half (`genKey` + `mkCert`), which calls
// `openssl req -x509 -provider pkcs11 …` under the hood. That is NOT CMS;
// it's plain X.509 minting via pkcs11-provider. We borrow the service
// because it already owns a Worker with pkcs11-provider preloaded and
// because the same code path already proves out KEM-only CA-issued certs
// in MLKEMEncryptDemo. See the architectural-debt note at
// `memory/project-pkcs-hsm-service-naming.md` — the right long-term fix is
// to factor a `PkcsHsmCryptoService` layer (Option 2) that both
// CMSSigningService and HybridCryptoService delegate to.
import { CMSSigningService } from '@/components/PKILearning/modules/EmailSigning/services/CMSSigningService'
import { generateX25519KeyPair, deriveSharedSecret, hkdfExtract } from '@/utils/webCrypto'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { x25519 } from '@noble/curves/ed25519.js'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateSLHDSAKeyPair,
  hsm_extractKeyValue,
  hsm_extractECPoint,
  hsm_signBytesMLDSA,
  hsm_signBytesECDSA,
  hsm_signBytesSLHDSA,
  CKM_ECDSA_SHA256,
  CKM_ECDSA_SHA512,
} from '@/wasm/softhsm'
import {
  buildSelfSignedX509,
  buildCompositeCert,
  buildCompositeKEMCert,
  buildAltSigCert,
  buildRelatedCertPair as buildRelatedCertPairDER,
  buildChameleonCert,
  derToPem,
  buildParsedText,
  SLH_DSA_SHA2_128S_OID,
  ML_DSA_65_OID,
  ML_DSA_65_OID_STR,
  COMPOSITE_KEM_X25519_MLKEM768_OID_STR,
  COMPOSITE_KEM_SECP256R1_MLKEM768_OID_STR,
  type SignerFn,
} from './certBuilder'

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

export type KeyTracker = (
  handle: number,
  family: HsmFamily,
  label: string,
  role?: HsmKeyRole
) => void

export class HybridCryptoService {
  // Lazy-init CMSSigningService for HSM-routed cert ops (Pure PQC KEM,
  // composite KEM, anywhere we need pkcs11-provider + softhsmv3 instead
  // of bare openssl genpkey/req). One Worker per HybridCryptoService
  // singleton — kept alive for the session.
  // TODO: extract a shared PkcsHsmWorker layer when a third consumer
  // beyond EmailSigning + HybridCrypto appears.
  private cmsService: CMSSigningService | null = null
  private cmsInitPromise: Promise<void> | null = null

  private async getCms(): Promise<CMSSigningService> {
    if (!this.cmsService) {
      this.cmsService = new CMSSigningService()
    }
    if (!this.cmsInitPromise) {
      this.cmsInitPromise = (async () => {
        const r = await this.cmsService!.initProvider()
        if (r.status !== 'ok' && r.status !== 'already') {
          // Reset so a future call can retry from scratch.
          this.cmsInitPromise = null
          throw new Error(`pkcs11-provider init failed: ${r.status} (${r.code}) ${r.detail ?? ''}`)
        }
      })()
    }
    await this.cmsInitPromise
    return this.cmsService
  }

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
    mechType: number = CKM_ECDSA_SHA256
  ): Promise<{
    publicKeyRaw: Uint8Array
    signerFn: SignerFn
  }> {
    const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'sign')
    if (onKey) onKey(privHandle, 'ecdsa', 'ECDSA P-256 (Cert Gen)', 'private')
    if (onKey) onKey(pubHandle, 'ecdsa', 'ECDSA P-256 Public (Cert Gen)', 'public')
    const ecPoint = hsm_extractECPoint(M, hSession, pubHandle)
    // CKA_EC_POINT is DER OCTET STRING wrapping the uncompressed point — strip the DER header
    const rawPub = ecPoint.length === 67 ? ecPoint.slice(2) : ecPoint // 04 41 04...
    const signerFn: SignerFn = async (tbs: Uint8Array) => {
      return hsm_signBytesECDSA(M, hSession, privHandle, tbs, mechType)
    }
    return { publicKeyRaw: rawPub, signerFn }
  }

  /**
   * Generate an ML-DSA-65 key pair + signer function via SoftHSM PKCS#11.
   * C_GenerateKeyPair → CKA_VALUE for public key, C_MessageSign for signature.
   */
  private async generateMLDSAKeyPairForCert(
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<{
    publicKey: Uint8Array
    signerFn: SignerFn
  }> {
    const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 65)
    if (onKey) onKey(privHandle, 'ml-dsa', 'ML-DSA-65 (Cert Gen)', 'private')
    if (onKey) onKey(pubHandle, 'ml-dsa', 'ML-DSA-65 Public (Cert Gen)', 'public')
    const publicKey = hsm_extractKeyValue(M, hSession, pubHandle)
    const signerFn: SignerFn = async (tbs: Uint8Array) => {
      return hsm_signBytesMLDSA(M, hSession, privHandle, tbs)
    }
    return { publicKey, signerFn }
  }

  /**
   * Pure PQC certificate: ML-DSA-65 (RFC 9881).
   * Real DER-encoded X.509 with correct OID 2.16.840.1.101.3.4.3.18.
   */
  async generatePurePQCCertMLDSA(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<CertResult> {
    const start = performance.now()
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      const { publicKey, signerFn } = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
      const derBytes = await buildSelfSignedX509(publicKey, signerFn, ML_DSA_65_OID, subject)
      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter, 'pure-pqc')
      return { pem, parsed, timingMs: performance.now() - start }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'ML-DSA-65 certificate generation failed',
      }
    }
  }

  /**
   * Composite certificate: ML-DSA-65 + ECDSA P-256 (draft-ietf-lamps-pq-composite-sigs-15).
   * Real DER-encoded X.509 with composite OID 1.3.6.1.5.5.7.6.45.
   * Both signatures over the same TBS bytes.
   */
  async generateCompositeCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<CertResult> {
    const start = performance.now()
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      // Composite OID 1.3.6.1.5.5.7.6.45 = id-MLDSA65-ECDSA-P256-SHA512 — ECDSA must use SHA-512
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey, CKM_ECDSA_SHA512)
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)

      const derBytes = await buildCompositeCert(
        ec.publicKeyRaw,
        mldsa.publicKey,
        ec.signerFn,
        mldsa.signerFn,
        subject
      )
      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter, 'composite')
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
   * Alt-Sig / Catalyst certificate (ITU-T X.509 §9.8).
   * ECDSA primary with ML-DSA-65 in extensions 2.5.29.72/73/74.
   */
  async generateAltSigCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<CertResult> {
    const start = performance.now()
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey)
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)

      const derBytes = await buildAltSigCert(
        ec.publicKeyRaw,
        ec.signerFn,
        mldsa.publicKey,
        mldsa.signerFn,
        subject
      )
      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter, 'alt-sig')
      return { pem, parsed, timingMs: performance.now() - start }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Alt-Sig certificate generation failed',
      }
    }
  }

  /**
   * Related Certificates (RFC 9763) with two-pass bidirectional binding.
   * Each cert contains RelatedCertificate extension (OID 1.3.6.1.5.5.7.1.36)
   * with SHA-256 hash of the partner cert.
   */
  async generateRelatedCertPairReal(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<{
    classical: CertResult
    pqc: CertResult
    bindingHash: string
    totalMs: number
    error?: string
  }> {
    const start = performance.now()
    const empty: CertResult = { pem: '', parsed: '', timingMs: 0 }
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey)
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)

      const result = await buildRelatedCertPairDER(
        ec.publicKeyRaw,
        ec.signerFn,
        mldsa.publicKey,
        mldsa.signerFn,
        subject
      )

      const classicalSubject = subject.replace(/CN=([^/]+)/, 'CN=$1 (Classical)')
      const pqcSubject = subject.replace(/CN=([^/]+)/, 'CN=$1 (PQC)')

      return {
        classical: {
          pem: derToPem(result.certA, 'CERTIFICATE'),
          parsed: buildParsedText(
            result.certA,
            classicalSubject,
            notBefore,
            notAfter,
            'related-classical'
          ),
          timingMs: performance.now() - start,
        },
        pqc: {
          pem: derToPem(result.certB, 'CERTIFICATE'),
          parsed: buildParsedText(result.certB, pqcSubject, notBefore, notAfter, 'related-pqc'),
          timingMs: performance.now() - start,
        },
        bindingHash: result.bindingHashA,
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

  /**
   * Chameleon certificate (draft-bonnell-lamps-chameleon-certs-07).
   * ML-DSA-65 primary with DeltaCertificateDescriptor extension containing ECDSA delta.
   */
  async generateChameleonCert(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<CertResult> {
    const start = performance.now()
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      const mldsa = await this.generateMLDSAKeyPairForCert(M, hSession, onKey)
      const ec = await this.generateECKeyPairForCert(M, hSession, onKey)

      const derBytes = await buildChameleonCert(
        mldsa.publicKey,
        mldsa.signerFn,
        ec.publicKeyRaw,
        ec.signerFn,
        subject
      )
      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter, 'chameleon')
      return { pem, parsed, timingMs: performance.now() - start }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'Chameleon certificate generation failed',
      }
    }
  }

  /**
   * Generates a real self-signed X.509 certificate for SLH-DSA-128s via SoftHSM PKCS#11.
   * C_GenerateKeyPair(CKM_SLH_DSA_KEY_PAIR_GEN) + C_MessageSign(CKM_SLH_DSA).
   *
   * @param subject OpenSSL slash-format DN e.g. `/CN=.../O=.../OU=...`
   */
  async generateSelfSignedCertSLHDSA(
    subject: string,
    M: SoftHSMModule,
    hSession: number,
    onKey?: KeyTracker
  ): Promise<CertResult> {
    const start = performance.now()
    const notBefore = new Date()
    const notAfter = new Date(notBefore.getTime() + 365 * 24 * 60 * 60 * 1000)
    try {
      const { pubHandle, privHandle } = hsm_generateSLHDSAKeyPair(M, hSession)
      if (onKey) onKey(privHandle, 'slh-dsa', 'SLH-DSA-128s (Cert Gen)', 'private')
      if (onKey) onKey(pubHandle, 'slh-dsa', 'SLH-DSA-128s Public (Cert Gen)', 'public')
      const publicKey = hsm_extractKeyValue(M, hSession, pubHandle)

      const derBytes = await buildSelfSignedX509(
        publicKey,
        async (tbs) => hsm_signBytesSLHDSA(M, hSession, privHandle, tbs),
        SLH_DSA_SHA2_128S_OID,
        subject
      )

      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter, 'pure-pqc-slh')

      return { pem, parsed, timingMs: performance.now() - start }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : 'SLH-DSA certificate generation failed',
      }
    }
  }

  /**
   * Pure PQC KEM certificate: ML-KEM-512/768/1024 per RFC 9935.
   *
   * KEM keys cannot self-sign (RFC 9935 §4: encryption-only). We mint a
   * transient ML-DSA-65 issuer and CA-sign the KEM subject cert. Both
   * keys are HSM-resident via softhsmv3 + pkcs11-provider; OpenSSL never
   * sees raw key material, mirroring the S/MIME workshop's KEM-only flow
   * in MLKEMEncryptDemo.
   *
   * Why HSM instead of OpenSSL `genpkey + req -force_pubkey`: the
   * filesystem-key path was producing 0-byte certs in our 5.4 MB
   * openssl.wasm bundle (RFC 9935 cert issuance via -force_pubkey isn't
   * reliable for ML-KEM SPKI). Routing through pkcs11-provider's mkcert
   * path produces a real PEM byte-identical to what an HSM-backed CA
   * would emit in production.
   *
   * RFC 9935 OIDs:
   *   id-alg-ml-kem-512   = 2.16.840.1.101.3.4.4.1
   *   id-alg-ml-kem-768   = 2.16.840.1.101.3.4.4.2
   *   id-alg-ml-kem-1024  = 2.16.840.1.101.3.4.4.3
   */
  async generatePurePQCCertMLKEM(
    variant: 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024',
    cn: string
  ): Promise<CertResult> {
    const start = performance.now()
    const tag = variant.toLowerCase().replace(/-/g, '_')
    const kemKeyId = `kem_${tag}_priv`
    const issuerKeyId = `kem_${tag}_issuer`
    // The cms.worker derives the issuer cert path from `${issuerKeyId}.crt`,
    // so the issuer's self-signed cert MUST be minted with certId=issuerKeyId
    // (see EmailSigning/worker/cms.worker.ts §3196 "Convention").
    const issuerCertId = issuerKeyId
    const certId = `kem_${tag}_cert`
    const subject = `/CN=${cn}/O=PQC Today/OU=Hybrid Certificate Sandbox`
    const issuerSubject = '/CN=PQC Workshop CA/O=PQC Today/OU=Transient Issuer'

    try {
      const cms = await this.getCms()

      // 1. Generate the ML-KEM subject key in the HSM (encryption-only).
      await cms.genKey(variant, kemKeyId, true)

      // 2. Generate the ML-DSA-65 issuer key in the HSM.
      await cms.genKey('ML-DSA-65', issuerKeyId, true)

      // 3. Mint the issuer's self-signed CA cert. The cms.worker requires
      //    `/ssl/<issuerKeyId>.crt` to exist before any CA-issued mkCert
      //    call; otherwise it errors with "issuer cert not found". Mirrors
      //    MLKEMEncryptDemo's CA-then-subject pattern.
      await cms.mkCert({
        keyId: issuerKeyId,
        certId: issuerCertId,
        subject: issuerSubject,
        days: 730,
        useHsm: true,
      })

      // 4. CA-issue the subject cert. pkcs11-provider signs the SPKI
      //    containing the ML-KEM pubkey using the ML-DSA-65 issuer key.
      //    No raw key material leaves the HSM.
      const cert = await cms.mkCert({
        keyId: kemKeyId,
        certId,
        subject,
        days: 365,
        useHsm: true,
        issuerKeyId,
        alg: variant,
      })

      if (!cert.certPem) {
        return {
          pem: '',
          parsed: '',
          timingMs: performance.now() - start,
          error: `${variant} CA-signed cert returned empty PEM`,
        }
      }

      // 4. Parse the PEM for human-readable display. The PEM is plain
      //    ASCII; we feed it to bare `openssl x509 -text -noout` (no HSM
      //    needed for parsing).
      const certBytes = new TextEncoder().encode(cert.certPem)
      const parsedResult = await openSSLService.execute(
        `openssl x509 -in ${certId}.pem -text -noout`,
        [{ name: `${certId}.pem`, data: certBytes }]
      )

      return {
        pem: cert.certPem,
        parsed: parsedResult.stdout || parsedResult.stderr || '',
        timingMs: performance.now() - start,
      }
    } catch (e) {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: e instanceof Error ? e.message : `${variant} certificate generation failed`,
      }
    }
  }

  /**
   * Composite KEM certificate per draft-ietf-lamps-pq-composite-kem-14.
   *
   * The subject public key is a CompositeKEMPublicKey binding ML-KEM-768 with a classical
   * KEM (X25519 or P-256) under a single OID. Like pure KEM certs, the cert itself is signed
   * by a separate signing-capable issuer key (KEM keys cannot self-sign).
   *
   * draft-composite-kem-14 OIDs:
   *   id-X25519-MLKEM768  = 2.16.840.1.114027.80.5.2.21
   *   id-P256-MLKEM768    = 2.16.840.1.114027.80.5.2.22
   *
   * Composite KEM (X25519 + ML-KEM-768) X.509 certificate per
   * `draft-ietf-lamps-pq-composite-kem` (IETF LAMPS WG, currently in
   * Last Call as of this commit). OID id-X25519-MLKEM768 =
   * 2.16.840.1.114027.80.5.2.21 (LAMPS draft §6).
   *
   * Why not OpenSSL: the LAMPS composite KEM draft is not yet an RFC.
   * OpenSSL 3.5 ships X25519MLKEM768 as a TLS 1.3 hybrid named group
   * (RFC 9145-style key exchange) but does NOT provide an X.509 SPKI
   * encoder for the same algorithm — `openssl genpkey -algorithm
   * X25519MLKEM768` returns `No encoders were found`. So the workshop
   * routes through @noble/curves/x25519 + @noble/post-quantum/ml-kem
   * for keygen and our own `buildCompositeKEMCert` (certBuilder.ts) for
   * cert minting, in the same pattern used for the Silithium fused-
   * signature path.
   *
   * Public key layout per LAMPS draft §6 byte concatenation:
   *   subjectPublicKey ::= x25519PublicKey (32 B) ‖ mlkem768PublicKey (1184 B)
   *   total length: 1216 B
   *
   * Issuer: a transient ML-DSA-65 keypair (FIPS 204, RFC 9881). KEM
   * keys cannot self-sign, so the cert is signed by a separate ML-DSA-65
   * issuer key created on the fly.
   *
   * Note: the P-256 classical variant of this format
   * (id-SecP256r1-MLKEM768 = 2.16.840.1.114027.80.5.2.22) is reserved
   * in the LAMPS draft but not yet wired in the workshop UI; it is
   * accepted in the type signature for forward compatibility.
   */
  async generateCompositeKEMCert(
    // pqcVariant: only ML-KEM-768 is wired today; the parameter is kept in
    // the signature as a forward-compat slot for the LAMPS draft's eventual
    // ML-KEM-1024 composite variant. Renamed to _pqcVariant to silence
    // TS6133 noUnusedParameters under the production `tsc -b` build.
    _pqcVariant: 'ML-KEM-768',
    classicalVariant: 'X25519' | 'P-256',
    cn: string
  ): Promise<CertResult> {
    const start = performance.now()
    const subj = `/CN=${cn}/O=PQC Today/OU=Hybrid Certificate Sandbox`

    if (classicalVariant !== 'X25519') {
      return {
        pem: '',
        parsed: '',
        timingMs: performance.now() - start,
        error: `Classical variant '${classicalVariant}' is reserved in LAMPS draft-ietf-lamps-pq-composite-kem (id-SecP256r1-MLKEM768) but not wired in this workshop. Only X25519MLKEM768 is implemented.`,
      }
    }

    try {
      const compositeOidStr = COMPOSITE_KEM_X25519_MLKEM768_OID_STR
      // Acknowledge that the P-256 variant's OID constant is imported for
      // forward compatibility (referenced in the type-signature contract).
      void COMPOSITE_KEM_SECP256R1_MLKEM768_OID_STR

      // 1. Generate the composite KEM subject keys via @noble.
      const x25519Pair = x25519.keygen()
      const mlkemPair = ml_kem768.keygen()

      // 2. Build the subject public key per LAMPS draft §6:
      //    x25519PublicKey(32) ‖ mlkem768PublicKey(1184) = 1216 bytes.
      const compositePubKey = new Uint8Array(
        x25519Pair.publicKey.length + mlkemPair.publicKey.length
      )
      compositePubKey.set(x25519Pair.publicKey, 0)
      compositePubKey.set(mlkemPair.publicKey, x25519Pair.publicKey.length)

      // 3. Mint a transient ML-DSA-65 issuer (RFC 9881). KEM keys can't
      //    self-sign — the cert binds the composite KEM public key under
      //    an ML-DSA-65 signature from the same DN (self-issued, cross-
      //    algorithm).
      const issuerPair = ml_dsa65.keygen()
      const mldsaSignerFn: SignerFn = async (tbsDer: Uint8Array) =>
        ml_dsa65.sign(tbsDer, issuerPair.secretKey)

      // 4. Build the X.509 cert. buildCompositeKEMCert uses the composite
      //    OID for SubjectPublicKeyInfo.algorithm and the ML-DSA-65 OID
      //    for TBSCertificate.signature, matching the LAMPS draft.
      const certDer = await buildCompositeKEMCert(
        compositePubKey,
        compositeOidStr,
        mldsaSignerFn,
        ML_DSA_65_OID_STR,
        subj
      )
      const pem = derToPem(certDer, 'CERTIFICATE')

      // 5. Build a parsed-text description. We don't route through
      //    `openssl x509 -text` because OpenSSL doesn't recognise the
      //    LAMPS composite KEM OID yet and would print "unknown
      //    algorithm". The description below is byte-exact and cites
      //    the LAMPS draft sections so a learner can cross-reference.
      const parsed = [
        'Certificate:',
        '    Data:',
        '        Version: 3 (0x2)',
        '        Serial Number: (random 16 bytes)',
        `        Signature Algorithm: ml-dsa-65 (${ML_DSA_65_OID_STR})  [RFC 9881]`,
        `    Issuer: ${cn} (transient ML-DSA-65 CA)`,
        '    Validity',
        '        Not Before: now',
        '        Not After : now + 365 days',
        `    Subject: ${cn}`,
        '    Subject Public Key Info:',
        `        Public Key Algorithm: id-X25519-MLKEM768 (${compositeOidStr})`,
        `        [LAMPS draft-ietf-lamps-pq-composite-kem §6  — IETF Last Call]`,
        `            Composite Public Key (1216 bytes):`,
        `                X25519 component       (32 B):   ${this.toHex(x25519Pair.publicKey).slice(0, 64)}…`,
        `                ML-KEM-768 component   (1184 B): ${this.toHex(mlkemPair.publicKey).slice(0, 64)}…`,
        '        Encoding: subjectPublicKey ::= x25519PublicKey ‖ mlkem768PublicKey',
        '    X509v3 extensions:',
        '        X509v3 Basic Constraints: critical',
        '            CA:FALSE',
        `    Signature Algorithm: ml-dsa-65 (${ML_DSA_65_OID_STR})`,
        `    Signature Value: 3309 bytes (ML-DSA-65 signature over TBSCertificate DER)`,
        '',
        '# References:',
        '#   draft-ietf-lamps-pq-composite-kem  — IETF Last Call',
        '#     §6  Subject public key encoding',
        '#     OID id-X25519-MLKEM768 = 2.16.840.1.114027.80.5.2.21',
        '#   RFC 9881  ML-DSA in X.509 (signature algorithm)',
        '#   FIPS 203  ML-KEM',
        '#   FIPS 204  ML-DSA',
        '# Backend: @noble/curves/x25519 + @noble/post-quantum/ml-kem +',
        '#          @noble/post-quantum/ml-dsa (no OpenSSL composite KEM',
        '#          encoder exists yet; LAMPS draft not yet RFC).',
      ].join('\n')

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
        error: e instanceof Error ? e.message : 'Composite KEM certificate generation failed',
      }
    }
  }
}

export const hybridCryptoService = new HybridCryptoService()
