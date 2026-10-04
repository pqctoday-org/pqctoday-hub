// SPDX-License-Identifier: GPL-3.0-only
import { industryComplianceConfigs } from '../../data/industryAssessConfig'
import { sectorCodesOverlap } from '../../utils/applicabilityEngine'
import { EU_MEMBER_COUNTRIES } from '../../utils/euCountries'

/**
 * Keeps the frameworks a visitor selected that apply to their industry AND
 * country. Used by both assessment paths so they can never disagree.
 *
 * Industry and country are compared the way the applicability engine compares
 * them. The wizard's industry labels ("Finance & Banking", "Retail &
 * E-Commerce", ...) and the framework config's labels ("Finance & Insurance",
 * "Retail Trade", ...) are worded differently, so an exact string match
 * silently dropped frameworks such as PCI DSS for most industries; both sides
 * are resolved to the shared sector codes first. A framework listed for
 * "European Union" applies in every member state, which an exact match also
 * missed (DORA was dropped for a bank in Germany). A framework tagged with
 * three or more industries is treated as broadly applicable, and a framework
 * that is not in the config is never dropped.
 */
export function filterComplianceRequirements(
  requirements: string[],
  industry: string,
  country: string | undefined
): string[] {
  return requirements.filter((fw) => {
    const framework = industryComplianceConfigs.find((f) => f.label === fw)
    if (!framework) return true // don't silently drop unknowns

    const industryMatch =
      framework.industries.includes(industry) ||
      framework.industries.length >= 3 ||
      sectorCodesOverlap(framework.industries, industry)

    const countryMatch =
      !country ||
      country === 'Global' ||
      framework.countries.length === 0 ||
      framework.countries.includes('Global') ||
      framework.countries.includes(country) ||
      (framework.countries.includes('European Union') && EU_MEMBER_COUNTRIES.has(country))

    return industryMatch && countryMatch
  })
}
