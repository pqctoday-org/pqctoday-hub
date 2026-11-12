// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { CandidateComparator } from './CandidateComparator'
import { CandidatesExercises } from '../components/CandidatesExercises'
import { CANDIDATES, getCandidate } from '../data/candidates'
import { FamilyMathExplainer } from './FamilyMathExplainer'

const candidateRow = (name: string) => screen.getByRole('cell', { name }).closest('tr')!

describe('FAEST v3.0 paired size example', () => {
  it('renders the exact FAEST-128f signature/combined bytes and the retained SQIsign comparison', () => {
    render(<CandidateComparator initialCandidateId="faest" />)
    const faest = within(candidateRow('FAEST'))
    expect(faest.getByRole('cell', { name: '5,170' })).toBeInTheDocument()
    expect(faest.getByRole('cell', { name: '5,202' })).toBeInTheDocument()
    expect(faest.getByRole('link', { name: 'Spec' })).toHaveAttribute(
      'href',
      'https://faest.info/faest-spec-v3.0.pdf'
    )
    expect(within(candidateRow('SQIsign')).getByRole('cell', { name: '213' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: '6,336' })).not.toBeInTheDocument()
    const order = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(order).toEqual([
      'SQIsign',
      'SNOVA',
      'MAYO',
      'HAWK',
      'MQOM',
      'SDitH',
      'FAEST',
      'QR-UOV',
      'UOV',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Long-lived offline keys' }))
    expect(screen.getByText(/Size example: FAEST v3.0 FAEST-128f/)).toHaveTextContent(
      '32-byte serialized private key (16-byte x plus 16-byte k)'
    )
    expect(getCandidate('faest')).toMatchObject({
      publicKeyBytes: 32,
      privateKeyBytes: 32,
      signatureBytes: 5170,
    })
  })

  it('keeps the exercise handoff and makes both wire-size and private-key representation comparisons explicit', () => {
    const navigate = vi.fn(),
      configure = vi.fn()
    render(<CandidatesExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={configure} />)
    const exercise = screen
      .getByRole('heading', { name: '2. SQIsign vs FAEST — bandwidth vs CPU' })
      .closest('.glass-panel')
    if (!(exercise instanceof HTMLElement)) throw new Error('Missing exercise panel')
    expect(
      within(exercise).getByText(/FAEST v3.0 FAEST-128f \(5,170-byte signature\)/)
    ).toBeInTheDocument()
    const explanation = within(exercise).getByText(/65 \+ 148 = 213/)
    expect(explanation).toHaveTextContent('32 + 5,170 = 5,202')
    expect(explanation).toHaveTextContent('16-byte x plus 16-byte k = 32 bytes')
    expect(explanation).toHaveTextContent('24-byte compact seed')
    expect(explanation).toHaveTextContent('This does not measure CPU cost')
    // Independent arithmetic checks: an AES secret alone is not the serialized key.
    expect(65 + 148).toBe(213)
    expect(32 + 5170).toBe(5202)
    expect(16 + 16).toBe(getCandidate('faest')!.privateKeyBytes)
    expect(getCandidate('mayo')!.privateKeyBytes).toBe(24)
    expect(getCandidate('faest')!.privateKeyBytes).toBeGreaterThan(
      getCandidate('mayo')!.privateKeyBytes
    )
    fireEvent.click(within(exercise).getByRole('button', { name: 'Open in workshop' }))
    expect(configure).toHaveBeenCalledWith({ step: 2, candidateId: 'sqisign' })
    expect(navigate).toHaveBeenCalledOnce()
  })

  it('preserves the other eight retained candidate size examples', () => {
    const before = {
      mqom: [80, 128, 3540],
      sdith: [70, 163, 3705],
      uov: [66000, 237000, 96],
      mayo: [1168, 24, 321],
      'qr-uov': [24255, 32, 200],
      snova: [1016, 48, 248],
      sqisign: [65, 353, 148],
      hawk: [1024, 2480, 555],
    }
    expect(CANDIDATES.filter((c) => c.id !== 'faest')).toHaveLength(8)
    for (const [id, sizes] of Object.entries(before)) {
      const candidate = getCandidate(id)!
      expect(
        [candidate.publicKeyBytes, candidate.privateKeyBytes, candidate.signatureBytes],
        id
      ).toEqual(sizes)
    }
  })

  it('keeps the displayed family range equal to the actual three comparator signature values', () => {
    const view = render(<CandidateComparator />)
    fireEvent.click(screen.getByRole('button', { name: 'MPC-in-the-Head' }))
    const signatures = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => Number(within(row).getAllByRole('cell')[3].textContent!.replaceAll(',', '')))
    expect(signatures.sort((a, b) => a - b)).toEqual([3540, 3705, 5170])
    expect(Math.max(...signatures)).toBe(5170)
    view.unmount()
    render(<FamilyMathExplainer initialFamilyId="mpcith" />)
    expect(
      screen.getByText(/3,540 to 5,170 bytes at the sizes shown in the comparator/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/3.5 to 6.3 KB/)).not.toBeInTheDocument()
  })
})
