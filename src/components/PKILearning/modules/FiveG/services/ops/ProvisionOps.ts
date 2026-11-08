// SPDX-License-Identifier: AGPL-3.0-only
import { bytesToHex } from '@/services/crypto/FileUtils'
import type { FiveGService } from '../FiveGService'
import { DEFAULT_OP, milenage } from '../FiveGService'
export async function generateSubKey() {
  const ki = new Uint8Array(16)
  window.crypto.getRandomValues(ki)
  return bytesToHex(ki)
}

export async function computeOPc(_ctx: FiveGService, kiHex: string) {
  const OP = new Uint8Array(DEFAULT_OP)
  // Convert K hex to bytes
  const K = new Uint8Array(kiHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))

  const opc = await milenage.computeOPc(K, OP)
  return bytesToHex(opc)
}

export async function personalizeUSIM(
  _ctx: FiveGService,
  kiHex: string,
  opcHex: string
): Promise<string> {
  const imsi = '310260123456789'

  return `USIM PERSONALIZATION — PROCESS WALKTHROUGH

This step displays a fictional personalization plan. No USIM or secure element is accessed.

Illustrated inputs:
  > Sample subscriber key K: ${kiHex}
  > Sample derived operator key OPc: ${opcHex}
  > Sample IMSI: ${imsi}

Production actions illustrated (not executed):
  > Write subscriber keys through the supported personalization interface.
  > Store keys and identity data with the intended access protections.
  > Configure transport and PIN/PUK policies for the selected card profile.

[WALKTHROUGH] Personalization process reviewed.
[NOT EXECUTED] No key was written to a card, no protection setting was tested, and no card readiness was established.
[TOOL CAPABILITIES] Look for protected key handling, supported card profiles, controlled personalization access and operation logs. Check these capabilities with your own production tools.`
}

export async function importAtUDM(
  _ctx: FiveGService,
  eKiHex: string,
  opcHex: string
): Promise<string> {
  const imsi = '310260123456789'

  return `OPERATOR KEY IMPORT — PROCESS WALKTHROUGH

This step displays a fictional operator import plan. It does not consume or decrypt the encrypted batch.

Illustrated inputs:
  > Sample encrypted input excerpt (not validated): ${eKiHex.substring(0, 32)}...
  > Sample IMSI: ${imsi}
  > Sample OPc: ${opcHex}

Production actions illustrated (not executed):
  > Decrypt the received batch using controlled transport-key access.
  > Check batch integrity, origin and record validity before accepting entries.
  > Protect accepted subscriber keys in storage and record the import outcome.

Checks performed by this walkthrough:
  > Batch decryption: NOT EXECUTED
  > MAC verification: NOT EXECUTED
  > Key validation: NOT EXECUTED
  > Subscriber database write: NOT EXECUTED

[WALKTHROUGH] Operator import process reviewed.
[NOT EXECUTED] No subscriber was provisioned and no authentication readiness was established.
[TOOL CAPABILITIES] Evaluate authenticated batch handling, rejected-record reporting, protected key storage, access controls and audit logs in production provisioning tools. A displayed process is not evidence that these controls worked.`
}

export async function encryptTransport(_ctx: FiveGService, kiHex: string, opcHex: string) {
  // Use OpenSSL to encrypt the batch to a file
  // Input: CSV or JSON
  const content = `IMSI: 310260123456789, K: ${kiHex}, OPc: ${opcHex} `
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
