// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ragSummary from './rag-summary.md?raw'
import { content } from './content'
import { SecretsManagementExercises } from './components/SecretsManagementExercises'

describe('secrets exercise and summary wording on HNDL exposure', () => {
  it('says TLS certificates carry authentication risk but no HNDL exposure', () => {
    render(
      <MemoryRouter>
        <SecretsManagementExercises onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    const note = screen.getByText(/of the 6 critical-risk secrets have Immediate HNDL exposure/)
    expect(note).toHaveTextContent('4 of the 6 critical-risk secrets')
    expect(note).toHaveTextContent(
      'TLS certificates carry authentication risk but no HNDL exposure: recovering a signing key does not decrypt recorded sessions'
    )
    expect(note).toHaveTextContent(
      'ML-KEM-derived wrapping applies only where an asymmetric step exists and the product supports it'
    )
    expect(note).not.toHaveTextContent('shows ML-KEM-based mitigation for each type')
  })

  it('keeps the summary free of ML-KEM vault seal and KEK claims', () => {
    expect(ragSummary).not.toContain('ML-KEM vault seal')
    expect(ragSummary).not.toContain('ML-KEM vault KEK')
    expect(ragSummary).not.toContain('ML-KEM-1024 KEK')
    expect(ragSummary).not.toMatch(/encryption-at-rest with ML-KEM/)
    expect(ragSummary).not.toContain('KEK (ML-KEM-768/1024)')
    expect(content.narratives.keyConcepts).not.toMatch(/encryption-at-rest with ML-KEM/)
  })

  it('classes TLS certificates as no HNDL and names the AWS KMS ML-KEM key operations', () => {
    expect(ragSummary).toContain(
      '3. TLS Certificates & Private Keys — critical, no HNDL (authentication risk), ML-DSA certs'
    )
    expect(ragSummary).toContain(
      'AWS KMS ML-KEM keys (Encapsulate/Decapsulate); Secrets Manager stays AES-256 under symmetric KMS keys'
    )
  })

  it('labels the Vault transit ML-KEM path as a proposed design', () => {
    expect(ragSummary).toContain('as a proposed design: Vault documents no ML-KEM transit key type')
    expect(content.narratives.keyConcepts).toContain(
      'as a proposed design: Vault documents no ML-KEM transit key type'
    )
  })
})
