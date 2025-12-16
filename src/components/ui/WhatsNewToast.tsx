import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVersionStore, getCurrentVersion } from '../../store/useVersionStore'
import { useState, useEffect } from 'react'

export const WhatsNewToast = () => {
  const { hasSeenCurrentVersion, markVersionSeen } = useVersionStore()
  const [isVisible, setIsVisible] = useState(false)
  const version = getCurrentVersion()

  useEffect(() => {
    // Small delay to avoid flash on initial load
    const timer = setTimeout(() => {
      if (!hasSeenCurrentVersion()) {
        setIsVisible(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [hasSeenCurrentVersion])

  const handleDismiss = () => {
    setIsVisible(false)
    markVersionSeen()
  }

  const handleViewChangelog = () => {
    markVersionSeen()
    // Don't hide immediately - let navigation handle it
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm"
          role="alertdialog"
          aria-labelledby="whats-new-title"
          aria-describedby="whats-new-description"
        >
          <div className="glass-panel p-4 border border-primary/30 shadow-lg shadow-primary/10">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/20">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <h3 id="whats-new-title" className="font-bold text-foreground">
                  What's New
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <p id="whats-new-description" className="text-sm text-muted-foreground mb-4">
              See what's new in <span className="font-mono text-primary font-bold">v{version}</span>
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/changelog"
                onClick={handleViewChangelog}
                className="flex-1 text-center px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors border border-primary/30"
              >
                View Changelog
              </Link>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground text-sm transition-colors hover:bg-muted/30"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
