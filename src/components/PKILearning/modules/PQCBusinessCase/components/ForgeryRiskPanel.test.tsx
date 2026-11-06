// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ForgeryRiskPanel } from './ForgeryRiskPanel'

const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

describe('Forgery risk panel', () => {
  it('does not say forgery is limited to new signatures or that past records are safe', () => {
    render(<ForgeryRiskPanel />)
    expect(text()).not.toMatch(/cannot forge a signature that was already validly created/)
    expect(text()).not.toMatch(/Not retroactive/)
    expect(text()).not.toMatch(/only NEW signatures/)
    expect(text()).toMatch(/signatures that claim to be about the past/)
    expect(text()).toMatch(/trusted timestamp or archival renewal/)
  })

  it('teaches verification-trust migration and lead time, and gives no reliable CRQC-day deadline', () => {
    render(<ForgeryRiskPanel />)
    expect(text()).not.toMatch(/migrate signatures by CRQC-day/)
    expect(text()).not.toMatch(/the deadline is the CRQC arrival date itself/)
    expect(text()).toMatch(/migration of verification trust/)
    expect(text()).toMatch(/No CRQC arrival date is reliable enough to serve as the deadline/)
    expect(text()).toMatch(/start the long-lead signature work well before any scenario date/)
  })

  it('states harvest exposure as conditional on a quantum-vulnerable key exchange and a CRQC', () => {
    render(<ForgeryRiskPanel />)
    expect(text()).not.toMatch(/Data is being harvested today/)
    expect(text()).toMatch(/could be decrypted later if a CRQC exists/)
  })
})
