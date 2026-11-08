// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { Introduction } from './Introduction'

function section(id: string): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[`/learn/ai-security-pqc?section=${id}`]}>
        <Introduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('AI security introduction: model collapse', () => {
  it('teaches collapse as a conditional research result with its experiments named', () => {
    const text = section('synthetic-data')
    expect(text).toMatch(/is conditional, not\s+universal/)
    expect(text).toMatch(/Shumailov et al\./)
    expect(text).toMatch(/Gerstgrasser et al\./)
    expect(text).toMatch(
      /accumulating synthetic data alongside the\s+original real data avoided it/
    )
  })

  it('does not say synthetic data always degrades models, and keeps a useful synthetic-data case', () => {
    const text = section('synthetic-data')
    expect(text).not.toMatch(/quality degrades with each generation/i)
    expect(text).not.toMatch(/floods the internet/i)
    expect(text).toMatch(/phi-1/)
    expect(text).toMatch(/synthetically generated\s+textbooks and exercises/)
  })

  it('says provenance supports selection and accountability, not training quality', () => {
    const text = section('synthetic-data')
    expect(text).toMatch(/do not by themselves determine\s+training quality/)
    expect(text).not.toMatch(/ensures long-term provenance trust/)
    expect(text).toMatch(/remains a separate question/)
  })

  it('labels the Gen 0 to Gen 5 chain as a fictional scenario and signatures as not proof of origin', () => {
    const text = section('synthetic-data')
    expect(text).toMatch(/One Illustrative Collapse Scenario \(fictional numbers\)/)
    expect(text).not.toMatch(/Quality Collapse$/m)
    expect(text).toMatch(/a valid signature does not show that content is accurate or human-made/)
  })
})

describe('AI security introduction: privacy-preserving ML and key management', () => {
  it('gives each construction its own assumptions instead of a shared quantum-safe badge', () => {
    const text = section('scale')
    expect(text).not.toMatch(/Quantum-Safe/)
    expect(text).not.toMatch(/Needs PQC Migration/)
    expect(text).not.toMatch(/Quantum-safe by design/i)
    expect(text).toMatch(/Scheme- and parameter-dependent/)
    expect(text).toMatch(/Depends on the construction/)
    expect(text).toMatch(/Not a cryptographic scheme/)
  })

  it('does not say federated learning shares only encrypted gradients', () => {
    const text = section('scale')
    expect(text).not.toMatch(/only encrypted gradients shared/i)
    expect(text).toMatch(/Shared gradients can leak training data/)
  })

  it('states the trust model of differential privacy and that it does not encrypt data', () => {
    const text = section('scale')
    expect(text).toMatch(/in the central model the data curator must be trusted/)
    expect(text).toMatch(/does not protect data in transit or at rest/)
  })

  it('presents the hierarchical KMS as a sample architecture, not a requirement or per-object rule', () => {
    const text = section('scale')
    expect(text).not.toMatch(/is essential/)
    expect(text).not.toMatch(/Each data object needs its own encryption key/)
    expect(text).toMatch(/This is a sample architecture, not a requirement/)
  })
})

describe('AI security introduction: agent commerce', () => {
  it('explains identity, authorization, replay and key governance beyond signing', () => {
    const text = section('agentic-ai')
    expect(text).toMatch(/a signature alone is not enough/)
    expect(text).toMatch(/identity/)
    expect(text).toMatch(/authorization/)
    expect(text).toMatch(/replay protection/)
    expect(text).toMatch(/key governance/)
    expect(text).toMatch(/sample architecture, not a\s+requirement of any standard/)
  })

  it('does not say ML-KEM encrypts the payment details directly', () => {
    const text = section('agentic-ai')
    expect(text).not.toMatch(/payment details encrypted with ML-KEM/)
    expect(text).toMatch(
      /a KEM generates a shared secret key and a\s+symmetric scheme encrypts under it/
    )
  })
})
