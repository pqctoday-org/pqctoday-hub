// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CryptoDevAPIsExercises } from './CryptoDevAPIsExercises'

describe('API selection exercise gives criteria, not a winner', () => {
  it('separates the Luna JSP provider from the JCPROV wrapper and names no best option', () => {
    render(<CryptoDevAPIsExercises onNavigateToWorkshop={vi.fn()} />)
    const observation = screen.getByText(
      /JCA\/JCE reaches a Luna HSM through the Luna JSP provider/
    )
    expect(observation).toHaveTextContent('JCPROV is a separate PKCS#11 wrapper')
    expect(observation).toHaveTextContent(
      'Choose by your key-custody, HSM and runtime requirements'
    )
    expect(observation).not.toHaveTextContent(/optimal/i)
    expect(observation).not.toHaveTextContent(/clear winner/i)
    expect(observation).not.toHaveTextContent('JCA/JCE via JCProv')
  })

  it('does not rank the APIs on scores the explorer no longer shows', () => {
    render(<CryptoDevAPIsExercises onNavigateToWorkshop={vi.fn()} />)
    const prompt = screen.getByText(/In the API Architecture Explorer \(Step 1\)/)
    const observation = screen.getByText(
      /JCA\/JCE reaches a Luna HSM through the Luna JSP provider/
    )
    for (const element of [prompt, observation]) {
      expect(element).not.toHaveTextContent(/scores? higher|better PQC readiness/i)
    }
    // what each route offers, with the versions the module's own code examples state
    expect(prompt).toHaveTextContent('How does each API reach an HSM')
    expect(observation).toHaveTextContent('ML-KEM, ML-DSA and SLH-DSA natively since OpenSSL 3.5')
    expect(observation).toHaveTextContent('ML-KEM and ML-DSA in its default provider since JDK 24')
  })
})
