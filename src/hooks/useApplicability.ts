// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useAssessmentStore } from '../store/useAssessmentStore'
import { usePersonaStore } from '../store/usePersonaStore'
import { allApplicable, isProfileEmpty, type UserProfile } from '../utils/applicabilityEngine'
import { applyLens, type LensedApplicable } from '../utils/applicabilityLens'

/**
 * One-call wrapper that reads the active user profile from
 * `useAssessmentStore` (industry + country), `usePersonaStore`
 * (region + selectedPersona) and runs the applicability engine across all
 * four content domains, then applies the persona lens (caps + library
 * category filter) so executives see action items and architects see
 * protocols.
 *
 * Consumers can pass an `override` profile to bypass the stores (useful for
 * URL-driven "preview as user X" flows).
 */
export interface UseApplicabilityResult extends LensedApplicable {
  profile: UserProfile
  isEmpty: boolean
}

const EMPTY_DROPPED: Record<
  'mandatory' | 'recognized' | 'cross-border' | 'advisory' | 'informational',
  number
> = {
  mandatory: 0,
  recognized: 0,
  'cross-border': 0,
  advisory: 0,
  informational: 0,
}

export function useApplicability(override?: Partial<UserProfile>): UseApplicabilityResult {
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)
  const region = usePersonaStore((s) => s.selectedRegion)
  const persona = usePersonaStore((s) => s.selectedPersona)

  return useMemo<UseApplicabilityResult>(() => {
    const profile: UserProfile = {
      industry: override?.industry ?? industry ?? null,
      country: override?.country ?? country ?? null,
      region: override?.region ?? region ?? null,
    }
    const empty = isProfileEmpty(profile)
    if (empty) {
      return {
        profile,
        isEmpty: true,
        frameworks: [],
        library: [],
        threats: [],
        timeline: [],
        droppedCounts: {
          frameworks: { ...EMPTY_DROPPED },
          library: { ...EMPTY_DROPPED },
          threats: { ...EMPTY_DROPPED },
          timeline: { ...EMPTY_DROPPED },
        },
        lens: {
          sections: ['frameworks', 'threats', 'library', 'timeline'],
          tierCaps: {},
          framing: '',
        },
      }
    }
    const lensed = applyLens(allApplicable(profile), persona)
    return { profile, isEmpty: false, ...lensed }
  }, [industry, country, region, persona, override?.industry, override?.country, override?.region])
}
