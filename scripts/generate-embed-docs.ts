/**
 * generate-embed-docs.ts
 *
 * Generates public/data/embed-docs.json — the authoritative embed API reference
 * consumed by the pqc-tools/embed-test-site user-manual panel.
 *
 * Run standalone:
 *   npx tsx scripts/generate-embed-docs.ts
 *
 * Automatically included in:
 *   npm run prebuild  (via generate-embed-docs entry)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.resolve(__dirname, '../public/data/embed-docs.json')

// ---------------------------------------------------------------------------
// Package version
// ---------------------------------------------------------------------------

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'))
const appVersion: string = pkg.version

// ---------------------------------------------------------------------------
// Types mirrored from TypeScript source (kept simple — no ts-morph dependency)
// ---------------------------------------------------------------------------

interface FieldDef {
  name: string
  type: string
  required?: boolean
  description: string
  example?: string
  since?: string
}

interface MessageDef {
  type: string
  direction: 'app→parent' | 'parent→app'
  when: string
  description: string
  fields: FieldDef[]
  example: Record<string, unknown>
}

interface ThemeFieldDef {
  field: string
  type: string
  group: string
  description: string
  example?: string
  default?: string
  /** true = cannot be set via URL params; only configurable in the vendor certificate */
  certOnly?: boolean
}

interface PolicyFieldDef {
  field: string
  type: string
  required?: boolean
  description: string
  example?: string
  values?: string[]
}

interface EmbedDocs {
  version: string
  generatedAt: string
  postMessageProtocol: {
    appToParent: MessageDef[]
    parentToApp: MessageDef[]
  }
  urlParams: FieldDef[]
  errorCodes: { code: string; description: string }[]
  vendorTheme: ThemeFieldDef[]
  vendorPolicy: {
    routes: PolicyFieldDef[]
    content: PolicyFieldDef[]
    session: PolicyFieldDef[]
    features: PolicyFieldDef[]
  }
}

// ---------------------------------------------------------------------------
// postMessage protocol — mirrors postMessageProtocol.ts exactly
// ---------------------------------------------------------------------------

