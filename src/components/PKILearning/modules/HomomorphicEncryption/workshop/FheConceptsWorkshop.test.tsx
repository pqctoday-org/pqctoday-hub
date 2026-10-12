// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FheConceptsWorkshop } from './FheConceptsWorkshop'

const open = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('FheConceptsWorkshop', () => {
  it('shows the six concept cards', () => {
    render(<FheConceptsWorkshop />)
    for (const t of [
      /Noise budget and bootstrapping/,
      /Encode, decode and rounding/,
      /From a program to an FHE circuit/,
      /Key streaming and chunk size/,
      /Key rotation without decrypting/,
      /Shared \(2-of-2\) decryption/,
    ]) {
      expect(screen.getByRole('button', { name: t })).toBeInTheDocument()
    }
    expect(screen.getAllByText('Illustration (simplified, not real encryption)').length).toBe(1)
  })

  it('refuses a CKKS multiply once the levels run out, and bootstrap restores them', () => {
    render(<FheConceptsWorkshop />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const mul = screen.getByRole('button', { name: 'Multiply' })
    for (let i = 0; i < 6; i++) fireEvent.click(mul)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(mul)
    expect(screen.getByRole('alert')).toHaveTextContent(/decryption would fail — bootstrap first/i)
    fireEvent.click(screen.getByRole('button', { name: 'Bootstrap' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'CKKS levels remaining' })).toHaveAttribute(
      'aria-valuenow',
      String(Math.round((4 / 6) * 100))
    )
  })

  it('encodes 3.14159265 and releases round(x·2^20) = 3294199 at p = 20', () => {
    render(<FheConceptsWorkshop />)
    open(/Encode, decode and rounding/)
    expect(screen.getByText(/release precision p = 20 bits/)).toBeInTheDocument()
    expect(screen.getByTestId('released-int-0')).toHaveTextContent('3,294,199')
  })

  it('TFHE noise past half a step flips the decrypted message', () => {
    render(<FheConceptsWorkshop />)
    open(/Encode, decode and rounding/)
    expect(screen.getByText(/the noise was rounded away/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('TFHE noise'), { target: { value: '1500' } })
    expect(screen.getByText(/flipped the message/)).toBeInTheDocument()
  })

  it('shows the measured MX95 time at 8 limbs per call and 1,001 calls', () => {
    const onComplete = vi.fn()
    render(<FheConceptsWorkshop onComplete={onComplete} />)
    open(/Key streaming and chunk size/)
    const devices = screen.getByRole('group', { name: 'Device' })
    fireEvent.click(within(devices).getByRole('button', { name: /^MX95, one core, before/ }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('473 s')
    expect(screen.getAllByText(/1,001/).length).toBeGreaterThan(0)
    // a chunk size the board was not measured at says so
    const limbs = screen.getByRole('group', { name: 'Limbs per call' })
    fireEvent.click(within(limbs).getByRole('button', { name: '4' }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('Not measured')
  })

  it('shows the cached-generator runs on the boards, with no fitted model', () => {
    render(<FheConceptsWorkshop />)
    open(/Key streaming and chunk size/)
    const devices = screen.getByRole('group', { name: 'Device' })
    fireEvent.click(within(devices).getByRole('button', { name: /^MX95, one core, cached/ }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('214 s')
    expect(screen.getByText(/No fitted model for this device/)).toBeInTheDocument()
    fireEvent.click(within(devices).getByRole('button', { name: /^MX95 Pro, six cores/ }))
    const limbs = screen.getByRole('group', { name: 'Limbs per call' })
    fireEvent.click(within(limbs).getByRole('button', { name: '30' }))
    expect(screen.getByTestId('stream-seconds')).toHaveTextContent('72.4 s')
  })

  it('key rotation: the token refuses what the rules refuse, with the return codes it gives', () => {
    render(<FheConceptsWorkshop />)
    open(/Key rotation without decrypting/)
    const rule = () => screen.getByTestId('rotation-rule')
    const status = () => within(screen.getByTestId('rotation-attempt')).getByRole('status')
    // security officer + a token-made seed: allowed
    expect(status()).toHaveTextContent('Allowed')
    const who = screen.getByRole('group', { name: 'Who starts the rotation' })
    const what = screen.getByRole('group', { name: 'What the new secret is' })
    fireEvent.click(within(who).getByRole('button', { name: 'User session' }))
    expect(status()).toHaveTextContent('Refused')
    expect(status()).toHaveTextContent('CKR_USER_TYPE_INVALID')
    fireEvent.click(within(who).getByRole('button', { name: /^Public session/ }))
    expect(status()).toHaveTextContent('CKR_USER_NOT_LOGGED_IN')
    fireEvent.click(within(who).getByRole('button', { name: 'Security officer' }))
    fireEvent.click(within(what).getByRole('button', { name: /different parameter set/ }))
    expect(status()).toHaveTextContent('CKR_KEY_TYPE_INCONSISTENT')
    fireEvent.click(within(what).getByRole('button', { name: /copy of a token-made key/ }))
    expect(status()).toHaveTextContent('CKR_KEY_FUNCTION_NOT_PERMITTED')
    expect(rule()).toHaveTextContent(/generated by this token/)
    fireEvent.click(within(what).getByRole('button', { name: /Going back/ }))
    expect(rule()).toHaveTextContent(/one direction only/)
    fireEvent.click(within(what).getByRole('button', { name: /second target/ }))
    expect(rule()).toHaveTextContent(/one target only/)
    fireEvent.click(within(what).getByRole('button', { name: /looser decryption policy/ }))
    expect(rule()).toHaveTextContent(/equal to or stricter/)
    // the session is checked first, whatever the seed
    fireEvent.click(within(who).getByRole('button', { name: 'User session' }))
    expect(status()).toHaveTextContent('CKR_USER_TYPE_INVALID')
  })

  it('key rotation: steps through the seven steps with the measured numbers', () => {
    render(<FheConceptsWorkshop />)
    open(/Key rotation without decrypting/)
    expect(screen.getByTestId('rotation-step')).toHaveTextContent(/security officer starts/i)
    const next = screen.getByRole('button', { name: 'Rotation: next step' })
    fireEvent.click(next)
    fireEvent.click(next)
    expect(screen.getByTestId('rotation-step')).toHaveTextContent('31,457,872 B')
    expect(screen.getByTestId('rotation-step')).toHaveTextContent('15,728,640 B in 4 calls')
    fireEvent.click(next)
    expect(screen.getByTestId('rotation-step')).toHaveTextContent('36.5 ms')
    expect(screen.getByTestId('rotation-step')).toHaveTextContent('28.7 → 27.1')
    fireEvent.click(screen.getByRole('button', { name: /Rotation step 7:/ }))
    expect(screen.getByTestId('rotation-step')).toHaveTextContent(/deletes the rotation key/i)
    expect(screen.getByRole('button', { name: 'Rotation: next step' })).toBeDisabled()
  })

  it('shared decryption: independent approvals stop a crafted request, one approver does not', () => {
    render(<FheConceptsWorkshop />)
    open(/Shared \(2-of-2\) decryption/)
    expect(screen.getByTestId('shared-requester')).toHaveTextContent(
      /one share alone decrypts nothing/
    )
    expect(screen.getByTestId('shared-requester')).toHaveTextContent('65,536 of 65,536')
    expect(screen.getByTestId('shared-bits')).toHaveTextContent('24.2–24.5')
    const approvals = screen.getByRole('group', { name: 'Approvals for the two tokens' })
    fireEvent.click(within(approvals).getByRole('button', { name: /Not independent/ }))
    expect(screen.getByTestId('shared-requester')).toHaveTextContent(/add up to the secret/)
    const flooding = screen.getByRole('group', { name: 'Flooding of the partial decryptions' })
    fireEvent.click(within(flooding).getByRole('button', { name: /^On/ }))
    expect(screen.getByTestId('shared-bits')).toHaveTextContent('−1.6 to −1.9')
    expect(screen.getByTestId('shared-result')).toHaveTextContent(/wider \(2\^43\.1/)
  })

  it('shared decryption: the measured sizes and the joint-key bootstrap are shown', () => {
    render(<FheConceptsWorkshop />)
    open(/Shared \(2-of-2\) decryption/)
    const next = screen.getByRole('button', { name: 'Shared decryption: next step' })
    fireEvent.click(next)
    expect(screen.getByTestId('shared-step')).toHaveTextContent('4.10 GB (one token: 3.94 GB)')
    expect(screen.getByTestId('shared-step')).toHaveTextContent('157 MB')
    fireEvent.click(next)
    expect(screen.getByTestId('shared-step')).toHaveTextContent('24.3–24.5 / 24.9 bits')
    fireEvent.click(next)
    expect(screen.getByTestId('shared-step')).toHaveTextContent('524,304 B')
    expect(screen.getByTestId('shared-step')).toHaveTextContent('1,048,894 B')
  })

  it('the illustrations follow the step: the old seed is destroyed, the rotation key deleted', () => {
    render(<FheConceptsWorkshop />)
    open(/Key rotation without decrypting/)
    const ill = () => screen.getByTestId('rotation-illustration')
    expect(ill()).toHaveTextContent('new seednot made yet')
    fireEvent.click(screen.getByRole('button', { name: /Rotation step 3:/ }))
    expect(ill()).toHaveTextContent('rotation keyarriving')
    fireEvent.click(screen.getByRole('button', { name: /Rotation step 6:/ }))
    expect(ill()).toHaveTextContent('old seeddestroyed')
    expect(ill()).toHaveTextContent('retirement recordsigned, public')
    fireEvent.click(screen.getByRole('button', { name: /Rotation step 7:/ }))
    expect(ill()).toHaveTextContent('rotation keydeleted')
    open(/Shared \(2-of-2\) decryption/)
    const sh = () => screen.getByTestId('shared-illustration')
    expect(sh()).toHaveTextContent('no secretand no share')
    fireEvent.click(screen.getByRole('button', { name: /Shared decryption step 4:/ }))
    expect(sh()).toHaveTextContent('Token A → Mac: share 0.5 MB')
    fireEvent.click(screen.getByRole('button', { name: /Shared decryption step 5:/ }))
    expect(sh()).toHaveTextContent('one alone: noise')
  })
})
