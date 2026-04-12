// SPDX-License-Identifier: GPL-3.0-only
import type { EmbedConfig } from './embedContext'
import { getFreePolicy, getProPolicy } from './nativePolicies'

/**
 * Build the EmbedConfig for native (Capacitor) context.
 * No URL signature needed — the app binary IS the trusted context.
 *
 * Async because reading userId from Capacitor Preferences is async.
 * Only called from the `platform === 'capacitor'` boot path in main.tsx.
 */
export async function loadNativeEmbedConfig(isPro: boolean = false): Promise<EmbedConfig> {
  // Lazy-import Capacitor Preferences only in native context
  const { Preferences } = await import(/* @vite-ignore */ '@capacitor/preferences')

  // Read or generate persistent userId
  let userId: string
  const stored = await Preferences.get({ key: 'pqc-user-id' })
  if (stored.value) {
    userId = stored.value
  } else {
    userId = crypto.randomUUID()
    await Preferences.set({ key: 'pqc-user-id', value: userId })
  }

  const platformName = window.Capacitor?.getPlatform?.() ?? 'web'

  return {
    isEmbedded: true,
    vendorId: 'pqctoday-mobile',
    vendorName: 'PQC Today',
    userId,
    kid: 'mobile-v1',
    nonce: crypto.randomUUID(),
    expiresAt: Infinity,
    allowedRoutes: ['/*'],
    persistMode: 'capacitor',
    theme: undefined, // Uses platform-specific theme from policy
    allowedOrigins: platformName === 'ios' ? ['capacitor://localhost'] : ['http://localhost'],
    policy: isPro ? getProPolicy() : getFreePolicy(),
    isTestMode: false,
    platform: 'capacitor',
  }
}
