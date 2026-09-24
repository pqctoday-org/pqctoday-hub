// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ThreatItem } from '@/data/threatsData'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { SOC_LEARN_MODULE_HREF, SOC_LEARN_MODULE_ID } from '@/data/socQuantumPlaybook'
import { ThreatDetailDialog } from './ThreatDetailDialog'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'

// Claim-ledger fixture: CAV-UND undeterminable, CAV-CON contradicted, CAV-SUP supported;
// LIN-1 a confirmed source with 2 of 3 claims supported.
vi.mock('@/data/threatClaimStatus', async () => {
  const actual = await vi.importActual<typeof import('@/data/threatClaimStatus')>(
    '@/data/threatClaimStatus'
  )
  const fixture = {
    rows: {
      'CAV-UND': {
        claims: { threat_description: { verdict: 'undeterminable', decidedAt: '2026-09-16' } },
      },
      'CAV-CON': {
        claims: { threat_description: { verdict: 'contradicted', decidedAt: '2026-09-16' } },
      },
      'CAV-SUP': {
        claims: { threat_description: { verdict: 'supported', decidedAt: '2026-09-16' } },
      },
      'LIN-1': {
        claims: {
          main_source: { verdict: 'MATCH' },
          threat_description: { verdict: 'supported' },
          crypto_at_risk: { verdict: 'supported' },
          pqc_replacement: { verdict: 'undeterminable' },
        },
      },
    },
  }
  return {
    ...actual,
    getSourceCaveat: (id: string) => actual.sourceCaveatFor(id, fixture),
    getThreatLineage: (id: string) => actual.lineageFor(id, fixture),
  }
})

vi.mock('@/utils/endorsement', async () => {
  const actual = await vi.importActual<typeof import('@/utils/endorsement')>('@/utils/endorsement')
  return {
    ...actual,
    buildEndorsementUrl: vi.fn(actual.buildEndorsementUrl),
    buildFlagUrl: vi.fn(actual.buildFlagUrl),
  }
})

function threat(partial: Partial<ThreatItem>): ThreatItem {
  return {
    industry: 'Finance & Banking',
    threatId: 'TEST-001',
    description: 'A test threat.',
    criticality: 'High',
    cryptoAtRisk: 'TLS key exchange, encrypted archives',
    pqcReplacement: 'ML-KEM-768',
    mainSource: 'Test Source',
    sourceUrl: '',
    relatedModules: [],
    threatClass: 'hndl',
    ...partial,
  }
}

function renderDialog(t: ThreatItem, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <ThreatDetailDialog threat={t} onClose={onClose} />
    </MemoryRouter>
  )
}

describe('ThreatDetailDialog — Detection & Response (UX-1 / UX-2)', () => {
  it('lists the source use cases for a decrypt-later threat, each with its v3.0 page', () => {
    renderDialog(threat({}))
    expect(screen.getByText('Hybrid Downgrade Detection')).toBeInTheDocument()
    expect(screen.getByText('Cryptographic Drift Monitoring')).toBeInTheDocument()
    expect(screen.getByText('Enhanced HNDL-Indicator Detection')).toBeInTheDocument()
    expect(screen.queryByText('Certificate Lifecycle Anomalies')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Applied Quantum PQC Migration Framework v3\.0, p\. 218/)
    ).toBeInTheDocument()
    // UC5's v3.0 heading is named so a reader can find it in the document.
    expect(
      screen.getByText(/Exfiltration Detection Weighted by Confidentiality Horizon/)
    ).toBeInTheDocument()
  })

  it('points CRQC tracking at the Horizon section instead of listing it as a use case', () => {
    const onClose = vi.fn()
    renderDialog(threat({}), onClose)
    const link = screen.getByRole('link', { name: 'CRQC Threat Horizon' })
    expect(link).toHaveAttribute('href', '#crqc-threat-horizon')
    fireEvent.click(link)
    expect(onClose).toHaveBeenCalled()
  })

  it('follows the reviewed class — never "could not be determined" (ruling R1)', () => {
    // Encryption keywords, reviewed forge-later: the forge-later use cases show.
    renderDialog(threat({ threatClass: 'hnfl' }))
    expect(screen.queryByText(/could not be determined/)).not.toBeInTheDocument()
    expect(screen.getByText('Certificate Lifecycle Anomalies')).toBeInTheDocument()
    expect(screen.queryByText('Hybrid Downgrade Detection')).not.toBeInTheDocument()
  })

  it('Response tab shows the source playbooks with pages — no invented playbooks', () => {
    renderDialog(threat({}))
    fireEvent.click(screen.getByRole('tab', { name: /Incident Response/ }))
    const panel = screen.getByRole('tabpanel')
    expect(
      within(panel).getByText('Playbook 2: Confirmed Hybrid Downgrade Attack')
    ).toBeInTheDocument()
    expect(
      within(panel).getByText('Playbook 1: PQC Algorithm Vulnerability Disclosure')
    ).toBeInTheDocument()
    expect(within(panel).getByText(/p\. 226/)).toBeInTheDocument()
    expect(within(panel).queryByText(/Decrypt-Later Exposure Response/)).not.toBeInTheDocument()
    expect(within(panel).queryByText(/Manual Triage/)).not.toBeInTheDocument()
  })

  it('omits the hybrid-downgrade playbook for a forge-later threat', () => {
    renderDialog(
      threat({ cryptoAtRisk: 'ECDSA firmware signing certificate', threatClass: 'hnfl' })
    )
    fireEvent.click(screen.getByRole('tab', { name: /Incident Response/ }))
    expect(screen.queryByText(/Confirmed Hybrid Downgrade Attack/)).not.toBeInTheDocument()
    expect(screen.getByText(/Emergency Algorithm Rotation/)).toBeInTheDocument()
  })

  it('the playbook link opens a registered Learn module route, not the non-existent /business tool', () => {
    renderDialog(threat({}))
    fireEvent.click(screen.getByRole('tab', { name: /Incident Response/ }))
    const link = screen.getByRole('link', { name: /Learn: SOC Implementation for PQC/ })
    expect(link).toHaveAttribute('href', SOC_LEARN_MODULE_HREF)
    expect(link.getAttribute('href')).not.toMatch(/\/business/)
    const routable = MANIFESTS.filter((m) => m.load).map((m) => `/learn/${m.id}`)
    expect(routable).toContain(`/learn/${SOC_LEARN_MODULE_ID}`)
    expect(routable).toContain(link.getAttribute('href'))
  })
})

