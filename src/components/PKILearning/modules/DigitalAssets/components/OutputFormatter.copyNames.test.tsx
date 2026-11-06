// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OutputFormatter } from './OutputFormatter'

const HEX = 'a1'.repeat(32)

describe('OutputFormatter copy buttons are named for their value', () => {
  it('each labelled hex value gets its own named button', () => {
    render(<OutputFormatter output={`enc: ${HEX}\nnonce: ${'b2'.repeat(20)}`} />)
    expect(screen.getByRole('button', { name: 'Copy enc' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy nonce' })).toBeInTheDocument()
  })
})
