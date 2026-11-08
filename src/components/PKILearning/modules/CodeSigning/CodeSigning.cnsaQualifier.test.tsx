// SPDX-License-Identifier: AGPL-3.0-only
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CodeSigningIntroduction } from './components/CodeSigningIntroduction'
import { CodeSigningExercises } from './components/CodeSigningExercises'
import { SecureBootChain } from './workshop/SecureBootChain'

const QUALIFIER =
  /NSA's 2022 category guidance; superseded for planning by the dates in NSA's CNSA 2\.0 FAQ, version 2\.2/

const flat = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('code signing: the 2022 signing schedule carries the older-schedule note', () => {
  it('introduction timeline marks both signing dates as the 2022 guidance', () => {
    const { container } = render(
      <MemoryRouter>
        <CodeSigningIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const t = flat(container)
    const exclusive = t.match(/Software and firmware signing: exclusively use CNSA 2\.0 \([^)]*\)/)
    expect(exclusive?.[0]).toMatch(QUALIFIER)
    const preferred = t.match(
      /Software and firmware signing: support and prefer CNSA 2\.0 \([^)]*\)/
    )
    expect(preferred?.[0]).toMatch(QUALIFIER)
  })

  it('secure boot timeline marks both signing dates as the 2022 guidance', () => {
    const { container } = render(
      <MemoryRouter>
        <SecureBootChain />
      </MemoryRouter>
    )
    const t = flat(container)
    expect(t.match(/exclusively use CNSA 2\.0 \([^)]*\)/)?.[0]).toMatch(QUALIFIER)
    expect(t.match(/support and prefer CNSA 2\.0 \([^)]*\)/)?.[0]).toMatch(QUALIFIER)
  })
})

describe('code signing exercises: Sigstore key wording', () => {
  it('says developers hold no long-term signing keys, not that no long-term keys exist', () => {
    const { container } = render(
      <MemoryRouter>
        <CodeSigningExercises onNavigateToWorkshop={vi.fn()} onSetWorkshopConfig={vi.fn()} />
      </MemoryRouter>
    )
    const t = flat(container)
    expect(t).not.toMatch(/no long-term private keys exist/)
    expect(t).toMatch(
      /developers have no long-term artifact-signing private keys to manage, rotate, or protect/
    )
  })
})
