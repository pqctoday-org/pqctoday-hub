// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MitigateMigrateWizard } from './MitigateMigrateWizard'
import type { CbomExportItem } from '../data/workshopTypes'

function answer(values: boolean[]) {
  for (const [index, value] of values.entries()) {
    fireEvent.click(screen.getAllByRole('button', { name: value ? 'Yes' : 'No' })[index])
  }
  fireEvent.click(screen.getByRole('button', { name: 'Show planning suggestion' }))
}
function start(asset: RegExp) {
  render(<MitigateMigrateWizard cbomAssets={[]} />)
  fireEvent.click(screen.getByRole('button', { name: asset }))
  fireEvent.click(screen.getByRole('button', { name: 'Start Assessment' }))
}

describe('direct replacement prerequisites and operation scope', () => {
  it.each([
    [false, true, true, true, false],
    [true, false, true, true, true],
    [false, false, true, true, true],
  ])('does not let secondary answers override a direct prerequisite: %j', (...values) => {
    start(/Legacy PKI system/)
    answer(values)
    expect(screen.getByText('PLANNING SUGGESTION: EXPLORE MITIGATION')).toBeInTheDocument()
    expect(screen.queryByText('PLANNING SUGGESTION: EXPLORE MIGRATION')).not.toBeInTheDocument()
    expect(screen.getByText('Direct replacement prerequisites missing:')).toBeInTheDocument()
    expect(screen.getByText(/Other Yes answers cannot override/)).toHaveTextContent(
      'Supported supplier upgrades, full replacement and exit planning remain separate options'
    )
    expect(screen.getByText(/of 5 answers favour direct replacement/)).toHaveTextContent(
      `${values.filter(Boolean).length} of 5`
    )
  })

  it('works through the authored signing sample without prescribing TLS for artifact trust', () => {
    start(/Code signing pipeline/)
    answer([false, true, true, true, false])
    expect(screen.getByText(/In this authored code-signing sample/)).toHaveTextContent(
      'A TLS gateway does not replace those artifact signatures or update consumer trust'
    )
    expect(screen.getByText(/Map the issuer or signing key/)).toBeInTheDocument()
    expect(screen.getByText(/Test new sample certificates or signed artifacts/)).toHaveTextContent(
      'altered-object and untrusted-key rejection'
    )
    expect(screen.queryByText('Transport gateway example to evaluate')).not.toBeInTheDocument()
  })

  it('retains a scoped transport example for an authored connection', () => {
    start(/TLS Load Balancer/)
    answer([false, true, true, true, false])
    expect(screen.getByText('Transport gateway example to evaluate')).toBeInTheDocument()
    expect(
      screen.getByText(/This authored sample identifies a transport connection/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Test both external and internal legs/)).toHaveTextContent(
      'a cipher-suite name alone does not establish PQC key exchange'
    )
  })

  it('does not infer an imported record purpose from a signing or PKI keyword', () => {
    const assets = [
      { name: 'Legacy PKI code signing', version: 'sample', notes: 'Unclassified purpose' },
    ] as CbomExportItem[]
    render(<MitigateMigrateWizard cbomAssets={assets} />)
    fireEvent.click(screen.getByRole('button', { name: /Legacy PKI code signing/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start Assessment' }))
    answer([false, true, true, true, false])
    expect(
      screen.getByText(/The selected record does not establish its cryptographic purpose/)
    ).toHaveTextContent('no gateway design is selected from its name or notes')
    expect(screen.queryByText(/In this authored PKI sample/)).not.toBeInTheDocument()
    expect(screen.queryByText(/In this authored code-signing sample/)).not.toBeInTheDocument()
    expect(assets[0].notes).toBe('Unclassified purpose')
  })
})
