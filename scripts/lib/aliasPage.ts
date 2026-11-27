// SPDX-License-Identifier: AGPL-3.0-only
import { JSDOM } from 'jsdom'

/**
 * The saved page for an address that is an alias of another page (see src/seo/prerenderedAliases.ts).
 *
 * It is the target's own prerendered page, unchanged: the same text for a visitor or crawler that does
 * not run JavaScript, and a canonical link that names the target, so the alias is counted as a copy of
 * the target and not as a page of its own. It is not marked noindex (that would send the target's
 * signals nowhere); the canonical link does the work. The app starts from it as from any saved page
 * and sends the visitor on to the target.
 */

const BASE_URL = 'https://www.pqctoday.com'

/** What must hold for an alias page built from the target's saved page; empty when it does. */
export function validateAliasPage(html: string, target: string): string[] {
  const { document } = new JSDOM(html).window
  const errors: string[] = []
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? ''
  if (canonical !== `${BASE_URL}${target}`) {
    errors.push(`the page does not name ${BASE_URL}${target} as its canonical (has "${canonical}")`)
  }
  if (
    /noindex/i.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')
  ) {
    errors.push('the page is marked noindex')
  }
  const root = document.querySelector('#root')
  if (!root) {
    errors.push('the page has no #root, so the app could not start from it')
  } else if (root.querySelectorAll('h1').length !== 1) {
    errors.push('the page needs exactly one <h1>')
  }
  if (!document.querySelector('script[type="module"][src]')) {
    errors.push('the page does not load the app')
  }
  return errors
}

/** The page to save under the alias: the target's saved page, once it is checked. */
export function buildAliasPage(
  targetHtml: string,
  target: string
): { html: string; errors: string[] } {
  return { html: targetHtml, errors: validateAliasPage(targetHtml, target) }
}
