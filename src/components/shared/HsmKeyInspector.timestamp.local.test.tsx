// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HsmKeyInspector } from './HsmKeyInspector'
import type { HsmKey } from '@/hooks/useHSM'
const row: HsmKey = {
  handle: 7,
  slotId: 1,
  uniqueId: '74735f6578616d706c65',
  family: 'ml-dsa',
  role: 'public',
  label: 'Fictional public key',
  generatedAt: '2026-11-12T04:00:00.000Z',
}
const refs = { moduleRef: { current: null }, hSessionRef: { current: 0 } }
describe('HSM key timestamp display semantics', () => {
  it('preserves the Generated label and supplied timestamp for existing callers', () => {
    render(<HsmKeyInspector keys={[row]} {...refs} />)
    expect(screen.getByRole('columnheader', { name: 'Generated' })).toBeInTheDocument()
    expect(screen.getByText(row.generatedAt)).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Imported' })).not.toBeInTheDocument()
  })
  it('labels the actual captured-key import event without claiming generation', () => {
    render(
      <HsmKeyInspector
        keys={[row]}
        {...refs}
        timestampLabel="Imported"
        title="Imported sample public keys"
      />
    )
    expect(screen.getByRole('columnheader', { name: 'Imported' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Generated' })).not.toBeInTheDocument()
    expect(screen.getByText(row.generatedAt)).toBeInTheDocument()
  })
  it('does not invent a date when the caller has no recorded timestamp', () => {
    render(
      <HsmKeyInspector keys={[{ ...row, generatedAt: '' }]} {...refs} timestampLabel="Imported" />
    )
    expect(screen.getByText('Not recorded')).toBeInTheDocument()
    expect(screen.queryByText(row.generatedAt)).not.toBeInTheDocument()
  })
})
