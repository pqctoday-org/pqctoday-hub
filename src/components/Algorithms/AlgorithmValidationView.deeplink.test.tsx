// SPDX-License-Identifier: AGPL-3.0-only
/** `?section=` write-back / re-read, `?attack=`, `?kat=` and `?polarity=` on the Validation tab. */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AlgorithmValidationView } from './AlgorithmValidationView'
import { matchAttackProfile, attackProfileId } from './attackDeepLink'
import { ATTACK_PROFILES } from '@/data/implementationAttackProfiles'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('./KATView', () => ({
  KATView: ({ katParam }: { katParam?: string | null }) => <div>kat {katParam ?? '-'}</div>,
}))
vi.mock('./CoverageMatrixView', () => ({
  CoverageMatrixView: ({ polarityParam }: { polarityParam?: string | null }) => (
    <div>coverage {polarityParam ?? '-'}</div>
  ),
}))

const sectionButton = (name: RegExp) => screen.getByRole('button', { name })

describe('matchAttackProfile', () => {
  it.each([
    ['ML-KEM-768', 'ML-KEM / Kyber'],
    ['ml-kem-768', 'ML-KEM / Kyber'],
    ['Kyber', 'ML-KEM / Kyber'],
    ['fn-dsa-512', 'FN-DSA / Falcon'],
    ['SLH-DSA-SHA2-128s', 'SLH-DSA / SPHINCS+'],
    ['Classic-McEliece-348864', 'Classic McEliece'],
    ['NTRU+-768', 'NTRU+'],
    ['NTRU+', 'NTRU+'],
    ['ntru-plus', 'NTRU+'],
    ['SPHINCS+', 'SLH-DSA / SPHINCS+'],
    ['LMS-SHA256 (H20/W8)', 'LMS / XMSS (Stateful Hash-Based)'],
    ['ECDSA P-256', 'RSA / ECDSA (Classical)'],
    ['ml-kem-kyber', 'ML-KEM / Kyber'],
  ])('%s → %s', (raw, algorithm) => {
    expect(matchAttackProfile(raw)?.algorithm).toBe(algorithm)
  })

  it('returns null for empty or unmatched values', () => {
    expect(matchAttackProfile(null)).toBeNull()
    expect(matchAttackProfile('Picnic-L1')).toBeNull()
  })

  it('does not let NTRU+ absorb plain NTRU or NTRU Prime', () => {
    expect(matchAttackProfile('NTRU')).toBeNull()
    expect(matchAttackProfile('ntruprime')).toBeNull()
    expect(matchAttackProfile('NTRU-HPS-2048-677')).toBeNull()
    expect(matchAttackProfile('sntrup761')).toBeNull()
  })

  it('profile ids are unique', () => {
    const ids = ATTACK_PROFILES.map(attackProfileId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('AlgorithmValidationView — deep links', () => {
  beforeEach(() => usePersonaStore.setState({ selectedPersona: 'developer' }))

  it('opening a section writes ?section; closing it clears the param', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView onUpdateParams={onUpdateParams} />)
    fireEvent.click(sectionButton(/Known-answer checks/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: 'kat' })
    fireEvent.click(sectionButton(/Known-answer checks/))
    // Closing KAT also drops its variant (?kat) so it can't reopen the section.
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: null, kat: null })
  })

  it('closing the linked section falls back to another open one', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView sectionParam="kat" onUpdateParams={onUpdateParams} />)
    fireEvent.click(sectionButton(/Implementation Attacks/))
    fireEvent.click(sectionButton(/Known-answer checks/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: 'attacks', kat: null })
  })

  it('re-reads ?section on same-route change', async () => {
    const { rerender } = render(<AlgorithmValidationView sectionParam={null} />)
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'false')
    rerender(<AlgorithmValidationView sectionParam="coverage" />)
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('coverage -')).toBeInTheDocument()
  })

  it('?attack opens Implementation Attacks and marks the matching profile', () => {
    render(<AlgorithmValidationView attackParam="ML-DSA-65" />)
    expect(sectionButton(/Implementation Attacks/)).toHaveAttribute('aria-expanded', 'true')
    // eslint-disable-next-line testing-library/no-node-access
    const tile = document.querySelector('[data-deeplink-id="attack-ml-dsa-dilithium"]')
    expect(tile).not.toBeNull()
    expect(tile).toHaveClass('border-primary/60')
  })

  it('an unknown ?attack says so; dismissing clears it', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView attackParam="nope-9" onUpdateParams={onUpdateParams} />)
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('nope-9')
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ attack: null })
  })

  it('closing Implementation Attacks also clears ?attack', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView attackParam="ML-KEM-768" onUpdateParams={onUpdateParams} />)
    fireEvent.click(sectionButton(/Implementation Attacks/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: null, attack: null })
  })

  it('?kat opens KAT Validation and passes the variant through', () => {
    render(<AlgorithmValidationView katParam="SHAKE-256f" />)
    expect(sectionButton(/Known-answer checks/)).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('kat SHAKE-256f')).toBeInTheDocument()
  })

  it('?polarity opens the Coverage Matrix and passes the polarity through', async () => {
    render(<AlgorithmValidationView polarityParam="negative" />)
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('coverage negative')).toBeInTheDocument()
  })

  it('re-reads ?kat / ?polarity on same-route change', async () => {
    const { rerender } = render(<AlgorithmValidationView />)
    expect(sectionButton(/Known-answer checks/)).toHaveAttribute('aria-expanded', 'false')
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'false')
    rerender(<AlgorithmValidationView katParam="SHA2-256s" polarityParam="boundary" />)
    expect(sectionButton(/Known-answer checks/)).toHaveAttribute('aria-expanded', 'true')
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('coverage boundary')).toBeInTheDocument()
  })

  it('closing KAT Validation also clears ?kat', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView katParam="SHA2-256s" onUpdateParams={onUpdateParams} />)
    fireEvent.click(sectionButton(/Known-answer checks/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: null, kat: null })
  })

  it('closing the Coverage Matrix also clears ?case and ?polarity', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView polarityParam="negative" onUpdateParams={onUpdateParams} />)
    fireEvent.click(sectionButton(/Coverage Matrix/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: null, case: null, polarity: null })
  })
})

describe('AlgorithmValidationView — arrival scroll', () => {
  beforeEach(() => usePersonaStore.setState({ selectedPersona: 'cert-engineer' }))

  it('aligns a linked section to its top, not its centre', async () => {
    // A section is taller than the viewport; centring it landed the
    // ?section=kat link on the AES tiles, far below the KAT header.
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    // jsdom has no layout; the hook only scrolls an element that has a box.
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
    render(<AlgorithmValidationView sectionParam="kat" />)
    await vi.waitFor(() => expect(scroll).toHaveBeenCalled())
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
  })
})
