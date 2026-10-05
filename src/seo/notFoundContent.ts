// SPDX-License-Identifier: GPL-3.0-only
/**
 * What the "page not found" page says. Shared by the screen the app shows for an address it does not
 * know (src/components/NotFound) and by the saved 404.html that GitHub Pages serves, with a 404 status,
 * for an address that has no file (scripts/lib/notFoundPage.ts), so the two cannot drift apart.
 */

export const NOT_FOUND_TITLE = 'Page not found | PQC Today'

export const NOT_FOUND_DESCRIPTION =
  'This page does not exist on PQC Today. Use the links to find what you were looking for.'

/** Where to go next: the main sections, as real links a visitor or a crawler can follow. */
export const NOT_FOUND_LINKS: ReadonlyArray<{ path: string; label: string }> = [
  { path: '/', label: 'Home' },
  { path: '/learn', label: 'Learn post-quantum cryptography' },
  { path: '/algorithms', label: 'Algorithms' },
  { path: '/migrate', label: 'Migration workbench' },
  { path: '/compliance', label: 'Compliance' },
  { path: '/library', label: 'Reference library' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/threats', label: 'Threats' },
  { path: '/about', label: 'About' },
]
