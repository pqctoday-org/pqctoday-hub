// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProviderPatternWorkshop } from './ProviderPatternWorkshop'
import { CODE_EXAMPLES } from '../data/codeExamplesData'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    slotRef: { current: 0 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/wasm/softhsm', () => ({}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))

describe('Luna Java integrations are described as two separate things', () => {
  it('shows the Luna JSP registration steps and says JCPROV is not registered as a provider', () => {
    render(<ProviderPatternWorkshop />)
    const pattern = screen.getByText(/Luna JSP \(JCA\): login/)
    expect(pattern).toHaveTextContent(
      'Security.insertProviderAt(new LunaProvider(), n); JCPROV (PKCS#11 wrapper) has no provider registration'
    )
    expect(
      screen.getByText(
        'Luna JSP is the JCA/JCE provider; JCPROV is a separate PKCS#11 wrapper and is not registered as a provider.'
      )
    ).toBeVisible()
    expect(screen.queryByText(/JCProv\.initialize/)).toBeNull()
    expect(screen.queryByText(/jcprovProvider/)).toBeNull()
    expect(screen.queryByText(/JCProv wraps PKCS#11 as a JCA provider/)).toBeNull()
  })
})

describe('PKCS#11 signing example does not promise the key never leaves hardware', () => {
  it('ties key export to its attributes and token policy', () => {
    const example = CODE_EXAMPLES.find((e) => e.apiId === 'pkcs11' && e.operation === 'sign')!
    expect(example.notes).toBe(
      'HSM performs the signing operation internally. Whether the key can leave the token depends on its CKA_EXTRACTABLE/CKA_SENSITIVE attributes and token policy.'
    )
    expect(CODE_EXAMPLES.some((e) => /never leaves hardware/i.test(e.notes ?? ''))).toBe(false)
  })
})
