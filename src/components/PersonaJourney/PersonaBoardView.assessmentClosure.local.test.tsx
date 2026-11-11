// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { PersonaBoardView } from './PersonaBoardView'
import { MobileHomeBoard } from '@/components/Mobile/screens/MobileHomeBoard'
import { resolveRoleBoardVariant } from '@/data/personaConfig'
import {
  buildMarkdown,
  type VerifyState,
} from '@/components/BusinessCenter/tools/MigrationVerification'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useRoleBoardVariantStore } from '@/store/useRoleBoardVariantStore'

// The workshop launcher is unrelated to either destination and loads async tools.
vi.mock('@/components/Mobile/shell/MobileWorkshopEntry', () => ({
  MobileWorkshopEntry: () => null,
}))

const stores = [
  useAssessmentFormStore,
  useAssessmentResultStore,
  usePersonaStore,
  useRoleBoardVariantStore,
]
const snapshot = () => stores.map((store) => store.getState())

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="destination">{location.pathname + location.search}</output>
}

// Real generated board data and real desktop/mobile consumers: a generic CTA
// routing assertion would miss a report mislabeled as a closure record.
describe('assessment report and closure board contract', () => {
  it.each(['desktop', 'phone'] as const)(
    '%s keeps the ops sample report and closure destinations separate without replacing learner state',
    (shell) => {
      const before = snapshot()
      const writes = vi.spyOn(Storage.prototype, 'setItem')
      try {
        render(
          <MemoryRouter initialEntries={['/?variant=closeout']}>
            {shell === 'desktop' ? (
              <PersonaBoardView personaId="ops" variantId="closeout" />
            ) : (
              <MobileHomeBoard persona="ops" variantId="closeout" onOpenRoleSwitch={() => {}} />
            )}
            <LocationProbe />
          </MemoryRouter>
        )
        fireEvent.click(screen.getByRole('button', { name: 'Explore a sample assessment report' }))
        expect(screen.getByTestId('destination')).toHaveTextContent('/report?example=1')
        fireEvent.click(screen.getByRole('button', { name: 'Record the closure evidence' }))
        expect(screen.getByTestId('destination')).toHaveTextContent(
          '/business/tools/migration-verification'
        )
        expect(snapshot()).toEqual(before)
        snapshot().forEach((state, index) => expect(state).toBe(before[index]))
        expect(writes).not.toHaveBeenCalled()
      } finally {
        writes.mockRestore()
      }
    }
  )

  it.each(['desktop', 'phone'] as const)(
    '%s renders the developer report as a sample and preserves practitioner-framework attribution',
    (shell) => {
      render(
        <MemoryRouter>
          {shell === 'desktop' ? (
            <PersonaBoardView personaId="developer" variantId="closure" />
          ) : (
            <MobileHomeBoard persona="developer" variantId="closure" onOpenRoleSwitch={() => {}} />
          )}
        </MemoryRouter>
      )
      if (shell === 'phone') {
        fireEvent.click(screen.getByRole('button', { name: /Show 3/ }))
      }
      const report = screen.getByText('Sample assessment report')
      expect(report).toBeInTheDocument()
      expect(
        screen.getByText(
          /Explore a sample risk and planning report generated from assessment answers/
        )
      ).toBeInTheDocument()
      const board = resolveRoleBoardVariant('developer', 'closure').board
      expect(board.gridCards[0].href).toBe('/report?example=1')
      expect(board.ctaSecondaryHref).toBe('/business/tools/migration-verification')
      // Pin the practitioner-framework wording, including its limitation. These five
      // practitioner-framework points must not become a normative NIST claim
      // or be misattributed as criteria invented by the Hub.
      expect(
        screen.getByText(
          "The linked closure tool offers five prompts that follow the framework's five-point verification evidence standard. Filling them records references; it does not run checks or verify a deployment."
        )
      ).toBeInTheDocument()
    }
  )

  it('preserves the named practitioner source in the closure artifact', () => {
    const state: VerifyState = {
      records: [],
      decommissions: [],
      closure: {
        decision: '',
        signOffBy: '',
        signOffDate: '',
        bauOwners: {
          Discovery: '',
          CBOM: '',
          Risk: '',
          'Vendor governance': '',
        },
      },
    }
    const markdown = buildMarkdown(state)
    expect(markdown).toContain(
      'Built on the Applied Quantum PQC Migration Framework v2.1 — Marin Ivezic / Applied Quantum (CC BY 4.0). https://pqcframework.com'
    )
    expect(markdown).not.toMatch(/(?:NIST|Hub)[^\n]*(?:five-point|5-point) evidence standard/i)
  })
})
