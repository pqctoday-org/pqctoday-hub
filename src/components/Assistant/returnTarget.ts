// SPDX-License-Identifier: AGPL-3.0-only
import { NAV_PATH_LABELS } from '@/data/personaConfig'

/**
 * A plain name for the page the learner is on, for "Back to <page>". The page's own heading is the
 * truest name; the route's label and a plain fallback follow.
 */
export function describeCurrentPage(pathname: string): string {
  if (typeof document !== 'undefined') {
    const heading = document.querySelector('main h1, #main-content h1')?.textContent?.trim()
    if (heading) return heading
  }
  return NAV_PATH_LABELS[pathname] ?? 'the page you were on'
}