const APP_TO_PARENT: MessageDef[] = [
  {
    type: 'pqc:ready',
    direction: 'app→parent',
    when: 'Sent immediately after the embed app mounts and URL verification succeeds.',
    description:
      'Signals that the embed is ready to receive messages. The parent should send pqc:auth (if using an auth token) after receiving this.',
    fields: [
      {
        name: 'type',
        type: '"pqc:ready"',
        required: true,
        description: 'Message type discriminator.',
      },
    ],
    example: { type: 'pqc:ready' },
  },
  {
    type: 'pqc:load',
    direction: 'app→parent',
    when: 'Sent after pqc:ready when persistMode is "postMessage". The parent must respond with pqc:loadResponse.',
    description:
      'Requests the previously saved user snapshot. The parent should reply with pqc:loadResponse containing the stored snapshot (or null for a new user). The app waits up to 2 seconds for the response before proceeding with an empty state.',
    fields: [
      {
        name: 'type',
        type: '"pqc:load"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'userId',
        type: 'string',
        required: true,
        description:
          'The anonymized user identifier from the signed URL (uid parameter). Use this as the key to look up the stored snapshot in your own database or localStorage.',
      },
    ],
    example: { type: 'pqc:load', userId: 'usr_a7f3c9d2' },
  },
  {
    type: 'pqc:save',
    direction: 'app→parent',
    when: 'Sent whenever the user makes progress: completing a module step, submitting a quiz, completing an assessment, or changing persona.',
    description:
      'Delivers the full user journey snapshot to the parent for storage. The vendor is responsible for persisting this — in localStorage, a database, or any backend. The snapshot is opaque JSON and should be returned verbatim in pqc:loadResponse on the next session.',
    fields: [
      {
        name: 'type',
        type: '"pqc:save"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Anonymized user identifier.',
      },
      {
        name: 'snapshot',
        type: 'AppSnapshot',
        required: true,
        description:
          'The complete user journey state. Contents: completed module IDs, quiz scores, assessment answers, active persona, active region/industry, viewed milestones, generated artifacts. Treat as opaque — return it verbatim in pqc:loadResponse.',
      },
    ],
    example: {
      type: 'pqc:save',
      userId: 'usr_a7f3c9d2',
      snapshot: {
        completedModules: ['pqc-101', 'hybrid-crypto'],
        quizScores: { 'pqc-101': 90 },
        activePersona: 'basics',
        activeRegion: 'eu',
      },
    },
  },
  {
    type: 'pqc:event',
    direction: 'app→parent',
    when: 'Sent after each significant user action for activity tracking and analytics.',
    description:
      'Delivers one or more user activity events to the parent. Use these for progress tracking dashboards, compliance reporting, or metering. Each event includes a timestamp and the userId.',
    fields: [
      {
        name: 'type',
        type: '"pqc:event"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Anonymized user identifier.',
      },
      {
        name: 'events',
        type: 'HistoryEvent[]',
        required: true,
        description:
          'Array of activity events. Each event has: type (e.g. "module_completed", "quiz_session", "step_completed", "assessment_completed"), moduleId (if applicable), data (event-specific payload), timestamp (ISO 8601).',
      },
    ],
    example: {
      type: 'pqc:event',
      userId: 'usr_a7f3c9d2',
      events: [
        {
          type: 'module_completed',
          moduleId: 'pqc-101',
          data: { timeSpent: 342 },
          timestamp: '2026-04-11T14:32:00.000Z',
        },
      ],
    },
  },
  {
    type: 'pqc:resize',
    direction: 'app→parent',
    when: 'Sent when the embed content height changes (debounced 100ms).',
    description:
      'Used for iframe auto-height. Set the iframe height to the reported value to avoid double scrollbars. Example: iframe.style.height = height + "px".',
    fields: [
      {
        name: 'type',
        type: '"pqc:resize"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'height',
        type: 'number',
        required: true,
        description: 'Content height in pixels (integer).',
      },
    ],
    example: { type: 'pqc:resize', height: 1240 },
  },
  {
    type: 'pqc:authExpired',
    direction: 'app→parent',
    when: 'Sent when a vendor API call returns 401/403 (auth token has expired). Only relevant when using custom auth tokens.',
    description:
      'Signals that the current auth token is no longer valid. The parent should generate a new token and send it via pqc:auth. Until the new token arrives, API calls are queued.',
    fields: [
      {
        name: 'type',
        type: '"pqc:authExpired"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Anonymized user identifier.',
      },
    ],
    example: { type: 'pqc:authExpired', userId: 'usr_a7f3c9d2' },
  },
]

const PARENT_TO_APP: MessageDef[] = [
  {
    type: 'pqc:auth',
    direction: 'parent→app',
    when: 'Sent by the parent after receiving pqc:ready, and again after pqc:authExpired.',
    description:
      'Delivers an opaque auth token to the embed. The token is stored in memory only (never persisted). Use this to pass a short-lived JWT or session token without exposing it in the URL.',
    fields: [
      {
        name: 'type',
        type: '"pqc:auth"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'token',
        type: 'string',
        required: true,
        description:
          'Opaque auth token string. Stored in React ref — never written to localStorage, URL, or cookies.',
      },
    ],
    example: { type: 'pqc:auth', token: 'eyJhbGciOiJFUzI1NiJ9...' },
  },
  {
    type: 'pqc:loadResponse',
    direction: 'parent→app',
    when: 'Sent in response to pqc:load. Must be sent within 2 seconds or the app proceeds with empty state.',
    description:
      'Returns the previously saved snapshot for the user. If no snapshot exists (new user or first visit), send null — the app will start fresh. The snapshot is applied before the first render.',
    fields: [
      {
        name: 'type',
        type: '"pqc:loadResponse"',
        required: true,
        description: 'Message type discriminator.',
      },
      {
        name: 'snapshot',
        type: 'AppSnapshot | null',
        required: true,
        description: 'The snapshot previously received in pqc:save, or null for a new user.',
      },
    ],
    example: {
      type: 'pqc:loadResponse',
      snapshot: {
        completedModules: ['pqc-101'],
        quizScores: { 'pqc-101': 90 },
        activePersona: 'basics',
      },
    },
  },
]

