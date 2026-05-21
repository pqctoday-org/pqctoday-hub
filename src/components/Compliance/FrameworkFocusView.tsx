// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Globe, ShieldCheck, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComplianceFramework } from '@/data/complianceData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { isComplianceFrameworkEmphasized } from '@/data/personaConfig'
import { getComplianceCuriousPreface } from '@/data/complianceCuriousPrefaces'

interface Props {
  /** Frameworks to surface in the rail. Caller pre-filters as needed. */
  frameworks: readonly ComplianceFramework[]
  /** When set, the rail pre-selects this framework on mount. */
  initialFrameworkId?: string
  /** Optional handler the parent can listen on for analytics / URL sync. */
  onSelectFramework?: (fw: ComplianceFramework) => void
  /** Exit handler — restores the parent's grid view. */
  onExit?: () => void
}

/**
 * Compliance "one regulator at a time" view (P11-P1-03).
 *
 * Renders applicable frameworks as a left-rail list with a right-pane detail
 * panel showing the active framework. Density-relief for the Frameworks tab
 * when a user wants to focus instead of scan. Toggle-on / toggle-off
 * controlled by the parent — this component is purely the rendered layout.
 */
export const FrameworkFocusView: React.FC<Props> = ({
  frameworks,
  initialFrameworkId,
  onSelectFramework,
  onExit,
}) => {
  const sorted = useMemo(() => sortFrameworks(frameworks), [frameworks])
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (initialFrameworkId && sorted.some((f) => f.id === initialFrameworkId)) {
      return initialFrameworkId
    }
    return sorted[0]?.id ?? null
  })

  // Re-sync if the parent passes a different initial id after mount.
  useEffect(() => {
    if (initialFrameworkId && initialFrameworkId !== selectedId) {
      if (sorted.some((f) => f.id === initialFrameworkId)) {
        setSelectedId(initialFrameworkId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFrameworkId])

  const selected = sorted.find((f) => f.id === selectedId) ?? null
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const curiousPreface =
    selected && selectedPersona === 'curious' ? getComplianceCuriousPreface(selected.id) : undefined

  const handleSelect = (fw: ComplianceFramework) => {
    setSelectedId(fw.id)
    onSelectFramework?.(fw)
  }

  if (sorted.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
        No frameworks match the current filters.
      </div>
    )
  }

  return (
    <section
      data-section-id="compliance-framework-focus"
      className="glass-panel border border-border rounded-lg overflow-hidden"
      aria-label="Framework focus view"
    >
      <header className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Focus view</span> · one regulator at a
          time · {sorted.length} framework{sorted.length !== 1 ? 's' : ''}
        </p>
        {onExit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Return to framework grid"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Back to grid
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left rail */}
        <nav className="max-h-[60vh] md:max-h-[600px] overflow-y-auto" aria-label="Frameworks">
          <ul className="py-1">
            {sorted.map((fw) => {
              const isActive = fw.id === selectedId
              const emphasized = isComplianceFrameworkEmphasized(selectedPersona, fw.id)
              return (
                <li key={fw.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSelect(fw)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`w-full justify-start text-left h-auto px-3 py-2 rounded-none border-l-2 whitespace-normal ${
                      isActive
                        ? 'border-l-primary bg-primary/10 text-foreground'
                        : 'border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className="flex items-start gap-1.5 w-full">
                      <ShieldCheck
                        size={12}
                        className={`shrink-0 mt-1 ${
                          fw.pqcRequirement === 'yes'
                            ? 'text-status-success'
                            : fw.pqcRequirement === 'partial' || fw.pqcRequirement === 'expected'
                              ? 'text-status-warning'
                              : 'text-muted-foreground'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold truncate">{fw.label}</span>
                        <span className="block text-[10px] text-muted-foreground truncate">
                          {fw.deadline || 'Ongoing'}
                        </span>
                      </span>
                      {emphasized && (
                        <span
                          className="text-[9px] font-medium text-primary shrink-0"
                          title="Highly relevant to your role"
                        >
                          ★
                        </span>
                      )}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right pane */}
        <article className="p-4 space-y-3 max-h-[60vh] md:max-h-[600px] overflow-y-auto">
          {selected ? (
            <>
              {curiousPreface && (
                <div className="glass-panel border border-primary/30 bg-primary/5 rounded-md p-3 text-sm text-foreground leading-relaxed">
                  {curiousPreface}
                </div>
              )}

              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{selected.label}</h3>
                  <p className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    {selected.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} aria-hidden="true" />
                        {selected.deadline}
                      </span>
                    )}
                    {selected.countries.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Globe size={11} aria-hidden="true" />
                        {selected.countries.slice(0, 3).join(', ')}
                        {selected.countries.length > 3 ? ` +${selected.countries.length - 3}` : ''}
                      </span>
                    )}
                  </p>
                </div>
                {selected.website && (
                  <a
                    href={selected.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
                  >
                    Source
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
                {selected.notes && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {selected.notes}
                  </p>
                )}
              </div>

              {selected.industries.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Industries
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.industries.map((ind) => (
                      <span
                        key={ind}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a framework to see details.</p>
          )}
        </article>
      </div>
    </section>
  )
}

function sortFrameworks(items: readonly ComplianceFramework[]): ComplianceFramework[] {
  return [...items].sort((a, b) => {
    // Frameworks with PQC requirement first
    const aRank = a.pqcRequirement === 'yes' ? 0 : a.pqcRequirement === 'partial' ? 1 : 2
    const bRank = b.pqcRequirement === 'yes' ? 0 : b.pqcRequirement === 'partial' ? 1 : 2
    if (aRank !== bRank) return aRank - bRank
    return a.label.localeCompare(b.label)
  })
}
