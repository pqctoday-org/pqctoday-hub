// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Browse Migrate Catalog" used to be a bare navigate('/migrate') although the
 * matched products are known — it now carries them (?product= / ?productIds=),
 * and each preview card links its own product.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { JurisdictionMapper } from './JurisdictionMapper'

const product = (productId: string, softwareName: string) => ({
  productId,
  softwareName,
  pqcSupport: 'Yes',
  targetIndustries: 'Finance',
  fipsValidated: '',
  productBrief: '',
  infrastructureLayer: 'Libraries',
})
const mocks = vi.hoisted(() => ({ software: [] as unknown[] }))

vi.mock('@/data/migrateData', () => ({
  get softwareData() {
    return mocks.software
  },
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    frameworks: [
      {
        id: 'fw-test',
        label: 'Test Banking Rule',
        description: 'desc',
        countries: ['United States'],
        industries: ['Finance'],
        requiresPQC: true,
        deadline: '2030',
        timelineRefs: [],
      },
    ],
    countryDeadlines: [],
  }),
}))

function Probe() {
  const loc = useLocation()
  return <output data-testid="loc">{`${loc.pathname}${loc.search}`}</output>
}
const renderMapper = () =>
  render(
    <MemoryRouter initialEntries={['/learn/compliance-strategy']}>
      <JurisdictionMapper
        selectedJurisdictions={['us']}
        onJurisdictionsChange={() => {}}
        dismissedFrameworks={new Set()}
        onDismissedFrameworksChange={() => {}}
      />
      <Probe />
    </MemoryRouter>
  )
const expandAndBrowse = () => {
  fireEvent.click(screen.getAllByText('Test Banking Rule')[0])
  fireEvent.click(screen.getByRole('button', { name: /Browse Migrate Catalog/ }))
  return screen.getByTestId('loc').textContent
}

describe('JurisdictionMapper — Migrate links', () => {
  it('several matched products → /migrate?productIds=<exact ids>', () => {
    mocks.software = [product('alpha-lib', 'Alpha Lib'), product('beta-hsm', 'Beta HSM')]
    renderMapper()
    expect(expandAndBrowse()).toBe('/migrate?productIds=alpha-lib,beta-hsm')
  })

  it('one matched product → /migrate?product=<id>; each card links its product', () => {
    mocks.software = [product('alpha-lib', 'Alpha Lib')]
    renderMapper()
    fireEvent.click(screen.getAllByText('Test Banking Rule')[0])
    expect(screen.getByRole('link', { name: 'Alpha Lib' })).toHaveAttribute(
      'href',
      '/migrate?product=alpha-lib'
    )
    fireEvent.click(screen.getByRole('button', { name: /Browse Migrate Catalog/ }))
    expect(screen.getByTestId('loc').textContent).toBe('/migrate?product=alpha-lib')
  })
})
