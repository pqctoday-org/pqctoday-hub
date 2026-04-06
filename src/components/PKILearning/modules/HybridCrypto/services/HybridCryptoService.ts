// SPDX-License-Identifier: GPL-3.0-only
import type { HsmFamily } from '@/components/Playground/hsm/HsmContext'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { generateX25519KeyPair, deriveSharedSecret, hkdfExtract } from '@/utils/webCrypto'
import type { SoftHSMModule } from '@/wasm/softhsm'
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
  buildAltSigCert,
  buildRelatedCertPair as buildRelatedCertPairDER,
  buildChameleonCert,
  derToPem,
  buildParsedText,
  SLH_DSA_SHA2_128S_OID,
  ML_DSA_65_OID,
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

export type KeyTracker = (handle: number, family: HsmFamily, label: string) => void

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
    mechType: number = CKM_ECDSA_SHA256
  ): Promise<{
    publicKeyRaw: Uint8Array
    signerFn: SignerFn
  }> {
    const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'sign')
    if (onKey) onKey(privHandle, 'ecdsa', 'ECDSA P-256 (Cert Gen)')
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
    if (onKey) onKey(privHandle, 'ml-dsa', 'ML-DSA-65 (Cert Gen)')
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
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter)
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
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter)
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
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter)
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
          parsed: buildParsedText(result.certA, classicalSubject, notBefore, notAfter),
          timingMs: performance.now() - start,
        },
        pqc: {
          pem: derToPem(result.certB, 'CERTIFICATE'),
          parsed: buildParsedText(result.certB, pqcSubject, notBefore, notAfter),
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
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter)
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
      if (onKey) onKey(privHandle, 'slh-dsa', 'SLH-DSA-128s (Cert Gen)')
      const publicKey = hsm_extractKeyValue(M, hSession, pubHandle)

      const derBytes = await buildSelfSignedX509(
        publicKey,
        async (tbs) => hsm_signBytesSLHDSA(M, hSession, privHandle, tbs),
        SLH_DSA_SHA2_128S_OID,
        subject
      )

      const pem = derToPem(derBytes, 'CERTIFICATE')
      const parsed = buildParsedText(derBytes, subject, notBefore, notAfter)

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
}

export const hybridCryptoService = new HybridCryptoService()
