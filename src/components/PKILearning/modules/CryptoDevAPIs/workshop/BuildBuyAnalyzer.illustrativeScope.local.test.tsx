// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BuildBuyAnalyzer } from './BuildBuyAnalyzer'
import { CryptoDevAPIsModule } from '../index'

vi.mock('@/components/PKILearning/common/ModuleShell', () => ({
  ModuleShell: ({ workshopParts }: { workshopParts: { id: string; description: string }[] }) => (
    <p>{workshopParts.find((part) => part.id === 'build-buy-oss')?.description}</p>
  ),
}))

describe('Sourcing example teaching scope', () => {
  it('passes the same limited comparison scope through the module step description', () => {
    render(<CryptoDevAPIsModule />)
    expect(
      screen.getByText(/Compare sourcing options using Hub-authored teaching weights/)
    ).toHaveTextContent('named reference examples and fictional planning scenarios')
    expect(screen.getByText(/The comparison does not validate/)).toHaveTextContent(
      'suitability or costs'
    )
  })
  it('distinguishes fictional scenarios from named examples and preserves conditional weighted suggestions', () => {
    render(<BuildBuyAnalyzer />)
    expect(screen.getAllByText('Fictional planning scenario — illustrative outcome')).toHaveLength(
      2
    )
    expect(screen.getAllByText('Named reference example')).toHaveLength(3)
    expect(screen.queryByText(/Leading option in this teaching model/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Build Your Own/ }))
    expect(screen.getByText('Illustrative TCO bands')).toBeInTheDocument()
    expect(screen.getByText(/Authored planning ranges/)).toHaveTextContent('not supplier quotes')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'A FIPS 140-3 validated module is required (FIPS 140-2 only for existing systems)',
      })
    )
    expect(screen.getByText(/Illustrative weighted scores/)).toHaveTextContent('1/8 answered')
    expect(screen.queryByText(/Leading option in this teaching model/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dedicated crypto engineering team' }))
    fireEvent.click(screen.getByRole('button', { name: '> $1M / year' }))
    expect(
      screen.getByText(/Leading option in this teaching model: Commercial/)
    ).toBeInTheDocument()
    expect(screen.getByText('8', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('6', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('9', { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/Hub-authored answer weights/)).toHaveTextContent(
      'do not verify requirements, suitability or cost'
    )
    expect(screen.queryByText('Real-World Case Studies')).not.toBeInTheDocument()
  })
})
