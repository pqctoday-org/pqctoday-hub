// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BYOKKeyDesigner } from './BYOKKeyDesigner'

describe('BYOKKeyDesigner', () => {
  it('compares the patterns without a readiness percentage', () => {
    const { container } = render(<BYOKKeyDesigner />)
    expect(screen.getByText('PQC Upgrade Path')).toBeInTheDocument()
    expect(screen.queryByText(/PQC Readiness/i)).not.toBeInTheDocument()
    expect(container.textContent ?? '').not.toMatch(/\d+\s*%/)
  })
})
