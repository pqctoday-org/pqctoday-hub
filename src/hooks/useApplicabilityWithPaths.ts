// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { useApplicability } from './useApplicability'
import { usePersonaStore } from '../store/usePersonaStore'
import { getLens } from '../utils/applicabilityLens'
import { allApplicable } from '../utils/applicabilityEngine'
import { conceptXwalkData } from '../data/conceptXwalkData'
import { traverseXwalkPaths, type DerivedResult } from '../utils/trustPathTraversal'
import type { UserProfile, ApplicabilityResult } from '../utils/applicabilityEngine'
import type { ComplianceFramework } from '../data/complianceData'
import type { LensedApplicable } from '../utils/applicabilityLens'

export interface UseApplicabilityWithPathsResult extends LensedApplicable {
  profile: UserProfile
  isEmpty: boolean
  /** Derived compliance frameworks reached via IR 8477 trust paths. */
  derivedFrameworks: DerivedResult[]
  /** All framework results including derived, ready for components that only show frameworks. */
  allFrameworks: ApplicabilityResult<ComplianceFramework>[]
}

/**
 * Extends `useApplicability` with IR 8477 trust path traversal.
 *
 * Returns direct applicability results plus `derivedFrameworks` — standards
 * semantically related to directly-matched frameworks via reviewed xwalk edges.
 * Derived results respect the active persona's trustPathConfig (allowed
 * relationship types, confidence threshold, max count, 2-hop for researcher).
 */
export function useApplicabilityWithPaths(
  override?: Partial<UserProfile>
): UseApplicabilityWithPathsResult {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const base = useApplicability(override)

  const derivedFrameworks = useMemo<DerivedResult[]>(() => {
    if (base.isEmpty) return []
    if (conceptXwalkData.length === 0) return []
    const lens = getLens(persona)
    // Use the uncapped engine output as traversal sources — the persona lens caps
    // what's DISPLAYED but must not limit which standards seed the trust path graph.
    // Library items (NIST CSWP 39, FIPS 203, etc.) are the primary xwalk anchors.
    const uncapped = allApplicable(base.profile)
    return traverseXwalkPaths([...base.frameworks, ...uncapped.library], conceptXwalkData, lens)
  }, [base.isEmpty, base.frameworks, base.profile, persona])

  const allFrameworks = useMemo<ApplicabilityResult<ComplianceFramework>[]>(
    () => base.frameworks,
    [base.frameworks]
  )

  return { ...base, derivedFrameworks, allFrameworks }
}
