// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CryptoAgilityDefinitions } from './CryptoAgilityDefinitions'
import { CSWP39_APPENDIX_B_DEFINITIONS } from '@/data/cswp39AppendixB'

describe('crypto agility source definition and teaching attribution', () => {
  it('retains the four Appendix B entries without presenting the authored synthesis as a fifth definition', () => {
    render(<CryptoAgilityDefinitions />)
    const alternatives = screen.getByRole('region', {
      name: 'Alternative definitions from other literature',
      hidden: true,
    })
    expect(within(alternatives).getAllByRole('listitem', { hidden: true })).toHaveLength(4)
    expect(CSWP39_APPENDIX_B_DEFINITIONS.map((entry) => entry.source)).toEqual([
      'NIST (2016 workshop)',
      'FS-ISAC (financial sector)',
      'ATIS',
      'ETSI',
    ])
    for (const entry of CSWP39_APPENDIX_B_DEFINITIONS) {
      expect(within(alternatives).getByText(entry.definition)).toBeInTheDocument()
    }
    expect(
      within(alternatives)
        .getAllByRole('link', { name: 'View source', hidden: true })
        .map((link) => link.getAttribute('href'))
    ).toEqual(CSWP39_APPENDIX_B_DEFINITIONS.map((entry) => entry.url))
    expect(alternatives).not.toHaveTextContent('CARAF')
    expect(alternatives).not.toHaveTextContent('Hohm')
  })

  it('separates Hub guidance and distinct related works without claiming a source quotation', () => {
    render(<CryptoAgilityDefinitions />)
    const synthesis = screen.getByRole('region', { name: 'Hub teaching synthesis', hidden: true })
    expect(synthesis).toHaveTextContent(
      'Hub-authored guidance, not a quotation or a definition from NIST Appendix B'
    )
    expect(synthesis).toHaveTextContent('not interchangeable definitions')
    expect(within(synthesis).getByRole('link', { name: /CARAF:/, hidden: true })).toHaveAttribute(
      'href',
      'https://doi.org/10.1093/cybsec/tyab013'
    )
    expect(
      within(synthesis).getByRole('link', { name: /Towards a Maturity Model/, hidden: true })
    ).toHaveAttribute('href', 'https://arxiv.org/abs/2202.07645')
    expect(synthesis).not.toHaveTextContent('CARAF (Hohm et al.)')
  })
})
