// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AuditEvent } from '@/wasm/kmip/kmipEngine'
import { AuditTrailPanel } from './AuditTrailPanel'

const EVENTS: AuditEvent[] = [
  {
    ts: '2026-10-16T10:00:00Z',
    plane: 'p2',
    correlation_id: 'transaction-123',
    event: { type: 'KmipRequestReceived', op: 'CreateKeyPair' },
  },
  {
    ts: '2026-10-16T10:00:01Z',
    plane: 'p1',
    correlation_id: 'transaction-123',
    event: { type: 'PolicyDecided', outcome: { type: 'Allow' } },
  },
  {
    ts: '2026-10-16T10:00:02Z',
    plane: 'p3',
    correlation_id: 'transaction-123',
    event: { type: 'Pkcs11Call', function: 'C_GenerateKeyPair' },
  },
]

describe('AuditTrailPanel responsive representations', () => {
  it('keeps comparative desktop lanes and an ordered mobile causal timeline', () => {
    render(<AuditTrailPanel events={EVENTS} detailed={false} />)

    expect(screen.getByTestId('kmip-audit-desktop-lanes')).toBeInTheDocument()
    const timeline = screen.getByTestId('kmip-audit-mobile-timeline')
    const items = within(timeline).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('CreateKeyPair')
    expect(items[1]).toHaveTextContent('decision: Allow')
    expect(items[2]).toHaveTextContent('HSM ran C_GenerateKeyPair')
  })
})
