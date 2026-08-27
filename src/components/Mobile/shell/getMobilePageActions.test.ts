// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getMobilePageActions, pageIdForMobileRoute } from './getMobilePageActions'
import { FAQ_DATA } from '@/components/FAQ/faqData'

describe('getMobilePageActions', () => {
  it("always includes Assistant, Journey, FAQ, Glossary, What's new and About", () => {
    const { actions } = getMobilePageActions('/some-route-with-no-gates')
    const ids = actions.map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining(['assistant', 'journey', 'faq', 'glossary', 'whatsNew', 'about'])
    )
  })

  it('always includes About, even on /about itself — real bug found 2026-08-23: without this, isMobileShell readers had zero nav path to MobileAboutView.tsx', () => {
    const { actions } = getMobilePageActions('/about')
    expect(actions.map((a) => a.id)).toContain('about')
  })

  it('includes Sources for a route with a registered ViewType', () => {
    const { actions, sourcesViewType } = getMobilePageActions('/timeline')
    expect(actions.map((a) => a.id)).toContain('sources')
    expect(sourcesViewType).toBe('Timeline')
  })

  it('omits Sources for /compliance — the ux-standard.md P10 MUST NOT', () => {
    const { actions, sourcesViewType } = getMobilePageActions('/compliance')
    expect(actions.map((a) => a.id)).not.toContain('sources')
    expect(sourcesViewType).toBeUndefined()
  })

  it('omits Sources for a route with no registered ViewType at all', () => {
    const { actions } = getMobilePageActions('/assess')
    expect(actions.map((a) => a.id)).not.toContain('sources')
  })

  // 2026-08-24 audit R4.8: the FAQ row's sub-label used to hardcode "Four
  // real questions" — a stale number that would silently drift from the
  // real FAQ_DATA catalogue every time a question was added or removed.
  it("the FAQ row's sub-label count matches the real FAQ_DATA question count", () => {
    const { actions } = getMobilePageActions('/some-route-with-no-gates')
    const faq = actions.find((a) => a.id === 'faq')!
    const realCount = FAQ_DATA.reduce((sum, cat) => sum + cat.items.length, 0)
    expect(faq.sub).toContain(`${realCount} real questions`)
  })
})

describe('pageIdForMobileRoute', () => {
  it('resolves an exact-path entry', () => {
    expect(pageIdForMobileRoute('/timeline')).toBe('timeline')
  })

  it('resolves a nested route via the prefix fallback', () => {
    expect(pageIdForMobileRoute('/learn/pqc-101')).toBe('learn')
  })

  it('returns undefined for a route with no page id at all', () => {
    expect(pageIdForMobileRoute('/does-not-exist')).toBeUndefined()
  })
})
