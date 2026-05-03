// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildUrl, buildStepUrl, isOnStepRoute } from './workshopDeepLink'
import type { WorkshopStep } from '@/types/Workshop'

describe('workshopDeepLink', () => {
  it('returns just the route when no query is provided', () => {
    expect(buildUrl('/timeline')).toBe('/timeline')
  })

  it('encodes query params and skips empty values', () => {
    expect(buildUrl('/threats', { industry: 'FIN', empty: '' })).toBe('/threats?industry=FIN')
  })

  it('encodes special characters', () => {
    expect(buildUrl('/migrate', { vendor: 'Dell & Sons' })).toBe('/migrate?vendor=Dell+%26+Sons')
  })

  it('buildStepUrl forwards step.page', () => {
    const step: WorkshopStep = {
      id: 's',
      chapter: 'foundations',
      title: 't',
      estMinutes: 1,
      whyItMatters: 'w',
      page: { route: '/timeline', query: { country: 'United States' } },
      tasks: ['t1'],
      expectedOutput: 'o',
      narration: 'n',
    }
    expect(buildStepUrl(step)).toBe('/timeline?country=United+States')
  })

  it('isOnStepRoute matches exact and nested routes', () => {
    const step: WorkshopStep = {
      id: 's',
      chapter: 'foundations',
      title: 't',
      estMinutes: 1,
      whyItMatters: 'w',
      page: { route: '/business' },
      tasks: ['t'],
      expectedOutput: 'o',
      narration: 'n',
    }
    expect(isOnStepRoute(step, '/business')).toBe(true)
    expect(isOnStepRoute(step, '/business/governance')).toBe(true)
    expect(isOnStepRoute(step, '/threats')).toBe(false)
  })
})
