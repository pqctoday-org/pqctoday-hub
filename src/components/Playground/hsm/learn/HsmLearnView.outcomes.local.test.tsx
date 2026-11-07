// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { HsmLearnView } from './HsmLearnView'

const fixture = vi.hoisted(() => ({
  first: vi.fn(),
  second: vi.fn(),
  third: vi.fn(),
  expectRefusal: false,
}))
vi.mock('../HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    slotRef: { current: 0 },
    hsmLog: [],
    hsmLogRef: { current: [] },
    addHsmStepLog: vi.fn(),
  }),
}))
vi.mock('@/components/Playground/components/MiniPkcsLog', () => ({ MiniPkcsLog: () => null }))
vi.mock('@/components/Playground/keystore/HsmKeyTable', () => ({ HsmKeyTable: () => null }))
vi.mock('@/components/Playground/keystore/discoverHsmObjects', () => ({
  discoverHsmObjects: vi.fn(),
}))
vi.mock('./pkcs11Lessons', () => ({
  FOUNDATIONS_LESSONS: [
    {
      id: 'sample',
      n: 1,
      title: 'Sample lesson',
      tag: 'Core',
      tone: 'ok',
      blurb: '',
      setup: '',
      notes: [],
      whyItMatters: '',
      tryRef: [],
      steps: [
        {
          op: 'C_GenerateKey',
          label: 'Create a sample key',
          run: fixture.first,
          get expect() {
            return fixture.expectRefusal ? 'refusal' : 'success'
          },
        },
        { op: 'C_Sign', label: 'Use the sample key', run: fixture.second },
        { op: 'C_Verify', label: 'Verify the sample', run: fixture.third },
      ],
    },
  ],
}))
const show = () =>
  render(
    <MemoryRouter>
      <HsmLearnView onTryInWorkbench={() => {}} />
    </MemoryRouter>
  )

describe('HSM lesson outcomes and dependency recovery', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fixture.expectRefusal = false
    fixture.first.mockResolvedValue({ detail: 'key created' })
    fixture.second.mockResolvedValue({ detail: 'signed' })
    fixture.third.mockResolvedValue({ detail: 'verified' })
  })
  it('stops Run all after failure and retries before continuing', async () => {
    fixture.first.mockRejectedValueOnce(new Error('key creation failed'))
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('key creation failed')
    expect(fixture.second).not.toHaveBeenCalled()
    expect(fixture.third).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await waitFor(() => expect(fixture.third).toHaveBeenCalledTimes(1))
    expect(fixture.first).toHaveBeenCalledTimes(2)
  })
  it('does not treat unexpected success as an intended refusal', async () => {
    fixture.expectRefusal = true
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Unexpected success: this step required a specific refusal.')
    expect(screen.queryByText('Refused, as expected')).not.toBeInTheDocument()
    expect(fixture.second).not.toHaveBeenCalled()
  })
  it('prevents duplicate Run all calls while a step is pending', async () => {
    let finish!: (value: { detail: string }) => void
    fixture.first.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    show()
    const run = screen.getByRole('button', { name: 'Run all' })
    fireEvent.click(run)
    fireEvent.click(run)
    await waitFor(() => expect(fixture.first).toHaveBeenCalledTimes(1))
    finish({ detail: 'key created' })
    await waitFor(() => expect(fixture.third).toHaveBeenCalledTimes(1))
  })
})
