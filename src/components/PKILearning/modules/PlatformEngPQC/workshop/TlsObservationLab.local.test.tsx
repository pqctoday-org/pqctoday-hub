// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TlsObservationLab } from './TlsObservationLab'

describe('TLS observation lab', () => {
  it('updates the result after every edit and accepts the permitted classical fallback', () => {
    render(<TlsObservationLab />)
    expect(screen.getByRole('status')).toHaveTextContent('Group allowed by sample policy')
    fireEvent.click(screen.getByRole('button', { name: 'Load classical capture' }))
    expect(screen.getByRole('status')).toHaveTextContent('Group allowed by sample policy')
    fireEvent.click(screen.getByRole('button', { name: 'Remove group observation' }))
    expect(screen.getByRole('status')).toHaveTextContent('Negotiated group not observed')
    fireEvent.click(screen.getByRole('button', { name: 'Load authored outside-policy case' }))
    expect(screen.getByRole('status')).toHaveTextContent('Group outside sample policy')
    fireEvent.change(screen.getByLabelText('Process exit code'), { target: { value: '1' } })
    expect(screen.getByRole('status')).toHaveTextContent('Connection not verified')
    fireEvent.change(screen.getByLabelText('OpenSSL brief output'), { target: { value: '' } })
    expect(screen.getByRole('status')).toHaveTextContent('Connection not verified')
  })
})
