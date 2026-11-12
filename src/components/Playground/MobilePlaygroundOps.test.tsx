// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, MemoryRouter } from 'react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

const caps = vi.hoisted(() => ({ sab: true, lowMemory: false }))
const keys = vi.hoisted(() => ({ render: vi.fn() }))
vi.mock('@/hooks/useDeviceCapabilities', () => ({ useDeviceCapabilities: () => caps }))
vi.mock('./PlaygroundProvider', () => ({
  PlaygroundProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('./contexts/SettingsContext', () => ({
  useSettingsContext: () => ({ executionMode: 'mock', wasmLoaded: false }),
}))
vi.mock('./hsm/HsmContext', () => ({
  useHsmContext: () => ({ hsmLog: [], clearHsmLog: () => {} }),
}))
vi.mock('./tabs/KemOpsTab', () => ({ KemOpsTab: () => <p>KEM screen</p> }))
vi.mock('./tabs/SignVerifyTab', () => ({ SignVerifyTab: () => <p>Sign screen</p> }))
vi.mock('./tabs/KeyStoreTab', () => ({
  KeyStoreTab: () => {
    keys.render()
    return <p>Existing Key Store panel</p>
  },
}))
vi.mock('./tabs/WorkshopToolsTab', () => ({ WorkshopToolsTab: () => <p>Crypto Lab screen</p> }))
vi.mock('../shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('./MobilePlaygroundView', () => ({ MobilePlaygroundView: () => <p>Info view</p> }))

import { MobilePlaygroundOps } from './MobilePlaygroundOps'

beforeEach(() => {
  caps.sab = true
  caps.lowMemory = false
  keys.render.mockClear()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
})
const at = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Link to="?tab=sign_verify">Open signing link</Link>
      <Link to="?tab=keystore">Open keys link</Link>
      <MobilePlaygroundOps />
    </MemoryRouter>
  )

describe('phone access to the existing Key Store', () => {
  it.each([
    '/playground/interactive?launchAlgo=Classic-McEliece-348864&algo=Classic-McEliece-348864&tab=keystore',
    '/playground/interactive?launchAlgo=ECDH+P-256&tab=keystore',
  ])(
    'opens Keys for a supported exact launch without a false no-Key-Store warning: %s',
    async (url) => {
      at(url)
      expect(await screen.findByText('Existing Key Store panel')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keys' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.queryByRole('alert')).toBeNull()
    }
  )

  it('does not mount Keys until selected, supports keyboard access and unmounts it on leaving', async () => {
    const user = userEvent.setup()
    at('/playground/interactive')
    expect(keys.render).not.toHaveBeenCalled()
    expect(screen.queryByText('Existing Key Store panel')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'KEM' })).toHaveAttribute('aria-pressed', 'true')
    const button = screen.getByRole('button', { name: 'Keys' })
    button.focus()
    await user.keyboard(' ')
    expect(await screen.findByText('Existing Key Store panel')).toBeInTheDocument()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Crypto Lab' }))
    expect(screen.queryByText('Existing Key Store panel')).not.toBeInTheDocument()
    expect(screen.getByText('Crypto Lab screen')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign & Verify' }))
    expect(screen.getByRole('button', { name: 'Sign & Verify' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByText('Sign screen')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'KEM' }))
    expect(screen.getByText('KEM screen')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Selected execution mode' })).toHaveTextContent(
      'Mock'
    )
  })

  it('keeps inactive panels mounted but inert as each tab is activated', async () => {
    at('/playground/interactive')
    const panels = [
      ['KEM', 'KEM screen'],
      ['Sign & Verify', 'Sign screen'],
      ['Crypto Lab', 'Crypto Lab screen'],
      ['Keys', 'Existing Key Store panel'],
    ] as const
    for (const [active] of panels) {
      fireEvent.click(screen.getByRole('button', { name: active }))
      if (active === 'Keys') await screen.findByText('Existing Key Store panel')
      for (const [name, content] of panels) {
        if (name === 'Keys' && active !== 'Keys') continue
        // Panels have no accessible group of their own; check the actual containing inert boundary.
        // eslint-disable-next-line testing-library/no-node-access
        const panel = screen.getByText(content).parentElement
        expect(panel).not.toBeNull()
        if (name === active) expect(panel).not.toHaveAttribute('inert')
        else expect(panel).toHaveAttribute('inert')
      }
      expect(screen.getByRole('button', { name: active })).toHaveAttribute('aria-pressed', 'true')
    }
    // Retain the real Keys boundary to check it becomes inert after its lazy content unmounts.
    // eslint-disable-next-line testing-library/no-node-access
    const keysPanel = screen.getByText('Existing Key Store panel').parentElement
    fireEvent.click(screen.getByRole('button', { name: 'KEM' }))
    expect(keysPanel).toHaveAttribute('inert')
    expect(screen.queryByText('Existing Key Store panel')).not.toBeInTheDocument()
    expect(screen.getByText('KEM screen')).toBeInTheDocument()
  })

  it('honours sign_verify initially and both deep links after navigation', async () => {
    at('/playground/interactive?tab=sign_verify')
    expect(screen.getByRole('button', { name: 'Sign & Verify' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(keys.render).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'Open keys link' }))
    expect(await screen.findByText('Existing Key Store panel')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Open signing link' }))
    expect(screen.queryByText('Existing Key Store panel')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign & Verify' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('leaves unknown launch validation to the existing page-level reason', () => {
    at('/playground/interactive?launchAlgo=Not-An-Algorithm')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(keys.render).not.toHaveBeenCalled()
  })

  it('keeps the capability warning and mounts the requested Keys panel only after Continue Anyway', async () => {
    caps.sab = false
    at('/playground/interactive?launchAlgo=FN-DSA-512&algo=FN-DSA-512&tab=keystore')
    expect(screen.getByText('Limited Device Support')).toBeInTheDocument()
    expect(keys.render).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue Anyway' }))
    expect(await screen.findByText('Existing Key Store panel')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('truthfully names the requested algorithm when View Info chooses the noninteractive fallback', async () => {
    caps.lowMemory = true
    at('/playground/interactive?launchAlgo=ML-KEM-768&algo=ML-KEM-768&tab=keystore')
    fireEvent.click(screen.getByRole('button', { name: /View Info/ }))
    expect(await screen.findByText('Info view')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('ML-KEM-768')
    expect(screen.getByRole('alert')).toHaveTextContent('information-only view')
    expect(screen.getByRole('alert')).not.toHaveTextContent('has no Key Store')
    expect(keys.render).not.toHaveBeenCalled()
  })
})
