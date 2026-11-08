// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CryptoMgmtModernizationModule } from './index'

// Expose the workshop step list that the module hands to its shell so the
// step descriptions can be read without driving the whole workshop UI.
vi.mock('@/components/PKILearning/common/ModuleShell', () => ({
  ModuleShell: (props: { workshopParts?: { id: string; description: string }[] }) => (
    <ul>
      {(props.workshopParts ?? []).map((part) => (
        <li key={part.id} data-testid={`part-${part.id}`}>
          {part.description}
        </li>
      ))}
    </ul>
  ),
}))

describe('CryptoMgmtModernization workshop step descriptions', () => {
  it('describes the CLM evaluator step as a practice scorecard of fictional profiles', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CryptoMgmtModernizationModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    const step = screen.getByTestId('part-clm-vendor-evaluator')
    expect(step).toHaveTextContent(
      'Interactive scorecard for practising how to evaluate fictional CLM platform profiles on PQC readiness criteria.'
    )
    expect(step).not.toHaveTextContent(/Venafi|AppViewX|Keyfactor/)
  })
})
