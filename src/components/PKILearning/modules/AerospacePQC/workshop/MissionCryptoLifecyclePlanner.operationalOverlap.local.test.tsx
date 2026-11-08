// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MissionCryptoLifecyclePlanner } from './MissionCryptoLifecyclePlanner'
const selectYears = (launch: number, life: number, threat: number) => {
  fireEvent.change(screen.getByRole('slider', { name: 'Launch / Delivery Year' }), {
    target: { value: String(launch) },
  })
  fireEvent.change(screen.getByRole('slider', { name: 'Service Life (years)' }), {
    target: { value: String(life) },
  })
  fireEvent.change(screen.getByRole('slider', { name: 'Assumed CRQC Year' }), {
    target: { value: String(threat) },
  })
}
describe('illustrative mission operational overlap', () => {
  it('keeps the original default8year intersection without calling all classical cryptography broken', () => {
    render(<MissionCryptoLifecyclePlanner />)
    // Operation2028–2043 and assumption2035 gives8years.
    expect(screen.getByText('8 yr modeled overlap')).toBeInTheDocument()
    expect(screen.getByText('2035–2043 (8 yr)')).toBeInTheDocument()
    expect(
      screen.getByText(/symmetric encryption needs its own algorithm and key-strength assessment/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/All non-PQC crypto is broken/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Until Decision Deadline/)).not.toBeInTheDocument()
  })
  it.each([
    { threat: 2030, label: 'before' },
    { threat: 2035, label: 'at' },
  ])(
    'clips overlap to the15year service interval when the threat assumption is $label launch',
    ({ threat }) => {
      render(<MissionCryptoLifecyclePlanner />)
      selectYears(2035, 15, threat)
      // The mission has no operating years before2035, regardless of the earlier assumption.
      expect(screen.getByText('15 yr modeled overlap')).toBeInTheDocument()
      expect(screen.getAllByText('2035–2050 (15 yr)')).toHaveLength(2)
      expect(screen.queryByText('20 yr modeled overlap')).not.toBeInTheDocument()
    }
  )
  it.each([
    { threat: 2035, label: 'at' },
    { threat: 2040, label: 'after' },
  ])(
    'has no operational overlap when the selected year is $label retirement without inferring safety',
    ({ threat }) => {
      render(<MissionCryptoLifecyclePlanner />)
      selectYears(2030, 5, threat)
      expect(screen.getByText('No operational overlap')).toBeInTheDocument()
      expect(
        screen.queryByText('Modeled Operational Overlap', { exact: true })
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Safe', { exact: true })).not.toBeInTheDocument()
      expect(
        screen.getByText(
          /pre-launch provisioning, retained-data confidentiality and signature or trust lifetimes/
        )
      ).toBeInTheDocument()
    }
  )
  it('keeps the short-axis first and last ticks aligned with the existing bounds', () => {
    render(<MissionCryptoLifecyclePlanner />)
    selectYears(2030, 1, 2030)
    const ticks = within(
      screen.getByRole('list', { name: 'Illustrative lifecycle year axis' })
    ).getAllByRole('listitem')
    expect(ticks.map((tick) => tick.textContent)).toEqual([
      '2027',
      '2028',
      '2029',
      '2030',
      '2031',
      '2032',
      '2033',
      '2034',
      '2035',
    ])
  })
  it('includes a prelaunch threat assumption inside the plotted axis without changing the operational start', () => {
    render(<MissionCryptoLifecyclePlanner />)
    selectYears(2040, 1, 2030)
    const ticks = within(
      screen.getByRole('list', { name: 'Illustrative lifecycle year axis' })
    ).getAllByRole('listitem')
    expect(ticks[0]).toHaveTextContent('2030')
    expect(ticks[ticks.length - 1]).toHaveTextContent('2041')
    expect(screen.getAllByText('2040–2041 (1 yr)')).toHaveLength(2)
    expect(screen.getByText('1 yr modeled overlap')).toBeInTheDocument()
  })
})
