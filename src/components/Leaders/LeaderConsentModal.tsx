// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import {
  X,
  Award,
  ExternalLink,
  MessageSquare,
  Linkedin,
  BookOpen,
  Cpu,
  Megaphone,
  Package,
} from 'lucide-react'

interface LeaderConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

const LEADER_CRITERIA = [
  {
    icon: BookOpen,
    label: 'Standards contributions',
    detail: 'Author or contributor to PQC standards (NIST, IETF, ISO, ETSI, etc.)',
  },
  {
    icon: Package,
    label: 'Product development',
    detail: 'Building or shipping PQC-enabled products or services',
  },
  {
    icon: Cpu,
    label: 'Algorithm research',
    detail: 'Inventor or researcher of post-quantum cryptographic algorithms',
  },
  {
    icon: Megaphone,
    label: 'PQC advocacy',
    detail: 'Leading a PQC advocacy group, community, or educational initiative',
  },
]

export function LeaderConsentModal({ isOpen, onClose }: LeaderConsentModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 print:hidden"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel bg-card max-w-lg w-full max-h-[85dvh] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="leader-consent-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Award size={20} className="text-primary" />
                  </div>
                  <h2 id="leader-consent-title" className="text-lg font-bold text-foreground">
                    Be Referenced as a PQC Leader
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We feature individuals and organizations who are actively driving the post-quantum
                  cryptography transition. Leaders are included{' '}
                  <span className="font-medium text-foreground">only with written consent</span>.
                </p>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    You qualify as a PQC leader if you are:
                  </p>
                  <div className="space-y-3">
                    {LEADER_CRITERIA.map((c) => (
                      <div key={c.label} className="flex items-start gap-3">
                        <c.icon size={16} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-foreground">{c.label}</span>
                          <p className="text-xs text-muted-foreground">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you&rsquo;d like to be featured, please reach out through one of these
                  channels:
                </p>

                <div className="space-y-2">
                  <a
                    href="https://github.com/pqctoday/pqc-timeline-app/discussions/116"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                  >
                    <MessageSquare size={18} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        GitHub Discussions &mdash; Add a Leader
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Post your request publicly for community visibility
                      </p>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-muted-foreground shrink-0 group-hover:text-primary"
                    />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/eric-amador-971850a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                  >
                    <Linkedin size={18} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        LinkedIn &mdash; Eric Amador
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Send a private message with your details
                      </p>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-muted-foreground shrink-0 group-hover:text-primary"
                    />
                  </a>
                </div>

                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    By requesting to be listed, you provide written consent to be referenced as a
                    PQC leader on this platform.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-4 shrink-0 border-t border-border/50">
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
