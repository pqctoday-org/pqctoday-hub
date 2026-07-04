// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  REPORT_SECTION_ORDER,
  REPORT_SECTION_TO_CSWP39,
  REPORT_SECTION_LABELS,
} from './reportSectionToCswp39'

// REPORT_SECTION_ORDER is the single source of truth for /report's render +
// TOC order (ReportContent.tsx and ReportView.tsx both import it). The two
// Record<ReportSectionId, ...> maps below are compiler-enforced to have every
// section id as a key, so comparing their key sets to REPORT_SECTION_ORDER
// catches drift a future editor could otherwise ship silently: adding a new
// section id to only one of the three would fail here, not in production.
describe('REPORT_SECTION_ORDER stays in sync with the section maps', () => {
  it('has no duplicate ids', () => {
    expect(new Set(REPORT_SECTION_ORDER).size).toBe(REPORT_SECTION_ORDER.length)
  })

  it('matches REPORT_SECTION_TO_CSWP39 exactly (same set, order-independent)', () => {
    expect([...REPORT_SECTION_ORDER].sort()).toEqual(
      Object.keys(REPORT_SECTION_TO_CSWP39).sort()
    )
  })

  it('matches REPORT_SECTION_LABELS exactly (same set, order-independent)', () => {
    expect([...REPORT_SECTION_ORDER].sort()).toEqual(Object.keys(REPORT_SECTION_LABELS).sort())
  })
})
