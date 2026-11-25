// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Helpers for the Assistant drawer: a 400 px region beside the page on a wide screen, a full-screen
 * modal sheet on a phone. The drawer answers from the Hub's own records; nothing here sets up a
 * model, a key or a download.
 */

export const WIDE = { width: 1280, height: 800 } as const
export const PHONE = { width: 390, height: 844 } as const

export const isPhone = (page: Page): boolean => (page.viewportSize()?.width ?? 1280) < 640

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
