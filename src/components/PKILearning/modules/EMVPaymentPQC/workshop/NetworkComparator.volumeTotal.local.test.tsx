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
    expect(screen.getByText('no compatible total')).toBeInTheDocument()
    expect(screen.getByText(/\(0 of 1 networks\)/)).toBeInTheDocument()
    expect(screen.queryByText('$0B')).not.toBeInTheDocument()
    await chooseRegion(user, 'Americas')
    expect(screen.getByText('$23,366B')).toBeInTheDocument()
    expect(screen.getByText(/\(2 of 4 networks\)/)).toBeInTheDocument()
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

  it('states on the page that the radar scores are authored judgements and shows the rubric', () => {
    const view = renderComparator()
    expect(
      screen.getByText('How the six radar scores are assigned (authored rubric)')
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/authored judgements made for teaching/).length
    ).toBeGreaterThanOrEqual(1)
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
    expect(
      screen.getAllByText(/missing evidence is never scored as 0/).length
    ).toBeGreaterThanOrEqual(1)
    view.unmount()
  })
})
