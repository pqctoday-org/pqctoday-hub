// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SecureBootChain } from './SecureBootChain'

const open = () => {
  const { container } = render(
    <MemoryRouter>
      <SecureBootChain />
    </MemoryRouter>
  )
  return container
}
const flat = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('firmware algorithm comparison puts state on the signer, not the verifier', () => {
  it('says a verifying device never needs a state counter, for every stage of ML-DSA', () => {
    const container = open()
    fireEvent.click(screen.getByRole('button', { name: /ML-DSA-65/ }))
    const seen: string[] = []
    for (let stage = 1; stage <= 4; stage++) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Stage ${stage}:`) }))
      seen.push(flat(container))
    }
    const t = seen.join(' ')
    expect(t).not.toMatch(/constrained devices that cannot maintain a secure state counter/)
    expect(t).not.toMatch(/ML-DSA lattice reduction/)
    expect(t).toMatch(/state counter is a signer-side burden/)
    expect(t).toMatch(/verifier validates no counter; only the signer tracks state/)
    expect(t).toMatch(/not a lattice search/)
    expect(t).toMatch(/memory, time and ROM/)
  })

  it('describes BSI TR-02102-1 as recommending stateful schemes where state can be managed safely', () => {
    const container = open()
    fireEvent.click(screen.getByRole('button', { name: /XMSS/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Stage 4:/ }))
    const t = flat(container)
    expect(t).not.toMatch(/European government systems/)
    expect(t).toMatch(/only where safe, error-free state management can be guaranteed/)
  })

  it('scopes the CNSA 2.0 timeline to software and firmware signing', () => {
    const t = flat(open())
    expect(t).toMatch(/Software and firmware signing: exclusively use CNSA 2\.0/)
    expect(t).not.toMatch(/All deployed National Security Systems must use CNSA 2\.0 signatures/)
    expect(t).not.toMatch(/Full quantum-resistant enforcement/)
    expect(t).toMatch(/not specific to signing/)
  })
})
