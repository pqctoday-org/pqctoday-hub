// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookText, X, Lightbulb } from 'lucide-react'
import { pageManuals, type PageId } from '../../data/userManualData'
import { Button } from '@/components/ui/button'

export const UserManualPanel: React.FC<{
  isOpen: boolean
  onClose: () => void
  pageId: PageId
}> = ({ isOpen, onClose, pageId }) => {
  const manual = pageManuals[pageId]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Page guide"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gradient flex items-center gap-2">
                  <BookText size={22} />
                  {manual.title}
                </h2>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
                  aria-label="Close guide"
                >
                  <X size={20} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{manual.summary}</p>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {manual.sections.map((section) => (
                <div key={section.heading} className="glass-panel p-4">
                  <h3 className="font-semibold text-foreground mb-2">{section.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                </div>
              ))}

              {/* Tips */}
              {manual.tips && manual.tips.length > 0 && (
                <div className="glass-panel p-4 border-primary/20">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb size={16} className="text-primary" />
                    Tips
                  </h3>
                  <ul className="space-y-1.5">
                    {manual.tips.map((tip) => (
                      <li
                        key={tip}
                        className="text-sm text-muted-foreground leading-relaxed flex gap-2"
                      >
                        <span className="text-primary shrink-0">*</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
