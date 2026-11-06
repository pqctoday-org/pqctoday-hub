// SPDX-License-Identifier: AGPL-3.0-only
/**
 * One-time-signature reuse: the lesson keeps the severe warning but does not promise that two
 * signatures hand over the whole private key or let an attacker forge any message of their choice.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { StatefulSigsIntroduction } from './components/StatefulSigsIntroduction'
import { content } from './content'
import curiousSummary from './curious-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

const introText = () => {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <StatefulSigsIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  const first = flat(document.body.textContent ?? '')
  fireEvent.click(screen.getAllByText('LMS/HSS & XMSS')[0])
  return `${first} ${flat(document.body.textContent ?? '')}`
}

describe('OTS reuse wording', () => {
  it('the Learn text explains partial chain exposure instead of full key recovery', () => {
    const t = introText()
    expect(t).toMatch(/knows this chain from H.\(sk\) onward and can hash forward from there/)
    expect(t).toMatch(/cannot go backward to sk/)
    expect(t).toMatch(
      /Two signatures do not guarantee that the whole private key or the seed is recovered/
    )
    expect(t).toMatch(/or that any chosen message can be forged/)
    expect(t).toMatch(/a set that grows with each further reuse/)
    expect(t).toMatch(/treat reuse as a compromise of the key/)
    expect(t).not.toMatch(/Reusing an OTS key leaks the private key/)
    expect(t).not.toMatch(/compute the full chain and forge arbitrary messages/)
    expect(t).not.toMatch(/not a partial leak/)
  })

  it('the Learn text keeps the warning severe: no recovery, the key must be revoked', () => {
    const t = introText()
    expect(t).toMatch(/There is no recovery; the entire key must be revoked/)
    expect(t).toMatch(/must be treated as compromised/)
  })

  it('the module narrative and the topic summary do not say two signatures recover the private key', () => {
    const o = content.narratives?.otsWarning ?? ''
    expect(o).not.toMatch(/the private key becomes recoverable from two signatures/)
    expect(o).toMatch(/Two signatures do not by themselves hand over the whole private key/)
    expect(o).toMatch(/treat any reuse as a compromise and retire the key/)
    const c = flat(curiousSummary)
    expect(c).not.toMatch(
      /guarantees a catastrophic security failure, allowing an attacker to forge signatures/
    )
    expect(c).toMatch(
      /It does not necessarily hand over the whole private key, but the key must then be treated as compromised/
    )
  })
})
