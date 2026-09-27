// SPDX-License-Identifier: GPL-3.0-only
/**
 * One place to turn a timeline row's years into reader-facing text, so an
 * open-ended phase (TimelineEvent.openEnded, D22 2026-09-27) never prints as a
 * single year or with an invented end.
 */
export const OPEN_ENDED_NOTE = 'no end date stated by source'

export const periodLabel = (startYear: number, endYear: number, openEnded?: boolean): string =>
  openEnded
    ? `${startYear} onward (${OPEN_ENDED_NOTE})`
    : startYear === endYear
      ? `${startYear}`
      : `${startYear}–${endYear}`
