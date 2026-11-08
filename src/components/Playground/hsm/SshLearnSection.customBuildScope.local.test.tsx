// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SshLearnSection } from './SshLearnSection'

describe('SSH operator example build scope', () => {
  it('distinguishes stock hybrid key exchange from experimental signature/provider configuration', () => {
    render(<SshLearnSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Operator Cheat Sheet' }))
    expect(screen.getByText(/Example.*for this Hub’s/, { exact: false })).toBeVisible()
    expect(screen.getByText(/This is not a stock OpenSSH configuration/)).toBeVisible()
    expect(screen.getByText(/Stock OpenSSH 9.9 added the hybrid key exchange/)).toHaveTextContent(
      'does not add the experimental post-quantum host or user signatures'
    )
    const example = screen.getByText(/# ~\/.ssh\/config — custom patched OpenSSH build example/)
    expect(example).toHaveTextContent(
      'Experimental PQ signatures; not an unmodified stock OpenSSH configuration'
    )
    expect(example).toHaveTextContent('HostKeyAlgorithms ssh-mldsa-65,ssh-ed25519')
    expect(example).toHaveTextContent('PKCS11Provider /usr/lib/softhsm/libsofthsm2.so')
    expect(screen.getByRole('link', { name: 'OpenSSH’s post-quantum support' })).toHaveAttribute(
      'href',
      'https://www.openssh.org/pq.html'
    )
  })
})
