// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DatabaseEncryptionExercises } from './DatabaseEncryptionExercises'
import introSource from './DatabaseEncryptionIntroduction.tsx?raw'

function exerciseText(): string {
  render(
    <MemoryRouter>
      <DatabaseEncryptionExercises onNavigateToWorkshop={vi.fn()} onSetWorkshopConfig={vi.fn()} />
    </MemoryRouter>
  )
  return document.body.textContent ?? ''
}

describe('database encryption key ownership exercise', () => {
  it('compares custody, plaintext DEK exposure and revocation instead of readiness scores', () => {
    const text = exerciseText()
    expect(text).toContain(
      'Compare the three key ownership patterns in the BYOK Architecture Designer: Provider-Managed, BYOK and HYOK. For each, ask who holds the master key, whether the cloud database engine receives the plaintext DEK after the on-premises unwrap, and how access is revoked.'
    )
    expect(text).not.toMatch(/Provider-Managed \(30% score\)/)
    expect(text).not.toMatch(/BYOK \(65%\)/)
  })

  it('titles the exercise by key custody, not PQC readiness', () => {
    const text = exerciseText()
    expect(text).toContain('3. HYOK vs BYOK key custody')
    expect(text).not.toContain('PQC Readiness')
  })

  it('states that HYOK still hands the cloud engine the plaintext DEK', () => {
    const text = exerciseText()
    expect(text).toContain(
      "The patterns differ in key custody and revocation, not in a measured readiness score. With HYOK the master key stays in the customer HSM, but the cloud database engine still receives the plaintext DEK after the on-premises unwrap. With BYOK the customer's key material is imported into the cloud KMS."
    )
    expect(text).not.toMatch(/HYOK achieves 90% PQC readiness/)
    expect(text).not.toMatch(/BYOK scores 65%/)
  })

  it('states no readiness difference or percentage for the three patterns in the exercise or the introduction', () => {
    const text = exerciseText()
    expect(text).not.toMatch(/percentages are illustrative/)
    const intro = introSource.replace(/\s+/g, ' ')
    expect(intro).toContain(
      'Three models exist, differing in who holds the key and who can revoke it:'
    )
    expect(intro).not.toMatch(/dramatically different/)
  })
})
