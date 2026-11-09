// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceSafetySimulator } from './DeviceSafetySimulator'
import { MEDICAL_DEVICE_CATALOG } from '../data/healthcareConstants'

const TOPICS = [
  'Threat model includes quantum adversary',
  'Cryptographic inventory documented',
  'PQC algorithm selection justified',
  'Key management plan covers device lifetime',
  'Firmware update mechanism supports PQC signatures',
  'Post-market surveillance for crypto vulnerabilities',
  'SBOM includes cryptographic dependencies',
  'Hybrid mode transition plan documented',
]
function toggle(topic: string) {
  fireEvent.click(screen.getByRole('button', { name: (name) => name.startsWith(topic) }))
}
function choose(index: number) {
  fireEvent.click(screen.getByRole('button', { name: 'Device:' }))
  fireEvent.click(screen.getByRole('option', { name: MEDICAL_DEVICE_CATALOG[index].name }))
}
function reviewed(count: number) {
  expect(screen.getByText(`${count}/8 reviewed`, { exact: true })).toBeInTheDocument()
}
const COMPLETE =
  /Sample checklist reviewed — device submission coverage and technical readiness not assessed/

describe('device-specific sample review drafts', () => {
  it('keeps a complete A review separate from a new B, and restores A on return', () => {
    render(<DeviceSafetySimulator />)
    reviewed(0)
    for (const topic of TOPICS) toggle(topic)
    reviewed(8)
    expect(screen.getByText(COMPLETE)).toBeInTheDocument()
    choose(1)
    reviewed(0)
    expect(screen.queryByText(COMPLETE)).not.toBeInTheDocument()
    expect(
      screen.getByText(`Selected sample device: ${MEDICAL_DEVICE_CATALOG[1].name}`)
    ).toBeInTheDocument()
    choose(0)
    reviewed(8)
    expect(screen.getByText(COMPLETE)).toBeInTheDocument()
    expect(
      screen.getByText(`Selected sample device: ${MEDICAL_DEVICE_CATALOG[0].name}`)
    ).toBeInTheDocument()
    expect(screen.queryByText(/This device submission addresses/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/No device benchmark or safety evaluation is executed here/)
    ).toBeInTheDocument()
  })

  it('preserves topic membership independently across three real device choices', () => {
    render(<DeviceSafetySimulator />)
    toggle(TOPICS[0])
    toggle(TOPICS[1])
    reviewed(2)
    choose(1)
    reviewed(0)
    toggle(TOPICS[2])
    reviewed(1)
    choose(0)
    reviewed(2)
    toggle(TOPICS[0])
    reviewed(1)
    choose(2)
    reviewed(0)
    toggle(TOPICS[3])
    reviewed(1)
    choose(1)
    reviewed(1)
    toggle(TOPICS[2])
    reviewed(0)
    choose(0)
    reviewed(1)
    toggle(TOPICS[1])
    reviewed(0)
    choose(2)
    reviewed(1)
    toggle(TOPICS[3])
    reviewed(0)
    expect(screen.queryByText(COMPLETE)).not.toBeInTheDocument()
  })

  it('keeps the same-device draft on reselect but starts a fresh activity instance empty', () => {
    const view = render(<DeviceSafetySimulator />)
    toggle(TOPICS[0])
    reviewed(1)
    choose(0)
    reviewed(1)
    view.unmount()
    render(<DeviceSafetySimulator />)
    reviewed(0)
    choose(1)
    reviewed(0)
    expect(screen.queryByText(COMPLETE)).not.toBeInTheDocument()
  })

  it('labels the choices as local review drafts without implying assessed submission coverage', () => {
    render(<DeviceSafetySimulator />)
    expect(screen.getByText(/Review selections are kept separately/)).toHaveTextContent(
      'each sample device'
    )
    expect(screen.getByText(/Review selections are kept separately/)).toHaveTextContent('not saved')
    expect(screen.getByText(/Selections record reviewed topics/)).toHaveTextContent(
      'not submission coverage or technical checks'
    )
    reviewed(0)
    expect(screen.queryByText(COMPLETE)).not.toBeInTheDocument()
  })
})
