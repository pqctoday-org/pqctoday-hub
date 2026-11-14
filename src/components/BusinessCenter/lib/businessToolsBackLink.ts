// SPDX-License-Identifier: AGPL-3.0-only

/** Router state a catalogue link passes to a tool page. */
export interface BusinessToolsLinkState {
  /** The catalogue's query string when the tool was opened ('' or '?…'). */
  fromToolsSearch?: string
}

/**
 * Where a tool page's back button goes: the catalogue with the filters it was
 * opened from, or the plain catalogue when the tool was reached any other way
 * (deep link, next-step card, search). Only a query string is accepted, so the
 * state cannot redirect anywhere else.
 */
export function businessToolsBackHref(state: unknown): string {
  const search = (state as BusinessToolsLinkState | null | undefined)?.fromToolsSearch
  if (typeof search === 'string' && search.startsWith('?') && !search.includes('#')) {
    return `/business/tools${search}`
  }
  return '/business/tools'
}
