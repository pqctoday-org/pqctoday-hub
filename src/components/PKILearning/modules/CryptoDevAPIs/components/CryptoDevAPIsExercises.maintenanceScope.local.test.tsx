// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CryptoDevAPIsExercises } from './CryptoDevAPIsExercises'

describe('language-choice exercise names the maintenance status of the pqcrypto crates', () => {
  it('does not list pqcrypto as a plain recommendation', () => {
    render(<CryptoDevAPIsExercises onNavigateToWorkshop={vi.fn()} />)
    const observation = screen.getByText(/Rust's ownership model and borrow checker/)
    expect(observation).toHaveTextContent('the aws-lc-rs crate provides PQC support')
    expect(observation).toHaveTextContent(
      'their own README says they are unmaintained and should not be used in new projects'
    )
    expect(observation).toHaveTextContent('PQClean is archived')
    expect(observation).not.toHaveTextContent(
      'the pqcrypto and aws-lc-rs crates provide PQC support'
    )
  })
})
