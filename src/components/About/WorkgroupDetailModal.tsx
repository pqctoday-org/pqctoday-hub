// SPDX-License-Identifier: GPL-3.0-only
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Calendar, Users } from 'lucide-react'
import { useEffect } from 'react'
import FocusLock from 'react-focus-lock'
import { Button } from '../ui/button'
import type { Workgroup } from './workgroupData'

interface WorkgroupDetailModalProps {
  workgroup: Workgroup | null
  onClose: () => void
}

export function WorkgroupDetailModal({ workgroup, onClose }: WorkgroupDetailModalProps) {
  useEffect(() => {
    if (!workgroup) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [workgroup, onClose])

  return (
    <AnimatePresence>
      {workgroup && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4">
            <FocusLock returnFocus>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-panel bg-card max-w-lg w-full max-h-[85dvh] flex flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="workgroup-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pinned header */}
                <div className="flex items-center justify-between p-4 md:p-5 border-b border-border/50 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {workgroup.regionFlag}
                    </span>
                    <h2
                      id="workgroup-modal-title"
                      className="text-lg font-semibold text-foreground truncate"
                    >
                      {workgroup.shortName}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close"
                    className="shrink-0"
                  >
                    <X size={18} />
                  </Button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-4 md:px-5 py-5 space-y-5">
                  {/* Full name */}
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {workgroup.name}
                  </h3>

                  {/* Region + Founded */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {workgroup.regionFlag} {workgroup.region}
                    </span>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-primary" />
                      Founded {workgroup.founded}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {workgroup.description}
                  </p>

                  {/* Focus Areas */}
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {workgroup.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Key Members */}
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Users size={12} className="text-primary" />
                      Key Members
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {workgroup.keyMembers}
                    </p>
                  </div>

                  {/* Visit Website */}
                  <a
                    href={workgroup.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="outline" size="lg" className="gap-2">
                      <ExternalLink size={14} />
                      Visit Website
                    </Button>
                  </a>
                </div>
              </motion.div>
            </FocusLock>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
