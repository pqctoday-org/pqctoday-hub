// SPDX-License-Identifier: GPL-3.0-only
/**
 * Behavioural embed test (WP5.7, local-only) — moves the "headless, no hard
 * navigation" side of the embed contract (embedContract.ts:19-25) from a
 * doc comment into a test. Renders every SIM_REFERENCE_EMBEDS widget — the
 * registry itself, not a hand-picked subset — and asserts:
 *
 *  - headless: no PageHeader (its distinctive `<h1>` never renders when a view
 *    is embedded — every widget here passes `simEmbed` to hide it).
 *  - no hard navigation: a widget MAY legitimately render internal
 *    cross-reference anchors (compliance-cert-check's records view links out
 *    to library/timeline citations, for example) — the contract isn't "no
 *    such link exists", it's "clicking one can't navigate the player away".
 *    Reproduces SimulationView's real embed-pane onClickCapture guard (same
 *    `isBlockedEmbedHref` predicate the production handler uses — see
 *    embedContract.ts) and asserts every found internal anchor's click gets
 *    prevented.
 *
 * NOT covered here: the Mark-complete affordance. That's provided externally
 * by SimulationView's embed chrome, unconditionally for ANY `referenceEmbed`
 * (see the `if (referenceEmbed) { done = refDone(...); onMark = ... }` branch)
 * — not per-widget, so there is no per-widget behavior to assert. What IS
 * per-widget — that a refId is actually reachable through the registry at
 * all — is already guarded by referenceEmbeds.test.ts's drift check against
 * REFERENCE_EMBED_IDS.
 *
 * Local-only: several of these widgets are genuinely heavy to mount (full
 * compliance/library/report data + RAG-adjacent init), too slow to want in
 * every CI run of the main suite.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SIM_REFERENCE_EMBEDS } from './referenceEmbeds'
import { isBlockedEmbedHref } from './embedContract'

// MigrateWorkbenchEmbed → MigrateView pulls in semantic search — keep it idle,
// same mock embedWidgets.smoke.test.tsx uses for the same component.
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

/** Reproduces SimulationView's embed-pane onClickCapture guard exactly. */
const guardedClick = (e: React.MouseEvent) => {
  const a = (e.target as HTMLElement).closest?.('a[href]')
  if (isBlockedEmbedHref(a?.getAttribute('href'))) e.preventDefault()
}

describe('SIM_REFERENCE_EMBEDS — behavioural contract (headless, no hard navigation)', () => {
  for (const [refId, spec] of Object.entries(SIM_REFERENCE_EMBEDS)) {
    it(`${refId}: renders headless; every internal anchor's click is blocked`, () => {
      const Component = spec.Component
      render(
        <MemoryRouter initialEntries={['/simulation']}>
          <div onClickCapture={guardedClick}>
            <Component />
          </div>
        </MemoryRouter>
      )

      // Headless: PageHeader's own <h1> must never appear once simEmbed hides it.
      expect(document.querySelectorAll('h1')).toHaveLength(0)

      // No hard navigation: every internal anchor's click must be prevented.
      const internalAnchors = [...document.querySelectorAll('a[href]')].filter((a) =>
        isBlockedEmbedHref(a.getAttribute('href'))
      )
      for (const a of internalAnchors) {
        const event = fireEvent.click(a)
        expect(
          event,
          `${refId}: click on internal anchor "${a.getAttribute('href')}" was NOT prevented`
        ).toBe(false) // fireEvent.click returns false when preventDefault() was called
      }
    })
  }
})
