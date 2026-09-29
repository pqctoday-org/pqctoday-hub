// SPDX-License-Identifier: GPL-3.0-only
/** `?section=` write-back / re-read and `?attack=` on the Validation tab. */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AlgorithmValidationView } from './AlgorithmValidationView'
import { matchAttackProfile, attackProfileId } from './attackDeepLink'
import { ATTACK_PROFILES } from '@/data/implementationAttackProfiles'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('./KATView', () => ({ KATView: () => <div>kat</div> }))
vi.mock('./CoverageMatrixView', () => ({ CoverageMatrixView: () => <div>coverage</div> }))

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
    fireEvent.click(sectionButton(/KAT Validation/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: 'kat' })
    fireEvent.click(sectionButton(/KAT Validation/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: null })
  })

  it('closing the linked section falls back to another open one', () => {
    const onUpdateParams = vi.fn()
    render(<AlgorithmValidationView sectionParam="kat" onUpdateParams={onUpdateParams} />)
    fireEvent.click(sectionButton(/Implementation Attacks/))
    fireEvent.click(sectionButton(/KAT Validation/))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ section: 'attacks' })
  })

  it('re-reads ?section on same-route change', () => {
    const { rerender } = render(<AlgorithmValidationView sectionParam={null} />)
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'false')
    rerender(<AlgorithmValidationView sectionParam="coverage" />)
    expect(sectionButton(/Coverage Matrix/)).toHaveAttribute('aria-expanded', 'true')
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
})
