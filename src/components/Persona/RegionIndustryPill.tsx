// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- every bracket access below is keyed by a
   typed union (Region / PersonaId) or a value drawn from AVAILABLE_INDUSTRIES itself, never
   free-form user input; PersonalizationSection.tsx (now retired) used the same file-level
   suppression for the identical pattern. */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { Region } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import {
  PERSONA_TIMELINE_REGION,
  PERSONA_THREATS_DEFAULT_INDUSTRIES,
  REGION_COUNTRIES_MAP,
} from '@/data/personaConfig'
import { REGIONS, REGION_LABELS, INDUSTRY_ICONS } from '@/data/regionIndustryOptions'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { logRegionSelected, logIndustrySelected } from '@/utils/analytics'

const REGION_ITEMS: FilterDropdownItem[] = REGIONS.map((r) => ({
  id: r.id,
  label: r.label,
  icon: <r.Icon size={14} aria-hidden="true" />,
}))

const INDUSTRY_ITEMS: FilterDropdownItem[] = AVAILABLE_INDUSTRIES.map((industry) => {
  const Icon = INDUSTRY_ICONS[industry] ?? Layers
  return { id: industry, label: industry, icon: <Icon size={14} aria-hidden="true" /> }
})

/**
 * Top-bar region/industry pill (persona-journeys A-grade redesign, top-bar
 * pill follow-up — 2026-08-01). Replaces the old Track→Role→Region→Industry
 * wizard (`PersonalizationSection.tsx`, retired alongside this build) as the
 * ONLY way to set region/industry: reads and writes the real
 * `usePersonaStore` fields live, instead of only ever displaying each
 * persona's static default.
 *
 * "Unset" heuristic (flagged explicitly — see build report): `selectedRegion`
 * defaults to `'global'` (never `null`) and `selectedIndustries` defaults to
 * `[]` — there is no separate "user touched this" flag in the store. This
 * component therefore treats `selectedRegion === 'global'` (or the legacy
 * `null`, only reachable from data persisted by the old wizard's since-removed
 * toggle-to-clear affordance) and `selectedIndustries.length === 0` as "unset,
 * fall back to the persona's smart default" — which means a user who
 * DELIBERATELY picks "Global" / clears industries back to "All industries"
 * here is indistinguishable from a user who never touched the pill at all, and
 * will see the persona's own default re-assert itself instead. Adding a
 * genuine `hasCustomizedRegion`/`hasCustomizedIndustries` persisted flag would
 * resolve this cleanly but needs its own version bump + migrate() — left as a
 * known limitation rather than expanding this follow-up's scope.
 */
export const RegionIndustryPill = () => {
  const { selectedPersona, selectedRegion, selectedIndustries, setRegion, setIndustries } =
    usePersonaStore()
  const {
    setCountry,
    setIndustry: setAssessIndustry,
    assessmentStatus,
    editFromStep,
  } = useAssessmentStore()

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

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

  const regionLabel = REGION_LABELS[effectiveRegion] ?? effectiveRegion
  const summary =
    effectiveIndustries.length > 0
      ? `${regionLabel} · ${effectiveIndustries.join(', ')}`
      : regionLabel

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

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Region and industry: ${summary} — click to edit`}
        title="Click to change your region and industry"
        className="inline-flex h-auto min-w-0 items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground"
      >
        <span className="truncate max-w-[220px]">{summary}</span>
        <ChevronDown
          size={11}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Edit region and industry"
          className="glass-panel absolute left-0 top-full z-50 mt-2 w-72 space-y-3 p-4 shadow-xl"
        >
          <div>
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
          <div>
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
      )}
    </div>
  )
}
