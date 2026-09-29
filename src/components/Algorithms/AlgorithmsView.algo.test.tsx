// SPDX-License-Identifier: GPL-3.0-only
/**
 * PR 2 deep links on /algorithms: the `?algo=<algorithm_id>` detail drawer,
 * tabs implied by `?usecase` / `?attack`, `tab` pinned whenever a tab-bound
 * param is set, and the phone routes for `?section=coverage` / `?algo`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { AlgorithmsView } from './AlgorithmsView'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'

const { algo, mobile } = vi.hoisted(() => ({
  mobile: { value: false },
  algo: (name: string, fipsStandard: string, statusTier: string) => ({
    id: name.toLowerCase(),
    name,
    fipsStandard,
    status: 'Standardized',
    statusTier,
    family: 'KEM',
    cryptoFamily: 'Lattice',
    region: 'USA',
    securityLevel: 3,
    hasResearchGap: false,
    aesEquivalent: 'AES-192',
    publicKeySize: 1184,
    privateKeySize: 2400,
    signatureCiphertextSize: 1088,
    sharedSecretSize: 32,
    keyGenCycles: '1x',
    signEncapsCycles: '1x',
    verifyDecapsCycles: '1x',
    stackRAM: 6000,
    optimizationTarget: 'Balanced',
    useCaseNotes: 'Recommended general use',
    sizesUnknown: false,
    perfUnknown: false,
  }),
}))

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => mobile.value }))
vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: () => ({ hits: [], mode: 'idle' as const, loading: false }),
}))
vi.mock('./AlgorithmComparison', () => ({
  AlgorithmComparison: () => <div data-testid="transition-body" />,
}))
vi.mock('./AlgorithmDetailedComparison', () => ({
  AlgorithmDetailedComparison: ({
    filteredAlgorithms,
    onOpenAlgorithm,
  }: {
    filteredAlgorithms: { name: string }[]
    onOpenAlgorithm?: (a: { name: string }) => void
  }) => (
    <ul data-testid="detailed-body">
      {filteredAlgorithms.map((a) => (
        <li key={a.name}>
          <Button type="button" onClick={() => onOpenAlgorithm?.(a)}>
            open {a.name}
          </Button>
        </li>
      ))}
    </ul>
  ),
}))
vi.mock('./PQCProtocolMatrix', () => ({
  PQCProtocolMatrix: () => <div data-testid="protocol-matrix" />,
}))
vi.mock('./IndustryLandscapeView', () => ({
  IndustryLandscapeView: () => <div data-testid="landscape-body" />,
}))
vi.mock('./AlgorithmValidationView', () => ({
  AlgorithmValidationView: ({ sectionParam }: { sectionParam?: string | null }) => (
    <div data-testid="validation-body">{sectionParam}</div>
  ),
}))
vi.mock('@/components/Mobile/screens/MobileAlgorithmsView', () => ({
  MobileAlgorithmsView: () => <div data-testid="mobile-landing" />,
}))
vi.mock('@/components/Mobile/screens/MobileKATValidationView', () => ({
  MobileKATValidationView: ({ attackProfile }: { attackProfile?: string | null }) => (
    <div data-testid="mobile-kat">{attackProfile}</div>
  ),
}))
vi.mock('../../data/pqcAlgorithmsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/pqcAlgorithmsData')>()),
  loadPQCAlgorithmsData: vi
    .fn()
    .mockResolvedValue([
      algo('ML-KEM-768', 'FIPS 203', 'final'),
      algo('HQC-128', 'FIPS 207 (in development)', 'fips-draft'),
    ]),
  loadedFileMetadata: { filename: 'x.csv', date: null },
}))
vi.mock('../../data/algorithmsData', () => ({
  loadAlgorithmsData: vi.fn().mockResolvedValue([]),
  loadedTransitionMetadata: { filename: 'x.csv', date: null },
  getCryptoFamilyFromPQCName: () => 'Lattice',
  getTransitionFunctionGroup: () => 'KEM',
}))

function Probe() {
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="url-search">{useLocation().search}</span>
      <Button type="button" onClick={() => navigate(-1)}>
        history-back
      </Button>
    </>
  )
}
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={['/algorithms', entry]} initialIndex={1}>
      <AlgorithmsView />
      <Probe />
    </MemoryRouter>
  )

describe('AlgorithmsView — ?algo detail drawer', () => {
  beforeEach(() => {
    mobile.value = false
    usePersonaStore.setState({
      selectedPersona: 'developer',
      viewAccess: 'unlocked',
      hasSeenPersonaPicker: true,
      experienceLevel: null,
    })
  })

  it('opens the drawer for an algorithm_id on the Detailed tab', async () => {
    renderAt('/algorithms?algo=ml-kem-768')
    const drawer = await screen.findByRole('dialog', { name: 'ML-KEM-768' })
    expect(drawer).toHaveTextContent('FIPS 203')
    expect(drawer).toHaveTextContent('Recommended general use')
    expect(screen.getByTestId('detailed-body')).toBeInTheDocument()
  })

  it('accepts an exact, case-insensitive algorithm name from older links', async () => {
    renderAt('/algorithms?algo=ml-KEM-768')
    expect(await screen.findByRole('dialog', { name: 'ML-KEM-768' })).toBeInTheDocument()
  })

  it('widens the NIST-picks quick view when the algorithm is hidden', async () => {
    renderAt('/algorithms?algo=hqc-128')
    expect(await screen.findByRole('dialog', { name: 'HQC-128' })).toBeInTheDocument()
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent('HQC-128')
    await waitFor(() => expect(urlSearch()).toContain('quickview=none'))
  })

  it('says "not found" for an unknown id and strips it on dismiss', async () => {
    renderAt('/algorithms?algo=falcon-512')
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('falcon-512')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    await waitFor(() => expect(urlSearch()).not.toContain('algo='))
  })

  it('clicking a row name pushes ?algo (with tab) and Back closes it', async () => {
    renderAt('/algorithms?tab=detailed')
    fireEvent.click(await screen.findByRole('button', { name: 'open ML-KEM-768' }))
    expect(await screen.findByRole('dialog', { name: 'ML-KEM-768' })).toBeInTheDocument()
    expect(urlSearch()).toContain('algo=ml-kem-768')
    expect(urlSearch()).toContain('tab=detailed')
    fireEvent.click(screen.getByRole('button', { name: 'history-back' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(urlSearch()).toBe('?tab=detailed')
  })

  it('closing the drawer replaces ?algo away', async () => {
    renderAt('/algorithms?tab=detailed&algo=ml-kem-768')
    await screen.findByRole('dialog', { name: 'ML-KEM-768' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(urlSearch()).toBe('?tab=detailed')
  })
})

describe('AlgorithmsView — tab written for tab-bound params', () => {
  beforeEach(() => {
    mobile.value = false
    usePersonaStore.setState({ selectedPersona: 'developer', viewAccess: 'unlocked' })
  })

  it('keeps tab= in the URL for the persona-default tab when ?compare is set', async () => {
    renderAt('/algorithms?tab=detailed&compare=ML-KEM-768')
    fireEvent.click(await screen.findByText('Transition Guide'))
    await waitFor(() => expect(urlSearch()).toContain('tab=transition'))
  })

  it('still drops a persona-default tab when no tab-bound param is set', async () => {
    renderAt('/algorithms?tab=detailed')
    fireEvent.click(await screen.findByText('Transition Guide'))
    await waitFor(() => expect(urlSearch()).not.toContain('tab='))
  })

  it('?usecase without tab lands on (and pins) Industry Landscape', async () => {
    renderAt('/algorithms?usecase=cross-web-tls')
    expect(await screen.findByTestId('landscape-body')).toBeInTheDocument()
    await waitFor(() => expect(urlSearch()).toContain('tab=landscape'))
  })

  it('?attack without tab lands on (and pins) Validation', async () => {
    renderAt('/algorithms?attack=ML-KEM-768')
    expect(await screen.findByTestId('validation-body')).toBeInTheDocument()
    await waitFor(() => expect(urlSearch()).toContain('tab=validation'))
  })
})

describe('AlgorithmsView — phone routes', () => {
  beforeEach(() => {
    mobile.value = true
    usePersonaStore.setState({ selectedPersona: 'developer', viewAccess: 'unlocked' })
  })

  it('?section=coverage falls through to the real Validation view', async () => {
    renderAt('/algorithms?tab=validation&section=coverage')
    expect(await screen.findByTestId('validation-body')).toHaveTextContent('coverage')
    expect(screen.queryByTestId('mobile-kat')).not.toBeInTheDocument()
  })

  it('other Validation links stay on the phone KAT screen, with ?attack resolved', async () => {
    renderAt('/algorithms?tab=validation&attack=ml-kem-768')
    expect(await screen.findByTestId('mobile-kat')).toHaveTextContent('ML-KEM / Kyber')
  })

  it('?algo alone keeps the phone landing screen (it opens its own sheet)', async () => {
    renderAt('/algorithms?algo=ml-kem-768')
    expect(await screen.findByTestId('mobile-landing')).toBeInTheDocument()
    expect(urlSearch()).not.toContain('tab=')
  })
})
