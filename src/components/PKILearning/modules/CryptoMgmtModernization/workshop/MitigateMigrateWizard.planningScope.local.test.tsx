// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { MitigateMigrateWizard } from './MitigateMigrateWizard'
import type { CbomExportItem } from '../data/workshopTypes'

const start = (assets: CbomExportItem[] = []) => {
  render(<MitigateMigrateWizard cbomAssets={assets} />)
  fireEvent.click(screen.getByRole('button', { name: /Legacy PKI system/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Start Assessment' }))
}
const answer = (values: boolean[]) => {
  values.forEach((yes, i) =>
    fireEvent.click(screen.getAllByRole('button', { name: yes ? 'Yes' : 'No' }).at(i)!)
  )
}

describe('majority wizard is a sample planning prompt, not feasibility', () => {
  it('keeps migration suggestion with a missing critical prerequisite, without claiming sufficient agility', () => {
    start()
    expect(
      screen.getByText('Q1. Is the source code available and actively maintained by your team?')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Source availability affects direct modification options/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/it does not establish that a live gateway is applicable or sufficient/)
    ).toBeInTheDocument()
    const show = screen.getByRole('button', { name: 'Show planning suggestion' })
    expect(show).toBeDisabled()
    answer([false, true, true, true, false])
    fireEvent.click(show)
    expect(screen.getByText('PLANNING SUGGESTION: EXPLORE MIGRATION')).toBeInTheDocument()
    expect(
      screen.getByText(/3 of 5 answers favour exploring direct algorithm replacement/)
    ).toHaveTextContent(
      'not a finding that the system has sufficient crypto agility or that migration is feasible'
    )
    expect(screen.getByText(/A missing prerequisite can outweigh the count/)).toHaveTextContent(
      'protocol/key-format interoperability'
    )
    expect(
      screen.getByText(
        /These examples are not an implementation or protocol profile selected for this asset/
      )
    ).toBeInTheDocument()
    for (const value of [
      'ML-KEM-768',
      'ML-DSA-65',
      'SLH-DSA-SHA2-128s',
      'TLS_AES_256_GCM_SHA384',
    ]) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('keeps mitigation/gateway comparison without claiming infeasibility or a demonstrated compensating control', () => {
    start()
    answer([false, true, false, true, false])
    fireEvent.click(screen.getByRole('button', { name: 'Show planning suggestion' }))
    expect(screen.getByText('PLANNING SUGGESTION: EXPLORE MITIGATION')).toBeInTheDocument()
    expect(screen.getByText(/2 of 5 answers favour direct replacement/)).toHaveTextContent(
      'does not establish that a gateway is feasible or that it reduces this asset’s risk'
    )
    expect(
      screen.queryByText(/Direct migration is not feasible at this time/)
    ).not.toBeInTheDocument()
    expect(screen.getByText('Gateway capabilities to evaluate')).toBeInTheDocument()
    expect(
      screen.getByText(/Which connections or operations would the gateway cover/)
    ).toBeInTheDocument()
    expect(screen.getByText(/§4.6 does not prescribe a sunset date/)).toHaveTextContent(
      'not a NIST deadline or a feasibility assessment'
    )
    expect(screen.getByText(/This is a paraphrase/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Explore another asset' }))
    expect(screen.getByRole('button', { name: 'Start Assessment' })).toBeDisabled()
  })

  it.each(Array.from({ length: 32 }, (_, mask) => mask))(
    'preserves the five-answer threshold and reported count for bitmask %i',
    (mask) => {
      start()
      const values = Array.from({ length: 5 }, (_, i) => Boolean(mask & (1 << i)))
      answer(values)
      const count = values.filter(Boolean).length
      fireEvent.click(screen.getByRole('button', { name: 'Show planning suggestion' }))
      expect(
        screen.getByText(
          count >= 3
            ? 'PLANNING SUGGESTION: EXPLORE MIGRATION'
            : 'PLANNING SUGGESTION: EXPLORE MITIGATION'
        )
      ).toBeInTheDocument()
      expect(screen.getByText(/of 5 answers favour/)).toHaveTextContent(
        `${count} of 5 answers favour`
      )
    }
  )

  it('preserves a supplied CBOM label and notes rather than inventing a checked architecture', () => {
    const assets = [
      { name: 'Fictional service', version: 'sample-v1', notes: 'Retained sample notes' },
    ] as CbomExportItem[]
    render(<MitigateMigrateWizard cbomAssets={assets} />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Fictional service (sample-v1) Retained sample notes' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Start Assessment' }))
    answer([true, true, true, true, true])
    fireEvent.click(screen.getByRole('button', { name: 'Show planning suggestion' }))
    expect(screen.getByText('Fictional service (sample-v1)')).toBeInTheDocument()
    expect(screen.getByText(/Hub guidance, not a NIST assessment/)).toBeInTheDocument()
    expect(assets).toEqual([
      { name: 'Fictional service', version: 'sample-v1', notes: 'Retained sample notes' },
    ])
  })
})
