// SPDX-License-Identifier: GPL-3.0-only
/**
 * The tabs of the interactive Playground lab (/playground/interactive) that a
 * link can open with `?tab=`. Any other value is ignored and the lab opens on
 * the default, Key Store.
 *
 * Kept in a plain module, with no UI imports, so the PQC Assistant can name
 * these exact values in its link grammar without loading the Playground.
 */
export const INTERACTIVE_TAB_IDS = [
  'data',
  'kem_ops',
  'sign_verify',
  'keystore',
  'logs',
  'symmetric',
  'hashing',
] as const

export type InteractiveTabId = (typeof INTERACTIVE_TAB_IDS)[number]

/** The tab the lab opens on when `?tab=` is absent or not one of the above. */
export const DEFAULT_INTERACTIVE_TAB: InteractiveTabId = 'keystore'
