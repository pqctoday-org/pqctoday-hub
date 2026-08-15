// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Off the Beaten Path" previously only ever listed Learn modules — a user
 * who explored Patents, or used a Playground tool their persona's milestones
 * never mention, left no trace there even though sectionsVisited and
 * playgroundToolsUsed already held exactly that data (they're read by the
 * achievement system already). This exercises the second reader added in
 * the 2026-08-15 journey-tracking remediation.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useJourneyMap } from './useJourneyMap'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAchievementStore } from '@/store/useAchievementStore'

describe('useJourneyMap — outsidePath sections and tools', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    useAchievementStore.setState({ sectionsVisited: [], playgroundToolsUsed: [] })
  })

  it('surfaces a visited section with no matching milestone', () => {
    // executive's milestones are /assess, /compliance, /business, /migrate —
    // /patents isn't one of them.
    useAchievementStore.setState({ sectionsVisited: ['patents'] })
    const { result } = renderHook(() => useJourneyMap())
    const item = result.current.outsidePath.find((i) => i.id === 'section:patents')
    expect(item).toBeDefined()
    expect(item?.route).toBe('/patents')
    expect(item?.status).toBe('completed')
  })

  it('surfaces a used playground tool with no matching milestone', () => {
    // executive has no /playground milestone at all.
    useAchievementStore.setState({ playgroundToolsUsed: ['openssl-studio'] })
    const { result } = renderHook(() => useJourneyMap())
    const item = result.current.outsidePath.find((i) => i.id === 'tool:openssl-studio')
    expect(item).toBeDefined()
    expect(item?.route).toBe('/playground/openssl-studio')
    expect(item?.label).toBe('OpenSSL Studio')
  })

  it("does not surface a section that is already one of this persona's milestones", () => {
    // /compliance is an executive milestone — the milestone row already
    // covers it, a duplicate off-path row would be redundant.
    useAchievementStore.setState({ sectionsVisited: ['compliance'] })
    const { result } = renderHook(() => useJourneyMap())
    expect(result.current.outsidePath.find((i) => i.id === 'section:compliance')).toBeUndefined()
  })

  it('does not surface the learn section (the module loop already covers it)', () => {
    useAchievementStore.setState({ sectionsVisited: ['learn'] })
    const { result } = renderHook(() => useJourneyMap())
    expect(result.current.outsidePath.find((i) => i.id === 'section:learn')).toBeUndefined()
  })

  it('caps the number of extra off-path entries', () => {
    useAchievementStore.setState({
      sectionsVisited: [
        'patents',
        'explore',
        'revisions',
        'about',
        'library',
        'leaders',
        'report',
        'simulation',
      ],
    })
    const { result } = renderHook(() => useJourneyMap())
    const extraCount = result.current.outsidePath.filter((i) => i.id.startsWith('section:')).length
    expect(extraCount).toBeLessThanOrEqual(6)
  })
})
