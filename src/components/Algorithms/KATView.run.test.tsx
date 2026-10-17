// SPDX-License-Identifier: AGPL-3.0-only
/** KAT tile run outcome: success styling, live announcement and focus. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    initialize: vi.fn(),
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    keys: [],
    removeKey: vi.fn(),
    clearKeys: vi.fn(),
  }),
}))

const mockRunKAT = vi.fn()
vi.mock('@/utils/katRunner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/katRunner')>()
  return {
    ...actual,
    runKAT: (...args: unknown[]) => mockRunKAT(...args),
    advertisedMechanisms: () => new Set<number>(),
  }
})

import { KATView } from './KATView'
import { ML_KEM_TILES } from './katTileConfig'

const tile = ML_KEM_TILES[0]

function tileEl() {
  return screen.getByRole('heading', { name: tile.name }).closest('div')!.parentElement!
}

function runWith(status: 'pass' | 'skip' | 'fail') {
  mockRunKAT.mockImplementation(async (_m: unknown, _s: unknown, spec?: { id: string }) => ({
    id: spec?.id,
    useCase: spec?.id,
    algorithm: tile.name,
    standard: tile.standard,
    referenceUrl: tile.fipsUrl,
    status,
    details: status,
  }))
}

describe('KATView — run outcome', () => {
  beforeEach(() => mockRunKAT.mockReset())

  it('a run where every check passed is shown as a success and announced', async () => {
    runWith('pass')
    render(<KATView />)
    const button = within(tileEl()).getByRole('button', { name: /Run/ })
    button.focus()
    fireEvent.click(button)
    const counts = await within(tileEl()).findByTestId('kat-counts')
    expect(counts).toHaveAttribute('data-tone', 'success')
    const status = within(tileEl()).getByTestId('kat-run-status')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent(
      `${tile.name}: ${tile.specs.length} of ${tile.specs.length} checks passed.`
    )
    await waitFor(() => expect(button).not.toBeDisabled())
    expect(document.activeElement).toBe(button)
  })

  it('a run with zero passes is never shown as a success', async () => {
    runWith('skip')
    render(<KATView />)
    fireEvent.click(within(tileEl()).getByRole('button', { name: /Run/ }))
    const counts = await within(tileEl()).findByTestId('kat-counts')
    expect(counts).toHaveTextContent(`0/0 passed · ${tile.specs.length} not tested`)
    expect(counts).toHaveAttribute('data-tone', 'warning')
    expect(counts).not.toHaveClass('text-status-success')
  })

  it('a failed check is shown as an error', async () => {
    runWith('fail')
    render(<KATView />)
    fireEvent.click(within(tileEl()).getByRole('button', { name: /Run/ }))
    const counts = await within(tileEl()).findByTestId('kat-counts')
    expect(counts).toHaveAttribute('data-tone', 'error')
  })

  it('the diagnostics header wraps instead of overlapping on narrow screens', () => {
    render(<KATView />)
    const header = screen.getByRole('button', { name: /PKCS#11 Diagnostics/ })
    expect(header).toHaveClass('flex-wrap', 'whitespace-normal')
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })
})
