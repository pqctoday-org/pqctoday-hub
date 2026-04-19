// SPDX-License-Identifier: GPL-3.0-only
export interface JurisdictionConfig {
  id: string
  label: string
  region: string
  countryNames: string[]
}

export const JURISDICTIONS: JurisdictionConfig[] = [
  // North America
  { id: 'us', label: 'United States', region: 'North America', countryNames: ['United States'] },
  { id: 'ca', label: 'Canada', region: 'North America', countryNames: ['Canada'] },
  // Europe
  { id: 'eu', label: 'European Union', region: 'Europe', countryNames: ['European Union'] },
  { id: 'uk', label: 'United Kingdom', region: 'Europe', countryNames: ['United Kingdom'] },
  { id: 'fr', label: 'France', region: 'Europe', countryNames: ['France'] },
  { id: 'de', label: 'Germany', region: 'Europe', countryNames: ['Germany'] },
  { id: 'cz', label: 'Czech Republic', region: 'Europe', countryNames: ['Czech Republic'] },
  { id: 'it', label: 'Italy', region: 'Europe', countryNames: ['Italy'] },
  { id: 'es', label: 'Spain', region: 'Europe', countryNames: ['Spain'] },
  // Asia Pacific
  { id: 'jp', label: 'Japan', region: 'Asia Pacific', countryNames: ['Japan'] },
  { id: 'kr', label: 'South Korea', region: 'Asia Pacific', countryNames: ['South Korea'] },
  { id: 'au', label: 'Australia', region: 'Asia Pacific', countryNames: ['Australia'] },
  { id: 'sg', label: 'Singapore', region: 'Asia Pacific', countryNames: ['Singapore'] },
  { id: 'nz', label: 'New Zealand', region: 'Asia Pacific', countryNames: ['New Zealand'] },
  { id: 'cn', label: 'China', region: 'Asia Pacific', countryNames: ['China'] },
  { id: 'in', label: 'India', region: 'Asia Pacific', countryNames: ['India'] },
  { id: 'tw', label: 'Taiwan', region: 'Asia Pacific', countryNames: ['Taiwan'] },
  { id: 'hk', label: 'Hong Kong', region: 'Asia Pacific', countryNames: ['Hong Kong'] },
  { id: 'my', label: 'Malaysia', region: 'Asia Pacific', countryNames: ['Malaysia'] },
  // Middle East
  { id: 'il', label: 'Israel', region: 'Middle East', countryNames: ['Israel'] },
  { id: 'ae', label: 'UAE', region: 'Middle East', countryNames: ['United Arab Emirates'] },
  { id: 'sa', label: 'Saudi Arabia', region: 'Middle East', countryNames: ['Saudi Arabia'] },
  { id: 'bh', label: 'Bahrain', region: 'Middle East', countryNames: ['Bahrain'] },
  { id: 'jo', label: 'Jordan', region: 'Middle East', countryNames: ['Jordan'] },
]
