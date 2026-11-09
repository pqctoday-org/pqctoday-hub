// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'fs'
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

describe('System TLS configurator: Ubuntu OpenSSL facts', () => {
  // The OS filter is a dropdown, so the Ubuntu block is checked in the source.
  const src = readFileSync(
    'src/components/PKILearning/modules/OSPQC/workshop/SystemTLSConfigurator.tsx',
    'utf-8'
  )
  const ubuntu = src.slice(src.indexOf('  ubuntu: {'), src.indexOf('  windows: {'))

  it('states the 24.04 and 26.04 OpenSSL versions and the OpenSSL 3.5.0 requirement', () => {
    expect(ubuntu).toContain('Ubuntu 24.04 LTS ships OpenSSL 3.0.13')
    expect(ubuntu).toContain('Ubuntu 26.04 LTS ships OpenSSL 3.5.5')
    expect(ubuntu).toContain('needs OpenSSL 3.5.0 or later')
  })

  it('does not teach OpenSSL 3.2, crypto-policies, an oqsprovider install or an unsourced key-share sample', () => {
    expect(ubuntu).not.toMatch(/OpenSSL 3\.2|oqsprovider|update-crypto-policies|Ubuntu 25\.10/)
    expect(ubuntu).not.toMatch(/Server Temp Key: X25519MLKEM768, 1152 bits/)
  })

  it('verifies the negotiated group with stdin closed on every OS block (OpenSSL 3.5+ prints no Server Temp Key line)', () => {
    expect(src).not.toMatch(/grep "Server Temp Key"/)
    expect(src.split('</dev/null 2>&1').length - 1).toBe(4)
    expect(src.split('| grep -E "Negotiated TLS1.3 group|Peer Temp Key"').length - 1).toBe(4)
    expect(ubuntu).toContain(
      'Expected on OpenSSL 3.5.0 or later: Negotiated TLS1.3 group: X25519MLKEM768'
    )
  })

  it('restarts a named service instead of showing the OpenSSL directory query', () => {
    expect(ubuntu).toContain('$ sudo systemctl restart <service>')
    expect(ubuntu).not.toContain('openssl version -d')
  })

  it('labels the Ubuntu choice "Ubuntu 24.04 / 26.04 LTS" in the selector and the config', () => {
    expect(src).toContain("{ id: 'ubuntu', label: 'Ubuntu 24.04 / 26.04 LTS' }")
    expect(ubuntu).toContain("label: 'Ubuntu 24.04 / 26.04 LTS'")
  })
})
