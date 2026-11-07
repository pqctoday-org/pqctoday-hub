// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useApplicabilityWithPaths } from './useApplicabilityWithPaths'
import { allApplicable } from '../utils/applicabilityEngine'
import { applyLens, getLens, withoutDerivedCap } from '../utils/applicabilityLens'
import { traverseXwalkPaths } from '../utils/trustPathTraversal'
import { conceptXwalkData } from '../data/conceptXwalkData'
import { usePersonaStore } from '../store/usePersonaStore'
import type { PersonaId } from '../data/personaIds'

const profile = { country: 'United States', industry: 'Finance & Banking' }

beforeEach(() => usePersonaStore.setState({ selectedPersona: null }))

describe('derived results and the number the persona cap left out', () => {
  it.each<PersonaId>(['executive', 'architect', 'researcher', 'curious'])(
    '%s: derived results shown plus omitted equal the results found',
    (persona) => {
      usePersonaStore.setState({ selectedPersona: persona })
      const { result } = renderHook(() => useApplicabilityWithPaths(profile))

      const lens = getLens(persona)
      const all = allApplicable(profile)
      const found = traverseXwalkPaths(
        [...applyLens(all, persona).frameworks, ...all.library],
        conceptXwalkData,
        withoutDerivedCap(lens)
      )
      expect(result.current.derivedFrameworks.length + result.current.derivedOmitted).toBe(
        found.length
      )
      expect(result.current.derivedFrameworks).toEqual(
        found.slice(0, lens.trustPathConfig.maxDerivedResults)
      )
      expect(result.current.derivedFrameworks.length).toBeLessThanOrEqual(
        lens.trustPathConfig.maxDerivedResults
      )
    }
  )

  it('omits results for a role whose cap is below what was found', () => {
    usePersonaStore.setState({ selectedPersona: 'researcher' })
    const { result } = renderHook(() => useApplicabilityWithPaths(profile))
    expect(result.current.derivedFrameworks).toHaveLength(
      getLens('researcher').trustPathConfig.maxDerivedResults
    )
    expect(result.current.derivedOmitted).toBeGreaterThan(0)
  })

  it('reports nothing omitted for an empty profile', () => {
    const { result } = renderHook(() =>
      useApplicabilityWithPaths({ country: null, industry: null })
    )
    expect(result.current.derivedFrameworks).toEqual([])
    expect(result.current.derivedOmitted).toBe(0)
  })
})
