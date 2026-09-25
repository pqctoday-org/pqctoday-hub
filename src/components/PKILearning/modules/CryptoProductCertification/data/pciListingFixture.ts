// SPDX-License-Identifier: GPL-3.0-only
// OWNER: PCI author
/**
 * STUB (scaffold). Hand-curated PTS HSM listing fixture (plan r2 §5 P8): 1–3
 * listings, field values quoted verbatim from the public PCI listing, with an
 * as-of date. The Hub has no PCI data, so this file is the only source.
 * Reshape freely — only pciData.ts / PciEvidenceReview.tsx consume it.
 */
export interface PciListingFixtureEntry {
  /** listing field name → value, quoted verbatim from the listing */
  fields: Record<string, string>
  /** public listing URL the fields were read from */
  sourceUrl: string
}

export interface PciListingFixture {
  /** ISO date the listings were read; null until curated */
  asOf: string | null
  entries: PciListingFixtureEntry[]
}

export const pciListingFixture: PciListingFixture = { asOf: null, entries: [] }
