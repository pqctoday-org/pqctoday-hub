// SPDX-License-Identifier: GPL-3.0-only

// ---------------------------------------------------------------------------
// OID assignments
// ---------------------------------------------------------------------------

/** Single JSON-encoded VendorPolicy extension — replaces all 8 CSV OIDs */
export const VENDOR_POLICY_OID = '1.3.6.1.4.1.99999.1'

/** Allowed origins — kept separate; evaluated at postMessage boundary before JSON parsing */
export const ALLOWED_ORIGINS_OID = '1.3.6.1.4.1.99999.2'

// Legacy OIDs (CSV format) — retained for backward-compat parsing only
export const LEGACY_OIDS = {
  allowedRoutePresets: '1.3.6.1.4.1.99999.1', // old OID .1 was reused for policy JSON
  maxSessionDuration: '1.3.6.1.4.1.99999.3',
  persistModes: '1.3.6.1.4.1.99999.4',
  allowedRegions: '1.3.6.1.4.1.99999.5',
  allowedIndustries: '1.3.6.1.4.1.99999.6',
  allowedRoles: '1.3.6.1.4.1.99999.7',
  assistantEnabled: '1.3.6.1.4.1.99999.8',
} as const

// ---------------------------------------------------------------------------
// VendorPolicy — the access policy encoded in the vendor certificate
// ---------------------------------------------------------------------------

export interface VendorPolicy {
  routes: {
    /** Section-level route presets (e.g. ["learn", "playground"]) */
    presets: string[]
    /** If set, restrict /learn/* to only these module IDs; undefined = all */
    modules?: string[]
    /** If set, restrict /playground/* and /business/tools/* to these IDs; undefined = all */
    tools?: string[]
  }
  content: {
    /** Geographic regions allowed (e.g. ["eu", "global"]) */
    regions: string[]
    /** Industry verticals allowed */
    industries: string[]
    /** Learning roles allowed (e.g. ["curious", "basics", "expert"]) */
    roles: string[]
    /** Maximum difficulty ceiling; undefined = no ceiling */
    maxDifficulty?: 'beginner' | 'intermediate' | 'advanced'
    /** Personas allowed; undefined = all */
    personas?: string[]
  }
  session: {
    /** Maximum session duration in seconds */
    maxDuration: number
    /** Allowed persistence mechanisms */
    persistModes: string[]
  }
  features: {
    /** Whether the PQC AI assistant may be shown */
    assistantEnabled: boolean
    /** Whether to hide the main navigation shell */
    hideNav?: boolean
  }
}

// ---------------------------------------------------------------------------
// Default (permissive) policy — used in dev/test when no cert extension present
// ---------------------------------------------------------------------------

export function defaultVendorPolicy(): VendorPolicy {
  return {
    routes: { presets: ['all'] },
    content: {
      regions: ['global'],
      industries: [
        'finance',
        'healthcare',
        'government',
        'telecom',
        'energy',
        'defense',
        'technology',
        'education',
      ],
      roles: ['curious', 'basics', 'expert'],
    },
    session: { maxDuration: 86400, persistModes: ['api', 'postMessage', 'none'] },
    features: { assistantEnabled: true },
  }
}
