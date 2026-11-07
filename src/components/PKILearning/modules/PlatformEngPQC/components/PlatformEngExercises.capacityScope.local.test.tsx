// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PlatformEngExercises } from './PlatformEngExercises'

describe('sample capacity interpretation', () => {
  it('separates the pinned default from an upper suggestion and preserves the exercise action', () => {
    const navigate = vi.fn()
    const configure = vi.fn()
    render(<PlatformEngExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={configure} />)
    const observation = screen.getByText(/For 500 certificates, the module's illustrative sizes/)
    expect(observation).toHaveTextContent('backend quota starts at 2 GiB')
    expect(observation).toHaveTextContent('8 GiB as an upper size')
    expect(observation).toHaveTextContent('not measured etcd usage')
    expect(observation).toHaveTextContent(
      'existing objects, retained history and operational headroom'
    )
    expect(observation).not.toHaveTextContent('default 8 GB')
    expect(observation).not.toHaveTextContent('NOT a reason to delay')
    expect(screen.getByRole('link', { name: /etcd v3.5 system limits/ })).toHaveAttribute(
      'href',
      'https://etcd.io/docs/v3.5/dev-guide/limit/'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open Step 5' }))
    expect(configure).toHaveBeenCalledWith({ step: 4 })
    expect(navigate).toHaveBeenCalledOnce()
  })
})
