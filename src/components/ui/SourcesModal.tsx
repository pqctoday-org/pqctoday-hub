import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import {
  getSourcesForView,
  type ViewType,
  type AuthoritativeSource,
} from '../../data/authoritativeSourcesData'

interface SourcesModalProps {
  isOpen: boolean
  onClose: () => void
  viewType: ViewType
}

const regionColors: Record<AuthoritativeSource['region'], string> = {
  Americas: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  EMEA: 'bg-green-500/20 text-green-400 border-green-500/50',
  APAC: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  Global: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
}

export const SourcesModal = ({ isOpen, onClose, viewType }: SourcesModalProps) => {
  const sources = useMemo(() => getSourcesForView(viewType), [viewType])

  // Group sources by type
  const groupedSources = useMemo(() => {
    const groups: Record<string, AuthoritativeSource[]> = {
      Government: [],
      Academic: [],
      'Industry Workgroup': [],
    }

    sources.forEach((source) => {
      groups[source.sourceType].push(source)
    })

    return groups
  }, [sources])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Authoritative Sources</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sources referenced for {viewType} data
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sources grouped by type */}
              <div className="space-y-6">
                {Object.entries(groupedSources).map(([type, typeSources]) => {
                  if (typeSources.length === 0) return null

                  return (
                    <div key={type}>
                      <h3 className="text-lg font-semibold mb-3 text-primary">{type}</h3>
                      <div className="grid gap-3">
                        {typeSources.map((source, idx) => (
                          <div
                            key={idx}
                            className="glass-panel p-4 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <a
                                  href={source.primaryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-foreground hover:text-primary font-medium inline-flex items-center gap-2 group"
                                >
                                  {source.sourceName}
                                  <ExternalLink
                                    size={14}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </a>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {source.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span
                                  className={clsx(
                                    'text-xs px-2 py-1 rounded border font-medium whitespace-nowrap',
                                    regionColors[source.region]
                                  )}
                                >
                                  {source.region}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Verified: {source.lastVerifiedDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">Total sources: {sources.length}</p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
