// SPDX-License-Identifier: GPL-3.0-only
//
// Right-anchored drill-down drawer for any pillar row. Its centrepiece is the
// traceability chain — the page's whole premise made visible: a mandate →
// requires a scheme → which covers algorithms → with live cert evidence.
// Supersedes FrameworkDetailPopover for the redesigned Landscape.

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import { ArrowDown, Globe, ListChecks, Workflow, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework } from '@/data/complianceData'
import { buildDrawerDetail, type PillarId } from './pillarModel'
import { pillClasses, TONES } from './tones'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import {
  buildFrameworkEndorsementUrl,
  buildFrameworkFlagUrl,
} from '@/components/Compliance/complianceEndorsement'

interface ComplianceDetailDrawerProps {
  framework: ComplianceFramework | null
  pillar: PillarId
  onClose: () => void
  /** Footer "Open CSWP.39 crosswalk" — jump to the agility tab for this row. */
  onOpenCswp39?: (refId: string) => void
  /** Footer "Track" — bookmark this framework (My Frameworks). */
  onTrack?: (framework: ComplianceFramework) => void
  isTracked?: boolean
  /** Related & overlapping row click — navigate to another framework drawer by display name. */
  onSelectRelated?: (name: string) => void
}

export function ComplianceDetailDrawer({
  framework,
  pillar,
  onClose,
  onOpenCswp39,
  onTrack,
  isTracked,
  onSelectRelated,
}: ComplianceDetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (framework) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [framework, onClose])

  if (!framework) return null
  const d = buildDrawerDetail(framework, pillar)

  return createPortal(
    <FocusLock returnFocus>
      <div
        className="fixed inset-0 z-50 flex justify-end"
        role="dialog"
        aria-modal="true"
        aria-label={`${d.name} detail`}
      >
        {/* Scrim */}
        <Button
          type="button"
          variant="ghost"
          aria-label="Close detail"
          className="absolute inset-0 h-full w-full rounded-none bg-black/60 hover:bg-black/60"
          onClick={onClose}
        />
        {/* Panel */}
        <div
          ref={panelRef}
          className="relative flex h-full w-[560px] max-w-[94vw] flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {d.pillarLabel}
                </span>
                <span className={pillClasses(d.pqcTone)}>{d.pqcLabel}</span>
              </div>
              <h2 className="text-lg font-bold leading-tight text-foreground">{d.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe size={12} />
                {d.juris}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 shrink-0 border border-input bg-muted/40"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Scroll body */}
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {/* Traceability chain */}
            <section>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Traceability chain
              </h3>
              <div className="flex flex-col items-stretch gap-0">
                {d.chain.map((node, i) => {
                  const tone = TONES[node.tone]
                  return (
                    <div key={`${node.kind}-${i}`}>
                      <div
                        className={`rounded-xl border ${tone.border} ${tone.softBg} border-t-2 p-3`}
                      >
                        <div
                          className={`mb-1 text-[8.5px] font-bold uppercase tracking-wide ${tone.text}`}
                        >
                          {node.kind}
                        </div>
                        <div className="text-sm font-bold leading-tight text-foreground">
                          {node.value}
                        </div>
                        {node.sub && (
                          <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                            {node.sub}
                          </div>
                        )}
                      </div>
                      {i < d.chain.length - 1 && (
                        <div className="flex justify-center py-1 text-muted-foreground">
                          <ArrowDown size={14} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Deadline phases */}
            {d.phases.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Deadline phases
                </h3>
                <ol className="flex items-start justify-between gap-1">
                  {d.phases.map((ph, i) => {
                    const tone =
                      ph.state === 'done' ? 'success' : ph.state === 'active' ? 'warning' : 'muted'
                    // eslint-disable-next-line security/detect-object-injection
                    const dot = TONES[tone]
                    return (
                      <li
                        key={`${ph.year}-${i}`}
                        className="relative flex flex-1 flex-col items-center gap-1.5 text-center"
                      >
                        {i < d.phases.length - 1 && (
                          <span className="absolute left-1/2 top-[5px] h-px w-full bg-border" />
                        )}
                        <span
                          className={`relative z-10 h-2.5 w-2.5 rounded-full ${dot.solidBg} ring-2 ring-background`}
                        />
                        <span
                          className={`font-mono text-[11px] ${ph.state === 'future' ? 'text-muted-foreground' : 'text-foreground'}`}
                        >
                          {ph.year}
                        </span>
                        <span className="text-[10px] leading-tight text-muted-foreground">
                          {ph.label}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}

            {/* What an auditor checks */}
            <section className="rounded-xl border border-status-success/30 bg-status-success/5 p-4">
              <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-status-success">
                <ListChecks size={13} />
                What an auditor checks
              </h3>
              <p className="mb-2.5 text-[11px] text-muted-foreground">{d.dossierFocus}</p>
              <ul className="space-y-1.5">
                {d.dossierItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-sm bg-status-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Related & overlapping */}
            {d.crosswalk.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Related &amp; overlapping
                </h3>
                <div className="space-y-1.5">
                  {d.crosswalk.map((c, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="ghost"
                      onClick={() => onSelectRelated?.(c.name)}
                      className={`h-auto w-full justify-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-left transition-colors${onSelectRelated ? ' cursor-pointer hover:border-primary/40 hover:bg-muted/50' : ' cursor-default'}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONES[c.tone].solidBg}`}
                      />
                      <span className="text-xs font-semibold text-foreground">{c.name}</span>
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
                        {c.note}
                      </span>
                      <ChevronRight
                        size={13}
                        className={`shrink-0 transition-colors${onSelectRelated ? ' text-primary/60' : ' text-muted-foreground'}`}
                      />
                    </Button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-2 gap-y-2 border-t border-border bg-background px-5 py-3">
            <Button
              type="button"
              variant="gradient"
              size="sm"
              className="basis-full sm:basis-auto gap-1.5"
              onClick={() => onOpenCswp39?.(framework.id)}
            >
              <Workflow size={14} />
              Open CSWP.39 crosswalk
            </Button>
            {onTrack && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onTrack(framework)}
                aria-pressed={isTracked}
              >
                {isTracked ? 'Tracked' : 'Track'}
              </Button>
            )}
            <EndorseButton
              endorseUrl={buildFrameworkEndorsementUrl(framework)}
              resourceLabel={framework.label}
              resourceType="Compliance Framework"
            />
            <FlagButton
              flagUrl={buildFrameworkFlagUrl(framework)}
              resourceLabel={framework.label}
              resourceType="Compliance Framework"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </FocusLock>,
    document.body
  )
}
