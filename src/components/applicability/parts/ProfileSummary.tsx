// SPDX-License-Identifier: GPL-3.0-only
import { Globe } from 'lucide-react'
import { useAssessmentFormStore } from '../../../store/useAssessmentFormStore'
import { FilterDropdown } from '../../common/FilterDropdown'
import type { UserProfile } from '../../../utils/applicabilityEngine'

const COUNTRY_OPTIONS = [
  { id: 'United States', label: 'United States' },
  { id: 'Australia', label: 'Australia' },
  { id: 'Bahrain', label: 'Bahrain' },
  { id: 'Brazil', label: 'Brazil' },
  { id: 'Canada', label: 'Canada' },
  { id: 'Czech Republic', label: 'Czech Republic' },
  { id: 'France', label: 'France' },
  { id: 'Germany', label: 'Germany' },
  { id: 'Hong Kong', label: 'Hong Kong' },
  { id: 'India', label: 'India' },
  { id: 'Israel', label: 'Israel' },
  { id: 'Japan', label: 'Japan' },
  { id: 'Jordan', label: 'Jordan' },
  { id: 'Malaysia', label: 'Malaysia' },
  { id: 'Netherlands', label: 'Netherlands' },
  { id: 'New Zealand', label: 'New Zealand' },
  { id: 'Saudi Arabia', label: 'Saudi Arabia' },
  { id: 'Singapore', label: 'Singapore' },
  { id: 'South Korea', label: 'South Korea' },
  { id: 'Taiwan', label: 'Taiwan' },
  { id: 'United Arab Emirates', label: 'United Arab Emirates' },
  { id: 'United Kingdom', label: 'United Kingdom' },
]

const INDUSTRY_OPTIONS = [
  { id: 'Finance & Banking', label: 'Finance & Banking' },
  { id: 'Government & Defense', label: 'Government & Defense' },
  { id: 'Technology', label: 'Technology' },
  { id: 'Healthcare', label: 'Healthcare' },
  { id: 'Energy & Utilities', label: 'Energy & Utilities' },
  { id: 'Telecommunications', label: 'Telecommunications' },
  { id: 'Aerospace', label: 'Aerospace' },
  { id: 'Automotive', label: 'Automotive' },
  { id: 'Critical Infrastructure', label: 'Critical Infrastructure' },
  { id: 'Education', label: 'Education' },
  { id: 'Retail & E-Commerce', label: 'Retail & E-Commerce' },
]

/**
 * Inline summary of the active profile — shown above the panel/view.
 * When editable, country and industry are live FilterDropdown pickers that
 * write directly to the assessment store (no /assess navigation required).
 */
export function ProfileSummary({ profile, editable }: { profile: UserProfile; editable: boolean }) {
  const setCountry = useAssessmentFormStore((s) => s.setCountry)
  const setIndustry = useAssessmentFormStore((s) => s.setIndustry)

  if (!editable) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-2 text-sm">
        <Globe size={14} className="text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">Showing applicability for:</span>
        <span className="font-medium text-foreground">{profile.industry || 'Any industry'}</span>
        <span className="text-muted-foreground">in</span>
        <span className="font-medium text-foreground">
          {profile.country || (profile.region ? profile.region.toUpperCase() : 'Global')}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-2 text-sm">
      <Globe size={14} className="text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">Showing applicability for:</span>
      <FilterDropdown
        items={INDUSTRY_OPTIONS}
        selectedId={profile.industry ?? ''}
        onSelect={(id) => setIndustry(id)}
        defaultLabel="Any industry"
        size="sm"
      />
      <span className="text-muted-foreground">in</span>
      <FilterDropdown
        items={COUNTRY_OPTIONS}
        selectedId={profile.country ?? ''}
        onSelect={(id) => setCountry(id)}
        defaultLabel="Global"
        size="sm"
        searchable
      />
    </div>
  )
}