// ---------------------------------------------------------------------------
// URL parameters — mirrors verifySignature.ts
// ---------------------------------------------------------------------------

const URL_PARAMS: FieldDef[] = [
  {
    name: 'kid',
    type: 'string',
    required: true,
    description:
      'Key identifier — maps to the vendor certificate filename stem in the PQC Today vendor registry.',
    example: 'acme-2026-01',
  },
  {
    name: 'uid',
    type: 'string',
    required: true,
    description:
      'Anonymized user identifier. Opaque to PQC Today — vendor is responsible for mapping to real identity. Used as the key in all postMessage persistence and event messages.',
    example: 'usr_a7f3c9d2',
  },
  {
    name: 'exp',
    type: 'integer',
    required: true,
    description:
      'URL expiry as Unix timestamp (seconds since epoch). PQC Today tolerates up to 5 minutes of clock skew. The effective session duration is min(exp − now, cert.maxDuration).',
    example: '1744406400',
  },
  {
    name: 'nonce',
    type: 'string',
    required: true,
    description:
      'Random hex string for replay mitigation. Minimum 16 characters. Generate fresh per URL.',
    example: 'a9f3c2d7e1b4f8a0',
  },
  {
    name: 'routes',
    type: 'string',
    required: true,
    description:
      'Comma-separated route preset names (e.g. "learn,assess") or explicit paths. Must be a subset of what the vendor certificate authorizes.',
    example: 'learn,assess',
  },
  {
    name: 'persist',
    type: '"postMessage" | "none"',
    required: true,
    description:
      'Persistence mode. "postMessage" = save/load via parent window messages. "none" = stateless session.',
    example: 'postMessage',
  },
  {
    name: 'theme',
    type: '"dark" | "light"',
    required: false,
    description:
      "Force color mode and hide the toggle. If omitted, uses the VendorTheme.colorMode cert value or the user's system preference.",
    example: 'light',
  },
  {
    name: 'persona',
    type: 'string',
    required: false,
    description:
      'Sets the initial user persona (e.g. "curious", "basics", "expert"). Clamped to cert-allowed personas. If the cert allows only one persona, it is auto-applied.',
    example: 'basics',
  },
  {
    name: 'ind',
    type: 'string',
    required: false,
    description:
      'Industry pre-filter (e.g. "finance", "healthcare"). Applied after verification — not included in the ECDSA canonical string. Seeds the industry context shown in compliance and assessment pages.',
    example: 'finance',
  },
  {
    name: 'assistant',
    type: '"true" | "false"',
    required: false,
    description:
      'Override the cert\'s assistantEnabled value for this session. "false" hides the PQC AI assistant even if the cert enables it.',
    example: 'false',
  },
  {
    name: 'sig',
    type: 'string',
    required: true,
    description:
      'Base64url-encoded ECDSA P-256 signature (raw r||s, 64 bytes). Covers all parameters except sig itself, sorted alphabetically by key and joined as key=value&key=value (values not URL-encoded).',
    example: 'MEUCIQD...base64url...',
  },
]

// ---------------------------------------------------------------------------
// Error codes — mirrors verifySignature.ts EmbedErrorCode
// ---------------------------------------------------------------------------

