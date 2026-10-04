// SPDX-License-Identifier: GPL-3.0-only

/**
 * Timeline lanes that are not a sovereign country, by flag code.
 *
 *  - INT   "International" and "Global" (the two share one code)
 *  - EU    the European Union
 *  - G7    the Group of Seven
 *  - NATO  the North Atlantic Treaty Organization
 *  - HK    Hong Kong, a Special Administrative Region of China
 *  - TW    Taiwan, which is not a United Nations member
 *
 * The rule is "a United Nations member state", so a reader can check it.
 * Hong Kong and Taiwan keep their own timeline lanes; they are only left out
 * of the country count.
 */
const NOT_A_SOVEREIGN_COUNTRY: ReadonlySet<string> = new Set([
  'INT',
  'EU',
  'G7',
  'NATO',
  'HK',
  'TW',
])

/**
 * How many sovereign countries the Timeline covers.
 *
 * The timeline groups events into lanes keyed by country name, but not every
 * lane is a country, and one country can have two lanes (the US CNSA lane
 * repeats the United States). So this counts distinct flag codes, which
 * collapses duplicate lanes, and skips the blocs, bodies and territories
 * listed above.
 */
export function countSovereignCountries(lanes: ReadonlyArray<{ flagCode?: string }>): number {
  const codes = new Set<string>()
  for (const lane of lanes) {
    const code = lane.flagCode?.trim().toUpperCase()
    if (code && !NOT_A_SOVEREIGN_COUNTRY.has(code)) codes.add(code)
  }
  return codes.size
}
