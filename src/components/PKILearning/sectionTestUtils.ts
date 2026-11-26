// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from 'vitest'

/**
 * The text of one lesson section, found by its section id. Every section of a lesson is in the
 * page at once, so a test reads it without a step bar to click.
 */
export function sectionText(sectionId: string): string {
  const el = document.querySelector(`[data-section-id="${sectionId}"]`)
  expect(el, `section "${sectionId}" is on the page`).not.toBeNull()
  return (el!.textContent ?? '').replace(/\s+/g, ' ')
}
