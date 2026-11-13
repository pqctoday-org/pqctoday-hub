// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { NetworkComparator } from './NetworkComparator'

function renderComparator() {
  return render(
    <MemoryRouter>
      <NetworkComparator />
    </MemoryRouter>
  )
}

async function chooseRegion(user: ReturnType<typeof userEvent.setup>, region: string) {
  await user.click(screen.getByRole('button', { name: 'Region:' }))
  await user.click(screen.getByRole('option', { name: region }))
}

describe('Network comparator volume total', () => {
  it('shows $23,366B for 2 of 5 networks and no longer shows the five-network sum', () => {
    const view = renderComparator()
    expect(screen.getByText('$23,366B')).toBeInTheDocument()
    expect(
      screen.getByText(/Purchase volume, calendar 2025 \(2 of 5 networks\)/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/46\.6/)).not.toBeInTheDocument()
    expect(screen.queryByText('Transaction Volume')).not.toBeInTheDocument()
    expect(screen.getByText(/Not an all-network market total/)).toBeInTheDocument()
    view.unmount()
  })

  it('explains why the other three networks are not in the total', () => {
    const view = renderComparator()
    expect(screen.getByText(/American Express/, { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/includes cash advances and other payments/)).toBeInTheDocument()
    expect(
      screen.getAllByText(/No dated, same-scope annual volume/i).length
    ).toBeGreaterThanOrEqual(2)
    view.unmount()
  })

  it('recomputes the total for a filter and says no compatible total instead of zero', async () => {
    const user = userEvent.setup()
    const view = renderComparator()
    await chooseRegion(user, 'Asia-Pacific')
    expect(screen.getAllByText('no compatible total')).toHaveLength(2)
    expect(screen.getByText(/At 31 Dec 2025 \(0 of 1 networks\)/)).toBeInTheDocument()
    expect(screen.getAllByText(/\(0 of 1 networks\)/)).toHaveLength(2)
    expect(screen.queryByText('$0B')).not.toBeInTheDocument()
    await chooseRegion(user, 'Americas')
    expect(screen.getByText('$23,366B')).toBeInTheDocument()
    expect(screen.getAllByText(/\(2 of 4 networks\)/).length).toBeGreaterThanOrEqual(1)
    view.unmount()
  })

  it('adds only same-date exact card counts and says which networks are left out', () => {
    const view = renderComparator()
    expect(screen.getByText('8.7B')).toBeInTheDocument()
    expect(screen.getByText(/At 31 Dec 2025 \(3 of 5 networks\)/)).toBeInTheDocument()
    expect(screen.getAllByText(/is not in the card total/, { selector: 'li' })).toHaveLength(2)
    expect(
      screen.getAllByText(/Older figure with no date or scope established/i).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/not a count of unique or at-risk cards/)).toBeInTheDocument()
    view.unmount()
  })

  it('shows not scored, with its basis, instead of a number where no sourced basis exists', async () => {
    const user = userEvent.setup()
    const view = renderComparator()
    await user.click(screen.getByRole('button', { name: 'Compare' }))
    await user.click(screen.getByRole('button', { name: 'Select Visa' }))
    await user.click(screen.getByRole('button', { name: 'Select China UnionPay' }))
    // Offline exposure, tokenization, regulatory and legacy are not scored for both; UnionPay scale too.
    expect(screen.getAllByText('not scored').length).toBe(9)
    expect(screen.getAllByText(/^Not scored: no network figure on this page shows/).length).toBe(2)
    expect(screen.getByText(/^Score 5: 5,142M card accounts at 31 Dec 2025/)).toBeInTheDocument()
    expect(screen.getAllByText(/^Score 1: shared EMVCo standards work only/).length).toBe(1)
    expect(screen.queryByText('0/5')).not.toBeInTheDocument()
    // Visa has two scored axes and UnionPay one, so three dots and no outlined polygon.
    const chart = screen.getByRole('img', {
      name: 'Illustrative network score comparison, not measured readiness',
    })
    // eslint-disable-next-line testing-library/no-node-access
    expect(chart.querySelectorAll('circle')).toHaveLength(3)
    // eslint-disable-next-line testing-library/no-node-access
    expect(chart.querySelectorAll('polygon[fill-opacity="0.12"]')).toHaveLength(0)
    expect(
      screen.getByText(
        /Offline Exposure, Tokenization, Regulatory, Legacy Burden are not scored for any network/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Axes that are not scored are left out of the chart/)
    ).toBeInTheDocument()
    view.unmount()
  })

  it('keeps all five networks visible with dated or older-labelled figures', () => {
    const view = renderComparator()
    for (const name of [
      'Visa',
      'Mastercard',
      'American Express',
      'China UnionPay',
      'Discover / Diners Club',
    ]) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getAllByText(/purchases \(calendar 2025\)/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/older figure/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/more than 439 million open cards/)).toBeInTheDocument()
    expect(
      screen.getByText(/more than 260 million cards issued outside mainland China/)
    ).toBeInTheDocument()
    view.unmount()
  })

  it('states on the page that scores need a sourced basis and shows the rubric', () => {
    const view = renderComparator()
    expect(
      screen.getByText('How the six radar scores are assigned (authored rubric)')
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Radar scores are teaching aids/).length).toBeGreaterThanOrEqual(1)
    for (const label of [
      'Scale',
      'Offline Exposure',
      'Tokenization',
      'PQC Readiness',
      'Regulatory',
      'Legacy Burden',
    ]) {
      expect(screen.getByRole('cell', { name: label })).toBeInTheDocument()
    }
    expect(screen.getAllByText(/Not scored. is not 0/).length).toBeGreaterThanOrEqual(1)
    view.unmount()
  })
})
