// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ArtifactPlaceholder } from './ArtifactCard'

describe('ArtifactPlaceholder', () => {
  it('invokes onCreate with the artifact type when clicked', () => {
    const onCreate = vi.fn()
    render(<ArtifactPlaceholder type="risk-register" pillar="risk" onCreate={onCreate} />)

    fireEvent.click(screen.getByText('Risk Register'))

    expect(onCreate).toHaveBeenCalledExactlyOnceWith('risk-register')
  })

  it('renders the tool description from the shared registry instead of a module name', () => {
    render(<ArtifactPlaceholder type="crqc-scenario" pillar="risk" onCreate={() => undefined} />)

    expect(screen.getByText(/quantum computer threat scenarios/i)).toBeInTheDocument()
    // Legacy "Build in the pqc-risk-management module" copy must be gone.
    expect(screen.queryByText(/Build in the/i)).not.toBeInTheDocument()
  })

  it('surfaces the Not created status chip', () => {
    render(
      <ArtifactPlaceholder type="deployment-playbook" pillar="vendor" onCreate={() => undefined} />
    )

    expect(screen.getByText('Not created')).toBeInTheDocument()
    expect(screen.getByText('Deployment Playbook')).toBeInTheDocument()
  })
})
