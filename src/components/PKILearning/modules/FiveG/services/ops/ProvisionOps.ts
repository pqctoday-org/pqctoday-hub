// SPDX-License-Identifier: GPL-3.0-only
import { bytesToHex } from '@/services/crypto/FileUtils'
import type { FiveGService } from '../FiveGService'
export async function generateSubKey() {
  const ki = new Uint8Array(16)
  window.crypto.getRandomValues(ki)
  return bytesToHex(ki)
}

export async function computeOPc(ctx: FiveGService, kiHex: string) {
  const OP = new Uint8Array(DEFAULT_OP)
  // Convert K hex to bytes
  const K = new Uint8Array(kiHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))

  const opc = await milenage.computeOPc(K, OP)
  return bytesToHex(opc)
}

export async function personalizeUSIM(
  ctx: FiveGService,
  kiHex: string,
  opcHex: string
): Promise<string> {
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

export async function importAtUDM(
  ctx: FiveGService,
  eKiHex: string,
  opcHex: string
): Promise<string> {
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

export async function encryptTransport(ctx: FiveGService, kiHex: string, opcHex: string) {
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
