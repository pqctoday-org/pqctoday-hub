// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The "Certification engineer route" box is shared by the four certification modules. The
 * reader-role orientation (lab tester, vendor engineer, scheme reviewer, next on this path) is for
 * the certification-engineer role on the Fundamentals module only: every other role, and the other
 * three modules, keep the text they had.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import fundamentalsManifest from '../manifest'
import fipsManifest from '../../Fips1403Certification/manifest'
import { CertIntroduction } from './CertIntroduction'

const renderBox = (manifest: ModuleManifest) =>
  render(
    <EmbedProvider>
      <MemoryRouter>
        <CertIntroduction
          manifest={manifest}
          sections={new Map()}
          onNavigateToWorkshop={() => {}}
        />
      </MemoryRouter>
    </EmbedProvider>
  )

const asPersona = (persona: 'cert-engineer' | 'ops') =>
  act(() => usePersonaStore.getState().setPersona(persona))

describe('certification route box: Fundamentals orientation', () => {
  afterEach(() => {
    act(() => usePersonaStore.getState().clearPersona())
  })

  it('gives the certification engineer the three reader roles and the next two modules', () => {
    asPersona('cert-engineer')
    renderBox(fundamentalsManifest)
    const box = screen.getByTestId('cert-audience-route')
    expect(box).toHaveTextContent('Certification engineer route')
    const lines = within(screen.getByTestId('cert-route-orientation')).getAllByRole('listitem')
    expect(lines.map((li) => li.textContent)).toEqual([
      'Lab tester: see who tests and who decides in each scheme, and where a lab’s report fits.',
      'Vendor engineer: learn what each certificate covers, so a claim about your product matches its record.',
      'Scheme reviewer: check which document, version and scope to read before you apply a scheme’s rules.',
      'Next on this path: FIPS 140-3 Certification, then ACVP Lab Workflow, which follows a vector set through to evidence. No test vectors are run in this module.',
    ])
    expect(screen.getByRole('link', { name: 'FIPS 140-3 Certification' })).toHaveAttribute(
      'href',
      '/learn/fips-140-3-certification'
    )
    expect(screen.getByRole('link', { name: 'ACVP Lab Workflow' })).toHaveAttribute(
      'href',
      '/learn/acvp-lab-workflow'
    )
  })

  it('replaces the old engineer sentences in this module', () => {
    asPersona('cert-engineer')
    renderBox(fundamentalsManifest)
    const box = screen.getByTestId('cert-audience-route')
    expect(box).not.toHaveTextContent('exact document revisions')
    expect(box).not.toHaveTextContent('Workshop exports are structured as inputs')
  })

  it('does not show the orientation to any other role', () => {
    asPersona('ops')
    renderBox(fundamentalsManifest)
    const box = screen.getByTestId('cert-audience-route')
    expect(box).toHaveTextContent('General security practitioner route')
    expect(box).toHaveTextContent('what each certificate can support')
    expect(screen.queryByTestId('cert-route-orientation')).not.toBeInTheDocument()
    expect(box).not.toHaveTextContent('Lab tester')
    expect(box).not.toHaveTextContent('No test vectors are run in this module.')
  })

  it('leaves the other certification modules’ engineer text unchanged', () => {
    asPersona('cert-engineer')
    renderBox(fipsManifest)
    const box = screen.getByTestId('cert-audience-route')
    expect(box).toHaveTextContent('Certification engineer route')
    expect(box).toHaveTextContent(
      'Use the exact document revisions, requirement components, evidence boundaries and review questions. Workshop exports are structured as inputs to a laboratory or certification-body discussion.'
    )
    expect(screen.queryByTestId('cert-route-orientation')).not.toBeInTheDocument()
    expect(box).not.toHaveTextContent('Lab tester')
  })
})
