// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useState } from 'react'
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
  Landmark,
  GraduationCap,
  Copy,
  Check,
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
  {
    icon: Landmark,
    label: 'Government / Policy',
    detail: 'Driving PQC regulatory mandates, government migration timelines, or policy frameworks',
  },
  {
    icon: GraduationCap,
    label: 'Education / Training',
    detail: 'Creating PQC training programs, courses, workshops, or educational content',
  },
]

const LEADER_TEMPLATE = `**Name:** [Your full name]
**Organization:** [Company / Institution]
**Contribution Type:** [Standards | Product | Research | Advocacy | Government | Education]
**Brief Description:** [1-2 sentences about your PQC contribution]
**Reference URL(s):** [Links to your PQC work — papers, products, standards, etc.]
**LinkedIn or Profile URL:** [Your public profile link]`

const DISCUSSION_NEW_URL = (() => {
  const base = 'https://github.com/pqctoday/pqc-timeline-app/discussions/new'
  const params = new URLSearchParams({
    category: 'i-consent-to-be-added-as-a-pqc-leader',
    title: 'I consent to be added as a PQC Leader',
    body: LEADER_TEMPLATE,
  })
  return `${base}?${params.toString()}`
})()

export function LeaderConsentModal({ isOpen, onClose }: LeaderConsentModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(LEADER_TEMPLATE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50 print:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4 print:hidden pointer-events-none">
        <div
          className="glass-panel bg-card max-w-lg w-full max-h-[85dvh] flex flex-col overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leader-consent-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Award size={20} className="text-primary" />
              </div>
              <h2 id="leader-consent-title" className="text-lg font-bold text-foreground">
                I Consent to Be Added as a PQC Leader
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

            {/* Copyable template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Your Leader Profile</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-status-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy template
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-3 whitespace-pre-wrap leading-relaxed select-all">
                {LEADER_TEMPLATE}
              </pre>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Copy the template above, then submit it through one of these channels:
            </p>

            <div className="space-y-2">
              <a
                href={DISCUSSION_NEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
              >
                <MessageSquare size={18} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    GitHub Discussions &mdash; I Consent to Be Added
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Post your leader profile for community review
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
                By requesting to be listed, you provide written consent to be referenced as a PQC
                leader on this platform.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 shrink-0 border-t border-border/50">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
