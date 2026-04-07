// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { bytesToHex } from '@/services/crypto/FileUtils'
import { MilenageService } from './MilenageService'

import * as NetworkOps from './ops/NetworkOps'
import * as EphemeralOps from './ops/EphemeralOps'
import * as SucOps from './ops/SucOps'
import * as AuthOps from './ops/AuthOps'
import * as UtilsOps from './ops/UtilsOps'

export const milenage = new MilenageService()

// Default Operator Key — consistent across auth and provisioning flows
export const DEFAULT_OP = new Uint8Array(16).fill(0x55)

export interface FiveGTestVectors {
  profileA?: { hnPriv: string; ephPriv: string; zEcdh?: string }
  profileB?: { hnPriv: string; ephPriv: string; zEcdh?: string }
  profileC?: { zEcdh: string; zKem: string }
  milenage?: { k: string; op: string; rand: string }
}

export class FiveGService {
  // --- Profile A/B/C: Key Generation ---

  // State to persist computed values across steps
  public authState: {
    K?: Uint8Array
    OP?: Uint8Array
    OPc?: Uint8Array
    RAND?: Uint8Array
    SQN?: Uint8Array
    AMF?: Uint8Array
    milenageResult?: {
      MAC: Uint8Array
      RES: Uint8Array
      CK: Uint8Array
      IK: Uint8Array
      AK: Uint8Array
    }
  } = {}
  public state: {
    profile?: 'A' | 'B' | 'C'
    supi?: string // Added supi tracking
    sharedSecretHex?: string
    kEncHex?: string
    kMacHex?: string
    encryptedMSINHex?: string

    macTagHex?: string
    ephemeralPubKeyHex?: string
    ciphertextHex?: string // For PQC KEM

    // File continuity for OpenSSL operations
    cipherFile?: string // Cipher output from encryptMSIN

    // keys for JIT injection (stateless CI fix)
    hnPrivHex?: string
    hnPubHex?: string
    ephPrivHex?: string

    // Profile C specific (JIT)
    hnPubEccHex?: string
    hnPubPqcHex?: string
    hnPqcPrivHex?: string // Profile C: ML-KEM private key PEM bytes as hex (for SIDF decapsulation)
  } = {}

  // Track generated files for cleanup
  public generatedFiles: Set<string> = new Set()

  // Helper to track files for cleanup
  public trackFile(filename: string) {
    this.generatedFiles.add(filename)
  }

  // Cleanup generated files
  public async cleanup() {
    console.log(`[FiveGService] Cleaning up ${this.generatedFiles.size} files...`)
    for (const file of this.generatedFiles) {
      await openSSLService.deleteFile(file)
    }
    this.generatedFiles.clear()
    this.state = {} // Reset state
    this.authState = {} // Reset auth state
  }

  // Test Vectors for Validation (GSMA TS 33.501)
  public testVectors?: FiveGTestVectors

  public enableTestMode(vectors: FiveGTestVectors) {
    this.testVectors = vectors
    console.log('[FiveGService] Test Mode Enabled.', vectors)
  }

  public disableTestMode() {
    this.testVectors = undefined
  }

  // Helper to write hex string to binary file in worker
  private async writeHexToFile(filename: string, hexString: string) {
    this.trackFile(filename)
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
    await openSSLService.execute('openssl version', [{ name: filename, data: bytes }])
  }

  // Helper to write text (PEM) to file in worker
  private async writeTextToFile(filename: string, content: string) {
    this.trackFile(filename)
    const bytes = new TextEncoder().encode(content)
    await openSSLService.execute('openssl version', [{ name: filename, data: bytes }])
  }

  public async injectKey(filename: string, content: string) {
    if (content.trim().startsWith('-----BEGIN')) {
      await this.writeTextToFile(filename, content)
    } else {
      // Assume Hex
      await this.writeHexToFile(filename, content)
    }
  }

