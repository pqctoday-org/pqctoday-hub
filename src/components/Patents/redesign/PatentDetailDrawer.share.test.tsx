// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import type { PatentItem } from '@/types/PatentTypes'
import { PatentDetailDrawer } from './PatentDetailDrawer'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const patent: PatentItem = {
  patentNumber: 'US11000001',
  title: 'Lattice-Based Key Encapsulation Method',
  inventors: 'Test Inventor',
  assignee: 'TestCo',
  priorityDate: '2020-01-01',
  issueDate: '2022-06-01',
  filingDate: '2020-01-01',
  cpcCodes: '',
  summary: 'A sample summary.',
  primaryInventiveClaim: 'A sample claim.',
  cryptoAgilityMode: 'hybrid',
  migrationStrategy: 'hybrid',
  quantumRelevance: 'core_invention',
  quantumSafeBasis: 'pqc_algorithm',
  quantumNotes: '',
  protocols: [],
  classicalAlgorithms: [],
  pqcAlgorithms: [],
  quantumTechnology: [],
  keyManagementOps: [],
  hardwareComponents: [],
  authenticationFactors: [],
  standardsReferenced: [],
  threatModel: [],
  entropySource: [],
  primitiveTypes: [],
  applicationDomain: [],
  independentClaimSubjects: [],
  performanceClaims: [],
  dataTypesProtected: [],
  complianceTargets: [],
  citationGraph: [],
  claimDependencies: [],
  nistRoundStatus: [],
  pqcMigrationScore: 5,
  pqcMigrationReason: '',
  impactScore: 50,
  impactLevel: 'Medium',
  priorityYear: 2020,
  filingYear: 2020,
}

function openDrawer(onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/patents?tab=explore&assignee=TestCo&patent=US11000001']}>
      <Button type="button">outside</Button>
      <PatentDetailDrawer
        patent={patent}
        resultList={[patent]}
        inCorpusIds={new Set([patent.patentNumber])}
        onClose={onClose}
        onNavigate={vi.fn()}
      />
    </MemoryRouter>
  )
  return onClose
}

describe('PatentDetailDrawer — Share inside the drawer', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('Copy link copies the clean ?patent link; Esc closes only the menu', async () => {
    const onClose = openDrawer()
    const drawer = screen.getByRole('dialog')
    fireEvent.click(within(drawer).getByRole('button', { name: /^Share US11000001/ }))
    const menu = screen.getByRole('menu')
    expect(drawer.contains(menu)).toBe(false)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(within(drawer).getByRole('button', { name: /^Share US11000001/ }))
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ }))
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/patents?patent=US11000001`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('traps focus inside the open drawer', async () => {
    openDrawer()
    const drawer = screen.getByRole('dialog')
    await vi.waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
    screen.getByRole('button', { name: 'outside', hidden: true }).focus()
    await vi.waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
  })
})
