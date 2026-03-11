// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useAirplaneModeStore } from '@/store/useAirplaneModeStore'

/**
 * Monitors browser connectivity and auto-toggles Airplane Mode.
 *
 * - When connectivity drops: auto-enables Airplane Mode (isManual = false)
 * - When connectivity returns:
 *   - If auto-activated (isManual = false): auto-disables
 *   - If user-toggled (isManual = true): stays on, shows nudge
 *
 * Mount once in MainLayout.
 */
export function useConnectivityMonitor(
  onOffline?: () => void,
  onOnline?: (wasManual: boolean) => void
) {
  const setEnabled = useAirplaneModeStore((s) => s.setEnabled)

  useEffect(() => {
    const handleOffline = () => {
      const { isEnabled } = useAirplaneModeStore.getState()
      if (!isEnabled) {
        setEnabled(true, false) // auto-activate, not manual
      }
      onOffline?.()
    }

    const handleOnline = () => {
      const { isEnabled, isManual } = useAirplaneModeStore.getState()
      if (isEnabled && !isManual) {
        setEnabled(false) // auto-deactivate
      }
      onOnline?.(isManual)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Sync initial state if browser is already offline
    if (!navigator.onLine) {
      const { isEnabled } = useAirplaneModeStore.getState()
      if (!isEnabled) {
        setEnabled(true, false)
        onOffline?.()
      }
    }

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [setEnabled, onOffline, onOnline])
}
