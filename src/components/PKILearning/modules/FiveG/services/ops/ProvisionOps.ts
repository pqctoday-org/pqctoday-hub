// SPDX-License-Identifier: AGPL-3.0-only
import { bytesToHex } from '@/services/crypto/FileUtils'
import type { FiveGService } from '../FiveGService'
import { DEFAULT_OP, milenage } from '../FiveGService'
import {
  PROVISIONING_AAD,
  PROVISIONING_IMSI,
  parseProvisioningEnvelope,
  parseProvisioningRecord,
  provisioningHex,
  provisioningHexBytes,
  requireSubscriberKey,
  requireTransportKey,
  validateProvisioningIdentity,
  type ProvisioningEnvelope,
  type ProvisioningImportResult,
} from './provisioningBatch'
export async function generateSubKey() {
  const ki = new Uint8Array(16)
  window.crypto.getRandomValues(ki)
  return bytesToHex(ki)
}

export async function computeOPc(_ctx: FiveGService, kiHex: string) {
  requireSubscriberKey(kiHex, 'Subscriber K')
  const OP = new Uint8Array(DEFAULT_OP)
  const K = provisioningHexBytes(kiHex)

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
  ctx: FiveGService,
  envelopeText: string,
  key: CryptoKey,
  expectedImsi = PROVISIONING_IMSI
): Promise<ProvisioningImportResult> {
  // All inputs are captured before the first await; callers own publication of this result.
  const envelope = parseProvisioningEnvelope(envelopeText)
  const transportKey = key
  validateProvisioningIdentity(expectedImsi)
  requireTransportKey(transportKey)
  let decrypted: ArrayBuffer
  try {
    decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: provisioningHexBytes(envelope.ivHex),
        additionalData: new TextEncoder().encode(PROVISIONING_AAD),
        tagLength: 128,
      },
      transportKey,
      provisioningHexBytes(envelope.ciphertextHex)
    )
  } catch {
    throw new Error('Sample batch authentication/decryption failed; no record was accepted')
  }
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(decrypted)
  } catch {
    throw new Error('Authenticated sample record is not valid UTF-8')
  }
  const record = parseProvisioningRecord(text)
  if (record.imsi !== expectedImsi)
    throw new Error('Sample record IMSI does not match the expected subscriber identity')
  const recomputed = await computeOPc(ctx, record.k)
  if (recomputed.toLowerCase() !== record.opc.toLowerCase())
    throw new Error('Sample record OPc does not match MILENAGE recomputation from its K')
  return {
    record,
    checks: {
      envelope: 'Version1 envelope and nonce/tag lengths validated',
      authentication:
        'AES-128-GCM authentication and decryption passed with the separate local key',
      recordShape: 'One strict IMSI/K/OPc record validated',
      identity: 'Decoded IMSI matches the expected fictional subscriber',
      opcConsistency: 'Decoded OPc matches actual MILENAGE recomputation from decoded K',
      sampleStorage: 'Accepted in memory only; no USIM or subscriber database write',
    },
  }
}

export async function encryptTransport(
  _ctx: FiveGService,
  kiHex: string,
  opcHex: string
): Promise<{ envelope: ProvisioningEnvelope; transportKey: CryptoKey }> {
  requireSubscriberKey(kiHex, 'Subscriber K')
  requireSubscriberKey(opcHex, 'Derived OPc')
  const record = { imsi: PROVISIONING_IMSI, k: kiHex, opc: opcHex }
  const plaintext = new TextEncoder().encode(JSON.stringify(record))
  const transportKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 128 },
    false,
    ['encrypt', 'decrypt']
  )
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(PROVISIONING_AAD),
      tagLength: 128,
    },
    transportKey,
    plaintext
  )
  return {
    envelope: {
      format: 'pqctoday-provisioning-batch',
      version: 1,
      algorithm: 'AES-128-GCM',
      ivHex: provisioningHex(iv),
      ciphertextHex: provisioningHex(new Uint8Array(encrypted)),
    },
    transportKey,
  }
}
