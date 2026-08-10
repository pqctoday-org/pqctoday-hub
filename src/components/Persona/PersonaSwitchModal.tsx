// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- every bracket access below is keyed by a
   typed union (Region / PersonaId) or a value drawn from AVAILABLE_INDUSTRIES itself, never
   free-form user input; RegionIndustryPill.tsx (folded into this modal) used the same
   file-level suppression for the identical pattern. */
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
  Globe,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import { PERSONAS } from '@/data/learningPersonas'
import { personaTradeSentence, describePersonaAdaptation } from '@/data/personaConfig'
import type { PersonaId } from '@/data/learningPersonas'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { Region } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import {
  PERSONA_TIMELINE_REGION,
  PERSONA_THREATS_DEFAULT_INDUSTRIES,
  REGION_COUNTRIES_MAP,
} from '@/data/personaConfig'
import { REGIONS, INDUSTRY_ICONS } from '@/data/regionIndustryOptions'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { logPersonaSelected, logRegionSelected, logIndustrySelected } from '@/utils/analytics'

const REGION_ITEMS: FilterDropdownItem[] = REGIONS.map((r) => ({
  id: r.id,
  label: r.label,
  icon: <r.Icon size={14} aria-hidden="true" />,
}))

const INDUSTRY_ITEMS: FilterDropdownItem[] = AVAILABLE_INDUSTRIES.map((industry) => {
  const Icon = INDUSTRY_ICONS[industry] ?? Layers
  return { id: industry, label: industry, icon: <Icon size={14} aria-hidden="true" /> }
})

const PERSONA_ICONS = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
} as const

const PERSONA_ORDER: PersonaId[] = [
  'curious',
  'executive',
  'developer',
  'architect',
  'ops',
  'researcher',
]

interface Props {
  onClose: () => void
}

