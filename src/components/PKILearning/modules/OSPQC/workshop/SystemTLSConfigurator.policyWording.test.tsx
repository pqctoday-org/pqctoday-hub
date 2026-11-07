// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SystemTLSConfigurator } from './SystemTLSConfigurator'

describe('System TLS configurator: RHEL crypto policy', () => {
  it('shows DEFAULT:PQ (RHEL 9.7) and the DEFAULT policy (RHEL 10.1+), never FUTURE', () => {
    const { container } = render(<SystemTLSConfigurator />)
    const before = container.textContent ?? ''
    expect(before).toMatch(/DEFAULT:PQ on RHEL 9\.7; the DEFAULT policy on RHEL 10\.1 and later/)
    expect(before).toMatch(/On RHEL 10\.1 and later the DEFAULT policy already enables and prefers/)
    fireEvent.click(screen.getByRole('button', { name: /Show After/ }))
    const after = container.textContent ?? ''
    expect(after).toContain('update-crypto-policies --set DEFAULT:PQ')
    expect(after).toMatch(
      /On RHEL 10\.1 and later no change is needed for applications that use\s+# OpenSSL, GnuTLS, NSS or Go/
    )
    expect(after).toContain('ECDHE-RSA-AES256-GCM-SHA384')
    for (const text of [before, after]) {
      expect(text).not.toMatch(/FUTURE|PQCONLY|HARDEN-LEGACY/)
    }
  })
})
