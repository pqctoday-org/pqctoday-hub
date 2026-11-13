// SPDX-License-Identifier: AGPL-3.0-only
//
// Short, readable labels for the Library documents a construction cites
// (2026-11-13). A Library reference_id is often a slug built from the title
// ("RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS"); the cards
// show the label ("RFC 9591") and keep the id for the link.

/** Labels for ids no rule below can shorten. */
const LABELS: Record<string, string> = {
  '3GPP-Post-Quantum-Cryptography-SA3-Overview': '3GPP SA3 PQC overview',
  'AWS-KMS-Import-Wrapping-Keys': 'AWS KMS key import guide',
  'Apple-PQ3-Security-Blog': 'Apple PQ3 blog',
  'ChaCha20-and-Poly1305-for-IETF-Protocols': 'RFC 8439',
  'Efficient-Threshold-ML-DSA-Brave': 'Brave Research: threshold ML-DSA',
  'Hybrid-Post-Quantum-Password-Authenticated-Key-Exchange': 'draft-vos-cfrg-pqpake',
  'ICAO-Doc-9303-Part-11-Security-Mechanisms-for-MRTDs': 'ICAO Doc 9303 Part 11',
  'ICAO-TAG-TRIP-5-WP-18': 'ICAO TAG/TRIP/5-WP/18',
  'PCI-SSC-Key-Blocks-101-104-AES-TDES-key-management': 'PCI SSC Key Blocks 101',
  'PKCS11-V32-OS-OASIS': 'PKCS #11 v3.2',
  'PQ-SUCI-MLKEM-Profile-C-2025': 'PQ SUCI paper (2025)',
  'Rosenpass-Protocol': 'Rosenpass whitepaper',
  'Signal-Blog-SPQR-Post-Quantum-Ratchets': 'Signal SPQR blog',
  'Signal-PQXDH-Spec': 'Signal PQXDH spec',
  'Specification-of-the-MILENAGE-algorithm-set-An-example-algor': 'ETSI TS 135 206 (MILENAGE)',
  'input-output-hk-kes-Cardano-Key-Evolving-Signatures-Sum6Kes': 'Cardano KES library',
  'Cardano-cardano-crypto-praos-VRF-suite-ECVRF-ED25519-SHA512': 'Cardano Praos VRF library',
}

/** The label a card shows for a Library reference id. */
export function proofRefLabel(ref: string): string {
  const fixed = LABELS[ref]
  if (fixed) return fixed
  if (ref.startsWith('draft-')) return ref
  let m = /^(?:IETF[- ])?RFC[- ](\d+)\b/.exec(ref)
  if (m) return `RFC ${m[1]}`
  m = /^NIST[- ]SP[- ]800-(\d+[A-Z]?)(?:-R(\d+))?\b/.exec(ref)
  if (m) return `NIST SP 800-${m[1]}${m[2] ? ` Rev. ${m[2]}` : ''}`
  m = /^NIST[- ]IR[- ](\d+[A-Z]?)\b/.exec(ref)
  if (m) return `NIST IR ${m[1]}`
  m = /ePrint-(\d{4})-(\d+)$/.exec(ref)
  if (m) return `IACR ePrint ${m[1]}/${m[2]}`
  return ref
}

/**
 * True when a label still reads as a raw slug: four or more hyphen-joined
 * words. Internet-Draft names are real identifiers and are allowed.
 */
export function looksLikeSlug(label: string): boolean {
  if (label.startsWith('draft-')) return false
  const parts = label.split('-')
  return parts.length >= 4 && parts.every((p) => /^[A-Za-z0-9]+$/.test(p))
}