const ERROR_CODES = [
  {
    code: 'missing_params',
    description:
      'One or more required URL parameters are absent (kid, uid, exp, nonce, routes, persist, sig).',
  },
  {
    code: 'unknown_vendor',
    description: 'The kid parameter does not match any entry in the vendor registry.',
  },
  {
    code: 'revoked',
    description: 'The vendor certificate has been revoked (revoked: true in the registry).',
  },
  { code: 'cert_not_yet_valid', description: "The certificate's notBefore date is in the future." },
  { code: 'cert_expired', description: "The certificate's notAfter date has passed." },
  {
    code: 'url_expired',
    description: 'The exp timestamp has passed (plus 5-minute clock skew tolerance).',
  },
  {
    code: 'session_too_long',
    description:
      'The URL expiry would grant a session longer than cert.session.maxDuration allows.',
  },
  {
    code: 'unauthorized_routes',
    description:
      'The routes parameter requests a preset or path not authorized by the vendor certificate.',
  },
  {
    code: 'unauthorized_module',
    description:
      "The current path navigates to a module not in the cert's routes.modules allowlist.",
  },
  {
    code: 'unauthorized_tool',
    description: "The current path navigates to a tool not in the cert's routes.tools allowlist.",
  },
  {
    code: 'unauthorized_persist',
    description: "The persist mode is not in the cert's session.persistModes allowlist.",
  },
  {
    code: 'invalid_signature',
    description:
      'ECDSA P-256 signature verification failed. Likely cause: wrong key, wrong canonical string, or URL was modified after signing.',
  },
  {
    code: 'verification_error',
    description:
      'An unexpected error occurred during verification (e.g., cert parse failure, WebCrypto unavailable).',
  },
]

// ---------------------------------------------------------------------------
// VendorTheme fields — mirrors vendorPolicy.ts VendorTheme interface
// ---------------------------------------------------------------------------

