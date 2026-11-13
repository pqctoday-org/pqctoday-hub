// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { SMIMECertViewer } from './SMIMECertViewer'
import { EmailSigningExercises } from '../components/EmailSigningExercises'
function row(name: string) {
  const match = screen.getAllByRole('row').find((r) => within(r).queryByRole('rowheader', { name }))
  if (!match) throw new Error(`Missing representation row: ${name}`)
  return within(match)
}
describe('Actual viewer measured comparison and exercise handoff', () => {
  it('renders whole publickey/certificate/CMS/MIME boundaries without universal5x guess', () => {
    render(<SMIMECertViewer />)
    expect(row('Complete SubjectPublicKeyInfo DER').getByText('422')).toBeVisible()
    expect(row('Complete SubjectPublicKeyInfo DER').getByText('1,974')).toBeVisible()
    expect(row('Complete certificate DER').getByText('1,101')).toBeVisible()
    expect(row('Complete certificate DER').getByText('5,524')).toBeVisible()
    expect(row('Complete opaque CMS SignedData DER').getByText('2,018')).toBeVisible()
    expect(screen.queryByText(/approximately 5x/)).not.toBeInTheDocument()
    expect(screen.queryByText('~1,200 bytes')).not.toBeInTheDocument()
  })
  it('real Subject/PEM controls change only their actual serialized boundaries', () => {
    render(<SMIMECertViewer />)
    const cms = row('Complete opaque CMS SignedData DER')
      .getAllByRole('cell')
      .map((c) => c.textContent)
    const mime = row('Complete MIME entity UTF-8')
      .getAllByRole('cell')
      .map((c) => Number(c.textContent?.replace(/,/g, '')))
    const originalSubject = (
      screen.getByLabelText('Unsigned outer MIME Subject') as HTMLInputElement
    ).value
    fireEvent.change(screen.getByLabelText('Unsigned outer MIME Subject'), {
      target: { value: originalSubject + 'é' },
    })
    expect(
      row('Complete MIME entity UTF-8')
        .getAllByRole('cell')
        .map((c) => Number(c.textContent?.replace(/,/g, '')))
    ).toEqual(mime.map((n) => n + 2))
    expect(
      row('Complete opaque CMS SignedData DER')
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(cms)
    fireEvent.click(screen.getByRole('button', { name: 'Certificate PEM line endings:' }))
    fireEvent.click(screen.getByRole('option', { name: 'CRLF' }))
    expect(
      within(screen.getByRole('button', { name: 'Certificate PEM line endings:' })).getByText(
        'CRLF'
      )
    ).toBeVisible()
    expect(row('Complete certificate PEM UTF-8').getByText('1,570')).toBeVisible()
    expect(row('Complete certificate DER').getByText('1,101')).toBeVisible()
  })
  it('retains actual extensionexample navigation and recovery to measuredview', () => {
    render(<SMIMECertViewer />)
    fireEvent.click(screen.getByRole('button', { name: 'S/MIME Extensions' }))
    expect(screen.getByText('Certificate Extension Examples')).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'RSA vs ML-DSA Fields' }))
    expect(row('Complete SubjectPublicKeyInfo DER').getByText('422')).toBeVisible()
  })
  it('paired exercise selects the real measuredviewer step and teaches boundary changes', () => {
    const set = vi.fn(),
      go = vi.fn()
    render(
      <MemoryRouter>
        <EmailSigningExercises onNavigateToWorkshop={go} onSetWorkshopConfig={set} />
      </MemoryRouter>
    )
    expect(screen.getByText('1. RSA vs ML-DSA Certificate Fields')).toBeVisible()
    expect(screen.getByText(/Compare the captured RSA-3072/)).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: /Load & Run/ }).at(0)!)
    expect(set).toHaveBeenCalledWith({ step: 0 })
    expect(go).toHaveBeenCalledOnce()
  })
})
