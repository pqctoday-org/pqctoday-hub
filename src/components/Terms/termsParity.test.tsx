// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { TermsView } from './TermsView'

// The privacy section (section 10) is published twice: on the /terms page and in
// TERMS.md in the repository. TERMS.md once said "no cookies, no analytics
// tracking" while the page disclosed Google Analytics, and it lacked the PQC
// Assistant paragraph altogether. This keeps the two word for word identical.
// (Other sections still differ in wording; only the privacy section and the
// dates are held to this.)

// eslint-disable-next-line security/detect-non-literal-fs-filename -- a fixed repo file
const termsMd = readFileSync(join(process.cwd(), 'TERMS.md'), 'utf-8')

/** Plain text for comparison: straight quotes, no markdown, one-space gaps. */
const normalize = (text: string) =>
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

/** The body of "## 10. ..." in TERMS.md, up to the next numbered "## " heading. */
function privacySectionBodyFromMd(): string {
  const match = /^## 10\. [^\n]*\n([\s\S]*?)(?=^## \d+\. |(?![\s\S]))/m.exec(termsMd)
  expect(match, 'TERMS.md has no section 10').not.toBeNull()
  return match?.[1] ?? ''
}

/** The rendered section 10 of the page, as one string and as a list of links. */
function privacySectionFromPage(): { text: string; links: (string | null)[] } {
  render(
    <MemoryRouter>
      <TermsView />
    </MemoryRouter>
  )
  const heading = screen.getByRole('heading', { name: /^10\. Privacy and Analytics$/ })
  // eslint-disable-next-line testing-library/no-node-access -- the section has no accessible name to query by
  const section = heading.closest('section')
  expect(section).not.toBeNull()
  const scoped = within(section as HTMLElement)
  const paragraphs = scoped.getAllByRole('paragraph')
  const links = scoped.getAllByRole('link')
  return {
    // Join the paragraphs with a space: textContent alone runs them together.
    text: paragraphs.map((p) => p.textContent).join(' '),
    links: links.map((a) => a.getAttribute('href')),
  }
}

describe('TERMS.md and the /terms page say the same about privacy', () => {
  it('section 10 is word for word identical', () => {
    expect(normalize(privacySectionBodyFromMd())).toBe(normalize(privacySectionFromPage().text))
  })

  it('section 10 links to the same places', () => {
    const mdLinks = [...privacySectionBodyFromMd().matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(
      (m) => m[1]
    )
    expect(mdLinks).toEqual(privacySectionFromPage().links)
  })

  it('both carry the same Effective and Last Updated dates', () => {
    render(
      <MemoryRouter>
        <TermsView />
      </MemoryRouter>
    )
    const effective = /\*\*Effective Date:\*\* ([^\n]+)/.exec(termsMd)?.[1].trim()
    const updated = /\*\*Last Updated:\*\* ([^\n]+)/.exec(termsMd)?.[1].trim()
    expect(effective).toBeTruthy()
    expect(updated).toBeTruthy()
    expect(screen.getByText(/Effective Date:/)).toHaveTextContent(
      `Effective Date: ${effective} · Last Updated: ${updated}`
    )
  })

  it('neither text still claims that nothing is tracked', () => {
    const page = normalize(privacySectionFromPage().text)
    for (const text of [page, normalize(termsMd)]) {
      expect(text).not.toMatch(/no analytics tracking|no cookies,|collects no personal data/i)
    }
  })
})
