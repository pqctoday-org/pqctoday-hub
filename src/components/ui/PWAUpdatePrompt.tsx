// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'
import { Button } from './button'

export function PWAUpdatePrompt() {
  const [show, setShow] = useState(false)
  const [updateFn, setUpdateFn] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setUpdateFn(() => detail.updateSW)
      setShow(true)
    }
    window.addEventListener('pwa-update-available', handler)
    return () => window.removeEventListener('pwa-update-available', handler)
  }, [])

  const handleUpdate = () => {
    updateFn?.(true)
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] print:hidden"
        >
          <div className="glass-panel rounded-xl px-4 py-3 shadow-lg border border-border flex items-center gap-3 max-w-sm">
            <RefreshCw size={18} className="text-primary shrink-0" />
            <span className="text-sm text-foreground">New version available</span>
            <Button variant="gradient" size="sm" onClick={handleUpdate} className="shrink-0">
              Update
            </Button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss update notification"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
