// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Wifi, X } from 'lucide-react'
import { useConnectivityMonitor } from '@/hooks/useConnectivityMonitor'
import { useAirplaneModeStore } from '@/store/useAirplaneModeStore'
import { revalidateDataCache } from '@/utils/cacheRevalidation'
import { Button } from '@/components/ui/button'
import { useIsEmbedded } from '@/embed/EmbedProvider'

export function AirplaneModeToast() {
  const isEmbedded = useIsEmbedded()
  const [toast, setToast] = useState<{
    message: string
    icon: 'plane' | 'wifi'
    action?: { label: string; onClick: () => void }
  } | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setEnabled = useAirplaneModeStore((s) => s.setEnabled)

  const showToast = useCallback(
    (message: string, icon: 'plane' | 'wifi', action?: { label: string; onClick: () => void }) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setToast({ message, icon, action })
      timerRef.current = setTimeout(() => setToast(null), 5000)
    },
    []
  )

  const handleOffline = useCallback(() => {
    showToast("You're offline — Airplane Mode activated", 'plane')
  }, [showToast])

  const handleOnline = useCallback(
    (wasManual: boolean) => {
      if (wasManual) {
        showToast('Connection available — tap to exit Airplane Mode', 'wifi', {
          label: 'Go Online',
          onClick: () => {
            setEnabled(false)
            setToast(null)
            revalidateDataCache()
          },
        })
      } else {
        showToast('Back online — Airplane Mode deactivated', 'wifi')
        revalidateDataCache()
      }
    },
    [showToast, setEnabled]
  )

  useConnectivityMonitor(handleOffline, handleOnline)

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          role="status"
          aria-live="polite"
          className={`${isEmbedded ? 'absolute' : 'fixed'} bottom-20 left-1/2 -translate-x-1/2 z-airplane-toast print:hidden`}
        >
          <div className="glass-panel rounded-xl px-4 py-3 shadow-lg border border-border flex items-center gap-3 max-w-sm">
            {toast.icon === 'plane' ? (
              <Plane size={18} className="text-primary shrink-0" />
            ) : (
              <Wifi size={18} className="text-status-success shrink-0" />
            )}
            <span className="text-sm text-foreground">{toast.message}</span>
            {toast.action && (
              <Button
                variant="ghost"
                type="button"
                onClick={toast.action.onClick}
                className="text-xs font-medium text-primary hover:underline whitespace-nowrap shrink-0"
              >
                {toast.action.label}
              </Button>
            )}
            <Button
              variant="ghost"
              type="button"
              onClick={() => setToast(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