const VENDOR_THEME: ThemeFieldDef[] = [
  // Colors
  {
    field: 'primary',
    type: 'string',
    group: 'Colors',
    description: 'Brand primary color. Used for buttons, active nav items, links, and focus rings.',
    example: '#0E6FCC',
  },
  {
    field: 'primaryForeground',
    type: 'string',
    group: 'Colors',
    description: 'Text color on primary-colored backgrounds (e.g. button label).',
    example: '#FFFFFF',
  },
  {
    field: 'secondary',
    type: 'string',
    group: 'Colors',
    description: 'Secondary brand color for secondary action buttons and some badges.',
    example: '#6366F1',
  },
  {
    field: 'secondaryForeground',
    type: 'string',
    group: 'Colors',
    description: 'Text color on secondary-colored backgrounds.',
    example: '#FFFFFF',
  },
  {
    field: 'background',
    type: 'string',
    group: 'Colors',
    description: 'Page background color.',
    example: '#FFFFFF',
    default: 'dark: #0a0a0f, light: #f8f9fa',
  },
  {
    field: 'card',
    type: 'string',
    group: 'Colors',
    description: 'Card and panel background color (also applied to dropdowns and modals).',
    example: '#FFFFFF',
  },
  {
    field: 'foreground',
    type: 'string',
    group: 'Colors',
    description: 'Main body text color.',
    example: '#111827',
  },
  {
    field: 'muted',
    type: 'string',
    group: 'Colors',
    description: 'Muted section background — table headers, zebra rows, secondary panels.',
    example: '#F3F4F6',
  },
  {
    field: 'mutedForeground',
    type: 'string',
    group: 'Colors',
    description: 'Muted text color — table header labels, metadata, placeholders.',
    example: '#6B7280',
  },
  {
    field: 'border',
    type: 'string',
    group: 'Colors',
    description: 'Border and input outline color.',
    example: '#E5E7EB',
  },
  {
    field: 'accent',
    type: 'string',
    group: 'Colors',
    description: 'Accent color for hover states and secondary highlights.',
    example: '#2563EB',
  },
  {
    field: 'linkColor',
    type: 'string',
    group: 'Colors',
    description: 'Override link/anchor color. Defaults to primary.',
    example: '#0E6FCC',
  },
  {
    field: 'successColor',
    type: 'string',
    group: 'Colors',
    description: 'Override success status color (badges, indicators).',
    example: '#16A34A',
    default: '#22c55e',
  },
  {
    field: 'warningColor',
    type: 'string',
    group: 'Colors',
    description: 'Override warning status color.',
    example: '#D97706',
    default: '#f59e0b',
  },
  {
    field: 'destructiveColor',
    type: 'string',
    group: 'Colors',
    description: 'Override destructive/error status color.',
    example: '#DC2626',
    default: '#ef4444',
  },
  // Dark Mode Surfaces
  {
    field: 'darkBackground',
    type: 'string',
    group: 'Dark Mode Surfaces',
    description:
      'Page background color used when colorMode is "dark". Overrides the default dark background. Pair with darkCard, darkForeground, darkBorder for a complete dark theme.',
    example: '#0D1117',
  },
  {
    field: 'darkCard',
    type: 'string',
    group: 'Dark Mode Surfaces',
    description: 'Card and panel background color in dark mode.',
    example: '#161B22',
  },
  {
    field: 'darkForeground',
    type: 'string',
    group: 'Dark Mode Surfaces',
    description: 'Main body text color in dark mode.',
    example: '#E6EDF3',
  },
  {
    field: 'darkMuted',
    type: 'string',
    group: 'Dark Mode Surfaces',
    description: 'Muted section background in dark mode (table headers, zebra rows).',
    example: '#21262D',
  },
  {
    field: 'darkMutedForeground',
    type: 'string',
    group: 'Dark Mode Surfaces',
    description: 'Muted text color in dark mode.',
    example: '#8B949E',
  },
  {
    field: 'darkBorder',
    type: 'string',
    group: 'Dark Mode Surfaces',
    description: 'Border and input outline color in dark mode.',
    example: '#30363D',
  },
  // Typography & Shape
  {
    field: 'radius',
    type: 'string',
    group: 'Typography & Shape',
    description:
      'Base border-radius applied to all rounded elements (cards, buttons, badges, inputs). Cascades to sm/md/lg/xl variants.',
    example: '4px',
    default: '0.5rem',
  },
  {
    field: 'fontFamily',
    type: 'string',
    group: 'Typography & Shape',
    description: 'Font family stack for all text in the embed.',
    example: 'Inter, system-ui, -apple-system, sans-serif',
  },
  {
    field: 'density',
    type: '"compact" | "normal" | "relaxed"',
    group: 'Typography & Shape',
    description:
      'Table row and filter dropdown item vertical padding. compact=6px, normal=12px, relaxed=16px.',
    default: 'normal',
  },
  {
    field: 'colorMode',
    type: '"light" | "dark"',
    group: 'Typography & Shape',
    description:
      'Default color mode for this embed. URL ?theme= takes priority if also set. User can still toggle after load.',
    example: 'light',
  },
  // Navigation
  {
    field: 'navLayout',
    type: '"top" | "sidebar"',
    group: 'Navigation',
    description:
      'Navigation structure. "top" = horizontal header (default). "sidebar" = fixed left panel.',
    default: 'top',
  },
  {
    field: 'navWidth',
    type: 'string',
    group: 'Navigation',
    description:
      'Sidebar width. Use "56px" for icon-only or "200px" for icon+label. Only applies when navLayout is "sidebar".',
    example: '56px',
    default: '200px',
  },
  {
    field: 'headerHeight',
    type: 'string',
    group: 'Navigation',
    description: 'Nav bar height override.',
    example: '56px',
    default: '48px',
  },
  {
    field: 'navActiveBackground',
    type: 'string',
    group: 'Navigation',
    description:
      'Background color of the active navigation item. Overrides the default primary/10 tint.',
    example: 'rgba(14, 111, 204, 0.12)',
  },
  // Sidebar
  {
    field: 'sidebar',
    type: 'string',
    group: 'Sidebar',
    description:
      'Navigation bar background color. When set, the nav header uses this color instead of the page background.',
    example: '#1B2A3B',
  },
  {
    field: 'sidebarForeground',
    type: 'string',
    group: 'Sidebar',
    description:
      'Text and icon color in the navigation bar. Defaults to #FFFFFF when sidebar is set.',
    example: '#FFFFFF',
  },
  // Branding (cert-only — cannot be set via URL parameters)
  {
    field: 'brandName',
    type: 'string',
    group: 'Branding',
    description:
      'Replace "PQC Today" in the nav header with your brand name. If omitted, shows "PQC Today" with default gradient style.',
    example: 'Acme Security',
    certOnly: true,
  },
  {
    field: 'logoUrl',
    type: 'string',
    group: 'Branding',
    description:
      'URL to a vendor logo image shown in the nav header (replaces text wordmark). Must be HTTPS, hosted on your origin. Recommended: ≤ 120×32px.',
    example: 'https://cdn.acme.com/logo-white.svg',
    certOnly: true,
  },
  {
    field: 'logoHeight',
    type: 'string',
    group: 'Branding',
    description: 'Logo image height override.',
    example: '28px',
    default: '28px',
    certOnly: true,
  },
  {
    field: 'logoMaxWidth',
    type: 'string',
    group: 'Branding',
    description: 'Logo image max-width override.',
    example: '120px',
    default: '120px',
    certOnly: true,
  },
  // Badges
  {
    field: 'badgeFill',
    type: '"solid" | "tinted"',
    group: 'Badges',
    description:
      '"solid" renders status badges (Online, Active, Critical) with full-opacity background. "tinted" (default) uses a subtle /10 opacity tint.',
    default: 'tinted',
  },
]

