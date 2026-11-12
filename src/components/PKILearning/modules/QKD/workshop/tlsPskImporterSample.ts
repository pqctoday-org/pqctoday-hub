// SPDX-License-Identifier: AGPL-3.0-only
import { hash, hkdfExtract, hkdfExpand } from '@/utils/webCrypto'

export const TLS_SAMPLE_CONTEXT = 'pqctoday:tls13:importer-mechanics:v1'
export const TLS_SAMPLE_PROTOCOL = 0x0304
export const TLS_SAMPLE_TARGET_KDF = 0x0001
const OUTPUT_LENGTH = 32

/** Selected TLS1.3/SHA256 mechanics only, not a QKD channel-binding profile. */
export function serializeSampleImportedIdentity(
  externalIdentity: Uint8Array,
  context: Uint8Array
): Uint8Array {
  if (!externalIdentity.length || externalIdentity.length > 65535)
    throw new Error('External identity must contain 1..65535 bytes')
  if (!context.length || context.length > 65535)
    throw new Error('This mechanics example requires an explicit 1..65535-byte sample context')
  const length = 2 + externalIdentity.length + 2 + context.length + 4
  if (length > 65535)
    throw new Error('Serialized sample identity exceeds the PSK identity size bound')
  const bytes = new Uint8Array(length),
    view = new DataView(bytes.buffer)
  view.setUint16(0, externalIdentity.length, false)
  bytes.set(externalIdentity, 2)
  const contextOffset = 2 + externalIdentity.length
  view.setUint16(contextOffset, context.length, false)
  bytes.set(context, contextOffset + 2)
  view.setUint16(length - 4, TLS_SAMPLE_PROTOCOL, false)
  view.setUint16(length - 2, TLS_SAMPLE_TARGET_KDF, false)
  return bytes
}

/** RFC9258§5.1 uses the TLS HkdfLabel with "tls13 " prefix and no NUL. */
export function sampleDerivedPskLabel(identityHash: Uint8Array): Uint8Array {
  if (identityHash.length !== 32)
    throw new Error('Selected sample identity hash must contain 32 bytes')
  const label = new TextEncoder().encode('tls13 derived psk')
  const bytes = new Uint8Array(2 + 1 + label.length + 1 + identityHash.length)
  new DataView(bytes.buffer).setUint16(0, OUTPUT_LENGTH, false)
  bytes[2] = label.length
  bytes.set(label, 3)
  bytes[3 + label.length] = identityHash.length
  bytes.set(identityHash, 4 + label.length)
  return bytes
}

export interface TlsImporterSampleResult {
  serializedIdentity: Uint8Array
  identityHash: Uint8Array
  epskx: Uint8Array
  hkdfLabel: Uint8Array
  ipsk: Uint8Array
  earlySecret: Uint8Array
}
export async function deriveTlsImporterSample(
  epsk: Uint8Array,
  externalIdentity: Uint8Array,
  context: Uint8Array
): Promise<TlsImporterSampleResult> {
  if (epsk.length !== 32) throw new Error('Selected synthetic EPSK sample must contain 32 bytes')
  // Snapshot all inputs before the first native crypto await.
  const source = epsk.slice(),
    serializedIdentity = serializeSampleImportedIdentity(externalIdentity.slice(), context.slice())
  const zeroSalt = new Uint8Array(32)
  const epskx = await hkdfExtract(zeroSalt, source, 'SHA-256')
  if (epskx.length !== 32)
    throw new Error('EPSK extract did not produce the selected 32-byte result')
  const identityHash = await hash('SHA-256', serializedIdentity)
  const hkdfLabel = sampleDerivedPskLabel(identityHash)
  const ipsk = await hkdfExpand(epskx, hkdfLabel, OUTPUT_LENGTH, 'SHA-256')
  if (ipsk.length !== 32)
    throw new Error('IPSK expansion did not produce the selected 32-byte result')
  // Imported PSK is IKM, not the salt, at the existing TLS Early Secret step.
  const earlySecret = await hkdfExtract(zeroSalt, ipsk, 'SHA-256')
  if (earlySecret.length !== 32)
    throw new Error('Early Secret extract did not produce the selected 32-byte result')
  return { serializedIdentity, identityHash, epskx, hkdfLabel, ipsk, earlySecret }
}
