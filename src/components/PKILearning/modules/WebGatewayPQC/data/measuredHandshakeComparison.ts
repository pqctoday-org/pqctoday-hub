// SPDX-License-Identifier: AGPL-3.0-only
import { sha256 } from '@noble/hashes/sha2.js'
import captures from '../../VPNSSHModule/data/tlsMeasuredSamples.json'
import {
  measureTlsSample,
  type TlsSampleMode,
  type EncodedTlsSample,
} from '../../VPNSSHModule/data/measuredTlsHandshake'
import variants from './handshakeCertificateVariants.json'

export const HANDSHAKE_SAMPLE_OPTIONS = [
  { id: 'classical', label: 'X25519 + RSA-2048' },
  { id: 'hybrid', label: 'X25519MLKEM768 + RSA-2048' },
  { id: 'pure-pqc', label: 'ML-KEM-768 + ML-DSA-65' },
] as const
export const HANDSHAKE_BOUNDARY = captures.boundary
export const HANDSHAKE_VARIANT_SCOPE =
  'Measured baseline; substituted certificate messages and negotiation framing are modelled variants, not negotiated captures.'
const decode = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
const digest = (bytes: Uint8Array) =>
  Array.from(sha256(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
const uint24 = (bytes: Uint8Array, at: number) =>
  bytes[at] * 65536 + bytes[at + 1] * 256 + bytes[at + 2]
function frame(bytes: Uint8Array, type: number) {
  if (bytes.length < 4 || bytes[0] !== type || uint24(bytes, 1) !== bytes.length - 4)
    throw new Error('Invalid certificate handshake frame')
  return bytes.subarray(4)
}
export type CertificateVariant = (typeof variants.variants)[number]
/** Refuse same-length substitutions whose source bytes differ from this measurement. */
export function validateCertificateVariant(
  mode: TlsSampleMode,
  fixture: EncodedTlsSample,
  variant: CertificateVariant
) {
  const measured = measureTlsSample(mode, fixture)
  const source = fixture.messages.find((m) => m.name === 'Certificate')!
  const body = frame(decode(source.base64), 11)
  if (variant.profile !== fixture.name || digest(body) !== variant.sourceCertificateBodySha256)
    throw new Error('Certificate source identity mismatch')
  const compressed = decode(variant.compressedCertificateBase64)
  const cbody = frame(compressed, 25)
  if (
    cbody.length < 8 ||
    cbody[0] !== 0 ||
    cbody[1] !== 1 ||
    uint24(cbody, 2) !== body.length ||
    uint24(cbody, 5) !== cbody.length - 8 ||
    digest(compressed) !== variant.compressedCertificateSha256
  )
    throw new Error('Compressed certificate identity or framing mismatch')
  const spki = decode(variant.leafSpkiBase64)
  if (digest(spki) !== variant.leafSpkiSha256) throw new Error('SPKI source identity mismatch')
  return {
    measured,
    certificateBytes: source.bytes,
    compressedBytes: compressed.length,
    spkiBytes: spki.length,
  }
}
export function measuredHandshakeProfile(profileId: string) {
  const option = HANDSHAKE_SAMPLE_OPTIONS.find((o) => o.id === profileId)
  if (!option) throw new Error('Unknown measured handshake profile')
  const name = option.id === 'pure-pqc' ? 'pqc' : option.id
  const fixture = captures.profiles.find((p) => p.name === name)!
  const variant = variants.variants.find((p) => p.profile === name)!
  return { ...validateCertificateVariant(option.id, fixture, variant), label: option.label }
}
/** Complete seven-message accounting, with substitutions confined to the declared message. */
export function compareMeasuredHandshake(
  profileId: string,
  mitigationIds: string[],
  newConnectionsPerSecond: number
) {
  if (!Number.isSafeInteger(newConnectionsPerSecond) || newConnectionsPerSecond < 0)
    throw new Error('New connections per second must be a nonnegative safe integer')
  const ids = [...new Set(mitigationIds)]
  const known = ['compression', 'rpk', 'http3-quic', 'connection-coalescing', 'psk', 'mtc']
  if (ids.some((id) => !known.includes(id))) throw new Error('Unknown handshake mitigation')
  const profile = measuredHandshakeProfile(profileId)
  const baseline = profile.measured.totalBytes
  let unsupportedReason: string | null = null
  if (ids.includes('compression') && ids.includes('rpk'))
    unsupportedReason =
      'No compressed-SPKI measurement is retained; choose compression or raw public key for a numeric variant.'
  if (ids.includes('psk'))
    unsupportedReason =
      'A complete resumed capture or declared PSK envelope is required; the removable authentication component is not a resumed-handshake total.'
  if (ids.includes('mtc'))
    unsupportedReason =
      'The MTC authenticated-component model is separate; no negotiated MTC handshake envelope is retained.'
  const messages: { name: string; direction: string; bytes: number }[] =
    profile.measured.messages.map((m) => ({ ...m }))
  let negotiationBytes = 0
  if (!unsupportedReason && ids.includes('compression')) {
    messages[0].bytes += 7 // extension type + length + one-byte vector length + uint16 algorithm
    messages[3] = { ...messages[3], name: 'CompressedCertificate', bytes: profile.compressedBytes }
    negotiationBytes = 7
  }
  if (!unsupportedReason && ids.includes('rpk')) {
    messages[0].bytes += 6 // server_certificate_type offer, one certificate type
    messages[2].bytes += 5 // selected server_certificate_type in EncryptedExtensions
    messages[3].bytes = profile.spkiBytes + 13 // Handshake4 + context1 + list3 + entry3 + extensions2
    negotiationBytes = 11
  }
  const adjustedBytes = unsupportedReason ? null : messages.reduce((n, m) => n + m.bytes, 0)
  const savingsBytes = adjustedBytes === null ? null : baseline - adjustedBytes
  const bandwidthBytesPerSecond =
    adjustedBytes === null ? null : adjustedBytes * newConnectionsPerSecond
  if (bandwidthBytesPerSecond !== null && !Number.isSafeInteger(bandwidthBytesPerSecond))
    throw new Error('Bandwidth exceeds safe byte accounting range')
  return {
    profile: profileId,
    profileLabel: profile.label,
    runtime: captures.runtime,
    measuredOn: captures.measuredOn,
    boundary: HANDSHAKE_BOUNDARY,
    scope: HANDSHAKE_VARIANT_SCOPE,
    certificateComposition: captures.certificateComposition,
    mitigations: ids,
    baselineBytes: baseline,
    adjustedBytes,
    savingsBytes,
    negotiationBytes,
    baselineMessages: profile.measured.messages,
    messages: unsupportedReason ? null : messages,
    newConnectionsPerSecond,
    bandwidthBytesPerSecond,
    unsupportedReason,
    authenticationComponentBytes: profile.measured.authenticationBytes,
    remainingBeforePskEnvelopeChanges: baseline - profile.measured.authenticationBytes,
    transportScope:
      'QUIC does not discount cryptographic message bytes. Coalescing changes the number of new handshakes only when the explicit new-connections input changes; packetization, record protection and latency are outside this boundary.',
    rawPublicKeyScope: ids.includes('rpk')
      ? 'Same leaf SPKI and unchanged CertificateVerify; requires negotiated support and an external identity-to-key trust binding.'
      : null,
  }
}
export function exportHandshakeComparison(
  result: ReturnType<typeof compareMeasuredHandshake>
): string {
  return JSON.stringify(result, null, 2) + '\n'
}
