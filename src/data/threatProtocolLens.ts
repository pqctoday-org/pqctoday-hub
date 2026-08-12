// SPDX-License-Identifier: GPL-3.0-only
/**
 * Threats, seen through the protocols a developer owns — B+ remediation 4.3
 * (2026-08-10, built on an explicit user decision).
 *
 * "Developers meet threats through protocols and are given sectors."
 *
 * THE HONEST PROBLEM, AND WHAT WE DO ABOUT IT. The threats corpus has no
 * protocol column. It has `cryptoAtRisk`, which is free text — 329 distinct
 * tokens across 114 rows — and that text is a mixture of two different things:
 * sometimes it names a protocol outright ("ground station TLS", "CAN bus
 * authentication", "TLS for telematics"), and sometimes it names only an
 * algorithm ("RSA-2048", "ECDSA").
 *
 * So a protocol lens is two different claims wearing one label, and this module
 * keeps them apart rather than blurring them:
 *
 *   - STATED — the record's own text names the protocol. Reading it back is not
 *     an inference; it is quotation.
 *   - INFERRED — the record names only an algorithm, and we are asserting that
 *     the algorithm is commonly used by that protocol. This is a real, useful
 *     heuristic and it is also a guess. It is labelled as one everywhere it
 *     surfaces, and `basis` is on the returned value so a caller cannot
 *     accidentally present the two as equivalent.
 *
 * That split is the whole design. The alternative — silently mixing them —
 * would hand a developer a confident list of "threats to your TLS" partly
 * assembled from records that never mentioned TLS, which is the pattern this
 * programme has spent its length removing.
 */
import type { ThreatItem } from './threatsData'

export type ProtocolBasis = 'stated' | 'inferred'

export interface ProtocolMatch {
  protocol: string
  basis: ProtocolBasis
}

/**
 * The protocols worth offering as a lens, each with the patterns that count as
 * the record NAMING it. Grounded in what the live corpus actually mentions —
 * every entry below appears in at least one active row today, so the lens can
 * never offer a filter that returns nothing.
 */
const PROTOCOL_PATTERNS: { protocol: string; match: RegExp }[] = [
  { protocol: 'TLS / HTTPS', match: /\b(TLS|HTTPS|SSL)\b/i },
  { protocol: 'PKI / X.509', match: /\b(PKI|X\.509|certificate authority)\b/i },
  { protocol: 'VPN / IPsec', match: /\b(VPN|IPsec|IKEv2)\b/i },
  { protocol: 'SCADA / OT', match: /\b(SCADA|Modbus|DNP3|OPC ?UA)\b/i },
  { protocol: 'SSH', match: /\bSSH\b/i },
  { protocol: 'S/MIME & email', match: /\b(S\/MIME|PGP|OpenPGP)\b/i },
  { protocol: 'DNSSEC / BGP / RPKI', match: /\b(DNSSEC|BGP|RPKI)\b/i },
  { protocol: 'Payments (SWIFT, EMV, FIX)', match: /\b(SWIFT|EMV|FIX protocol|FIX)\b/i },
  { protocol: 'Vehicle & avionics', match: /\b(V2X|CAN ?bus|ADS-?B|ACARS|IEEE 1609)\b/i },
  { protocol: 'IoT (MQTT, CoAP, Matter)', match: /\b(MQTT|CoAP|Matter|Zigbee|LoRaWAN)\b/i },
  { protocol: 'Network auth (EAP, 802.1X)', match: /\b(EAP|802\.1X|RADIUS)\b/i },
]

/**
 * Which protocols an ALGORITHM is commonly used by. This is the inference half,
 * and it is deliberately conservative: only mappings a practitioner would call
 * uncontroversial, and only for algorithms the corpus actually names.
 *
 * Note what is absent. AES and SHA are not here, because "AES is at risk" tells
 * you nothing about which protocol is affected — every protocol uses it — and a
 * lens that returned everything would be worse than no lens.
 */
const ALGORITHM_PROTOCOLS: { match: RegExp; protocols: string[] }[] = [
  { match: /\bRSA\b/i, protocols: ['TLS / HTTPS', 'PKI / X.509', 'S/MIME & email', 'SSH'] },
  { match: /\bECDSA\b/i, protocols: ['TLS / HTTPS', 'PKI / X.509', 'SSH', 'Vehicle & avionics'] },
  { match: /\bECDH\b/i, protocols: ['TLS / HTTPS', 'VPN / IPsec', 'SSH'] },
  { match: /\bEdDSA|Ed25519\b/i, protocols: ['SSH', 'PKI / X.509'] },
  { match: /\bECC\b/i, protocols: ['TLS / HTTPS', 'PKI / X.509'] },
  { match: /\bDiffie-?Hellman|\bDH\b/i, protocols: ['TLS / HTTPS', 'VPN / IPsec'] },
]

/** Every protocol this lens can offer, in the order the filter shows them. */
export const LENS_PROTOCOLS: string[] = PROTOCOL_PATTERNS.map((p) => p.protocol)

/**
 * The protocols a threat touches, each tagged with how we know.
 *
 * A protocol the record NAMES always wins over the same protocol arrived at by
 * inference — if the text says TLS, we say stated, even when RSA would also
 * have implied it.
 */
export function protocolsForThreat(threat: ThreatItem): ProtocolMatch[] {
  const text = `${threat.cryptoAtRisk ?? ''} ${threat.description ?? ''} ${threat.pqcReplacement ?? ''}`
  const stated = new Set<string>()
  for (const { protocol, match } of PROTOCOL_PATTERNS) {
    if (match.test(text)) stated.add(protocol)
  }

  const inferred = new Set<string>()
  for (const { match, protocols } of ALGORITHM_PROTOCOLS) {
    if (!match.test(text)) continue
    for (const p of protocols) if (!stated.has(p)) inferred.add(p)
  }

  return [
    ...[...stated].map((protocol) => ({ protocol, basis: 'stated' as const })),
    ...[...inferred].map((protocol) => ({ protocol, basis: 'inferred' as const })),
  ]
}

/** True when a threat touches the given protocol by either route. */
export function threatTouchesProtocol(threat: ThreatItem, protocol: string): boolean {
  return protocolsForThreat(threat).some((m) => m.protocol === protocol)
}
