// SPDX-License-Identifier: AGPL-3.0-only

import { COUNTRY_CODE_TO_NAME, JURISDICTION_BY_NAME } from './jurisdictionsData'

/**
 * One spelling per country for the Community directory. The leaders file keeps each person's Country on
 * the jurisdiction list: a jurisdiction name ("France") or its code ("US", "GB"), and a person tied to
 * two countries holds the codes joined by ";" ("NL;US"). Rows are read with the long form, the form the
 * Timeline CSV uses, so the Country filter has one entry per country. Old values and links keep working
 * because every country param goes through this same function: "USA" and "UK" (spellings the file used
 * to hold), a "/" pair ("Netherlands/USA") and any code are read part by part.
 */
const LEGACY_SPELLING: Record<string, string> = {
  USA: 'United States',
  UK: 'United Kingdom',
}

function canonicalPart(part: string): string {
  const p = part.trim()
  if (Object.prototype.hasOwnProperty.call(LEGACY_SPELLING, p)) {
    // eslint-disable-next-line security/detect-object-injection -- own key checked above
    return LEGACY_SPELLING[p]
  }
  if (Object.prototype.hasOwnProperty.call(COUNTRY_CODE_TO_NAME, p)) {
    // eslint-disable-next-line security/detect-object-injection -- own key checked above
    return COUNTRY_CODE_TO_NAME[p]
  }
  return p
}

export function canonicalLeaderCountry(country: string): string {
  const value = country.trim()
  if (!value || value === 'All') return value
  return value.split(/[/;]/).map(canonicalPart).join('/')
}

/**
 * True when a Country value of the leaders file is on the list: a jurisdiction name or code, or several
 * of them joined by ";" (no spaces). An empty value (the person's country is not stated) is not a country
 * and passes: the file never guesses one.
 */
export function isLeaderCountryOnList(country: string): boolean {
  if (country === '') return true
  return country.split(';').every((part) => {
    if (part === '' || part !== part.trim()) return false
    if (part === 'EU') return false
    return (
      Object.prototype.hasOwnProperty.call(JURISDICTION_BY_NAME, part) ||
      Object.prototype.hasOwnProperty.call(COUNTRY_CODE_TO_NAME, part)
    )
  })
}
