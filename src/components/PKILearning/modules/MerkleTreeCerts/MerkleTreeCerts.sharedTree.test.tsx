// SPDX-License-Identifier: GPL-3.0-only
/**
 * The /learn workshop hands the tree built in Step 1 to Steps 2 and 3, the same
 * wiring the Playground's MerkleWorkshopSteps uses. Without it, Step 2 silently
 * fell back to 8 sample certificates and proved a tree the learner never built.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { MerkleTreeCertsModule } from './index'

function renderWorkshop() {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <MerkleTreeCertsModule />
      </MemoryRouter>
    </EmbedProvider>
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
}

describe('MerkleTreeCerts workshop — Step 1 tree reaches Step 2', () => {
  it('Step 2 uses the tree the learner built in Step 1', async () => {
    renderWorkshop()
    fireEvent.click(screen.getByRole('button', { name: 'Instant' }))
    fireEvent.click(screen.getByRole('button', { name: 'Load 8 sample certs' }))
    fireEvent.click(screen.getByRole('button', { name: /Build Merkle Tree/ }))
    // the build is async (SHA-256 via WebCrypto); wait for the built tree to render
    await screen.findByText(/Merkle Tree \(height \d+, 8 leaves\)/, undefined, { timeout: 5000 })

    fireEvent.click(screen.getAllByRole('button', { name: /Next Step/ })[0])

    expect(
      await screen.findByText(/Your tree from Step 1 is loaded/, undefined, { timeout: 5000 })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Build your own tree in Step 1 first/)).not.toBeInTheDocument()
  })

  it('without a Step 1 tree, Step 2 says it is using sample certificates', async () => {
    renderWorkshop()
    fireEvent.click(screen.getAllByRole('button', { name: /Next Step/ })[0])
    expect(
      await screen.findByText(/Build your own tree in Step 1 first/, undefined, { timeout: 5000 })
    ).toBeInTheDocument()
  })
})
