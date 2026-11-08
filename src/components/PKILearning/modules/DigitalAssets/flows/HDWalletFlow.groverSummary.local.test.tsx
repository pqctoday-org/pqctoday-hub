// SPDX-License-Identifier: AGPL-3.0-only
import { Button } from '@/components/ui/button'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HDWalletFlow } from './HDWalletFlow'

const { generated } = vi.hoisted(() => ({ generated: { output: '' } }))
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => ({ isReady: false }) }))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('../components/StepWizard', () => ({
  StepWizard: ({ onExecute }: { onExecute: () => Promise<void> }) => (
    <Button onClick={onExecute}>Generate final explanation only</Button>
  ),
}))
vi.mock('../hooks/useStepWizard', () => ({
  useStepWizard: () => ({
    currentStep: 4,
    output: null,
    isExecuting: false,
    error: null,
    isStepComplete: false,
    execute: async (action: () => Promise<string>) => {
      generated.output = await action()
    },
    handleNext: vi.fn(),
    handleBack: vi.fn(),
    setError: vi.fn(),
  }),
}))

describe('Wallet generic-search summary', () => {
  it('generates the qualified quadratic-query explanation without executing earlier key steps', async () => {
    generated.output = ''
    render(<HDWalletFlow onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate final explanation only' }))
    await waitFor(() => expect(generated.output).toContain('quadratically fewer queries'))
    expect(generated.output).toContain('not a twofold speedup')
    expect(generated.output).toContain('circuit resources and parallelization')
    expect(generated.output).toContain('not a proof of seed security')
    expect(generated.output).toContain('does not assess seed entropy or handling')
    expect(generated.output).not.toContain('Your mnemonic and seed are safe')
    expect(generated.output).not.toContain('2× speedup')
  })
})
