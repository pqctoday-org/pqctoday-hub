// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { MobileProtocolMatrixView } from '@/components/Mobile/screens/MobileProtocolMatrixView'
import { PQCProtocolMatrix } from './PQCProtocolMatrix'
import { ProtocolDetailModal } from './ProtocolDetailModal'
import { parseMatrixAvailabilityParam, passesAvailabilityFilter } from './protocolMatrixState'

const pkcs11 = PROTOCOL_MATRIX.find((row) => row.id === 'pkcs11')!
const renderMatrix = (query: string, mobile = false) =>
  render(
    <MemoryRouter initialEntries={[`/algorithms?tab=support&${query}`]}>
      {mobile ? <MobileProtocolMatrixView /> : <PQCProtocolMatrix />}
    </MemoryRouter>
  )

function expectAvailabilitySources(region: HTMLElement) {
  for (const evidence of pkcs11.implementationAvailability ?? []) {
    expect(
      within(region).getByRole('link', { name: (name) => name.startsWith(evidence.provider) })
    ).toHaveAttribute('href', evidence.referenceUrl)
    expect(within(region).getByText(evidence.what)).toBeInTheDocument()
    expect(within(region).queryByText(/available since 2025-08/)).not.toBeInTheDocument()
  }
}

describe('vendor API availability and production deployment are distinct evidence', () => {
  it('preserves the two actual vendor release records, support details and educational tool separately', () => {
    expect(pkcs11.liveDeployments).toEqual([])
    expect(pkcs11.recommended).toBe(false)
    for (const dimension of [pkcs11.dimensions.pureKem, pkcs11.dimensions.pureSig]) {
      expect(dimension).not.toHaveProperty('deploymentPosture')
      expect(dimension.stage).toBe('rfc-published')
      expect(dimension.note).toContain('The published PKCS#11 v3.2 API defines')
      expect(dimension.note).toContain('Vendor API availability is documented below')
    }
    expect(pkcs11.implementationAvailability).toHaveLength(2)
    const [entrust, thales] = pkcs11.implementationAvailability!
    expect(entrust.referenceUrl).toBe(
      'https://nshielddocs.entrust.com/security-world-docs/v13.9.0/nshield-security-world-v13-9-0-release-notes.pdf'
    )
    expect(entrust.what).toContain('PKCS #11 API')
    expect(entrust.what).toContain('ML-DSA-44/65/87 key generation, signing and verification')
    expect(entrust.what).toContain('firmware v13.8 or greater and the PostQuantum feature enabled')
    expect(entrust.what).not.toMatch(/13\.9\.[35]|SLH-DSA|ML-KEM/)
    expect(entrust).not.toHaveProperty('since')
    expect(thales.referenceUrl).toBe(
      'https://thalesdocs.com/gphsm/luna/7/docs/network/Content/CRN/Luna/firmware/7-9-0.htm'
    )
    expect(thales.what).toContain('CA_EncapsulateKey')
    expect(pkcs11.playgrounds.length).toBeGreaterThan(0)
    expect(passesAvailabilityFilter(pkcs11, 'has-availability')).toBe(true)
    expect(passesAvailabilityFilter(pkcs11, 'has-deployment')).toBe(false)
    expect(passesAvailabilityFilter(pkcs11, 'no-deployment')).toBe(true)
    expect(parseMatrixAvailabilityParam('has-availability')).toBe('has-availability')
  })

  it('production evidence still passes the live category, while empty and lab-only rows do not', () => {
    const deployed = PROTOCOL_MATRIX.find((row) => (row.liveDeployments?.length ?? 0) > 0)!
    expect(passesAvailabilityFilter(deployed, 'has-deployment')).toBe(true)
    for (const id of ['5g-suci', 'macsec', 'kmip']) {
      const row = PROTOCOL_MATRIX.find((r) => r.id === id)!
      expect(passesAvailabilityFilter(row, 'has-deployment'), id).toBe(false)
      expect(passesAvailabilityFilter(row, 'has-availability'), id).toBe(false)
    }
    expect(PROTOCOL_MATRIX.find((row) => row.id === '5g-suci')?.noDeploymentReason).toContain(
      'lab trial'
    )
    expect(PROTOCOL_MATRIX.find((row) => row.id === 'macsec')?.noDeploymentReason).toContain(
      'proof of concept'
    )
  })

  it('the desktop category filter shows availability without a live count or deployed star', () => {
    renderMatrix('matrixQ=PKCS%2311&matrixAvailability=has-availability')
    expect(screen.getByText('2 vendor availability reports')).toBeInTheDocument()
    expect(screen.queryByText('2 live')).not.toBeInTheDocument()
    expect(screen.queryByText('Deployed')).not.toBeInTheDocument()
    expect(screen.queryByText('Production', { exact: true })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Has vendor availability evidence/ })
    ).toBeInTheDocument()
  })

  it('switching the visible category control separates availability from live deployment', () => {
    renderMatrix('matrixQ=PKCS%2311')
    fireEvent.click(screen.getByRole('button', { name: /^All rows/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Has vendor availability evidence' }))
    expect(screen.getByText('2 vendor availability reports')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Has vendor availability evidence/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Has live deployment' }))
    expect(screen.queryByText('2 vendor availability reports')).not.toBeInTheDocument()
  })

  it('the live filter excludes PKCS#11 rather than treating vendor availability as deployment', () => {
    renderMatrix('matrixQ=PKCS%2311&matrixAvailability=has-deployment')
    expect(screen.queryByText('2 vendor availability reports')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Open details for PKCS#11' })
    ).not.toBeInTheDocument()
  })

  it('the detailed card retains availability evidence, separate zero live count and tools', () => {
    renderMatrix('matrixView=detailed&matrixQ=PKCS%2311')
    fireEvent.click(screen.getByRole('button', { name: 'Expand PKCS#11' }))
    expect(screen.getByText(/0 live/)).toBeInTheDocument()
    expect(screen.queryByText('Production', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vendor availability (2)' })).toBeInTheDocument()
    expectAvailabilitySources(
      screen.getByRole('region', { name: 'Vendor implementation availability' })
    )
  })

  it('the desktop modal keeps both exact source links and mechanism/version scope outside Live deployments', () => {
    render(
      <MemoryRouter>
        <ProtocolDetailModal isOpen onClose={() => {}} protocol={pkcs11} />
      </MemoryRouter>
    )
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.queryByText('Production', { exact: true })).not.toBeInTheDocument()
    expect(dialog.getByRole('heading', { name: 'Live deployments (0)' })).toBeInTheDocument()
    expectAvailabilitySources(
      dialog.getByRole('region', { name: 'Vendor implementation availability' })
    )
  })

  it('the phone honors the same availability URL category and shows source-scoped support in its sheet', () => {
    renderMatrix('matrixQ=PKCS%2311&matrixAvailability=has-availability&protocol=pkcs11', true)
    expect(screen.getByText(/From link: Has vendor availability evidence/)).toBeInTheDocument()
    expect(screen.queryByText('Live deployments')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Deployment: production/)).not.toBeInTheDocument()
    expectAvailabilitySources(
      screen.getByRole('region', { name: 'Vendor implementation availability' })
    )
  })
  it('keeps actual Signal PQXDH deployment distinct from API availability in the phone sheet', () => {
    const signal = PROTOCOL_MATRIX.find((row) => row.id === 'signal-pqxdh')!
    expect(signal.dimensions.hybridKem.deploymentPosture).toBe('production')
    expect(
      signal.liveDeployments?.some(
        (entry) => entry.referenceUrl === 'https://signal.org/blog/pqxdh/'
      )
    ).toBe(true)
    expect(passesAvailabilityFilter(signal, 'has-deployment')).toBe(true)
    renderMatrix('protocol=signal-pqxdh', true)
    expect(screen.getByText(/^Deployment: production/)).toBeInTheDocument()
    expect(screen.getByText('Live deployments', { exact: true })).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: /Signal Messenger/ })
        .some((link) => link.getAttribute('href') === 'https://signal.org/blog/pqxdh/')
    ).toBe(true)
  })
})
