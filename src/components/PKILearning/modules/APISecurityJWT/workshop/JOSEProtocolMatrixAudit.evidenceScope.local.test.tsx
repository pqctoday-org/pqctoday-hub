// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, it, vi } from 'vitest'
import { JOSEProtocolMatrixAudit } from './JOSEProtocolMatrixAudit'

vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: ({
    label,
    authorityNote,
    specs,
  }: {
    label: string
    authorityNote: string
    specs: { id: string; useCase: string; kind: { type: string } }[]
  }) => (
    <section aria-label="Primitive evidence contract">
      <h4>{label}</h4>
      <p>{authorityNote}</p>
      <ul>
        {specs.map((spec) => (
          <li key={spec.id}>
            {spec.kind.type}: {spec.useCase}
          </li>
        ))}
      </ul>
    </section>
  ),
}))

it('attributes the actual mixed primitive cases without granting all rows external expected answers', async () => {
  render(
    <MemoryRouter>
      <JOSEProtocolMatrixAudit />
    </MemoryRouter>
  )
  const panel = within(screen.getByRole('region', { name: 'Primitive evidence contract' }))
  await waitFor(() => expect(panel.getAllByRole('listitem')).toHaveLength(4))
  expect(panel.getAllByText(/mldsa-functional:/)).toHaveLength(2)
  expect(panel.getByText(/mlkem-encap-roundtrip:/)).toBeInTheDocument()
  expect(panel.getByText(/hmac-verify:/)).toBeInTheDocument()
  expect(panel.getByText(/Only the HMAC-SHA256 row checks/)).toHaveTextContent(
    'they do not compare an output with a NIST expected answer'
  )
  expect(panel.queryByText(/our primitive output matches NIST/)).not.toBeInTheDocument()
  expect(panel.getByRole('heading')).toHaveTextContent('functional round-trips and HMAC')
})
