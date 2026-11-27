// SPDX-License-Identifier: AGPL-3.0-only
import { TONE_CLASS, type Tone } from '@/data/migrateToneClass'

/**
 * The support chip's six words (grammar chip family 10): Available, Partial, Planned, Not determined,
 * None, PSK only. The catalog holds free text in `pqc_support` ("Yes (ML-KEM, ML-DSA; ...)"); until it
 * carries the level as its own field, the level is read from how that text begins, and anything that
 * does not say one of the five plainly is "Not determined", never guessed.
 */
export type PqcSupportLevel =
  'Available' | 'Partial' | 'Planned' | 'Not determined' | 'None' | 'PSK only'

export function pqcSupportLevel(pqcSupport: string | undefined): PqcSupportLevel {
  const text = (pqcSupport ?? '').trim().toLowerCase()
  if (/^(yes|available)\b/.test(text)) return 'Available'
  if (/^(partial|limited)\b/.test(text)) return 'Partial'
  if (/^(planned|roadmap|in progress)\b/.test(text)) return 'Planned'
  if (/^psk\b/.test(text)) return 'PSK only'
  if (/^(no|none)\b/.test(text)) return 'None'
  return 'Not determined'
}

const LEVEL_TONE: Record<PqcSupportLevel, Tone> = {
  Available: 'success',
  Partial: 'warning',
  Planned: 'info',
  'Not determined': 'muted',
  None: 'muted',
  'PSK only': 'warning',
}

/** Token classes for the chip of a level; the word is always shown beside the colour. */
export const pqcSupportToneClass = (level: PqcSupportLevel): string => TONE_CLASS[LEVEL_TONE[level]]
