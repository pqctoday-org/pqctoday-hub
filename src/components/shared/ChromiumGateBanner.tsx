// SPDX-License-Identifier: GPL-3.0-only
/**
 * ChromiumGateBanner — shown above the VPN / SSH simulator panels when
 * the user's browser isn't recognized as Chromium. Chromium-family
 * visitors see nothing (null render).
 *
 * Sibling API `useChromiumGate()` exposes the same detection so button
 * handlers can be disabled and tooltips surfaced inline.
 */
import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { detectBrowser, type BrowserSupport } from '@/utils/browserDetect'

export const useChromiumGate = (): BrowserSupport => {
  // Memoise so we don't re-parse the UA string on every render. The UA
  // never changes for a given tab lifetime.
  return useMemo(() => detectBrowser(), [])
}

export const ChromiumGateBanner: React.FC<{ feature: string }> = ({ feature }) => {
  const support = useChromiumGate()
  if (support.supported) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        <strong>{feature} requires a Chromium-based browser.</strong>{' '}
        {support.reason ??
          `Detected: ${support.name}. The live handshake buttons below are disabled; open this page in Chrome, Edge, or Brave to run the simulation.`}
      </span>
    </div>
  )
}
