// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileComplianceView } from './MobileComplianceView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { complianceFrameworks } from '@/data/complianceData'
import { isComplianceFrameworkEmphasized } from '@/data/personaConfig'
import {
  buildObligations,
  groupObligations,
} from '@/components/Compliance/obligations/obligationsModel'
import { documentsFor, citationIndex } from '@/components/Compliance/requirements/requirementsModel'
import { CSWP39_STEPS } from '@/components/Compliance/cswp39Data'

// Real data throughout. The design brief for this screen invented a "9 tabs
// collapsed to 2 chips" mechanism that doesn't exist in the real code
// (confirmed by research before building) — every assertion below is derived
// from the SAME real model functions the component calls, not from the
// brief's numbers.
function seedScope() {
  usePersonaStore.setState({ selectedPersona: 'executive', selectedIndustries: [] })
  useAssessmentStore.setState({ country: 'United States', industry: 'Finance & Banking' })
}

function clearScope() {
  usePersonaStore.setState({ selectedPersona: null, selectedIndustries: [], selectedRegion: null })
  useAssessmentStore.setState({ country: undefined, industry: undefined })
}

describe('MobileComplianceView', () => {
  beforeEach(() => {
    clearScope()
  })

  it('shows an empty-profile message on Rules & Standards when nothing is scoped', () => {
    render(<MobileComplianceView />)
    expect(screen.getByText('Nothing in scope yet')).toBeInTheDocument()
  })

  it('renders the real tier-grouped obligations for a scoped profile, not stale figures', () => {
    seedScope()
    render(<MobileComplianceView />)
    const rows = buildObligations({
      country: 'United States',
      industry: 'Finance & Banking',
      region: null,
    })
    const groups = groupObligations(rows)
    expect(groups.length).toBeGreaterThan(0)
    // Every tier's real row count is shown as its own badge next to its label.
    for (const group of groups) {
      expect(screen.getByText(String(group.rows.length))).toBeInTheDocument()
    }
  })

  it('tapping an obligation opens its real "about this standard" detail sheet', () => {
    seedScope()
    render(<MobileComplianceView />)
    const rows = buildObligations({
      country: 'United States',
      industry: 'Finance & Banking',
      region: null,
    })
    const target = rows.find((r) => r.framework.description)
    expect(target).toBeTruthy()
    fireEvent.click(screen.getByText(target!.framework.label).closest('button')!)
    // The sheet shows the framework's real description — not a filtered
    // requirements jump.
    expect(screen.getByText(target!.framework.description)).toBeInTheDocument()
    expect(screen.getByText('What an auditor checks')).toBeInTheDocument()
  })

  it('the detail sheet\'s "View extracted requirements" jumps to Requirements with that framework selected', () => {
    seedScope()
    render(<MobileComplianceView />)
    const rows = buildObligations({
      country: 'United States',
      industry: 'Finance & Banking',
      region: null,
    })
    const target = rows.find((r) => r.framework.label)
    expect(target).toBeTruthy()
    fireEvent.click(screen.getByText(target!.framework.label).closest('button')!)
    fireEvent.click(screen.getByText('View extracted requirements'))
    // Requirements section is now active — the framework's own reason text
    // (verbatim from the applicability engine) appears in the reading pane.
    expect(screen.getAllByText(target!.reason).length).toBeGreaterThan(0)
  })

  it('shows real, live-computed cited-document counts on Requirements, not typed figures', () => {
    seedScope()
    render(<MobileComplianceView />)
    fireEvent.click(screen.getByText('Requirements'))
    const rows = buildObligations({
      country: 'United States',
      industry: 'Finance & Banking',
      region: null,
    })
    const index = citationIndex(rows.map((r) => r.framework))
    const first = rows[0]
    const docs = documentsFor(first.framework, index)
    if (docs.length > 0) {
      expect(screen.getByText(docs[0].sourceName)).toBeInTheDocument()
    }
  })

  it('Landscape shows the real persona-emphasis reduction, not the brief\'s "2 of 9"', () => {
    seedScope()
    render(<MobileComplianceView />)
    fireEvent.click(screen.getByText('Landscape'))
    const emphasisCount = complianceFrameworks.filter((f) =>
      isComplianceFrameworkEmphasized('executive', f.id)
    ).length
    expect(
      screen.getByText(new RegExp(`Showing the ${emphasisCount} frameworks`))
    ).toBeInTheDocument()
  })

  it('Landscape tiles are tappable and open the real detail sheet, not a dead end', () => {
    seedScope()
    render(<MobileComplianceView />)
    fireEvent.click(screen.getByText('Landscape'))
    const emphasisSet = complianceFrameworks.filter((f) =>
      isComplianceFrameworkEmphasized('executive', f.id)
    )
    expect(emphasisSet.length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText(emphasisSet[0].label).closest('button')!)
    expect(screen.getByText('What an auditor checks')).toBeInTheDocument()
  })

  it('Landscape explains the cut rather than dumping the full catalogue when no role is set', () => {
    render(<MobileComplianceView />)
    fireEvent.click(screen.getByText('Landscape'))
    expect(screen.getByText(/No role set/i)).toBeInTheDocument()
    expect(
      screen.queryByText(new RegExp(`Showing the .* frameworks that matter`))
    ).not.toBeInTheDocument()
  })

  it('Records shows the real 6-term certification glossary', () => {
    render(<MobileComplianceView />)
    fireEvent.click(screen.getByText('Records'))
    for (const term of ['FIPS 140-3', 'ACVP', 'CC', 'EUCC', 'CNSA 2.0', 'HNDL']) {
      expect(screen.getByText(term)).toBeInTheDocument()
    }
  })

  it("CSWP.39 shows all 5 real steps with the correct section refs, not the brief's wrong ones", () => {
    render(<MobileComplianceView />)
    fireEvent.click(screen.getByText('CSWP.39'))
    expect(CSWP39_STEPS).toHaveLength(5)
    for (const step of CSWP39_STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByText('Govern').closest('button')!)
    expect(screen.getByText('§5 (key activities, bullet 1)')).toBeInTheDocument()
    expect(screen.queryByText(/§5\.1/)).not.toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    render(<MobileComplianceView />)
    expect(screen.getByText(/Progress tracking, the full Products catalogue/i)).toBeInTheDocument()
  })
})
