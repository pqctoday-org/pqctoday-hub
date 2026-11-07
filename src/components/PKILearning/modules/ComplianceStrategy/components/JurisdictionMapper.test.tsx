// SPDX-License-Identifier: AGPL-3.0-only
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

describe('JurisdictionMapper — early-deadline conflict', () => {
  it('lists Australia and the Czech annex estimate, and leaves Taiwan out of the list', () => {
    mocks.software = []
    render(
      <MemoryRouter initialEntries={['/learn/compliance-strategy']}>
        <JurisdictionMapper
          selectedJurisdictions={['us', 'au', 'cz', 'tw']}
          onJurisdictionsChange={() => {}}
          dismissedFrameworks={new Set()}
          onDismissedFrameworksChange={() => {}}
        />
      </MemoryRouter>
    )
    const early = screen.getByText(/have deadlines significantly earlier than/)
    expect(early).toHaveTextContent('Australia (2030)')
    expect(early).toHaveTextContent('Czech Republic (end of 2030, NUKIB annex estimate)')
    expect(early).not.toHaveTextContent('Taiwan')
    expect(early).not.toHaveTextContent('2027')
  })

  it('does not raise the early-deadline conflict for Taiwan alone', () => {
    mocks.software = []
    render(
      <MemoryRouter initialEntries={['/learn/compliance-strategy']}>
        <JurisdictionMapper
          selectedJurisdictions={['us', 'tw']}
          onJurisdictionsChange={() => {}}
          dismissedFrameworks={new Set()}
          onDismissedFrameworksChange={() => {}}
        />
      </MemoryRouter>
    )
    expect(screen.queryByText(/have deadlines significantly earlier than/)).not.toBeInTheDocument()
  })
})

describe('JurisdictionMapper — CNSA 2.0 applies to national security systems', () => {
  const NSS_LABEL =
    /This sample system is a U\.S\. national security system or under an NSS contract/
  const renderWith = (selected: string[]) => {
    mocks.software = []
    return render(
      <MemoryRouter initialEntries={['/learn/compliance-strategy']}>
        <JurisdictionMapper
          selectedJurisdictions={selected}
          onJurisdictionsChange={() => {}}
          dismissedFrameworks={new Set()}
          onDismissedFrameworksChange={() => {}}
        />
      </MemoryRouter>
    )
  }

  it('offers the national-security-system checkbox only when the U.S. is selected, unticked by default', () => {
    renderWith(['us', 'eu'])
    expect(screen.getByRole('checkbox', { name: NSS_LABEL })).not.toBeChecked()
  })

  it('does not show the checkbox without the U.S.', () => {
    renderWith(['eu', 'fr'])
    expect(screen.queryByRole('checkbox', { name: NSS_LABEL })).not.toBeInTheDocument()
  })

  it('words the U.S./EU conflict conditionally until the box is ticked', () => {
    renderWith(['us', 'eu'])
    expect(
      screen.getByText(/^If the system is a national security system, CNSA 2\.0 requires/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/^CNSA 2\.0 requires ML-KEM-1024/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: NSS_LABEL }))
    expect(
      screen.getByText(
        /^CNSA 2\.0 requires ML-KEM-1024 and ML-DSA-87 minimum security levels for U\.S\. NSS/
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/^If the system is a national security system, CNSA 2\.0/)
    ).not.toBeInTheDocument()
  })

  it('words the U.S./France-Germany conflict conditionally until the box is ticked', () => {
    renderWith(['us', 'fr'])
    expect(
      screen.getByText(
        /if the system is a national security system, NSA CNSA 2\.0 targets pure PQC/
      )
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: NSS_LABEL }))
    const text = screen.getByText(/ANSSI \(France\) makes hybrid mandatory/).textContent ?? ''
    expect(text).toMatch(/BSI \(Germany\) recommends hybrid; NSA CNSA 2\.0 targets pure PQC/)
    expect(text).not.toMatch(/if the system is a national security system/)
  })

  it('attaches the U.S. 2033-2035 target to national security systems in the early-deadline conflict', () => {
    renderWith(['us', 'au'])
    expect(screen.getByText(/have deadlines significantly earlier than/)).toHaveTextContent(
      'earlier than US full transition (2033-2035, if the system is a national security system).'
    )
    fireEvent.click(screen.getByRole('checkbox', { name: NSS_LABEL }))
    const ticked = screen.getByText(/have deadlines significantly earlier than/)
    expect(ticked).toHaveTextContent('earlier than US full transition (2033-2035).')
    expect(ticked).not.toHaveTextContent('national security system')
  })
})
