// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Key release to an attested workload: named only for the two documented services (Azure Key Vault
 * Secure Key Release, AWS KMS with Nitro Enclaves), not "any cloud KMS". Statements follow
 * Microsoft Learn (Secure Key Release) and the AWS Nitro Enclaves User Guide (cryptographic
 * attestation with AWS KMS), read 8 Nov 2026.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { KmsPqcIntroduction } from './components/KmsPqcIntroduction'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

const flat = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

const renderIntro = () =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/kms-pqc?section=cloud-responsibility']}>
        <KmsPqcIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )

describe('KMS: key release to an attested workload', () => {
  it('names Azure Secure Key Release and AWS KMS with Nitro Enclaves, with the documented controls', () => {
    renderIntro()
    const box = screen.getByTestId('key-release-attested')
    const text = flat(box.textContent)
    expect(text).toContain('azure key vault secure key release (managed hsm and premium)')
    expect(text).toContain('microsoft azure attestation claims satisfy a release policy')
    expect(text).toContain('aws kms works with aws nitro enclaves')
    expect(text).toContain('kms:recipientattestation:imagesha384')
    expect(text).toContain('kms:recipientattestation:pcr')
    expect(text).toContain('signed attestation document whose measurements match the policy')
  })

  it('links to the Confidential Computing module and does not generalise to every cloud KMS', () => {
    renderIntro()
    const box = screen.getByTestId('key-release-attested')
    const link = within(box).getByRole('link', { name: 'Confidential Computing' })
    expect(link.getAttribute('href')).toBe('/learn/confidential-computing')
    expect(flat(box.textContent)).not.toMatch(/every (cloud )?kms|any (cloud )?kms|all clouds/)
  })

  it('says the same in the rag-summary and the curious summary', () => {
    expect(flat(ragSummary)).toContain('kms:recipientattestation:imagesha384')
    expect(flat(ragSummary)).toContain(
      'azure key vault secure key release (managed hsm and premium)'
    )
    expect(flat(curiousSummary)).toContain('aws kms used with nitro enclaves')
  })

  it('links to the trust-hardware comparison from the related-resources block', () => {
    renderIntro()
    const links = screen
      .getAllByRole('link', { name: /Compare with the other trust hardware/ })
      .map((a) => a.getAttribute('href'))
    expect(links).toEqual(['/learn/arch-quantum-impact?tab=workshop&step=5'])
  })
})
