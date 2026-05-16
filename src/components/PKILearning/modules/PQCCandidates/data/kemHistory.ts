// SPDX-License-Identifier: GPL-3.0-only
/**
 * Past PQC KEM-round history. Used by the Learn tab to anchor the thesis
 * that standardisation is a rolling process — the KEM track already shows
 * one selection, one alternate, and likely further additions to come.
 */

export interface KemHistoryEntry {
  /** Scheme name as proposed */
  name: string
  /** Family */
  family: 'Lattice' | 'Code' | 'Hash' | 'Isogeny' | 'Other'
  /** Where the scheme ended up */
  outcome: 'standardised' | 'alternate' | 'broken' | 'eliminated' | 'monitoring'
  /** Final / current standard name if standardised */
  finalName?: string
  /** Short summary for the timeline */
  summary: string
}

export const KEM_HISTORY: KemHistoryEntry[] = [
  {
    name: 'Kyber',
    family: 'Lattice',
    outcome: 'standardised',
    finalName: 'ML-KEM (FIPS 203)',
    summary:
      'CRYSTALS-Kyber selected in 2022; published as ML-KEM under FIPS 203 in August 2024. The primary PQC KEM.',
  },
  {
    name: 'HQC',
    family: 'Code',
    outcome: 'alternate',
    finalName: 'HQC alternate (2025)',
    summary:
      'Hamming Quasi-Cyclic selected in March 2025 as the code-based KEM alternate — diversifies the KEM portfolio against an unexpected lattice break.',
  },
  {
    name: 'Classic McEliece',
    family: 'Code',
    outcome: 'monitoring',
    summary:
      'Maintained as a 4th-round candidate. Public key is ~1 MB but signature security has held since 1978 — kept as long-tail insurance.',
  },
  {
    name: 'BIKE',
    family: 'Code',
    outcome: 'eliminated',
    summary: 'Bit-Flipping Key Encapsulation — eliminated due to performance and decoder concerns.',
  },
  {
    name: 'SIKE',
    family: 'Isogeny',
    outcome: 'broken',
    summary:
      'Supersingular Isogeny Key Encapsulation — broken in 2022 by the Castryck–Decru attack in under an hour on a single core. Cautionary tale for young assumptions.',
  },
  {
    name: 'NTRU',
    family: 'Lattice',
    outcome: 'eliminated',
    summary:
      'Long-standing lattice KEM. Strong design but Kyber edged it out on a balance of size, speed, and IP clarity.',
  },
  {
    name: 'NTRU Prime',
    family: 'Lattice',
    outcome: 'eliminated',
    summary:
      'Streamlined NTRU variant with simpler structural assumptions. Still used in some deployments (e.g., OpenSSH sntrup761).',
  },
  {
    name: 'Saber',
    family: 'Lattice',
    outcome: 'eliminated',
    summary: 'Module-LWR KEM. Eliminated in favour of Kyber.',
  },
  {
    name: 'FrodoKEM',
    family: 'Lattice',
    outcome: 'monitoring',
    summary:
      'Unstructured-LWE KEM — conservative but bandwidth-heavy. Maintained by some agencies (BSI in Germany) as a fallback option.',
  },
]