describe('ThreatDetailDialog — blank fields and internal notes (UX-5 / UX-6 / UX-12)', () => {
  it('shows "Not yet specified" for blank at-risk and PQC fields, and Unrated criticality', () => {
    renderDialog(threat({ criticality: 'Unrated', cryptoAtRisk: '', pqcReplacement: '' }))
    expect(screen.getAllByText('Not yet specified')).toHaveLength(2)
    expect(screen.getByText('Unrated')).toBeInTheDocument()
  })

  it('never renders the internal data_quality_notes maintenance log', () => {
    renderDialog(
      threat({
        peerReviewed: 'yes',
        dataQualityNotes:
          'Added via intake queue Phase 2 (add_row.py). LLM rewrite merged inline via qwen3.6:27b.',
      })
    )
    expect(screen.queryByText(/Data quality notes/)).not.toBeInTheDocument()
    expect(screen.queryByText(/add_row\.py/)).not.toBeInTheDocument()
    expect(screen.queryByText(/qwen/)).not.toBeInTheDocument()
    // The rest of the evidence panel still renders.
    expect(screen.getByText('Evidence')).toBeInTheDocument()
  })
})

describe('ThreatDetailDialog — shareable links (UX-3)', () => {
  it('Endorse and Flag link back with ?id=, the parameter the page reads', () => {
    renderDialog(threat({ threatId: 'FIN-007' }))
    const pageUrls = [
      ...vi.mocked(buildEndorsementUrl).mock.calls,
      ...vi.mocked(buildFlagUrl).mock.calls,
    ].map(([opts]) => opts.pageUrl)
    expect(pageUrls.length).toBeGreaterThanOrEqual(2)
    for (const url of pageUrls) expect(url).toBe('/threats?id=FIN-007')
  })
})

describe('ThreatDetailDialog — source caveat (claim ledger)', () => {
  const caveat =
    /doesn't itself state the quantum-specific points above — those are our analysis\. \(checked 2026-09-16\)/

  it('shows the caveat with its date when the description verdict is undeterminable', () => {
    renderDialog(threat({ threatId: 'CAV-UND', sourceUrl: 'https://example.org' }))
    expect(screen.getByText(caveat)).toBeInTheDocument()
  })

  it('shows the same caveat for "contradicted" — never that the source disagrees', () => {
    renderDialog(threat({ threatId: 'CAV-CON', sourceUrl: 'https://example.org' }))
    expect(screen.getByText(caveat)).toBeInTheDocument()
    expect(screen.queryByText(/contradict|disagree/i)).not.toBeInTheDocument()
  })

  it('no caveat when supported, or when the row has no verdict', () => {
    renderDialog(threat({ threatId: 'CAV-SUP', sourceUrl: 'https://example.org' }))
    expect(screen.queryByText(/those are our analysis/)).not.toBeInTheDocument()
  })

  it('no caveat for a row absent from the ledger', () => {
    renderDialog(threat({ threatId: 'NOT-IN-LEDGER', sourceUrl: 'https://example.org' }))
    expect(screen.queryByText(/those are our analysis/)).not.toBeInTheDocument()
  })
})

describe('ThreatDetailDialog — Evidence panel shows lineage, not scores (ruling R2 / UX-4)', () => {
  it('shows source identity and the claims checked — never confidence or accuracy', () => {
    renderDialog(
      threat({
        threatId: 'LIN-1',
        sourceUrl: 'https://example.org',
        confidenceScore: 87,
        accuracyPct: 92,
        lastVerified: '2026-09-20',
      })
    )
    expect(
      screen.getByText('Source document: confirmed to be the cited document')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Claims checked against the cited document: 2 supported · 1 could not be confirmed'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Last verified 2026-09-20')).toBeInTheDocument()
    expect(screen.queryByText(/confidence score|accuracy/i)).not.toBeInTheDocument()
    expect(screen.queryByText('92%')).not.toBeInTheDocument()
    expect(screen.queryByText('87')).not.toBeInTheDocument()
  })

  it('says "not yet confirmed" for a row the ledger has not matched, and omits last verified when absent', () => {
    renderDialog(threat({ threatId: 'NOT-IN-LEDGER', sourceUrl: 'https://example.org' }))
    expect(screen.getByText('Source document: not yet confirmed')).toBeInTheDocument()
    expect(screen.queryByText(/Claims checked/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Last verified/)).not.toBeInTheDocument()
  })

  it('labels a mirror copy with the original publisher', () => {
    renderDialog(
      threat({
        mainSource: 'PCI DSS v4.0.1',
        sourceUrl: 'https://mirror.example.org/pci.pdf',
        sourceMirrorOf: 'PCI Security Standards Council',
      })
    )
    const link = screen.getByRole('link', { name: /PCI DSS v4\.0\.1/ })
    expect(link).toHaveTextContent('(mirror of PCI Security Standards Council)')
  })
})
