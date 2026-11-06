// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const seed = vi.hoisted(() => ({
  useCases: [] as string[],
  transitions: [] as Array<Record<string, string | undefined>>,
  products: [] as Array<Record<string, string>>,
  saved: undefined as Array<Record<string, string>> | undefined,
}))

vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument: vi.fn() }),
}))
vi.mock('@/hooks/assessment/useAssessmentSnapshot', () => ({
  useAssessmentSnapshot: () => ({ input: { cryptoUseCases: seed.useCases } }),
}))
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => seed.transitions,
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: seed.products }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => seed.saved }))
vi.mock('@/components/Simulation/MermaidDiagram', () => ({
  MermaidDiagram: ({ source }: { source: string }) => (
    <pre data-testid="mermaid-source">{source}</pre>
  ),
}))
vi.mock('@/components/Simulation/mermaidRender', () => ({
  renderMermaidToPngDataUrl: vi.fn(),
}))
vi.mock('@/services/export/pdfExport', () => ({
  buildArtifactPdf: vi.fn(),
  addDiagramImagePage: vi.fn(),
  drawFooters: vi.fn(),
  sanitiseFilename: (s: string) => s,
}))

import { CryptoArchitectureDiagram } from './CryptoArchitectureDiagram'

const dependsOn = (id: string) =>
  (screen.getByLabelText(`Ids ${id} depends on, comma-separated`) as HTMLInputElement).value
const nameOf = (id: string) => (screen.getByLabelText(`Name of ${id}`) as HTMLInputElement).value
const detailOf = (id: string) =>
  (screen.getByLabelText(`Detail of ${id}`) as HTMLInputElement).value
const diagramSource = () => screen.getByTestId('mermaid-source').textContent ?? ''

async function copiedMarkdown(): Promise<string> {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  fireEvent.click(screen.getByRole('button', { name: /Copy markdown/i }))
  await waitFor(() => expect(writeText).toHaveBeenCalled())
  return String(writeText.mock.calls[0][0])
}

describe('CryptoArchitectureDiagram assessment seeding', () => {
  beforeEach(() => {
    seed.saved = undefined
    seed.useCases = ['TLS/HTTPS', 'Code signing']
    seed.transitions = [
      {
        classical: 'RSA',
        keySize: '2048',
        pqc: 'ML-DSA-65',
        status: 'Standardized',
        deprecationDate: '2030',
      },
      {
        classical: 'ECDH',
        keySize: 'P-256',
        pqc: 'ML-KEM-768',
        status: 'Standardized',
        deprecationDate: '',
      },
    ]
    seed.products = [
      { softwareName: 'Example HSM', vendorId: 'VND-1', fipsValidated: 'No', pqcSupport: 'None' },
    ]
  })

  it('does not invent dependencies between reported use cases and algorithms or products', () => {
    render(<CryptoArchitectureDiagram />)
    for (const id of ['lib-1', 'lib-2', 'prod-1', 'proto-1', 'proto-2']) {
      expect(dependsOn(id)).toBe('')
    }
    // No edge is drawn until a dependency is supplied.
    expect(diagramSource()).not.toContain('-->')
  })

  it('does not present a reported algorithm as an identified library', () => {
    render(<CryptoArchitectureDiagram />)
    expect(nameOf('lib-1')).toMatch(/RSA \(2048\).*to identify/)
    expect(nameOf('lib-1')).not.toMatch(/^RSA \(2048\)$/)
    expect(detailOf('lib-1')).toMatch(/not identified/i)
    // A product the learner actually selected on the Migrate page keeps its own name.
    expect(nameOf('prod-1')).toBe('Example HSM (VND-1)')
  })

  it('draws an edge once the learner supplies a dependency', () => {
    render(<CryptoArchitectureDiagram />)
    fireEvent.change(screen.getByLabelText('Ids proto-1 depends on, comma-separated'), {
      target: { value: 'prod-1' },
    })
    expect(diagramSource()).toContain('proto_1 --> prod_1')
    expect(diagramSource().match(/-->/g)).toHaveLength(1)
  })

  it('exports no dependencies for seeded rows and marks the algorithm rows as unidentified', async () => {
    render(<CryptoArchitectureDiagram />)
    const markdown = await copiedMarkdown()
    const tableRows = markdown.split('\n').filter((line) => /^\| (Library|Protocol|HSM)/.test(line))
    expect(tableRows).toHaveLength(5)
    for (const row of tableRows) expect(row.trimEnd()).toMatch(/\| — \|$/)
    expect(markdown).not.toContain('-->')
    expect(markdown).toMatch(/implementation \(to identify\)/)
  })

  it('tells the learner that no dependencies were assumed', () => {
    render(<CryptoArchitectureDiagram />)
    expect(screen.getByText(/no dependencies assumed/i)).toBeInTheDocument()
    expect(screen.getByText(/implementing library still to identify/i)).toBeInTheDocument()
  })
})

describe('CryptoArchitectureDiagram generic starter sample', () => {
  const EXAMPLE_NOTE = 'Example architecture — replace with your own components.'

  beforeEach(() => {
    seed.useCases = []
    seed.transitions = []
    seed.products = []
    seed.saved = undefined
  })

  it('labels the starter rows as an example when nothing is saved or reported', () => {
    render(<CryptoArchitectureDiagram />)
    // The generic sample is on screen: web app, OpenSSL, HSM and CA.
    expect(nameOf('app-1')).toBe('Customer-facing web app')
    expect(screen.getByText(EXAMPLE_NOTE)).toBeInTheDocument()
  })

  it('drops the label once the learner edits a row', () => {
    render(<CryptoArchitectureDiagram />)
    fireEvent.change(screen.getByLabelText('Name of app-1'), {
      target: { value: 'My payments API' },
    })
    expect(screen.queryByText(EXAMPLE_NOTE)).not.toBeInTheDocument()
  })

  it('drops the label once the learner adds or removes a component', () => {
    const { unmount } = render(<CryptoArchitectureDiagram />)
    fireEvent.click(screen.getByRole('button', { name: /^Protocol$/ }))
    expect(screen.queryByText(EXAMPLE_NOTE)).not.toBeInTheDocument()
    unmount()

    render(<CryptoArchitectureDiagram />)
    expect(screen.getByText(EXAMPLE_NOTE)).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove component' })[0])
    expect(screen.queryByText(EXAMPLE_NOTE)).not.toBeInTheDocument()
  })

  it('drops the label once the learner saves', () => {
    render(<CryptoArchitectureDiagram />)
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(screen.queryByText(EXAMPLE_NOTE)).not.toBeInTheDocument()
  })

  it('does not label a restored saved diagram as an example', () => {
    seed.saved = [
      { id: 'app-1', kind: 'application', name: 'Payments API', detail: '', dependsOn: '' },
    ]
    render(<CryptoArchitectureDiagram />)
    expect(nameOf('app-1')).toBe('Payments API')
    expect(screen.queryByText(EXAMPLE_NOTE)).not.toBeInTheDocument()
  })

  it('does not label an assessment-seeded diagram as an example', () => {
    seed.useCases = ['TLS/HTTPS']
    render(<CryptoArchitectureDiagram />)
    expect(screen.queryByText(EXAMPLE_NOTE)).not.toBeInTheDocument()
  })

  it('labels the sample again after the assessment rows are cleared', () => {
    seed.useCases = ['TLS/HTTPS']
    render(<CryptoArchitectureDiagram />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(nameOf('app-1')).toBe('Customer-facing web app')
    expect(screen.getByText(EXAMPLE_NOTE)).toBeInTheDocument()
  })
})
