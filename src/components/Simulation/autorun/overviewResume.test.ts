// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { autoRunWalkthroughQueue } from './simAutoRun'
import { overviewResumeIndex, overviewRouteSignature } from './overviewResume'

describe('overview chapter bookmarks', () => {
  const queue = autoRunWalkthroughQueue()
  const bookmark = {
    mode: 'walkthrough',
    phase: 'p4',
    routeSignature: overviewRouteSignature(queue),
  }

  it('restarts the saved chapter at its first resource', () => {
    expect(overviewResumeIndex(bookmark, queue, 'walkthrough')).toBe(
      queue.findIndex((item) => item.phase === 'p4')
    )
  })

  it('does not apply a standard overview position to the deep overview or full journey', () => {
    expect(
      overviewResumeIndex(bookmark, autoRunWalkthroughQueue(true), 'walkthrough-deep')
    ).toBeUndefined()
    expect(overviewResumeIndex(bookmark, queue, 'climb')).toBeUndefined()
  })

  it('requires a restart when the route changes rather than trusting an old index', () => {
    expect(overviewResumeIndex(bookmark, queue.slice(1), 'walkthrough')).toBeUndefined()
    expect(
      overviewResumeIndex({ ...bookmark, phase: 'absent' }, queue, 'walkthrough')
    ).toBeUndefined()
  })

  it.each([null, {}, { mode: 'other' }, { mode: 'walkthrough', phase: 4 }])(
    'ignores malformed persisted bookmarks: %j',
    (value) => {
      expect(overviewResumeIndex(value, queue, 'walkthrough')).toBeUndefined()
    }
  )
})
