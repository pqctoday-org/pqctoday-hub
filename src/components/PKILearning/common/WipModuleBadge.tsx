// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import { Wrench, CheckCircle2, Clock, X, MessageSquare } from 'lucide-react'
import { EndorseButton } from '../../ui/EndorseButton'
import { FlagButton } from '../../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl, buildDiscussionSearchUrl } from '@/utils/endorsement'

interface WipModuleBadgeProps {
  moduleMeta: {
    id: string
    title: string
    duration: string
    difficulty?: string
    description: string
  }
}

export const WipModuleBadge: React.FC<WipModuleBadgeProps> = ({ moduleMeta }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const endorseUrl = buildEndorsementUrl({
    category: 'learn-module-endorsement',
    title: `Endorse: ${moduleMeta.title}`,
    resourceType: 'Learn Module',
    resourceId: moduleMeta.title,
    resourceDetails: [
      `**Module:** ${moduleMeta.title}`,
      `**Duration:** ${moduleMeta.duration}`,
      `**Difficulty:** ${moduleMeta.difficulty ?? 'N/A'}`,
      `**Description:** ${moduleMeta.description}`,
    ].join('\n'),
    pageUrl: `/learn/${moduleMeta.id}`,
  })

  const flagUrl = buildFlagUrl({
    category: 'learn-module-endorsement',
    title: `Flag: ${moduleMeta.title}`,
    resourceType: 'Learn Module',
    resourceId: moduleMeta.title,
    resourceDetails: [
      `**Module:** ${moduleMeta.title}`,
      `**Duration:** ${moduleMeta.duration}`,
      `**Difficulty:** ${moduleMeta.difficulty ?? 'N/A'}`,
      `**Description:** ${moduleMeta.description}`,
    ].join('\n'),
    pageUrl: `/learn/${moduleMeta.id}`,
  })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-status-warning/60 rounded-full"
        aria-label="View module review status"
        title="Module review status — click for details"
      >
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-status-warning/40 bg-status-warning/15 text-status-warning animate-pulse-glow cursor-pointer hover:bg-status-warning/25 transition-colors">
          <Wrench size={12} className="animate-bounce-subtle" />
          WIP
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop — click to close */}
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 cursor-default border-0 p-0"
            onClick={() => setOpen(false)}
          />
          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wip-modal-title"
            className="fixed inset-0 flex items-center justify-center z-wip-badge p-4 pointer-events-none"
          >
            <div className="glass-panel p-6 max-w-md w-full space-y-5 pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-status-warning" />
                  <h2 id="wip-modal-title" className="text-base font-bold text-foreground">
                    Module Review Status
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border rounded"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Review checklist */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-status-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Automated cross-check passed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Content verified against source references with automated tooling.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-status-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Manual editorial review complete
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reviewed by the PQC Today team for accuracy and educational quality.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-status-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-status-warning">
                      Peer review in progress
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Community peer review is underway. This module will be tagged as GA once peer
                      review is complete.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Community feedback */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-muted-foreground shrink-0" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Community Feedback
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Help improve this module — endorse it if you find it accurate and valuable, or
                  flag issues for correction. All feedback is public and goes directly to our GitHub
                  Discussions.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <EndorseButton
                    endorseUrl={endorseUrl}
                    resourceLabel={moduleMeta.title}
                    resourceType="Learn Module"
                    variant="text"
                    label="Endorse this module"
                  />
                  <FlagButton
                    flagUrl={flagUrl}
                    resourceLabel={moduleMeta.title}
                    resourceType="Learn Module"
                    variant="text"
                    label="Flag an issue"
                  />
                  <a
                    href={buildDiscussionSearchUrl(moduleMeta.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <MessageSquare size={12} />
                    View discussions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
