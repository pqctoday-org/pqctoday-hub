// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The count of systems or products the ROI scenario migrates. The learner types it: it is never
 * taken from the Hub catalogue, whose size says nothing about one organisation's estate.
 */

/** The smallest count the scenario accepts. */
export const MIN_PRODUCT_COUNT = 1
/** The largest count the scenario accepts; above it the field asks the learner to check the entry. */
export const MAX_PRODUCT_COUNT = 1_000_000
/** The editable example the calculator opens with, shown with an "example" tag until it is replaced. */
export const EXAMPLE_PRODUCT_COUNT = 50

/**
 * Where the count came from:
 * - `example`: the opening value, which the learner has not set.
 * - `entered`: a valid number the learner typed (or confirmed).
 * - `saved-model`: restored from a model saved before the learner entered their own count was
 *   possible, when the count was bounded by the catalogue size; it is not confirmed as an inventory.
 */
export type ProductCountSource = 'example' | 'entered' | 'saved-model'

export type ProductCountParse = { ok: true; value: number } | { ok: false; message: string }

/** "1,200" or "12,345,678": a leading group of 1 to 3 digits, then groups of exactly 3. */
function hasThousandsCommas(text: string): boolean {
  const groups = text.split(',')
  if (groups.length < 2) return false
  const [first, ...rest] = groups
  return /^\d{1,3}$/.test(first) && rest.every((group) => /^\d{3}$/.test(group))
}

/** Reads the typed text. Whole numbers from 1 to 1,000,000; thousands commas are allowed. */
export function parseProductCount(raw: string): ProductCountParse {
  const text = raw.trim()
  if (text === '') {
    return {
      ok: false,
      message:
        'Enter the number of systems or products in your scenario (a whole number, 1 or more).',
    }
  }
  const digits = hasThousandsCommas(text) ? text.replace(/,/g, '') : text
  if (!/^\d+$/.test(digits)) {
    return {
      ok: false,
      message: 'Use a whole number of 1 or more, with no letters, decimals or minus sign.',
    }
  }
  const value = Number(digits)
  if (value < MIN_PRODUCT_COUNT) {
    return { ok: false, message: 'The count must be 1 or more.' }
  }
  if (value > MAX_PRODUCT_COUNT) {
    return {
      ok: false,
      message: `The most this calculator accepts is ${MAX_PRODUCT_COUNT.toLocaleString('en-US')}. Check the entry.`,
    }
  }
  return { ok: true, value }
}

/** Short words for where the count in use came from, used in the capex line and the export. */
export function productCountSourceLabel(source: ProductCountSource): string {
  switch (source) {
    case 'example':
      return 'example value, not your count'
    case 'entered':
      return 'entered by you'
    case 'saved-model':
      return 'restored from your saved model, not confirmed'
  }
}

/** One sentence saying what the count is, for the page and the export. */
export function productCountScopeNote(source: ProductCountSource): string {
  switch (source) {
    case 'example':
      return 'The count of systems or products is an example value, not an inventory of your organisation. Replace it with your own count; it is not taken from the Hub catalogue.'
    case 'entered':
      return 'The count of systems or products is the figure you entered; it is not taken from the Hub catalogue.'
    case 'saved-model':
      return 'The count of systems or products comes from your saved model. It was set against the Hub catalogue, not your inventory. Confirm or change it.'
  }
}

/** True once the learner has set the count themselves, which is when a comparison can be read. */
export function isOwnCount(source: ProductCountSource): boolean {
  return source === 'entered'
}

/** What a saved model's count is, given the marker it was saved with (none before the marker existed). */
export function restoredCountSource(marker: unknown): ProductCountSource {
  return marker === 'example' || marker === 'entered' ? marker : 'saved-model'
}
