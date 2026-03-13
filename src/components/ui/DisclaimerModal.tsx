// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Construction, ExternalLink, MessageSquare, Linkedin, X } from 'lucide-react'
import { Button } from './button'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'

export function DisclaimerModal() {
  const { hasAcknowledgedCurrentMajor, acknowledgeDisclaimer } = useDisclaimerStore()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isOpen = !hasAcknowledgedCurrentMajor()

  // Auto-focus the button when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the element is mounted
      const timer = setTimeout(() => buttonRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') acknowledgeDisclaimer()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, acknowledgeDisclaimer])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="disclaimer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden"
          onClick={acknowledgeDisclaimer}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.15 }}
            className="glass-panel bg-card max-w-lg w-full max-h-[85dvh] flex flex-col overflow-hidden"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="disclaimer-modal-title"
            aria-describedby="disclaimer-modal-description"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Construction size={20} className="text-primary" />
                </div>
                <h2 id="disclaimer-modal-title" className="text-lg font-bold text-foreground">
                  Welcome to PQC Today
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={acknowledgeDisclaimer}
                aria-label="Close disclaimer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Scrollable content */}
            <div
              id="disclaimer-modal-description"
              className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                PQC Today is a{' '}
                <span className="font-medium text-foreground">
                  community-driven educational platform
                </span>{' '}
                built to help professionals understand and prepare for the post-quantum cryptography
                transition.
              </p>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Please be aware that:</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-1 shrink-0">&#9679;</span>
                    <span>
                      This website has{' '}
                      <span className="font-medium text-foreground">not received endorsement</span>{' '}
                      from the organizations, standards bodies, or government agencies referenced in
                      its content
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-1 shrink-0">&#9679;</span>
                    <span>
                      All information is sourced from{' '}
                      <span className="font-medium text-foreground">
                        publicly available resources
                      </span>{' '}
                      on the internet
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-1 shrink-0">&#9679;</span>
                    <span>
                      Significant effort has gone into ensuring accuracy through{' '}
                      <span className="font-medium text-foreground">
                        thorough automated and manual verification processes
                      </span>
                      , but the content{' '}
                      <span className="font-medium text-foreground">
                        may still contain inaccuracies
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-1 shrink-0">&#9679;</span>
                    <span>
                      We are actively working to{' '}
                      <span className="font-medium text-foreground">
                        collaborate with authoritative organizations and domain experts
                      </span>{' '}
                      to cross-validate and continuously improve the quality of this content
                    </span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Industry leaders featured on this platform are included only with their{' '}
                <span className="font-medium text-foreground">written consent</span>. If you
                represent a cited organization, are a domain expert, or simply want to help improve
                the accuracy of this platform, we welcome your involvement:
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/pqctoday/pqc-timeline-app/discussions/108"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <MessageSquare size={14} />
                  GitHub Discussions
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://www.linkedin.com/in/eric-amador-971850a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Linkedin size={14} />
                  Eric Amador
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 shrink-0 border-t border-border/50">
              <Button
                ref={buttonRef}
                variant="gradient"
                className="w-full"
                onClick={acknowledgeDisclaimer}
              >
                I Understand
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
