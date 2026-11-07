// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { OSPQCIntroduction } from './OSPQCIntroduction'

function introText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/os-pqc']}>
        <OSPQCIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  // The learn sections are accordions; open every one so the text is in the DOM.
  for (const btn of Array.from(document.querySelectorAll('button[aria-expanded="false"]'))) {
    fireEvent.click(btn)
  }
  return document.body.textContent ?? ''
}

describe('OSPQC introduction: Red Hat crypto-policies row', () => {
  it('shows the documented DEFAULT:PQ policy instead of the FUTURE policy', () => {
    const text = introText()
    expect(text).toContain('update-crypto-policies --set DEFAULT:PQ')
    expect(text).toContain(
      'Red Hat documents the DEFAULT:PQ policy for RHEL 9.7; on RHEL 10.1 the DEFAULT policy is the documented route'
    )
    expect(text).not.toContain('update-crypto-policies --set FUTURE')
    expect(text).not.toContain('X25519MLKEM768 hybrid group systemwide')
  })
})
