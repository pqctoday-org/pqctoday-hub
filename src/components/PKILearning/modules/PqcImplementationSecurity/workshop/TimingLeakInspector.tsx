// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, Code2, Info, ShieldAlert, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TIMING_LEAK_PATTERNS } from '../data/implSecurityData'

type ViewMode = 'compare' | 'vulnerable' | 'fixed'

export const TimingLeakInspector: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(TIMING_LEAK_PATTERNS[0].id)
  const [viewMode, setViewMode] = useState<ViewMode>('compare')
  const [reviewedIds, setReviewedIds] = useState<string[]>([])

  const active = TIMING_LEAK_PATTERNS.find((p) => p.id === selectedId) ?? TIMING_LEAK_PATTERNS[0]

  const reviewedCount = TIMING_LEAK_PATTERNS.filter((p) => reviewedIds.includes(p.id)).length
  const isActiveReviewed = reviewedIds.includes(active.id)

  const toggleReviewed = (id: string) => {
    setReviewedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational Code-Pattern Triage:</strong> Inspect four high-impact timing and
          cache side-channel patterns in ML-KEM and ML-DSA. Compare the vulnerable snippet against
          its constant-time fix and note which production verification tools catch regressions in
          compiled binaries.
        </span>
      </div>

      {/* Pattern Selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Select Side-Channel Defect Pattern ({reviewedCount} / {TIMING_LEAK_PATTERNS.length}{' '}
            reviewed)
          </span>
          <div role="group" aria-label="Code comparison view mode" className="flex gap-1.5">
            {(
              [
                { id: 'compare', label: 'Side-by-Side' },
                { id: 'vulnerable', label: 'Vulnerable Only' },
                { id: 'fixed', label: 'Constant-Time Fix' },
              ] as const
            ).map((mode) => (
              <Button
                key={mode.id}
                variant={viewMode === mode.id ? 'gradient' : 'outline'}
                size="sm"
                aria-pressed={viewMode === mode.id}
                onClick={() => setViewMode(mode.id)}
                className="h-7 px-2.5 text-xs"
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        <div
          role="group"
          aria-label="Timing leak pattern selector"
          className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
        >
          {TIMING_LEAK_PATTERNS.map((pattern) => {
            const isSelected = pattern.id === active.id
            const isReviewed = reviewedIds.includes(pattern.id)
            return (
              <Button
                key={pattern.id}
                variant={isSelected ? 'gradient' : 'outline'}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(pattern.id)}
                className="h-auto py-3 px-3.5 text-left justify-start items-start flex-col gap-1 whitespace-normal"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-xs font-bold leading-snug">{pattern.title}</span>
                  {isReviewed && (
                    <CheckCircle2 size={14} className="shrink-0 text-status-success" />
                  )}
                </div>
                <span className="text-[11px] opacity-85">
                  {pattern.algorithm} · {pattern.leakClass} · {pattern.severity}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Active Pattern Detail */}
      <div className="glass-panel p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-status-error/15 text-status-error font-semibold border border-status-error/30">
                {active.severity} · {active.leakClass}
              </span>
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                {active.standardRef}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground">{active.title}</h3>
          </div>

          <Button
            variant={isActiveReviewed ? 'outline' : 'gradient'}
            size="sm"
            aria-pressed={isActiveReviewed}
            onClick={() => toggleReviewed(active.id)}
          >
            <CheckCircle2 size={14} className="mr-1.5" />
            {isActiveReviewed ? 'Reviewed' : 'Mark Reviewed'}
          </Button>
        </div>

        {/* Code Comparison Panels */}
        <div className={`grid grid-cols-1 ${viewMode === 'compare' ? 'lg:grid-cols-2' : ''} gap-4`}>
          {(viewMode === 'compare' || viewMode === 'vulnerable') && (
            <div className="rounded-lg border border-status-error/40 bg-status-error/5 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-status-error/30 bg-status-error/10 flex items-center gap-2 text-xs font-semibold text-status-error">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{active.vulnerableTitle}</span>
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
                <code>{active.vulnerableCode}</code>
              </pre>
            </div>
          )}

          {(viewMode === 'compare' || viewMode === 'fixed') && (
            <div className="rounded-lg border border-status-success/40 bg-status-success/5 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-status-success/30 bg-status-success/10 flex items-center gap-2 text-xs font-semibold text-status-success">
                <Code2 size={14} className="shrink-0" />
                <span>{active.fixedTitle}</span>
              </div>
              <pre className="p-3.5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
                <code>{active.fixedCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Leak Mechanism & Remediation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-status-warning shrink-0" />
              Why This Leaks Secret Key Material
            </h4>
            <p className="text-muted-foreground leading-relaxed">{active.leakMechanism}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <Wrench size={14} className="text-primary shrink-0" />
              Constant-Time Remediation Rule
            </h4>
            <p className="text-muted-foreground leading-relaxed">{active.remediationRule}</p>
          </div>
        </div>

        {/* Verification Tooling & Limitation */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2 text-xs">
          <h4 className="font-semibold text-foreground">
            Production Verification Tooling (Run on Shipping Binaries)
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {active.verificationTooling.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <p className="pt-1.5 border-t border-border/50 text-muted-foreground">
            <strong className="text-foreground">Limitation: </strong>
            {active.limitationNote}
          </p>
        </div>
      </div>
    </div>
  )
}
