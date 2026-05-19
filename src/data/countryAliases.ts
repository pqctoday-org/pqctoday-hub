// SPDX-License-Identifier: GPL-3.0-only
/**
 * Country alias map for the Timeline view.
 *
 * Maps common short-form country codes/names (used by deep links from other
 * pages and external chatbots) to the canonical `countryName` values that
 * appear in the Timeline CSV's `Country` column.
 *
 * Hygiene gated by `npm run audit:timeline-aliases` — that script enforces:
 *   1. Every alias value resolves to a real Timeline CSV country row.
 *   2. Every distinct CSV Country either matches itself canonically or is
 *      reachable through at least one alias entry.
 *   3. No alias key duplicates another alias key (case-insensitive) and no
 *      alias key collides with a canonical country name.
 *
 * When adding / renaming a country in the Timeline CSV, update this map in
 * the same commit. The CI gate will fail otherwise.
 */
export const COUNTRY_ALIASES = {
  UK: 'United Kingdom',
  GB: 'United Kingdom',
  USA: 'United States',
  US: 'United States',
  UAE: 'United Arab Emirates',
  PRC: 'China',
  ROK: 'South Korea',
  Korea: 'South Korea',
} as const

export type CountryAliasKey = keyof typeof COUNTRY_ALIASES
