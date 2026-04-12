// SPDX-License-Identifier: GPL-3.0-only
import type { VendorPolicy } from './vendorPolicy'

const FREE_MODULES = [
  'pqc-101',
  'quantum-threats',
  'pqc-business-case',
  'exec-quantum-impact',
  'dev-quantum-impact',
  'arch-quantum-impact',
  'ops-quantum-impact',
  'research-quantum-impact',
  'compliance-strategy',
  'pqc-risk-management',
]

const FREE_TOOLS = [
  'rng-demo',
  'entropy-test',
  'merkle-proof',
  'bitcoin-flow',
  'hd-wallet',
  'roi-calculator',
]

const SHARED_FEATURES: VendorPolicy['features'] = {
  assistantEnabled: false,
  hideNav: true, // Native tab bar replaces embed nav
  hideAbout: false,
  hidePoweredBy: true, // First-party app
  showHelpButton: false,
}

const SHARED_CONTENT: VendorPolicy['content'] = {
  regions: ['global', 'us', 'eu', 'apac', 'latam', 'mena'],
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
}

/**
 * Evaluated lazily at call time — safe because it's only called from the
 * Capacitor boot path, after the native bridge has initialized.
 */
function platformTheme(): VendorPolicy['theme'] {
  const isIOS = window.Capacitor?.getPlatform?.() === 'ios'
  return {
    fontFamily: isIOS
      ? '-apple-system, SF Pro, system-ui, sans-serif'
      : 'Roboto, system-ui, sans-serif',
    radius: isIOS ? '12px' : '8px',
    density: 'normal',
    navLayout: 'top',
    headerHeight: '0px', // Hidden — native handles status bar
    colorMode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  }
}

/** Returns a fresh FREE policy — call at boot time, not at import time. */
export function getFreePolicy(): VendorPolicy {
  return {
    routes: {
      presets: ['learn', 'assess', 'library', 'compliance', 'faq'],
      modules: FREE_MODULES,
      tools: FREE_TOOLS,
    },
    content: { ...SHARED_CONTENT, maxDifficulty: 'intermediate' },
    session: { maxDuration: 86400, persistModes: ['capacitor'] },
    features: SHARED_FEATURES,
    theme: platformTheme(),
  }
}

/** Returns a fresh PRO policy — call at boot time, not at import time. */
export function getProPolicy(): VendorPolicy {
  return {
    routes: { presets: ['all'] },
    content: SHARED_CONTENT,
    session: { maxDuration: 86400, persistModes: ['capacitor'] },
    features: SHARED_FEATURES,
    theme: platformTheme(),
  }
}
