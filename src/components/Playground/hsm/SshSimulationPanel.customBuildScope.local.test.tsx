// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SshSimulationPanel } from './SshSimulationPanel'

vi.mock('./HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    isReady: false,
    autoInit: vi.fn(),
    hsmKeys: [],
    removeHsmKey: vi.fn(),
    clearHsmKeys: vi.fn(),
  }),
}))

describe('SSH native engine build attribution before any operation', () => {
  it('attributes the real-capable selection to a modified build, without executing a handshake', () => {
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    expect(screen.getByText('Runs the bundled, modified OpenSSH binary.')).toBeVisible()
    expect(
      screen.getByText(/This Hub build adds experimental post-quantum signature names/)
    ).toHaveTextContent('not an unmodified stock build')
    expect(screen.queryByText('Runs the real OpenSSH binary.')).not.toBeInTheDocument()
  })
})
