// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import { SettingsProvider } from './SettingsProvider'
import { useSettingsContext } from './SettingsContext'
import { algorithmLaunchHref } from '@/data/algorithmLaunch'
vi.mock('@/wasm/liboqs_dsa', () => ({ load: vi.fn().mockResolvedValue(true) }))
function Selection() {
  const s = useSettingsContext()
  return (
    <>
      <output>{`${s.algorithm}|${s.keySize}|${s.classicalAlgorithm}|${s.activeTab}`}</output>
      <span data-testid="execution-mode">{s.executionMode}</span>
    </>
  )
}
describe('exact interactive launch', () => {
  it.each([
    ['ML-KEM-1024', 'ML-KEM|1024|RSA-2048|keystore'],
    ['ML-DSA-44', 'ML-DSA|44|RSA-2048|keystore'],
    ['FN-DSA-1024', 'FN-DSA-1024|FN-DSA-1024|RSA-2048|keystore'],
    ['FrodoKEM-976', 'FrodoKEM-976-AES|FrodoKEM-976-AES|RSA-2048|keystore'],
    ['ECDSA P-384', 'ML-KEM|768|ECDSA-P384|keystore'],
    ['ECDH P-521', 'ML-KEM|768|P-521|keystore'],
  ])('selects %s in the real settings provider', async (name, selected) => {
    render(
      <MemoryRouter initialEntries={[algorithmLaunchHref(name)!]}>
        <SettingsProvider>
          <Selection />
        </SettingsProvider>
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(selected))
  })
})

it('uses real WASM when an exact launch follows an earlier mock session', async () => {
  sessionStorage.setItem('playground-execution-mode', 'mock')
  render(
    <MemoryRouter initialEntries={[algorithmLaunchHref('ML-KEM-768')!]}>
      <SettingsProvider>
        <Selection />
      </SettingsProvider>
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByTestId('execution-mode')).toHaveTextContent('wasm'))
})
