// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { Introduction } from './Introduction'

function bullets(): string[] {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/exec-quantum-impact']}>
        <Introduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return Array.from(document.querySelectorAll('li')).map((li) => li.textContent ?? '')
}

describe('Executive introduction: federal deadline bullets', () => {
  it('keeps the agency key-establishment and signature dates apart from the contractor direction', () => {
    const items = bullets()
    const keyEstablishment = items.find((t) => /2030 \(federal agencies\)/.test(t))
    const signatures = items.find((t) => /2031 \(federal agencies\)/.test(t))
    expect(keyEstablishment).toBeDefined()
    expect(signatures).toBeDefined()
    // the agency milestones are about agency systems, not contractors
    expect(keyEstablishment).not.toMatch(/contractor/i)
    expect(keyEstablishment).toMatch(/National Security\s+Systems excluded/)
    expect(signatures).toMatch(/agency systems/)
  })

  it('presents the contractor date as a direction to propose a rule, not as a binding duty', () => {
    const items = bullets()
    const farBullet = items.find((t) => /FAR\s+Council/.test(t))
    expect(farBullet).toBeDefined()
    expect(farBullet).toMatch(/proposed/i)
    expect(farBullet).toMatch(/binds no contractor until it\s+is finalized/)
    // the contractor direction is about NIST FIPS compliance, not a signature-specific 2031 date
    expect(farBullet).not.toMatch(/2031/)
  })

  it('does not say the order itself governs contractors', () => {
    const items = bullets()
    expect(items.join(' ')).not.toMatch(/High Value Assets[^.]*and covered contractors/i)
    expect(document.body.textContent).not.toMatch(/and the contractors that serve them/)
  })
})
