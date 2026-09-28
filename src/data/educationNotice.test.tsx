// SPDX-License-Identifier: GPL-3.0-only
/**
 * The education / not-for-production status notice (education-notice
 * remediation 2026-09-26). Modelled on `validationDisclaimer.test.tsx`: pin the
 * wording, and prove it renders with NO interaction — not behind a disclosure
 * and not behind a persona condition.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  EDUCATION_NOTICE,
  EDUCATION_NOTICE_TEXT,
  ENGINE_NOTICE,
  ENGINE_NOTICE_TEXT,
  stripEducationNoticeComment,
  withEducationNoticeComment,
  withEducationNoticeCsv,
  withEducationNoticeMarkdown,
  wrapNotice,
} from './educationNotice'
import { EducationNotice } from '@/components/shared/EducationNotice'

describe('education notice — wording is pinned', () => {
  it('EDUCATION_NOTICE is the approved text, verbatim', () => {
    expect(EDUCATION_NOTICE).toBe(
      'PQC Today is an educational and demonstration platform, not a production system. Nothing it produces — keys, certificates, configurations, reports, or test results — is fit to protect real data, and none of it may be deployed or relied upon in production.'
    )
  })

  it('ENGINE_NOTICE is the approved text, verbatim', () => {
    expect(ENGINE_NOTICE).toBe(
      'Educational and demonstration build — not for production use, in any environment. Not security-audited, not certified, and not intended to protect real data.'
    )
  })

  it('ENGINE_NOTICE is short enough for an npm description / OCI label', () => {
    // npm truncates long descriptions in search results; an OCI label wants one
    // line. The whole point of the second constant is that it fits.
    expect(ENGINE_NOTICE.length).toBeLessThanOrEqual(200)
  })

  it('ENGINE_NOTICE is NOT scoped to a browser or to "the Platform"', () => {
    // The gap this notice exists to close: SECURITY.md scoped its disclaimer to
    // "this browser-based environment" and TERMS.md to "the Platform… in your
    // browser", while the engine ships as a Node-consumable npm package. A
    // browser-scoped sentence would not reach that consumer.
    expect(ENGINE_NOTICE).not.toMatch(/browser|platform|in your/i)
    expect(ENGINE_NOTICE).toMatch(/in any environment/)
  })

  it('exposes plain-text forms for artefacts that cannot render JSX', () => {
    expect(EDUCATION_NOTICE_TEXT).toBe(`Notice: ${EDUCATION_NOTICE}`)
    expect(ENGINE_NOTICE_TEXT).toBe(`Notice: ${ENGINE_NOTICE}`)
  })
})

describe('education notice — renders with no interaction', () => {
  it('renders verbatim, visible, with nothing clicked', () => {
    render(<EducationNotice />)
    const el = screen.getByTestId('education-notice')
    expect(el).toBeVisible()
    expect(el).toHaveTextContent(EDUCATION_NOTICE)
  })

  it('renders the same text in the strong tone', () => {
    render(<EducationNotice tone="strong" />)
    expect(screen.getByTestId('education-notice')).toHaveTextContent(EDUCATION_NOTICE)
  })
})

describe('education notice — export payload helpers', () => {
  it('wraps to a fixed width with a comment prefix', () => {
    const wrapped = wrapNotice(EDUCATION_NOTICE, '# ', 74)
    for (const line of wrapped.split('\n')) {
      expect(line.startsWith('# ')).toBe(true)
      expect(line.length).toBeLessThanOrEqual(76)
    }
    expect(wrapped.replace(/# /g, '').replace(/\n/g, ' ')).toBe(EDUCATION_NOTICE)
  })

  it('markdown/csv/comment helpers each carry the notice', () => {
    expect(withEducationNoticeMarkdown('# Report')).toContain(EDUCATION_NOTICE)
    expect(withEducationNoticeCsv('a,b\n1,2\n')).toContain(EDUCATION_NOTICE)
    expect(withEducationNoticeComment('key-bytes', '#')).toContain('# PQC Today is an educational')
  })

  it('every helper is idempotent — a payload never says it twice', () => {
    const md = withEducationNoticeMarkdown('# Report')
    expect(withEducationNoticeMarkdown(md)).toBe(md)
    const csv = withEducationNoticeCsv('a,b\n')
    expect(withEducationNoticeCsv(csv)).toBe(csv)
    const txt = withEducationNoticeComment('body', '#')
    expect(withEducationNoticeComment(txt, '#')).toBe(txt)
  })

  it('the CSV notice is one quoted field, so a spreadsheet shows it as a cell', () => {
    const csv = withEducationNoticeCsv('a,b\n1,2\n')
    const first = csv.split('\n')[0]
    expect(first.startsWith('"')).toBe(true)
    expect(first.endsWith('"')).toBe(true)
  })

  it('stripping the comment notice round-trips the original bytes', () => {
    const original = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n'
    expect(stripEducationNoticeComment(withEducationNoticeComment(original, '#'), '#')).toBe(
      original
    )
    // A payload that never carried the notice is returned untouched, even when
    // it happens to start with comment lines of its own.
    const foreign = '# someone else’s comment\nbody\n'
    expect(stripEducationNoticeComment(foreign, '#')).toBe(foreign)
  })
})
