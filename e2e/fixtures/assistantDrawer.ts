// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Helpers for the Assistant drawer: a region beside the page on a wide screen (520 px, or 400 px below
 * 1,280 px), a full-screen modal sheet below 1,024 px. The drawer answers from the Hub's own records; nothing here sets up a
 * model, a key or a download.
 */

export const WIDE = { width: 1280, height: 800 } as const
export const PHONE = { width: 390, height: 844 } as const

/** True when the drawer is the full-screen sheet: below the 1,024 px breakpoint. */
export const isPhone = (page: Page): boolean => (page.viewportSize()?.width ?? 1280) < 1024

export interface SeedOptions {
  /** The learner's role; `null` is a first visit. Default: security architect. */
  persona?: string | null
  theme?: 'light' | 'dark'
}

/** Suppress the first-visit notices and set the role and the theme, before any page script runs. */
export async function seedHub(
  page: Page,
  { persona = 'architect', theme = 'light' }: SeedOptions = {}
) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
  await page.addInitScript(
    ([p, th]) => {
      localStorage.setItem(
        'theme-storage-v1',
        JSON.stringify({ state: { theme: th, hasSetPreference: true }, version: 1 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      if (p) {
        localStorage.setItem(
          'pqc-learning-persona',
          JSON.stringify({
            state: {
              selectedPersona: p,
              hasAcknowledgedExecutiveGrcSplit: true,
              selectedRegion: 'global',
              experienceLevel: 'basics',
              viewAccess: 'unlocked',
              hasSeenPersonaPicker: true,
              suppressSuggestion: true,
              niceTier: 'practitioner',
              niceTierOverridden: false,
              curiousGuideDismissed: true,
            },
            version: 7,
          })
        )
      }
    },
    [persona, theme] as const
  )
}

/** The drawer: a region beside the page on a wide screen, a dialog (the sheet) on a phone. */
export function drawerOf(page: Page): Locator {
  return isPhone(page)
    ? page.getByRole('dialog', { name: 'Assistant', exact: true })
    : page.getByRole('region', { name: 'Assistant', exact: true })
}

/** The control that opens the drawer: the top bar's Assistant button, or More on a phone. */
export function openerOf(page: Page): Locator {
  return isPhone(page)
    ? page.getByRole('button', { name: /^More(?: — unread updates)?$/ })
    : page.getByRole('button', { name: 'Assistant', exact: true }).first()
}

/** Open the drawer the way a learner does, by keyboard-reachable controls only. */
export async function openDrawer(page: Page): Promise<Locator> {
  const opener = openerOf(page)
  await expect(opener).toBeVisible({ timeout: 30_000 })
  await opener.click()
  if (isPhone(page)) {
    await page
      .getByTestId('mobile-page-actions-sheet')
      .getByRole('button', { name: /^Assistant/ })
      .click()
  }
  const drawer = drawerOf(page)
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('textbox', { name: 'Your question' })).toBeFocused()
  return drawer
}

/** The answer card of a question, once the Hub has answered it. */
export function answerOf(drawer: Locator, question: string): Locator {
  return drawer.getByRole('article', { name: question, exact: true }).last()
}

/**
 * Ask a question. A wide screen sends with Return; on a phone Return adds a line and only Send sends.
 * Resolves with the answer card once the loading line is gone.
 */
export async function ask(page: Page, drawer: Locator, question: string): Promise<Locator> {
  const input = drawer.getByRole('textbox', { name: 'Your question' })
  await input.fill(question)
  if (isPhone(page)) await drawer.getByRole('button', { name: 'Send', exact: true }).click()
  else await input.press('Enter')
  const answer = answerOf(drawer, question)
  await expect(answer).toBeVisible({ timeout: 30_000 })
  await expect(answer.getByText('Looking in the Hub records.')).toHaveCount(0, { timeout: 30_000 })
  return answer
}

/**
 * Steps through an answer's resources with Next, as a learner does, until `target` (a locator inside
 * `answer`) is on screen, and returns it. Fails when the end of the answer is reached without it.
 */
export async function reveal(answer: Locator, target: Locator): Promise<Locator> {
  const next = answer.getByRole('button', { name: /^(Next resource|No more resources)/ })
  for (let i = 0; i < 100; i++) {
    if (await target.first().isVisible()) return target.first()
    if ((await next.getAttribute('aria-disabled')) === 'true') break
    await next.click()
  }
  await expect(target.first(), 'the resource is somewhere in the answer').toBeVisible()
  return target.first()
}

/** Selects a resource type of an answer by its tab, e.g. `/^Library, \d+ resources?$/`. */
export async function openTab(answer: Locator, name: RegExp | string): Promise<Locator> {
  const tab = answer.getByRole('tab', { name })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  return answer.getByRole('tabpanel')
}

/** The page's own name for "where I came from" is its heading; used to read the phone's return label. */
export const returnControl = (page: Page): Locator =>
  page.getByRole('button', { name: /^Back to / })

/** Requests that left the Hub's own origin: the Assistant must cause none. */
export function trackForeignRequests(page: Page, baseURL: string): string[] {
  const origin = new URL(baseURL).origin
  const foreign: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith(origin)) return
    foreign.push(url)
  })
  return foreign
}
