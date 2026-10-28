// SPDX-License-Identifier: AGPL-3.0-only
//
// An exact algorithm launch (`?launchAlgo=`) on the phone layout of the
// interactive playground. The phone layout has no Key Store, where a launch
// generates its key pair, so it must say so and name the algorithm, never
// show its own defaults as if they were the requested algorithm (found in the
// 4.183.0 browser check: every phone launch landed on the KEM screen silently).
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

const caps = vi.hoisted(() => ({ sab: true, lowMemory: false }))
vi.mock('@/hooks/useDeviceCapabilities', () => ({ useDeviceCapabilities: () => caps }))
vi.mock('./PlaygroundProvider', () => ({
  PlaygroundProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('./hsm/HsmContext', () => ({
  useHsmContext: () => ({ hsmLog: [], clearHsmLog: () => {} }),
}))
vi.mock('./tabs/KemOpsTab', () => ({ KemOpsTab: () => <p>KEM screen</p> }))
vi.mock('./tabs/SignVerifyTab', () => ({ SignVerifyTab: () => <p>Sign screen</p> }))
vi.mock('./tabs/WorkshopToolsTab', () => ({ WorkshopToolsTab: () => null }))
vi.mock('../shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))

import { MobilePlaygroundOps } from './MobilePlaygroundOps'

const at = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobilePlaygroundOps />
    </MemoryRouter>
  )

describe('MobilePlaygroundOps: exact algorithm launches on a phone', () => {
  it('names the launched algorithm and says why it cannot run here', () => {
    at(
      '/playground/interactive?launchAlgo=Classic-McEliece-348864&algo=Classic-McEliece-348864&tab=keystore'
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No exact Classic-McEliece-348864 launch is available on a phone'
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Open this link on a wider screen')
  })

  it('does the same for a classical launch (the desktop picks it in the classical picker)', () => {
    at('/playground/interactive?launchAlgo=ECDH+P-256&tab=keystore')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No exact ECDH P-256 launch is available on a phone'
    )
  })

  it('shows nothing extra without a launch', () => {
    at('/playground/interactive')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('KEM screen')).toBeInTheDocument()
  })

  it('leaves an unknown launch to the page-level reason (no second message here)', () => {
    at('/playground/interactive?launchAlgo=Not-An-Algorithm')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('still names the launch on a device that gets the capability warning', () => {
    caps.sab = false
    try {
      at('/playground/interactive?launchAlgo=FN-DSA-512&algo=FN-DSA-512&tab=keystore')
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No exact FN-DSA-512 launch is available on a phone'
      )
      expect(screen.getByText('Limited Device Support')).toBeInTheDocument()
    } finally {
      caps.sab = true
    }
  })
})
