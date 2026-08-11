// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FAQ_DATA, PERSONA_FAQ_LEAD, personaLeadItems } from './faqData'
import type { PersonaId } from '@/data/learningPersonas'
import { MANIFESTS } from '../PKILearning/manifest/registry'
import { findLibraryItemByRef } from '@/data/libraryData'

// Legacy/short `/learn/<slug>` aliases that resolve outside the manifest-derived
// route set (kept in sync with PKILearningView's own ROUTE_ALIASES + the
// common-ground special path — see manifest/routes.test.ts for the sibling
// conformance check on the router side).
const LEARN_SLUG_ALIASES = ['mls', 'common-ground']
const VALID_LEARN_SLUGS = new Set<string>([...MANIFESTS.map((m) => m.id), ...LEARN_SLUG_ALIASES])

// Non-`/learn` top-level routes the FAQ deep-links into (see App.tsx).
const VALID_TOP_LEVEL_ROUTES = new Set<string>([
  '/learn',
  '/timeline',
  '/algorithms',
  '/library',
  '/playground',
  '/openssl',
  '/threats',
  '/leaders',
  '/compliance',
  '/changelog',
  '/migrate',
  '/about',
  '/assess',
  '/report',
  '/business',
  '/faq',
  '/terms',
  '/editorial-independence',
  '/sponsor',
  '/explore',
  '/patents',
  '/revisions',
  '/simulation',
])

describe('FAQ_DATA deep links', () => {
  const allItems = FAQ_DATA.flatMap((cat) => cat.items)

  it('has questions in every category', () => {
    for (const cat of FAQ_DATA) {
      expect(cat.items.length, `category "${cat.id}" has no questions`).toBeGreaterThan(0)
    }
  })

  it('every /learn/<slug> deep link resolves to a real module manifest', () => {
    for (const item of allItems) {
      if (!item.deepLink.startsWith('/learn/')) continue
      const slug = item.deepLink.slice('/learn/'.length).split('?')[0]
      expect(
        VALID_LEARN_SLUGS.has(slug),
        `dead /learn link "${item.deepLink}" on question "${item.question}"`
      ).toBe(true)
    }
  })

  it('every non-/learn deep link resolves to a real top-level route', () => {
    for (const item of allItems) {
      if (item.deepLink.startsWith('/learn/')) continue
      const path = item.deepLink.split('?')[0]
      expect(
        VALID_TOP_LEVEL_ROUTES.has(path),
        `unknown route "${item.deepLink}" on question "${item.question}"`
      ).toBe(true)
    }
  })

  it('has no dead /library?ref= links against the currently-wired library CSV', () => {
    for (const item of allItems) {
      if (!item.deepLink.startsWith('/library?ref=')) continue
      const ref = new URLSearchParams(item.deepLink.split('?')[1]).get('ref')
      expect(
        ref ? findLibraryItemByRef(ref) : undefined,
        `dead /library?ref= link "${item.deepLink}" on question "${item.question}"`
      ).toBeTruthy()
    }
  })
})

describe('PERSONA_FAQ_LEAD — B+ remediation 4.1', () => {
  const allQuestions = new Set(FAQ_DATA.flatMap((c) => c.items).map((i) => i.question))

  it('every lead question resolves to a real FAQ item, verbatim', () => {
    // This is the constraint that keeps the lead block a REORDERING of the page
    // rather than a second, divergent FAQ that can promise answers the page
    // does not contain.
    for (const [persona, questions] of Object.entries(PERSONA_FAQ_LEAD)) {
      for (const q of questions) {
        expect(allQuestions.has(q), `${persona}: "${q}" is not in FAQ_DATA`).toBe(true)
      }
    }
  })

  it('gives every persona exactly three, and resolves all of them', () => {
    for (const persona of Object.keys(PERSONA_FAQ_LEAD) as PersonaId[]) {
      expect(PERSONA_FAQ_LEAD[persona]).toHaveLength(3)
      expect(personaLeadItems(persona)).toHaveLength(3)
    }
  })

  it('leads with nothing when no role is chosen', () => {
    expect(personaLeadItems(null)).toEqual([])
  })
})