  // Helper for filenames
  public getTimestamp(): string {
    const now = new Date()
    return now
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14) // YYYYMMDDHHMMSS
  }

  // Helper to read file as hex since xxd isn't in worker
  // Helper to read file as hex using standard OpenSSL command
  public async readFileHex(filename: string): Promise<string> {
    try {
      const res = await openSSLService.execute(`openssl enc -base64 -in ${filename} `)
      if (res.stdout && res.stdout.trim().length > 0) {
        // Decode base64 to binary string
        const b64 = res.stdout.replace(/\n/g, '')
        const binStr = atob(b64)
        // Convert to Uint8Array
        const bytes = new Uint8Array(binStr.length)
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i)
        }
        return bytesToHex(bytes)
      }
    } catch {
      // Ignore (file might not exist yet or read failed)
    }
    return ''
  }

  async generateNetworkKey(profile: 'A' | 'B' | 'C', pqcMode: 'hybrid' | 'pure' = 'hybrid') {
    return await NetworkOps.generateNetworkKey(this, profile, pqcMode)
  }

  // Helper to keep code clean
  public fallbackGen(ts: string, type: string) {
    const pub = `5g_hn_pub_fallback_${ts}.key`
    const priv = `5g_hn_priv_fallback_${ts}.key`
    this.trackFile(pub)
    this.trackFile(priv)
    return {
      output: `[Fallback] Generating ${type} Key Pair...`,
      pubKeyFile: pub,
      privKeyFile: priv,
    }
  }

  async provisionUSIM(pubKeyFile: string) {
    return await NetworkOps.provisionUSIM(this, pubKeyFile)
  }

  async retrieveKey(pubKeyFile: string, profile: string) {
    return await NetworkOps.retrieveKey(this, pubKeyFile, profile)
  }

  async generateEphemeralKey(profile: 'A' | 'B' | 'C', pqcMode: 'hybrid' | 'pure' = 'hybrid') {
    return await EphemeralOps.generateEphemeralKey(this, profile, pqcMode)
  }

  async computeSharedSecret(
    profile: 'A' | 'B' | 'C',
    ephPriv: string,
    hnPub: string,
    pqcMode: 'hybrid' | 'pure' = 'hybrid'
  ) {
    return await EphemeralOps.computeSharedSecret(this, profile, ephPriv, hnPub, pqcMode)
  }

  // Helper to parse hex digest from OpenSSL dgst output
  public parseDigestHex(stdout: string): string {
    return UtilsOps.parseDigestHex(this, stdout)
  }

  // Build ANSI X9.63 KDF input: Z || Counter || SharedInfo(EphPubKey)
  public buildKdfInput(z: Uint8Array, counter: number, sharedInfo: Uint8Array): Uint8Array {
    return EphemeralOps.buildKdfInput(this, z, counter, sharedInfo)
  }

  async deriveKeys(profile: 'A' | 'B' | 'C') {
    return await EphemeralOps.deriveKeys(this, profile)
  }

  // BCD encode: pack 2 digits per byte, nibble-swapped per 3GPP TS 23.003
  public bcdEncode(digits: string): Uint8Array {
    return UtilsOps.bcdEncode(this, digits)
  }

  // BCD decode: reverse nibble-swapped bytes back to digit string
  public bcdDecode(bytes: Uint8Array): string {
    return UtilsOps.bcdDecode(this, bytes)
  }

  async encryptMSIN() {
    return await SucOps.encryptMSIN(this)
  }

  async computeMAC() {
    return await SucOps.computeMAC(this)
  }

  async visualizeStructure() {
    return await SucOps.visualizeStructure(this)
  }

  async assembleSUCI(profile: 'A' | 'B' | 'C') {
    return await SucOps.assembleSUCI(this, profile)
  }

  // --- Auth Flow ---

  async retrieveCredentials(): Promise<string> {
    return await AuthOps.retrieveCredentials(this)
  }

  async generateRAND(): Promise<string> {
    return await AuthOps.generateRAND(this)
  }

  async computeAUTN(): Promise<string> {
    return await AuthOps.computeAUTN(this)
  }

  async deriveKAUSF(): Promise<string> {
    return await AuthOps.deriveKAUSF(this)
  }

  async sidfDecrypt(profile: 'A' | 'B' | 'C') {
    return await SucOps.sidfDecrypt(this, profile)
  }

  async runMilenage() {
    return await AuthOps.runMilenage(this)
  }

  // --- Provisioning ---

  async generateSubKey() {
    const ki = new Uint8Array(16)
    window.crypto.getRandomValues(ki)
    return bytesToHex(ki)
  }

  async computeOPc(kiHex: string) {
    const OP = new Uint8Array(DEFAULT_OP)
    // Convert K hex to bytes
    const K = new Uint8Array(kiHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))

    const opc = await milenage.computeOPc(K, OP)
    return bytesToHex(opc)
  }

  async personalizeUSIM(kiHex: string, opcHex: string): Promise<string> {
    const imsi = '310260123456789'

    return `═══════════════════════════════════════════════════════════════
            USIM PERSONALIZATION (Factory)
═══════════════════════════════════════════════════════════════

Step 1: Writing Master Key to Secure Element
  > EF_K:    ${kiHex}
  > Status:  Written to tamper-resistant memory

Step 2: Writing Derived Operator Key
  > EF_OPc:  ${opcHex}
  > Status:  Written (OP never stored on SIM)

Step 3: Writing Subscriber Identity
  > EF_IMSI: ${imsi}
  > MCC: 310 (USA)
  > MNC: 260 (T-Mobile)
  > MSIN: 123456789

Step 4: Security Configuration
  > Transport lock: ENABLED
  > PIN retry counter: 3
  > PUK retry counter: 10

[SUCCESS] USIM personalization complete.
[INFO] Card ready for secure transport to MNO.`
  }

  async importAtUDM(eKiHex: string, opcHex: string): Promise<string> {
    // Simulate operator import — decrypt transport-encrypted K
    const imsi = '310260123456789'

    return `═══════════════════════════════════════════════════════════════
            OPERATOR KEY IMPORT
═══════════════════════════════════════════════════════════════

Step 1: Receiving Encrypted Key Batch
  > File: out_batch_2026.enc
  > Records: 1

Step 2: Decrypting eK with Transport Key (inside HSM)
  > eK (encrypted):  ${eKiHex.substring(0, 32)}...
  > Transport Key:   [PROTECTED — pre-shared]
  > Decrypted K:     [PROTECTED — transient in HSM]

Step 3: Storing in Encrypted Subscriber Database
  > IMSI: ${imsi}
  > K:    [re-encrypted and stored in subscriber DB]
  > OPc:  ${opcHex}

Step 4: Verifying Import Integrity
  > MAC verification: PASS
  > Key validation:   PASS

[SUCCESS] Subscriber provisioning complete.
[INFO] ${imsi} ready for 5G-AKA authentication.`
  }

  async encryptTransport(kiHex: string, opcHex: string) {
    // Use OpenSSL to encrypt the batch to a file
    // Input: CSV or JSON
    const content = `IMSI: 310123456789000, K: ${kiHex}, OPc: ${opcHex} `
    const iv = new Uint8Array(16)
    window.crypto.getRandomValues(iv)
    const key = new Uint8Array(16)
    window.crypto.getRandomValues(key) // Transport Key

    // Let's use JS for simplicity of string output
    const enc = await window.crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      await window.crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt']),
      new TextEncoder().encode(content)
    )

    return `Transport Key: ${bytesToHex(key)}
IV: ${bytesToHex(iv)}
Encrypted Output(Hex):
${bytesToHex(new Uint8Array(enc))} `
  }
}

export const fiveGService = new FiveGService()

declare global {
  interface Window {
    fiveGService: FiveGService
  }
}

// Expose for E2E Testing / Validation (dev/test only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.fiveGService = fiveGService
}
