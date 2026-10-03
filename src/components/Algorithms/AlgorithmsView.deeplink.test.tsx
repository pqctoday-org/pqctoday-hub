// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link arrivals on /algorithms (2026-09-28 remediation): ?highlight
 * widens hidden rows with an Undo, unknown names say "not found", ?protocol
 * without ?tab lands on Protocol Support, and resource links bypass the
 * Curious preview card.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { AlgorithmsView } from './AlgorithmsView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getAlgorithmDefaults } from '@/data/personaConfig'

const { algo } = vi.hoisted(() => ({
  algo: (name: string, fipsStandard: string, statusTier: string, status = 'Standardized') => ({
    id: name.toLowerCase(),
    name,
    fipsStandard,
    status,
    statusTier,
    family: name,
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
    useCaseNotes: '',
    sizesUnknown: false,
    perfUnknown: false,
  }),
}))

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: () => ({ hits: [], mode: 'idle' as const, loading: false }),
}))
vi.mock('./AlgorithmComparison', () => ({
  AlgorithmComparison: () => <div data-testid="transition-body" />,
}))
vi.mock('./AlgorithmDetailedComparison', () => ({
  AlgorithmDetailedComparison: ({
    filteredAlgorithms,
  }: {
    filteredAlgorithms: { name: string }[]
  }) => (
    <ul data-testid="detailed-body">
      {filteredAlgorithms.map((a) => (
        <li key={a.name}>{a.name}</li>
      ))}
    </ul>
  ),
}))
vi.mock('./PQCProtocolMatrix', () => ({
  PQCProtocolMatrix: () => <div data-testid="protocol-matrix" />,
}))
vi.mock('../../data/pqcAlgorithmsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/pqcAlgorithmsData')>()),
  loadPQCAlgorithmsData: vi
    .fn()
    .mockResolvedValue([
      algo('ML-KEM-768', 'FIPS 203', 'final'),
      algo('HQC-128', 'FIPS 207 (in development)', 'fips-draft'),
      algo('Obscure-Candidate', 'None', 'candidate', 'Candidate'),
    ]),
  loadedFileMetadata: { filename: 'x.csv', date: null },
  getFunctionGroup: () => 'KEM',
  isClassical: () => false,
}))
vi.mock('../../data/algorithmsData', () => ({
  loadAlgorithmsData: vi.fn().mockResolvedValue([]),
  loadedTransitionMetadata: { filename: 'x.csv', date: null },
  getCryptoFamilyFromPQCName: () => 'Lattice',
  getTransitionFunctionGroup: () => 'KEM',
}))

function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
/** An in-app link followed while /algorithms is already mounted. */
function GoTo({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <Button type="button" onClick={() => navigate(to)}>
      {`go ${to}`}
    </Button>
  )
}
const renderAt = (entry: string, links: string[] = []) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AlgorithmsView />
      <Probe />
      {links.map((to) => (
        <GoTo key={to} to={to} />
      ))}
    </MemoryRouter>
  )

describe('AlgorithmsView — deep links', () => {
  beforeEach(() => {
    usePersonaStore.setState({
      selectedPersona: 'developer',
      viewAccess: 'unlocked',
      hasSeenPersonaPicker: true,
      experienceLevel: null,
    })
  })

  it('leaves filters alone when the highlighted row is already visible', async () => {
    renderAt('/algorithms?highlight=ML-KEM-768')
    expect(await screen.findByText('ML-KEM-768')).toBeInTheDocument()
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
    expect(urlSearch()).not.toContain('quickview=')
  })

  it('drops the NIST-picks default to show a hidden highlighted row, with Undo', async () => {
    renderAt('/algorithms?highlight=HQC-128')
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent('HQC-128')
    expect(await screen.findByText('HQC-128')).toBeInTheDocument()
    await waitFor(() => expect(urlSearch()).toContain('quickview=none'))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(screen.queryByText('HQC-128')).not.toBeInTheDocument())
    await waitFor(() => expect(urlSearch()).not.toContain('quickview='))
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
  })

  it('clears the status filter too when the quick view alone is not enough', async () => {
    renderAt('/algorithms?highlight=Obscure-Candidate')
    expect(await screen.findByTestId('deeplink-notice-widened')).toHaveTextContent(
      /Filters were cleared/
    )
    expect(await screen.findByText('Obscure-Candidate')).toBeInTheDocument()
  })

  it('says "not found" when the highlight matches no algorithm', async () => {
    renderAt('/algorithms?highlight=Falcon-512')
    expect(await screen.findByTestId('deeplink-notice-not-found')).toHaveTextContent('Falcon-512')
  })

  it('honours ?quickview=none on load', async () => {
    renderAt('/algorithms?tab=detailed&quickview=none')
    expect(await screen.findByText('HQC-128')).toBeInTheDocument()
  })

  it('treats ?protocol without ?tab as the Protocol Support tab', async () => {
    renderAt('/algorithms?protocol=ssh')
    expect(await screen.findByTestId('protocol-matrix')).toBeInTheDocument()
    await waitFor(() => expect(urlSearch()).toContain('tab=support'))
  })

  it('a resource link bypasses the Curious preview card', async () => {
    usePersonaStore.setState({ selectedPersona: 'curious', viewAccess: 'preview' })
    renderAt('/algorithms?tab=support&protocol=ssh')
    expect(await screen.findByTestId('protocol-matrix')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /three you actually need to know/ })
    ).not.toBeInTheDocument()
  })

  it('a bare visit still shows the Curious preview card', async () => {
    usePersonaStore.setState({ selectedPersona: 'curious', viewAccess: 'preview' })
    renderAt('/algorithms?tab=support')
    expect(
      await screen.findByRole('heading', { name: /three you actually need to know/ })
    ).toBeInTheDocument()
  })

  it('a filter change on the persona-default tab still pins ?tab (share carries it)', async () => {
    const defaultTab = getAlgorithmDefaults('developer').tab
    renderAt('/algorithms')
    await screen.findByTestId(defaultTab === 'detailed' ? 'detailed-body' : 'transition-body')
    expect(urlSearch()).not.toContain('tab=')
    fireEvent.click(screen.getAllByRole('button', { name: /Everything/ })[0])
    await waitFor(() => expect(urlSearch()).toContain('quickview=none'))
    expect(urlSearch()).toContain(`tab=${defaultTab}`)
  })

  it('follows ?quickview and ?cnsa on a second link while already on the page', async () => {
    const detailed = '/algorithms?tab=detailed'
    renderAt(`${detailed}&quickview=none`, [
      `${detailed}&quickview=nist-picks`,
      `${detailed}&quickview=none&cnsa=1`,
    ])
    expect(await screen.findByText('HQC-128')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `go ${detailed}&quickview=nist-picks` }))
    await waitFor(() => expect(screen.queryByText('HQC-128')).not.toBeInTheDocument())
    expect(screen.getByText('ML-KEM-768')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `go ${detailed}&quickview=none&cnsa=1` }))
    // CNSA 2.0 admits ML-KEM-1024 only, so the -768 row drops out.
    await waitFor(() => expect(screen.queryByText('ML-KEM-768')).not.toBeInTheDocument())
  })
})
