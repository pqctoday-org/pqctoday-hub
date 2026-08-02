// SPDX-License-Identifier: GPL-3.0-only
/**
 * TEMPORARY PROBE — not a real test. Renders every selectable phase and dumps
 * which panels actually appear under each tab, so the Decide/Progress/Resources/
 * Signals split can be verified against reality rather than assumed. Delete once
 * the split has been reviewed.
 */
import { writeFileSync } from 'node:fs'
import { describe, it, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { PHASE_ORDER, FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

/**
 * A REALISTIC completed assessment — the minimal fixture other tests use omits
 * categoryScores / frameworkRisk / categoryDrivers / complianceFrameworks
 * entirely, which legitimately empties every assessment-derived Signals panel.
 * A real user who finished the wizard has all of them, so probing with the
 * minimal fixture would report a false "everything is missing".
 */
const minimalAssessment = (): AssessmentResult => ({
  riskScore: 72,
  riskLevel: 'high',
  algorithmMigrations: [
    { classical: 'RSA-2048', replacement: 'ML-KEM-768', urgency: 'immediate' },
    { classical: 'ECDSA P-256', replacement: 'ML-DSA-65', urgency: 'near-term' },
  ] as AssessmentResult['algorithmMigrations'],
  complianceImpacts: [
    { framework: 'GDPR', requiresPQC: null, deadline: '', notes: '' },
    { framework: 'BSI TR-02102', requiresPQC: true, deadline: '2030', notes: '' },
  ],
  boosts: [
    { id: 'hndl-urgency', label: 'Long data retention', delta: 0.12 },
    { id: 'cnsa-regulatory', label: 'Highly regulated sector', delta: 0.08 },
  ] as AssessmentResult['boosts'],
  recommendedActions: [],
  narrative: 'Test assessment.',
  generatedAt: new Date().toISOString(),
  categoryScores: {
    quantumExposure: 78,
    migrationComplexity: 64,
    regulatoryPressure: 71,
    organizationalReadiness: 35,
  },
  frameworkRisk: { hndl: 80, tnfl: 55, regulatory: 70, feasibility: 40 },
  categoryDrivers: {
    quantumExposure: 'Long data retention with RSA-2048 in transit.',
    migrationComplexity: 'Large estate, limited crypto inventory.',
    regulatoryPressure: 'BSI guidance applies to this sector.',
    organizationalReadiness: 'No dedicated PQC owner yet.',
  },
  assessmentProfile: {
    industry: 'Healthcare',
    country: 'Germany',
    algorithmsSelected: ['RSA-2048', 'ECDSA P-256'],
    algorithmUnknown: false,
    sensitivityLevels: ['restricted'],
    sensitivityUnknown: false,
    complianceFrameworks: ['GDPR', 'BSI TR-02102'],
    complianceUnknown: false,
    migrationStatus: 'not-started',
    migrationUnknown: false,
    mode: 'quick',
    useCasesUnknown: false,
    retentionUnknown: false,
    credentialLifetimeUnknown: false,
    infrastructureUnknown: false,
    agilityUnknown: false,
    vendorUnknown: false,
    systemScale: '51-200',
    scaleUnknown: false,
    timelineUnknown: false,
  },
})

beforeEach(() => {
  useSimulationStore.getState().reset()
  useAssessmentResultStore.getState().reset()
  useAssessmentResultStore.setState({ lastResult: null, completedAt: null })
  const r = minimalAssessment()
  useAssessmentResultStore.getState().setResult(r)
  useAssessmentResultStore.getState().markComplete(r)
  useSimulationStore.setState({ tourSeen: true })
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
})

/** Panel titles we expect to find, per tab. */
const MARKERS: Record<string, string[]> = {
  decide: ['Next move', 'Common Failures', 'Trap', 'recommended study', 'YOU', 'AI'],
  progress: ['Maturity gates', 'artifacts', 'For your sector'],
  resources: ['Open a resource', 'Learn', 'Activities', 'Reference'],
  signals: [
    'Program status',
    'This run',
    'Vital signs',
    'Critical assets',
    'Your architecture',
    'From your assessment',
    'Assessment KPIs',
    'Applicable compliance',
    'Situational factors',
    'Quantum risk',
    'Score drivers',
    'PQC migration backlog',
  ],
}

describe('PROBE: per-phase tab contents', () => {
  it('dumps what each tab renders for every phase', () => {
    const report: string[] = []
    for (const p of PHASE_ORDER as PhaseId[]) {
      useSimulationStore.getState().reset()
      useSimulationStore.setState({ tourSeen: true, sel: p })
      const { unmount } = render(
        <MemoryRouter initialEntries={['/simulation']}>
          <SimulationView />
        </MemoryRouter>
      )
      const name = FRAMEWORK_PHASES[p].name
      report.push(`\n=== ${p} · ${name} ===`)
      for (const tab of ['decide', 'progress', 'resources', 'signals'] as const) {
        const label = tab[0].toUpperCase() + tab.slice(1)
        const trigger = screen.queryByRole('button', { name: label })
        if (!trigger) {
          report.push(`  ${label}: <NO TAB TRIGGER>`)
          continue
        }
        fireEvent.click(trigger)
        const found = MARKERS[tab].filter(
          (m) => screen.queryAllByText(new RegExp(m, 'i')).length > 0
        )
        const missing = MARKERS[tab].filter((m) => !found.includes(m))
        report.push(`  ${label}: found=[${found.join(', ')}]`)
        report.push(`           missing=[${missing.join(', ')}]`)
      }
      unmount()
    }
    writeFileSync('/tmp/sim-tab-probe.txt', report.join('\n'), 'utf8')
  })
})
