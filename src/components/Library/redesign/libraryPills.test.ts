// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { documentDatesText, formatLibDate } from './libraryPills'

describe('formatLibDate — precision of the recorded date', () => {
  it('keeps a month-only date at month precision (no invented day)', () => {
    expect(formatLibDate('2020-09')).toBe('Sep 2020')
  })

  it('keeps a year-only date at year precision', () => {
    expect(formatLibDate('2000')).toBe('2000')
  })

  it('prints a full date with its day, without slipping a day backwards', () => {
    expect(formatLibDate('2020-09-21')).toBe('Sep 21, 2020')
    expect(formatLibDate('2026-04-09')).toBe('Apr 9, 2026')
  })

  it('returns blank for a blank date', () => {
    expect(formatLibDate('')).toBe('')
    expect(formatLibDate('   ')).toBe('')
  })
})

describe('documentDatesText — the document’s own dates', () => {
  it('shows first published and updated for two full dates', () => {
    expect(documentDatesText('2020-09-21', '2026-08-19')).toBe(
      'First published Sep 21, 2020 · updated Aug 19, 2026'
    )
  })

  it('keeps month-only first publication at month precision', () => {
    expect(documentDatesText('2020-09', '2026-04-09')).toBe(
      'First published Sep 2020 · updated Apr 9, 2026'
    )
  })

  it('skips the update part when there is no update date', () => {
    expect(documentDatesText('2019-04', '')).toBe('First published Apr 2019')
  })

  it('shows only the update when there is no first-publication date', () => {
    expect(documentDatesText('', '2026-08-19')).toBe('Updated Aug 19, 2026')
  })

  it('omits the update when it is earlier than the first publication', () => {
    expect(documentDatesText('2025-10', '2025-04-01')).toBe('First published Oct 2025')
    expect(documentDatesText('2026-04-09', '2026-04-01')).toBe('First published Apr 9, 2026')
  })

  it('compares at the coarser precision, so a later day in the same month still counts as an update', () => {
    expect(documentDatesText('2025-10', '2025-10-15')).toBe('First published Oct 2025')
    expect(documentDatesText('2025-09', '2025-10-15')).toBe(
      'First published Sep 2025 · updated Oct 15, 2025'
    )
  })

  it('returns blank when neither date is recorded', () => {
    expect(documentDatesText('', '')).toBe('')
    expect(documentDatesText('  ', ' ')).toBe('')
  })

  it('drops an update that reads the same as the first publication', () => {
    expect(documentDatesText('2025-01-01', '2025-01-01')).toBe('First published Jan 1, 2025')
    expect(documentDatesText('2000', '2000')).toBe('First published 2000')
  })
})
