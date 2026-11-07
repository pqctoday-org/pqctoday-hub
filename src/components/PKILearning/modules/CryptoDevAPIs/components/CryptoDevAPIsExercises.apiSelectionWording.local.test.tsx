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
})
