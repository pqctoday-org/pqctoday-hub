// SPDX-License-Identifier: AGPL-3.0-only

/**
 * One spelling per country for the Community directory. The leaders CSV spells
 * two countries two ways ("USA" 95 rows / "United States" 45, "UK" 19 /
 * "United Kingdom" 8 in leaders_11132026_r5), which split the Country filter
 * in two. Rows are read with the long form, the form the Timeline CSV uses;
 * old `?country=USA` / `?country=UK` links still match because every country
 * param goes through this same function. Dual-country values ("Netherlands/USA")
 * are canonicalised part by part.
 */
const COUNTRY_SPELLING: Record<string, string> = {
  USA: 'United States',
  US: 'United States',
  UK: 'United Kingdom',
  GB: 'United Kingdom',
}

export function canonicalLeaderCountry(country: string): string {
  const value = country.trim()
  if (!value || value === 'All') return value
  return value
    .split('/')
    .map((part) => {
      const p = part.trim()
      return Object.prototype.hasOwnProperty.call(COUNTRY_SPELLING, p)
        ? // eslint-disable-next-line security/detect-object-injection -- own key checked above
          COUNTRY_SPELLING[p]
        : p
    })
    .join('/')
}