export const PersonaSwitchModal: React.FC<Props> = ({ onClose }) => {
  const {
    selectedPersona,
    setPersona,
    selectedRegion,
    selectedIndustries,
    setRegion,
    setIndustries,
  } = usePersonaStore()
  const {
    setCountry,
    setIndustry: setAssessIndustry,
    assessmentStatus,
    editFromStep,
  } = useAssessmentStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Region/industry, folded into this same modal (2026-08-01 follow-up:
  // "merge the persona filtering in one drop down") — was a separate
  // RegionIndustryPill trigger/popover; same "unset" heuristic and handlers,
  // just rendered here instead. See that file's history for the flagged
  // hasCustomizedRegion/hasCustomizedIndustries limitation (unchanged).
  const hasCustomRegion = selectedRegion !== null && selectedRegion !== 'global'
  const hasCustomIndustries = selectedIndustries.length > 0
  const effectiveRegion: Region | 'All' = hasCustomRegion
    ? selectedRegion
    : selectedPersona
      ? PERSONA_TIMELINE_REGION[selectedPersona]
      : 'global'
  const effectiveIndustries: string[] = hasCustomIndustries
    ? selectedIndustries
    : selectedPersona
      ? PERSONA_THREATS_DEFAULT_INDUSTRIES[selectedPersona]
      : []

  const handleRegionSelect = (id: string) => {
    const region: Region = id === 'All' ? 'global' : (id as Region)
    setRegion(region)
    setCountry(REGION_COUNTRIES_MAP[region]?.[0] ?? '')
    logRegionSelected(region)
    if (assessmentStatus === 'complete') editFromStep(0)
  }

  const handleIndustrySelect = (id: string) => {
    const industries = id === 'All' ? [] : [id]
    setIndustries(industries)
    setAssessIndustry(industries[0] ?? '')
    if (industries[0]) logIndustrySelected(industries[0])
    if (assessmentStatus === 'complete') editFromStep(0)
  }

  // Trap focus within modal
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    containerRef.current?.focus()
    return () => {
      prev?.focus()
    }
  }, [])

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // B+ remediation 1.2 (2026-08-10). "Choosing a role shrinks the navigation,
  // and the shrink is never explained at the moment of choosing — the reward
  // for telling the hub who you are is fewer doors." `previewId` is whichever
  // tile the pointer or keyboard focus is on; falling back to the active role
  // means the panel is never empty, so the trade is legible before any click.
  const [previewId, setPreviewId] = useState<PersonaId | null>(null)
  const shownId = previewId ?? selectedPersona
  const shownAdaptation = shownId ? describePersonaAdaptation(shownId) : null

  const handleSelect = (id: PersonaId) => {
    if (id !== selectedPersona) {
      setPersona(id)
      logPersonaSelected(id, 'switch')
    }
    onClose()
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-overlay bg-black/60" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-switch-title"
        tabIndex={-1}
        className="fixed inset-0 z-overlay flex items-center justify-center p-4 pointer-events-none outline-none"
      >
        <div className="glass-panel rounded-2xl p-6 w-full max-w-lg shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 id="persona-switch-title" className="text-base font-semibold text-foreground">
                Switch your role
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Content and navigation adapt to your selection
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERSONA_ORDER.map((id) => {
              const persona = PERSONAS[id]
              const Icon = PERSONA_ICONS[persona.icon]
              const isActive = selectedPersona === id

              return (
                <Button
                  key={id}
                  variant="ghost"
                  size="tile"
                  onClick={() => handleSelect(id)}
                  className={`min-h-[76px] gap-1 rounded-xl border transition-colors ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border bg-card/60 hover:border-primary/30 hover:bg-card text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isActive}
                  // Guided-workshop anchor. Keeps the `persona-role-` prefix the
                  // retired wizard used, so the workshop's role cues still select
                  // the active tile via [data-workshop-target^="persona-role-"].
                  data-workshop-target={`persona-role-${id}`}
                  onMouseEnter={() => setPreviewId(id)}
                  onMouseLeave={() => setPreviewId(null)}
                  onFocus={() => setPreviewId(id)}
                  onBlur={() => setPreviewId(null)}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-primary' : 'text-muted-foreground'}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {persona.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {persona.subtitle}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* What this role changes — stated at selection time, not discovered
              later. Every line below is DERIVED from personaConfig
              (`describePersonaAdaptation`), so it cannot drift from the gating
              it describes. `aria-live` announces it as the reader moves across
              the tiles with a keyboard. */}
          {shownId && shownAdaptation && (
            <div
              className="mt-4 rounded-xl border border-border bg-muted/20 p-3"
              aria-live="polite"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{PERSONAS[shownId].label}:</span>{' '}
                {personaTradeSentence(shownId)}
              </p>
              {shownAdaptation.reportOpenLabels.length > 0 && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Your report opens on {shownAdaptation.reportOpenLabels.slice(0, 3).join(', ')}
                  {shownAdaptation.reportOpenLabels.length > 3
                    ? ` and ${shownAdaptation.reportOpenLabels.length - 3} more`
                    : ''}
                  ; Algorithms lands on the {shownAdaptation.algorithmsLanding.tab} view.
                </p>
              )}
              {/* The single worst cell driver on this feature: curious drops
                  into preview access with no announcement at all. Say it, and
                  say what completes it. */}
              {shownId === 'curious' && (
                <p className="mt-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-[11px] leading-relaxed text-foreground">
                  This role starts in <strong>preview</strong>: the deep technical views open in a
                  simplified form until you finish the assessment, which is what unlocks the full
                  bench. Nothing is hidden from you — it is labelled where it applies.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3">
            <div data-workshop-target="persona-region-select">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Region
              </p>
              <FilterDropdown
                items={REGION_ITEMS}
                selectedId={effectiveRegion}
                onSelect={handleRegionSelect}
                defaultLabel="All regions"
                defaultIcon={<Globe size={14} className="text-primary" />}
                noContainer
                className="w-full"
              />
            </div>
            <div data-workshop-target="persona-industry-select">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Industry
              </p>
              <FilterDropdown
                items={INDUSTRY_ITEMS}
                selectedId={effectiveIndustries[0] ?? 'All'}
                onSelect={handleIndustrySelect}
                defaultLabel="All industries"
                defaultIcon={<Layers size={14} className="text-primary" />}
                noContainer
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