// ---------------------------------------------------------------------------
// VendorPolicy fields — mirrors vendorPolicy.ts VendorPolicy interface
// ---------------------------------------------------------------------------

const VENDOR_POLICY_ROUTES: PolicyFieldDef[] = [
  {
    field: 'routes.presets',
    type: 'string[]',
    required: true,
    description:
      'Section-level route presets that this vendor is authorized to embed. "all" grants full app access.',
    values: [
      'all',
      'learn',
      'timeline',
      'algorithms',
      'library',
      'threats',
      'leaders',
      'compliance',
      'assess',
      'migrate',
      'playground',
      'business',
      'faq',
    ],
    example: '["learn", "assess"]',
  },
  {
    field: 'routes.modules',
    type: 'string[] | undefined',
    description:
      'If set, restricts /learn/* to only these module IDs. Undefined = all modules within the licensed preset.',
    example: '["pqc-101", "hybrid-crypto", "ml-kem"]',
  },
  {
    field: 'routes.tools',
    type: 'string[] | undefined',
    description:
      'If set, restricts /playground/* and /business/tools/* to only these tool IDs. Undefined = all tools in preset.',
    example: '["ml-kem-kyber", "slh-dsa"]',
  },
]

const VENDOR_POLICY_CONTENT: PolicyFieldDef[] = [
  {
    field: 'content.regions',
    type: 'string[]',
    required: true,
    description:
      "Geographic regions the vendor's users may select. Scopes compliance content and migration guidance.",
    values: ['global', 'us', 'eu', 'apac', 'latam', 'mena', 'americas'],
    example: '["eu", "global"]',
  },
  {
    field: 'content.industries',
    type: 'string[]',
    required: true,
    description:
      'Industry verticals available to users. Affects assessment defaults, compliance frameworks shown, and threat relevance.',
    values: [
      'finance',
      'healthcare',
      'government',
      'telecom',
      'energy',
      'defense',
      'technology',
      'education',
    ],
    example: '["finance", "government"]',
  },
  {
    field: 'content.roles',
    type: 'string[]',
    required: true,
    description: 'Learning persona roles available. Single role → auto-applied (no picker shown).',
    values: ['curious', 'basics', 'expert'],
    example: '["basics", "expert"]',
  },
  {
    field: 'content.maxDifficulty',
    type: '"beginner" | "intermediate" | "advanced" | undefined',
    description: 'Difficulty ceiling. Modules above this level are blocked at navigation time.',
    example: 'intermediate',
  },
  {
    field: 'content.personas',
    type: 'string[] | undefined',
    description:
      'Persona IDs allowed (e.g. ["executive", "developer"]). Undefined = all standard personas permitted.',
    example: '["executive", "security-architect"]',
  },
]

