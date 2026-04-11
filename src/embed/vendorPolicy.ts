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

export interface VendorTheme {
  /** Primary brand color, e.g. "#2563EB" */
  primary?: string
  /** Text color on primary buttons/backgrounds, e.g. "#FFFFFF" */
  primaryForeground?: string
  /** Page background color, e.g. "#F8F9FA" */
  background?: string
  /** Card/panel background color, e.g. "#FFFFFF" */
  card?: string
  /** Main text color, e.g. "#1A1A2A" */
  foreground?: string
  /** Muted section background (table headers, zebra rows), e.g. "#F3F4F6" */
  muted?: string
  /** Secondary/muted text color, e.g. "#6B7280" */
  mutedForeground?: string
  /** Border color, e.g. "#E5E7EB" */
  border?: string
  /** Accent color for highlights, e.g. "#3B82F6" */
  accent?: string
  /** Border radius base value, e.g. "4px" */
  radius?: string
  /** Font family stack, e.g. "Inter, system-ui, sans-serif" */
  fontFamily?: string
  /** Table/filter row density: 'compact' (6px), 'normal' (12px), 'relaxed' (16px) */
  density?: 'compact' | 'normal' | 'relaxed'
  /**
   * Navigation bar background color, e.g. "#1A2332" (dark navy).
   * When set, the embed top nav uses this color instead of --color-background.
   * Navigation text/icons automatically use sidebarForeground (or white if unset).
   */
  sidebar?: string
  /** Text/icon color for the navigation bar when sidebar is set, e.g. "#FFFFFF" */
  sidebarForeground?: string
  /**
   * Badge fill style: 'solid' renders status badges with full opacity background
   * (e.g. solid green "Online" pill). 'tinted' (default) uses the subtle /10 tint.
   */
  badgeFill?: 'solid' | 'tinted'
  /**
   * Default color mode for the embed. User can still toggle after load.
   * URL param ?theme= takes priority over this cert value if both are set.
   */
  colorMode?: 'light' | 'dark'
  /** Override link/anchor color. Defaults to --color-primary. e.g. "#2563EB" */
  linkColor?: string
  /** Override success status color used in badges and indicators. e.g. "#059669" */
  successColor?: string
  /** Override warning status color. e.g. "#D97706" */
  warningColor?: string
  /** Override destructive/error status color. e.g. "#DC2626" */
  destructiveColor?: string
}

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
  /** Optional vendor brand theme — applies CSS custom properties before React mounts */
  theme?: VendorTheme
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
