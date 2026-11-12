// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SystemTLSConfigurator } from './SystemTLSConfigurator'
import { ISOLATED_OPENSSL_CONFIG, OPENSSL_CONFIG_PROBE } from '../data/tlsProbeCommands'

function selectOS(name: string) {
  fireEvent.click(screen.getByRole('button', { name: /RHEL 9\.7 \/ 10\.1\+/ }))
  fireEvent.click(screen.getByRole('option', { name }))
}
function configText(): string {
  return screen.getByLabelText('TLS configuration commands').textContent ?? ''
}

describe('System TLS configurator: actual policy, configuration and negotiated result', () => {
  it('preserves RHEL release-specific PQ policy and retained TLS 1.2 compatibility', () => {
    const { container } = render(<SystemTLSConfigurator />)
    expect(container.textContent).toContain(
      'DEFAULT:PQ on RHEL 9.7; the DEFAULT policy on RHEL 10.1 and later'
    )
    expect(configText()).toContain('update-crypto-policies --show')
    expect(configText()).toContain(OPENSSL_CONFIG_PROBE)
    fireEvent.click(screen.getByRole('button', { name: /Show After/ }))
    const after = configText()
    expect(after).toContain('update-crypto-policies --set DEFAULT:PQ')
    expect(after).toMatch(/RHEL 10\.1 and later no policy change is needed/)
    expect(after).toContain('OpenSSL, GnuTLS, NSS or Go')
    expect(container.textContent).toContain('ECDHE-RSA-AES256-GCM-SHA384')
    expect(after).not.toMatch(/--set FUTURE|PQCONLY|HARDEN-LEGACY/)
    expect(after).toContain(OPENSSL_CONFIG_PROBE)
  })

  it('renders the real Ubuntu selection with an activated, complete isolated configuration', () => {
    const { container } = render(<SystemTLSConfigurator />)
    selectOS('Ubuntu 24.04 / 26.04 LTS')
    expect(container.textContent).toContain('Ubuntu 24.04 LTS ships OpenSSL 3.0.13')
    expect(container.textContent).toContain('Ubuntu 26.04 LTS ships OpenSSL 3.5.5')
    expect(configText()).toContain(OPENSSL_CONFIG_PROBE)
    fireEvent.click(screen.getByRole('button', { name: /Show After/ }))
    const after = configText()
    expect(after).toContain(ISOLATED_OPENSSL_CONFIG)
    expect(after).toContain(OPENSSL_CONFIG_PROBE)
    expect(after).toContain('openssl version -a')
    expect(after).toContain('sudo systemctl restart your-sample-service.service')
    expect(after).toContain('unreferenced section does not activate it')
    expect(after).toContain('unset OPENSSL_CONF')
    expect(after).not.toMatch(/update-crypto-policies|OpenSSL 3\.2|oqsprovider|1152 bits/)
  })

  it('checks fresh TLS 1.3 negotiation with verification and no client group override', () => {
    render(<SystemTLSConfigurator />)
    fireEvent.click(screen.getByRole('button', { name: /Show After/ }))
    const probe = configText().slice(configText().indexOf('TLS_HOST='))
    expect(probe).toContain('-tls1_3 -verify_return_error -verify_hostname "$TLS_HOST"')
    expect(probe).toContain('</dev/null >tls-check.txt 2>&1')
    expect(OPENSSL_CONFIG_PROBE).not.toMatch(/-groups\b|grep.*supported_groups/)
    expect(probe).toContain('Negotiated TLS1.3 group')
    expect(probe).toContain('tls_status=$?')
    expect(probe).toContain('exit "$tls_status"')
    expect(probe).toContain('classical fallback, not a hybrid success')
  })

  it('captures the Windows connection before inspecting the final ServerHello selection', () => {
    render(<SystemTLSConfigurator />)
    selectOS('Windows Server 2025')
    fireEvent.click(screen.getByRole('button', { name: /Show After/ }))
    const after = configText()
    expect(after).toContain('Enable-TlsEccCurve -Name "x25519_mlkem768" -Position 0')
    expect(after.indexOf('netsh trace start')).toBeLessThan(after.indexOf('DownloadString'))
    expect(after.indexOf('DownloadString')).toBeLessThan(after.indexOf('netsh trace stop'))
    expect(after).toContain('finally')
    expect(after).toContain('final ServerHello')
    expect(after).toContain('key_share selected group X25519MLKEM768 (0x11ec)')
    expect(after).toContain('offer alone is NOT evidence')
    expect(after).toContain('TLS 1.3 alone is NOT PQC-only')
    expect(after).not.toContain('(Check trace for X25519MLKEM768 in ClientHello supported_groups)')
  })
})
