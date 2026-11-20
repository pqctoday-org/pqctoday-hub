// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskRegisterBuilderStandalone } from '@/components/BusinessCenter/adapters/RiskRegisterBuilderStandalone'
import { useRiskRegisterStore } from '@/store/useRiskRegisterStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { bankRiskEntries } from './executiveBankCase'
import { setAutoRunFill } from './autoRunFill'

afterEach(() => setAutoRunFill(false))

describe('bank risk presentation', () => {
  it('shows the three-service sample without replacing saved learner entries', () => {
    const saved = [{ ...bankRiskEntries()[0], id: 'saved', assetName: 'Saved learning exercise' }]
    useRiskRegisterStore.getState().setRiskEntries(saved)
    useSimulationStore.setState({ sector: 'financial' })
    setAutoRunFill(true, true)
    render(<RiskRegisterBuilderStandalone />)
    expect(screen.getByDisplayValue('Customer portal — connection confidentiality')).toBeVisible()
    expect(
      screen.getByDisplayValue(
        'Records archiving and retrieval service — long-lived records and recovery'
      )
    ).toBeVisible()
    expect(
      screen.getByDisplayValue('Software signing service — release authenticity and trust')
    ).toBeVisible()
    expect(useRiskRegisterStore.getState().riskEntries).toEqual(saved)
    // Each algorithm dropdown is named per entry; its current value is the visible text.
    ;(['ECDH / X25519', 'RSA-2048', 'ECDSA P-256'] as const).forEach((algorithm, i) => {
      const trigger = screen.getByRole('button', { name: `Current algorithm for entry ${i + 1}` })
      expect(trigger).toBeVisible()
      expect(trigger).toHaveTextContent(algorithm)
    })
  })
})
