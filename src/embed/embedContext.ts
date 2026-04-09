// SPDX-License-Identifier: GPL-3.0-only

/**
 * Embed mode state singleton.
 *
 * Set once during app bootstrap (before React mount) and read by
 * the EmbedProvider. Stored in module scope — never in localStorage.
 *
 * See PRD §7.2 for the EmbedConfig interface.
 */

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
  allowedRegions: string[]
  allowedIndustries: string[]
  allowedRoles: string[]
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
