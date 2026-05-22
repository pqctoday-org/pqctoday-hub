// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * Library persona-overwhelm-p0 — end-to-end coverage of the three behaviors
 * shipped in PRs 1–4 that a unit-test mock can't fully validate:
 *
 *   1. Per-persona narrowing actually runs against the real corpus and the
 *      result-count drops below the full total for every narrowing persona,
 *      while researcher sees the full corpus unchanged.
 *
 *   2. The "See all N" escape hatch round-trips: clicking it appends
 *      `?prefs=off` AND the result count expands back to the full total.
 *
 *   3. Curious minimum-viable mode hides the full shell until the user
 *      clicks "Browse the full library", and that interaction sets
 *      `?expand=1` and reveals the sidebar + search input.
 *
 * No assertions on cosmetic UI scaffolding (icons, layout classes, etc.).
 * Each assertion measures a feature-level outcome the user can observe.
 */

const PERSONAS_WITH_NARROWING = ['executive', 'developer', 'architect', 'ops', 'curious'] as const
type Persona = (typeof PERSONAS_WITH_NARROWING)[number] | 'researcher'

async function seedPersona(page: Page, persona: Persona): Promise<void> {
  await page.addInitScript((p: string) => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: p,
          selectedRegion: 'global',
          experienceLevel: 'expert',
          viewAccess: 'unlocked',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 7,
      })
    )
  }, persona)
}

/** Read the "Showing N documents matched to your role" count, or the bare
 *  "{N} documents" reading when the persona narrowing is inactive. */
async function readDocumentCount(page: Page): Promise<{ narrowed: boolean; count: number }> {
  const banner = page.getByText(/Showing (\d+) documents? matched to your role/)
  if (await banner.count()) {
    const text = (await banner.first().textContent()) ?? ''
    const m = text.match(/Showing (\d+)/)
    return { narrowed: true, count: m ? Number(m[1]) : Number.NaN }
  }
  const bare = page.getByText(/^(\d+) documents?/).first()
  const text = (await bare.textContent()) ?? ''
  const m = text.match(/^(\d+)/)
  return { narrowed: false, count: m ? Number(m[1]) : Number.NaN }
}

// Eight tests hammering the same dev server in parallel hit Vite cold-start
// races on the lazy /library route — pages return the SPA shell but the
// route chunk isn't compiled yet. Serial mode keeps the runtime predictable
// while still validating the same feature behaviors. CI already pins
// workers=1 via playwright.config.ts, so this only affects local runs.
test.describe.configure({ mode: 'serial' })

test.describe('library — persona-overwhelm-p0', () => {
  // Full corpus ships ~830 docs (2026-05). Per-persona narrowing ranges
  // depend on how many categories the persona's preferred set spans:
  //   - executive/curious (2–3 cats): ~150–250
  //   - developer/architect (4–5 cats): ~250–400
  //   - ops (6 cats, after P0.c) is the most permissive: ~600–700
  // NARROWED_CEILING is set just below the full corpus so a regression
  // that disables narrowing entirely (count back at ~830) trips this,
  // while every legitimate narrowing — even ops's mild one — passes.
  const FULL_CORPUS_FLOOR = 800
  const NARROWED_CEILING = 800

  test('researcher sees the full corpus and NO matched banner', async ({ page }) => {
    await seedPersona(page, 'researcher')
    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'PQC Library' })).toBeVisible({
      timeout: 15000,
    })
    const reading = await readDocumentCount(page)
    expect(reading.narrowed).toBe(false)
    expect(reading.count).toBeGreaterThan(FULL_CORPUS_FLOOR)
  })

  for (const persona of PERSONAS_WITH_NARROWING) {
    test(`persona=${persona} narrows the corpus AND shows the matched banner`, async ({ page }) => {
      await seedPersona(page, persona)
      // Curious collapses the shell; expand=1 is needed to see the count.
      await page.goto('/library?expand=1')
      await expect(page.getByRole('heading', { name: 'PQC Library' })).toBeVisible({
        timeout: 15000,
      })
      const reading = await readDocumentCount(page)
      expect(reading.narrowed, 'matched-to-your-role banner should be visible').toBe(true)
      expect(reading.count, 'narrowed count must be > 0').toBeGreaterThan(0)
      expect(
        reading.count,
        `narrowed count must be < full corpus (using ceiling ${NARROWED_CEILING})`
      ).toBeLessThan(NARROWED_CEILING)
    })
  }

  test('"See all N" escape hatch round-trips ?prefs=off + restores the full corpus', async ({
    page,
  }) => {
    await seedPersona(page, 'executive')
    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'PQC Library' })).toBeVisible({
      timeout: 15000,
    })

    const narrowed = await readDocumentCount(page)
    expect(narrowed.narrowed).toBe(true)

    // The reset link in the banner reads "See all {total}".
    const seeAll = page.getByRole('button', { name: /See all \d+/ })
    await expect(seeAll).toBeVisible()
    await seeAll.click()

    // URL converges on ?prefs=off and the banner disappears.
    await expect(page).toHaveURL(/prefs=off/)
    await expect(page.getByText(/matched to your role/)).toHaveCount(0)

    const expanded = await readDocumentCount(page)
    expect(expanded.narrowed).toBe(false)
    expect(expanded.count).toBeGreaterThan(narrowed.count)
  })

  test('curious mode hides the shell until "Browse the full library" is clicked', async ({
    page,
  }) => {
    await seedPersona(page, 'curious')
    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'PQC Library' })).toBeVisible({
      timeout: 15000,
    })

    // Above the fold: persona-picks panel + Browse CTA only.
    await expect(page.getByTestId('persona-picks-curious')).toBeVisible()
    const browse = page.getByRole('button', { name: 'Browse the full library' })
    await expect(browse).toBeVisible()

    // Shell elements are NOT in the DOM yet.
    await expect(
      page.getByRole('navigation', { name: /Library categories/i })
    ).toHaveCount(0)
    await expect(page.getByPlaceholder('Search standards and drafts...')).toHaveCount(0)

    await browse.click()

    // After click: URL gets ?expand=1; sidebar + search input become visible;
    // the Browse CTA disappears.
    await expect(page).toHaveURL(/expand=1/)
    await expect(page.getByRole('navigation', { name: /Library categories/i })).toBeVisible()
    await expect(page.getByPlaceholder('Search standards and drafts...')).toBeVisible()
    await expect(browse).toHaveCount(0)
  })
})
