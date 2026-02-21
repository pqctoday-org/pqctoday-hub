import type { PersonaId } from './learningPersonas'
import type { Region } from '../store/usePersonaStore'

/**
 * Nav paths shown per persona (on top of always-visible pages).
 * Always-visible: '/', '/learn', '/timeline', '/threats', '/about'
 * null = show all (researcher / no persona)
 */
export const PERSONA_NAV_PATHS: Record<PersonaId, string[] | null> = {
  executive: ['/assess', '/leaders', '/library'],
  developer: ['/algorithms', '/library', '/migrate', '/playground', '/openssl'],
  architect: ['/assess', '/algorithms', '/library', '/migrate', '/compliance', '/leaders'],
  researcher: null,
}

/**
 * Top 3 landing page feature card paths to badge as "Recommended" per persona.
 */
export const PERSONA_RECOMMENDED_PATHS: Record<PersonaId, string[]> = {
  executive: ['/assess', '/timeline', '/leaders'],
  developer: ['/playground', '/openssl', '/algorithms'],
  architect: ['/timeline', '/assess', '/compliance'],
  researcher: ['/algorithms', '/openssl', '/playground'],
}

/**
 * Broad region → representative country name matching timeline CSV data.
 * null means no pre-filter (Global).
 * @deprecated Use REGION_COUNTRIES_MAP for multi-country region filtering.
 */
export const REGION_COUNTRY_MAP: Record<Region, string | null> = {
  americas: 'United States',
  eu: 'France',
  apac: 'Japan',
  global: null,
}

/**
 * Broad region → all matching country names in the timeline CSV data.
 * Used to power multi-country region filter in the Gantt chart.
 */
export const REGION_COUNTRIES_MAP: Record<Region, string[]> = {
  americas: ['United States', 'Canada'],
  eu: [
    'European Union',
    'France',
    'Germany',
    'Italy',
    'Spain',
    'United Kingdom',
    'Czech Republic',
    'Israel',
  ],
  apac: [
    'Japan',
    'Singapore',
    'Australia',
    'South Korea',
    'Taiwan',
    'India',
    'China',
    'New Zealand',
  ],
  global: ['Global', 'International', 'G7', 'NATO', 'BIS', 'GSMA'],
}

/**
 * Module ID → industries where this module is particularly relevant.
 * null means relevant to all industries.
 */
export const MODULE_INDUSTRY_RELEVANCE: Record<string, string[] | null> = {
  'pqc-101': null,
  'quantum-threats': null,
  'hybrid-crypto': ['Finance & Banking', 'Government & Defense', 'Technology'],
  'crypto-agility': ['Finance & Banking', 'Government & Defense', 'Telecommunications'],
  'tls-basics': ['Technology', 'Finance & Banking', 'Telecommunications'],
  'vpn-ssh-pqc': ['Technology', 'Government & Defense', 'Energy & Utilities'],
  'email-signing': ['Healthcare', 'Government & Defense', 'Finance & Banking'],
  'pki-workshop': ['Government & Defense', 'Finance & Banking', 'Healthcare'],
  'key-management': ['Finance & Banking', 'Government & Defense', 'Healthcare', 'Technology'],
  'stateful-signatures': ['Government & Defense', 'Aerospace'],
  'digital-assets': ['Finance & Banking'],
  '5g-security': ['Telecommunications'],
  'digital-id': ['Government & Defense'],
}

/** Nav paths that are always shown regardless of persona. */
export const ALWAYS_VISIBLE_PATHS = ['/', '/learn', '/timeline', '/threats', '/about']

/**
 * Maps AVAILABLE_INDUSTRIES names (used in Assessment + store) to the
 * exact industry strings used in the threats CSV data.
 * null = no matching threat category.
 */
export const INDUSTRY_TO_THREATS_MAP: Record<string, string | null> = {
  'Finance & Banking': 'Financial Services / Banking',
  'Government & Defense': 'Government / Defense',
  Healthcare: 'Healthcare / Pharmaceutical',
  Telecommunications: 'Telecommunications',
  Technology: 'IT Industry / Software',
  'Energy & Utilities': 'Energy / Critical Infrastructure',
  Automotive: 'Automotive / Connected Vehicles',
  Aerospace: 'Aerospace / Aviation',
  'Retail & E-Commerce': 'Retail / E-Commerce',
  Education: null,
  Other: null,
}
