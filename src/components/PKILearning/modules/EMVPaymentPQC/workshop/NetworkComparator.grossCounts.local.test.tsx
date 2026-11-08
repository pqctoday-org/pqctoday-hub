// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { NetworkComparator } from './NetworkComparator'

vi.mock('../data/paymentNetworkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/paymentNetworkData')>()
  return {
    ...actual,
    PAYMENT_NETWORKS: actual.PAYMENT_NETWORKS.slice(0, 2).map((network, index) => ({
      ...network,
      cardsInCirculationNum: 100,
      cardsInCirculation: '100 sample cards',
      headquartersRegion: index === 0 ? 'Americas' : 'Asia-Pacific',
    })),
  }
})

it('preserves additive counts and region filtering without claiming unique at-risk cards or measured radar readiness', async () => {
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter>
      <NetworkComparator />
    </MemoryRouter>
  )
  expect(screen.getByText('Gross Reported Network Card Counts')).toBeInTheDocument()
  expect(screen.getByText('200')).toBeInTheDocument()
  expect(screen.getByText(/Reported network card counts may overlap/)).toHaveTextContent(
    'not a count of unique cards at risk'
  )
  await user.click(screen.getByRole('button', { name: 'Region:' }))
  await user.click(screen.getByRole('option', { name: 'Americas' }))
  expect(screen.getByText('100')).toBeInTheDocument()
  expect(screen.queryByText('200')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Region:' }))
  await user.click(screen.getByRole('option', { name: 'All' }))
  await user.click(screen.getByRole('button', { name: 'Compare' }))
  const choices = screen.getAllByRole('button', { name: /^Select / })
  await user.click(choices[0])
  await user.click(choices[1])
  expect(
    screen.getByRole('img', {
      name: 'Illustrative network score comparison, not measured readiness',
    })
  ).toBeInTheDocument()
  expect(screen.queryByText('Total Cards at Risk')).not.toBeInTheDocument()
  view.unmount()
})
