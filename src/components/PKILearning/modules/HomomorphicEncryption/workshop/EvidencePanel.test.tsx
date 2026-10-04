// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EvidencePanel } from './EvidencePanel'
import { EvidenceLine } from './FheHsmFlows'
import { FHE_HSM_FLOWS } from '../data/fheHsmFlows'
import { EVIDENCE_MANIFEST, validationsFor } from '@/data/fhe/fheEvidence'

const flow = FHE_HSM_FLOWS.find((f) => f.id === 'tfhe-single-hsm')!
const step = flow.steps.find((s) => validationsFor(flow.id, s.id).length > 0)!
const badges = validationsFor(flow.id, step.id)

describe('EvidenceLine: the Validated badge opens the results panel', () => {
  it('is a button now, not a link that opens a raw file in a new tab', () => {
    render(<EvidenceLine flow={flow} step={step} />)
    const b = screen.getByRole('button', { name: badges[0].label })
    expect(b).toHaveAttribute('aria-haspopup', 'dialog')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('click shows the panel with its raw-files link; Escape closes it', () => {
    render(<EvidenceLine flow={flow} step={step} />)
    fireEvent.click(screen.getByRole('button', { name: badges[0].label }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: badges[0].label })).toBeInTheDocument()
    const first = badges[0].record.artifacts[0]
    expect(
      within(dialog).getAllByRole('link', { name: new RegExp(first.name) })[0]
    ).toHaveAttribute('href', first.url)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('EvidencePanel', () => {
  const record = EVIDENCE_MANIFEST.records[0]

  it('shows the headline and a key-numbers table when the record has a summary', () => {
    render(
      <EvidencePanel
        open
        onClose={() => {}}
        label="fixture badge"
        record={{
          ...record,
          summary: {
            headline: 'Ran end to end: 5 of 5 correct.',
            keyNumbers: [{ label: 'Job time', value: '42.7', unit: 's' }],
          },
        }}
      />
    )
    expect(screen.getByText('Ran end to end: 5 of 5 correct.')).toBeInTheDocument()
    const row = screen.getByRole('row', { name: /Job time/ })
    expect(within(row).getByText('42.7 s')).toBeInTheDocument()
  })

  it('without a summary: no key-numbers table, but the structured facts and raw files show', () => {
    render(
      <EvidencePanel
        open
        onClose={() => {}}
        label="fixture badge"
        record={{ ...record, summary: undefined }}
      />
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()
    expect(screen.getByText(/Raw files:/)).toBeInTheDocument()
  })

  it('the close button and the backdrop both close it', () => {
    const onClose = vi.fn()
    render(<EvidencePanel open onClose={onClose} label="x" record={record} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close results' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