const VENDOR_POLICY_SESSION: PolicyFieldDef[] = [
  {
    field: 'session.maxDuration',
    type: 'number',
    required: true,
    description:
      'Maximum session duration in seconds. The effective session is min(exp − now, maxDuration). Typical values: 3600 (1h), 28800 (8h), 86400 (24h).',
    example: '86400',
  },
  {
    field: 'session.persistModes',
    type: 'string[]',
    required: true,
    description:
      'Persistence modes the vendor is authorized to use. The URL persist= parameter must be a member of this list.',
    values: ['api', 'postMessage', 'none'],
    example: '["postMessage", "none"]',
  },
]

const VENDOR_POLICY_FEATURES: PolicyFieldDef[] = [
  {
    field: 'features.assistantEnabled',
    type: 'boolean',
    required: true,
    description:
      'Whether the PQC AI assistant FAB and panel are shown. Can be further suppressed per-session via URL ?assistant=false.',
    example: 'true',
  },
  {
    field: 'features.hideNav',
    type: 'boolean | undefined',
    description:
      'true = suppress the entire navigation header. Use for full-page iframe embeds where you supply your own navigation.',
    example: 'false',
  },
  {
    field: 'features.hideAbout',
    type: 'boolean | undefined',
    description: 'true = hide the About route from the navigation and block direct access.',
    example: 'true',
  },
  {
    field: 'features.hidePoweredBy',
    type: 'boolean | undefined',
    description:
      'true = hide the "Powered by PQC Today" attribution badge. Requires explicit agreement with PQC Today.',
    example: 'false',
  },
  {
    field: 'features.showHelpButton',
    type: 'boolean | undefined',
    description: 'true = show a (?) help icon in the top-right nav area linking to helpUrl.',
    example: 'true',
  },
  {
    field: 'features.helpUrl',
    type: 'string | undefined',
    description: 'URL the help button links to. Required when showHelpButton is true.',
    example: 'https://support.example.com/pqc',
  },
  {
    field: 'features.assistantTitle',
    type: 'string | undefined',
    description:
      'Custom heading shown at the top of the PQC Assistant drawer. Defaults to "PQC Assistant".',
    example: 'Acme Security Advisor',
  },
  {
    field: 'features.assistantMaxWidth',
    type: 'string | undefined',
    description: 'Max-width of the assistant panel. Defaults to "400px".',
    example: '480px',
  },
]

// ---------------------------------------------------------------------------
// Assemble and write
// ---------------------------------------------------------------------------

const docs: EmbedDocs = {
  version: appVersion,
  generatedAt: new Date().toISOString(),
  postMessageProtocol: {
    appToParent: APP_TO_PARENT,
    parentToApp: PARENT_TO_APP,
  },
  urlParams: URL_PARAMS,
  errorCodes: ERROR_CODES,
  vendorTheme: VENDOR_THEME,
  vendorPolicy: {
    routes: VENDOR_POLICY_ROUTES,
    content: VENDOR_POLICY_CONTENT,
    session: VENDOR_POLICY_SESSION,
    features: VENDOR_POLICY_FEATURES,
  },
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(docs, null, 2) + '\n')
console.log(`✓ embed-docs.json written (v${appVersion}) → ${OUT_PATH}`)
