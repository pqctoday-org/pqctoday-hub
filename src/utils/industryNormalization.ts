// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared industry-name normalization for cross-domain matching.
 *
 * The codebase uses three industry vocabularies that don't directly overlap:
 *   - User-facing canonical (assess wizard, persona store, AVAILABLE_INDUSTRIES):
 *       'Government & Defense', 'Finance & Banking', 'Technology', ...
 *   - Threats CSV: 'Government / Defense', 'Financial Services / Banking', ...
 *       (mapped via `INDUSTRY_TO_THREATS_MAP` in personaConfig.ts)
 *   - Library CSV: free-form aliases like 'Government', 'Defense', 'IT', 'Cloud',
 *       'Federal Government', etc. — normalized via this map.
 *
 * Originally inlined in `LibraryView.tsx`; lifted here so the applicability
 * engine, library view, and any future consumer all stay in sync.
 */

export const LIBRARY_INDUSTRY_CANONICAL_MAP: Record<string, string> = {
  // Finance & Banking
  Finance: 'Finance & Banking',
  Banking: 'Finance & Banking',
  'Finance & Banking': 'Finance & Banking',

  // Government & Defense
  Government: 'Government & Defense',
  Gov: 'Government & Defense',
  'Federal Government': 'Government & Defense',
  Defense: 'Government & Defense',
  'Government & Defense': 'Government & Defense',

  // Healthcare
  Healthcare: 'Healthcare',
  'Regulated industries': 'Healthcare',
  Pharmaceutical: 'Healthcare',

  // Telecommunications
  Telecom: 'Telecommunications',
  Telecommunications: 'Telecommunications',
  'Mobile Networks': 'Telecommunications',
  '5G': 'Telecommunications',
  GSMA: 'Telecommunications',

  // Technology
  IT: 'Technology',
  'Software Development': 'Technology',
  Enterprise: 'Technology',
  'Enterprise IT': 'Technology',
  Cloud: 'Technology',
  'Cloud Security': 'Technology',
  Web: 'Technology',
  'Web APIs': 'Technology',
  IoT: 'Technology',
  'Embedded Systems': 'Technology',
  Firmware: 'Technology',
  'Hardware Security': 'Technology',
  'HSM Vendors': 'Technology',
  'Certificate Authorities': 'Technology',
  'Web PKI': 'Technology',
  PKI: 'Technology',
  'ICT Products': 'Technology',
  Protocol: 'Technology',
  'Data Protection': 'Technology',
  'Identity Management': 'Technology',
  'Secure Messaging': 'Technology',
  Messaging: 'Technology',
  Email: 'Technology',
  'Email Security': 'Technology',
  'Document Signing': 'Technology',
  VPN: 'Technology',
  'Remote Access': 'Technology',
  DNS: 'Technology',
  'Constrained Devices': 'Technology',

  // Energy & Utilities
  'Critical Infrastructure': 'Energy & Utilities',
  Energy: 'Energy & Utilities',
  'Energy & Utilities': 'Energy & Utilities',

  // Education
  Research: 'Education',
  Academia: 'Education',
  'Cryptography Research': 'Education',

  // Long-term Archival — loosely Technology or Government; map to Technology
  Archival: 'Technology',
  'Long-term Archival': 'Technology',
  'High Security': 'Technology',

  // Catch-alls (skip in dropdown — appear under "All")
  'All industries': 'All',
  Global: 'All',
  Mobile: 'All',
}

/** Returns the canonical user-facing industry name for a raw library tag, or undefined if unknown. */
export function canonicalizeLibraryIndustry(rawTag: string): string | undefined {
  const v = LIBRARY_INDUSTRY_CANONICAL_MAP[rawTag.trim()]
  return v && v !== 'All' ? v : undefined
}
