// SPDX-License-Identifier: GPL-3.0-only

/**
 * Embed mode state singleton.
 *
 * Set once during app bootstrap (before React mount) and read by
 * the EmbedProvider. Stored in module scope — never in localStorage.
 *
 * See PRD §7.2 for the EmbedConfig interface.
 */

import type { VendorPolicy } from './vendorPolicy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmbedConfig {
  isEmbedded: true
  vendorId: string
  vendorName: string
  userId: string
  kid: string
  nonce: string
  expiresAt: number
  allowedRoutes: string[]
  persistMode: 'api' | 'postMessage' | 'none'
  apiBase?: string
  theme?: 'dark' | 'light'
  persona?: string
  allowedOrigins: string[]
  /** Full vendor access policy from the certificate */
  policy: VendorPolicy
  /** Restricted module IDs; undefined = all modules in preset are allowed */
  allowedModules?: string[]
  /** Restricted tool IDs; undefined = all tools in preset are allowed */
  allowedTools?: string[]
  /** Personas allowed by cert; undefined = all personas permitted */
  allowedPersonas?: string[]
  /** Regions allowed by cert; undefined = all regions permitted */
  allowedRegions?: string[]
  /** Industries allowed by cert; undefined = all industries permitted */
  allowedIndustries?: string[]
  isTestMode?: boolean
}

export type EmbedState = { isEmbedded: false } | EmbedConfig

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

let state: EmbedState = { isEmbedded: false }

/** Get the current embed state. */
export function getEmbedState(): EmbedState {
  return state
}

/** Set the embed state. Called once from main.tsx after successful verification. */
export function setEmbedState(config: EmbedConfig): void {
  state = config
}

/** Convenience check — avoids importing the full state for simple guards. */
export function isEmbedded(): boolean {
  return state.isEmbedded
}
