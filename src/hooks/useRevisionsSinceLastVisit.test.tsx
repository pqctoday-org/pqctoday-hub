// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLastVisitStore } from '@/store/useLastVisitStore'

const { revisions } = vi.hoisted(() => ({
  revisions: [
    { merge_sha: 'a', merge_timestamp: '2026-09-18T10:00:00Z', domain: 'compliance' },
    { merge_sha: 'b', merge_timestamp: '2026-09-18T12:00:00Z', domain: 'compliance' },
    { merge_sha: 'c', merge_timestamp: '2026-09-18T13:00:00Z', domain: 'migrate' },
    { merge_sha: 'pending', merge_timestamp: '2026-09-18T14:00:00Z', domain: 'module' },
    { merge_sha: 'd', merge_timestamp: '2026-09-01T00:00:00Z', domain: 'library' },
  ],
}))
vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({ revisions, isLoading: false }),
}))

import { useRevisionsSinceLastVisit } from './useRevisionsSinceLastVisit'

describe('useLastVisitStore.recordVisit', () => {
  beforeEach(() => useLastVisitStore.setState({ previousVisitAt: null, currentVisitAt: null }))

  it('first visit stamps current only; a second visit >30 min later rolls it to previous', () => {
    const { recordVisit } = useLastVisitStore.getState()
    recordVisit(new Date('2026-09-18T09:00:00Z'))
    expect(useLastVisitStore.getState()).toMatchObject({
      previousVisitAt: null,
      currentVisitAt: '2026-09-18T09:00:00.000Z',
    })
    recordVisit(new Date('2026-09-18T09:10:00Z')) // same visit
    expect(useLastVisitStore.getState().previousVisitAt).toBeNull()
    recordVisit(new Date('2026-09-19T09:00:00Z'))
    expect(useLastVisitStore.getState()).toMatchObject({
      previousVisitAt: '2026-09-18T09:00:00.000Z',
      currentVisitAt: '2026-09-19T09:00:00.000Z',
    })
  })
})

describe('useRevisionsSinceLastVisit', () => {
  beforeEach(() => useLastVisitStore.setState({ previousVisitAt: null, currentVisitAt: null }))

  it('returns null on a first visit', () => {
    const { result } = renderHook(() => useRevisionsSinceLastVisit())
    expect(result.current).toBeNull()
  })

  it('counts merged revisions after the previous visit, ignores pending ones, ranks domains', () => {
    useLastVisitStore.setState({
      previousVisitAt: '2026-09-18T11:00:00Z',
      currentVisitAt: new Date().toISOString(),
    })
    const { result } = renderHook(() => useRevisionsSinceLastVisit())
    expect(result.current).toEqual({
      count: 2,
      since: '2026-09-18T11:00:00Z',
      domains: ['Compliance', 'Migrate catalog'],
    })
  })

  it('returns null when nothing merged since', () => {
    useLastVisitStore.setState({
      previousVisitAt: '2026-09-18T20:00:00Z',
      currentVisitAt: new Date().toISOString(),
    })
    const { result } = renderHook(() => useRevisionsSinceLastVisit())
    expect(result.current).toBeNull()
  })
})
