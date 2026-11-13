// SPDX-License-Identifier: AGPL-3.0-only
import captures from './tlsMeasuredSamples.json'

/**
 * Sizes the role lessons quote about the retained TLS handshake capture. Every
 * number is read from the capture file, so a lesson cannot drift from it.
 * The capture records bytes only; no handshake time was measured.
 */
const GROUP_NAMES: Record<number, string> = {
  29: 'X25519',
  4588: 'X25519MLKEM768',
  513: 'ML-KEM-768',
}

export const formatBytes = (value: number) => value.toLocaleString('en-US')

function profileFacts(name: string) {
  const profile = captures.profiles.find((entry) => entry.name === name)
  if (!profile) throw new Error(`Measured TLS capture missing profile ${name}`)
  const size = (message: string) => profile.messages.find((m) => m.name === message)?.bytes ?? 0
  const group = GROUP_NAMES[profile.groupCode]
  if (!group) throw new Error(`Unlabelled key-exchange group ${profile.groupCode}`)
  return {
    label: `${group} with ${profile.authentication}`,
    totalBytes: profile.totalBytes,
    certificateMessageBytes: size('Certificate'),
    clientHelloBytes: size('ClientHello'),
    serverHelloBytes: size('ServerHello'),
  }
}

const classical = profileFacts('classical')
const hybrid = profileFacts('hybrid')
const pqc = profileFacts('pqc')

export const MEASURED_HANDSHAKE_FACTS = {
  runtime: captures.runtime,
  measuredOn: captures.measuredOn,
  messageCount: captures.profiles[0].messages.length,
  classical,
  hybrid,
  pqc,
}

/** One sentence naming the three captured cases and their seven-message totals. */
export function measuredHandshakeTotalsSentence(): string {
  const f = MEASURED_HANDSHAKE_FACTS
  return (
    `${f.classical.label}: ${formatBytes(f.classical.totalBytes)} bytes; ` +
    `${f.hybrid.label}: ${formatBytes(f.hybrid.totalBytes)} bytes; ` +
    `${f.pqc.label}: ${formatBytes(f.pqc.totalBytes)} bytes`
  )
}

/** Plain statement of what the capture is, and what it is not. */
export function measuredHandshakeScopeSentence(): string {
  const f = MEASURED_HANDSHAKE_FACTS
  return (
    `These are TLS 1.3 handshake-layer bytes (${f.messageCount} messages, headers included, ` +
    `leaf and intermediate certificates, TLS record and TCP/IP framing excluded) captured with ` +
    `${f.runtime} on ${f.measuredOn} for a fictional host name; they are sample profiles, not ` +
    `estimates for every deployment. No handshake time was measured.`
  )
}
