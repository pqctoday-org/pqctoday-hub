// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Patent holder → Migrate catalogue vendor.
 *
 * Patents name the legal entity that holds them ("NXP B.V.", "International
 * Business Machines Corporation", "Cisco Technology, Inc."); the vendor
 * catalogue names the company that sells ("NXP Semiconductors N.V." / "NXP",
 * "IBM Corporation", "Cisco Systems Inc."). An exact name match linked only
 * 1 of the top 5 holders, so the Patents Role Lens sent readers to a "no
 * vendor matching" notice. This compares names with legal-form words removed,
 * plus a short list of holding entities whose name shares no word with the
 * vendor's. A holder that is not in the catalogue (a bank, an insurer, an
 * individual inventor) gets null, and the page shows no supplier link.
 */
import { vendorMap } from './vendorData'

/** Legal-form and IP-holding words that are not part of the company's name. */
const NOISE = new Set([
  'inc',
  'incorporated',
  'corp',
  'corporation',
  'co',
  'company',
  'ltd',
  'limited',
  'llc',
  'plc',
  'nv',
  'bv',
  'ag',
  'gmbh',
  'sa',
  'sas',
  'se',
  'oy',
  'ab',
  'kk',
  'group',
  'holdings',
  'technology',
  'technologies',
  'licensing',
  'semiconductors',
  'systems',
])

/** "Cisco Technology, Inc." → "cisco"; "NXP B.V." → "nxp". */
export function holderKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b([a-z])\.(?=[a-z]\.)/g, '$1') // "b.v." → "bv"
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w))
    .join(' ')
}

/**
 * Holding entities whose own name does not match the vendor's: each one is
 * the patent-holding arm of the catalogue vendor it points to (holder key →
 * vendor id).
 */
const HOLDER_ALIASES: Record<string, string> = {
  'international business machines': 'VND-019', // IBM Corporation
  amazon: 'VND-001', // Amazon Technologies, Inc. → Amazon Web Services
  'thales dis cpl usa': 'VND-041', // Thales CPL (cpl.thalesgroup.com)
}

const BY_KEY = new Map<string, string>()
for (const [id, v] of vendorMap) {
  for (const name of [v.vendorName, v.vendorDisplayName]) {
    const key = name ? holderKey(name) : ''
    if (key && !BY_KEY.has(key)) BY_KEY.set(key, id)
  }
}

/** The catalogue vendor id for a patent holder, or null when it is not a vendor there. */
export function vendorIdForPatentHolder(assignee: string): string | null {
  const key = holderKey(assignee)
  if (!key) return null
  // eslint-disable-next-line security/detect-object-injection -- fixed lookup table
  const alias = HOLDER_ALIASES[key]
  if (alias && vendorMap.has(alias)) return alias
  return BY_KEY.get(key) ?? null
}
