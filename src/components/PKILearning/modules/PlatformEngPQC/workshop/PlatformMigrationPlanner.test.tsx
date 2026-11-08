// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlatformMigrationPlanner } from './PlatformMigrationPlanner'

const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

function openRollbackTree() {
  render(<PlatformMigrationPlanner />)
  fireEvent.click(screen.getByRole('button', { name: /Rollback Decision Tree/ }))
}
const answer = (label: 'Yes' | 'No') => fireEvent.click(screen.getByRole('button', { name: label }))

describe('Platform migration planner: rollback guidance', () => {
  it('does not promise that the X25519 fallback is automatic or that the change is non-breaking', () => {
    render(<PlatformMigrationPlanner />)
    // phase 2 depends on phase 0, so complete phase 0 first
    fireEvent.click(screen.getAllByRole('button', { name: /^Mark .* complete$/ })[0])
    fireEvent.click(screen.getByText(/TLS Key Exchange \(X25519MLKEM768\)/))
    const t = text()
    expect(t).not.toMatch(/fallback is automatic/)
    expect(t).not.toMatch(/No breaking change/)
    expect(t).toMatch(/exists only because the Helm values above also list X25519 and P-256/)
    expect(t).toMatch(
      /configuration choice and a policy trade-off, not an automatic property of the hybrid/
    )
    expect(t).toMatch(/test with your own clients, proxies and load balancers/)
    expect(t).toMatch(
      /key exchange \(confidentiality\); certificate signatures are a separate risk/
    )
  })

  it('treats a key-exchange revert as a policy trade-off, not as a non-breaking removal', () => {
    openRollbackTree()
    answer('Yes') // handshake failures
    answer('Yes') // key exchange
    answer('Yes') // clients support TLS 1.3
    const t = text()
    expect(t).not.toMatch(/non-breaking/)
    expect(t).toMatch(
      /temporary policy trade-off: sessions fall back to classical-only key exchange/
    )
    expect(t).toMatch(/affects key exchange only; certificate signatures are a separate matter/)
  })

  it('renews a certificate with cmctl and confirms the new certificate, with no unsupported annotation', () => {
    openRollbackTree()
    answer('Yes') // handshake failures
    answer('No') // certificate validation rather than key exchange
    answer('No') // not signed by the new CA
    const t = text()
    expect(t).not.toMatch(/issue-once/)
    expect(t).not.toMatch(/kubectl annotate cert/)
    expect(t).toMatch(/cmctl renew \{name\} -n \{namespace\}/)
    expect(t).toMatch(/cmctl status certificate \{name\} -n \{namespace\}/)
    expect(t).toMatch(/check its issuer and signature algorithm/)
  })

  it('keeps the signing exception separate from the key-exchange decision', () => {
    openRollbackTree()
    answer('Yes')
    answer('No')
    answer('Yes') // signed by the new CA, so the client cannot validate it
    const t = text()
    expect(t).toMatch(
      /documented, time-limited exception with its own forgery risk, separate from the key-exchange decision/
    )
  })
})

describe('Platform migration planner: certificate monitoring wording', () => {
  it('inventories certificate algorithms from a documented source instead of prescribing exporter alert rules', () => {
    render(<PlatformMigrationPlanner />)
    const t = text()
    expect(t).not.toMatch(/Prometheus alert rules/)
    expect(t).toMatch(/Inventory certificate algorithms from a documented source/)
    expect(t).toMatch(/expiry metrics do not carry the key algorithm/)
  })

  it('does not send a healthy rollback outcome to exporter alerts for algorithm drift', () => {
    openRollbackTree()
    answer('No') // no handshake failures
    answer('No') // no admission blocks
    const t = text()
    expect(t).not.toMatch(/Check Prometheus alerts for non-PQC cert drift/)
    expect(t).toMatch(/expiry metrics do not carry the key algorithm/)
    expect(t).toMatch(/a missing algorithm stays Unknown/)
  })
})
