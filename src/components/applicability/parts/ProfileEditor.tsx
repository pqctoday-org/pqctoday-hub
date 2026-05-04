// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Info, ExternalLink } from 'lucide-react'
import { FilterDropdown } from '../../common/FilterDropdown'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { timelineData } from '../../../data/timelineData'
import { AVAILABLE_INDUSTRIES } from '../../../hooks/assessmentData'
import type { UserProfile } from '../../../utils/applicabilityEngine'

/**
 * Inline profile editor — shown when the engine reports an empty profile.
 * Lets users set industry + country without leaving the For-You / report /
 * command-center surface they're on. Writes back to `useAssessmentStore`.
 */
export function ProfileEditor({ profile, message }: { profile: UserProfile; message: string }) {
  const { setIndustry, setCountry } = useAssessmentStore()
  const { setRegion } = usePersonaStore()

  const countries = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const ev of timelineData) {
      if (ev.countryName && !seen.has(ev.countryName) && ev.countryName !== 'Global') {
        seen.add(ev.countryName)
        list.push(ev.countryName)
      }
    }
    return list.sort()
  }, [])

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Info size={16} className="text-status-info mt-0.5" aria-hidden="true" />
        <p className="text-sm text-foreground">{message}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-xs font-medium text-muted-foreground mb-1 block">Industry</span>
          <FilterDropdown
            items={[
              { id: '', label: 'Select industry…' },
              ...AVAILABLE_INDUSTRIES.map((i) => ({ id: i, label: i })),
            ]}
            selectedId={profile.industry ?? ''}
            onSelect={(id) => setIndustry(id)}
            defaultLabel="Industry"
            noContainer
            opaque
            className="mb-0 w-full"
          />
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground mb-1 block">Country</span>
          <FilterDropdown
            items={[
              { id: '', label: 'Select country…' },
              ...countries.map((c) => ({ id: c, label: c })),
            ]}
            selectedId={profile.country ?? ''}
            onSelect={(id) => {
              setCountry(id)
              if (id) setRegion(null)
            }}
            defaultLabel="Country"
            noContainer
            opaque
            className="mb-0 w-full"
          />
        </div>
      </div>
      <Link
        to="/assess"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        Or take the full assessment for personalized guidance
        <ExternalLink size={12} aria-hidden="true" />
      </Link>
    </div>
  )
}
