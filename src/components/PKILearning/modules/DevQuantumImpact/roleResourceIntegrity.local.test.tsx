// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, useLocation } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { DevQuantumImpactModule } from './index'
import { ArchQuantumImpactModule } from '../ArchQuantumImpact'
import { RoleWhyItMatters } from '../../common/roleGuide'
import { DEV_GUIDE_DATA } from './data'
import { content as devContent } from './content'
import { content as archContent } from '../ArchQuantumImpact/content'
import devRag from './rag-summary.md?raw'
import devCurious from './curious-summary.md?raw'
import devSimple from './curious-summary-curious.md?raw'
import archRag from '../ArchQuantumImpact/rag-summary.md?raw'
import archCurious from '../ArchQuantumImpact/curious-summary.md?raw'
import archSimple from '../ArchQuantumImpact/curious-summary-curious.md?raw'
import archManifest from '../ArchQuantumImpact/manifest'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="resource-destination">{location.pathname + location.search}</output>
}

// Expected routes are pinned independently of the arrays passed to the renderer.
const cases = [
  {
    id: 'dev-quantum-impact',
    Component: DevQuantumImpactModule,
    links: [
      ['Compare API migration examples', '/learn/crypto-dev-apis?tab=workshop&step=7'],
      ['Try the code-signing sample', '/learn/code-signing?tab=workshop&step=0'],
      ['Compare JWT size and a header-line budget', '/learn/api-security-jwt?tab=workshop&step=4'],
      ['Try a configured TLS handshake', '/playground/tls-simulator'],
      ['Follow a hybrid key derivation', '/playground/hybrid-encrypt'],
      ['Inspect test-vector input gaps', '/learn/acvp-lab-workflow?tab=workshop&step=1'],
    ],
  },
  {
    id: 'arch-quantum-impact',
    Component: ArchQuantumImpactModule,
    links: [
      ['Estimate certificate-related TLS payload', '/playground/cert-capacity'],
      ['Explore TLS configuration compatibility', '/playground/tls-simulator'],
      ['Compare sample hybrid certificate formats', '/playground/hybrid-certs'],
    ],
  },
] as const

describe('Role resource integrity', () => {
  it.each(cases)(
    '$id exposes separate working-tool routes from its actual first workshop step',
    ({ id, Component, links }) => {
      const entry = `/learn/${id}?tab=workshop&step=0`
      window.history.replaceState({}, '', entry)
      render(
        <EmbedProvider>
          <MemoryRouter initialEntries={[entry]}>
            <Component />
            <LocationProbe />
          </MemoryRouter>
        </EmbedProvider>
      )
      const resources = screen.getByRole('region', { name: 'Put the role guidance into practice' })
      expect(
        within(resources).getByRole('heading', { name: 'Try the linked sample tools' })
      ).toBeInTheDocument()
      expect(within(resources).getAllByRole('link')).toHaveLength(links.length)
      for (const [label, destination] of links) {
        const link = within(resources).getByRole('link', { name: label })
        expect(link).toHaveAttribute('href', destination)
        const card = link.closest('article')!
        expect(card.querySelectorAll('p')).toHaveLength(3) // decision, capability, limits
        fireEvent.click(link)
        expect(screen.getByTestId('resource-destination').textContent).toBe(destination)
      }
      // Descriptive threat cards remain usable: the resource repair adds an
      // investigation path rather than replacing the role's original lesson.
      const expand = screen.getAllByRole('button', { name: /^Expand .* scenario$/ })[0]
      fireEvent.click(expand)
      expect(expand).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Scenario:')).toBeInTheDocument()
      const text = resources.textContent || ''
      if (id === 'dev-quantum-impact') {
        expect(text).toMatch(/one header line, not all request headers/)
        expect(text).toMatch(/input-support lesson runs no engine/)
      } else {
        expect(text).toMatch(/root is excluded/)
        expect(text).toMatch(
          /does not predict CPU capacity, P99 latency, OCSP response size or MTU fragmentation/
        )
        expect(text).toMatch(/does not establish that your clients accept/)
      }
    }
  )

  it('does not add a resource panel for other callers that supply no resources', () => {
    render(
      <MemoryRouter>
        <RoleWhyItMatters data={DEV_GUIDE_DATA} />
      </MemoryRouter>
    )
    expect(
      screen.queryByRole('region', { name: 'Put the role guidance into practice' })
    ).not.toBeInTheDocument()
  })

  it('describes actual role activities and separate tool limits across structured and derived summaries', () => {
    expect(devContent.narratives.workshopSummary).toMatch(/four steps/)
    expect(archContent.narratives.workshopSummary).toMatch(/six steps/)
    const summaries = [
      devContent.narratives.workshopSummary,
      devRag,
      devCurious,
      devSimple,
      archContent.narratives.workshopSummary,
      archRag,
      archCurious,
      archSimple,
    ]
    for (const summary of summaries) {
      expect(summary).not.toMatch(
        /signature size impact calculator|TLS handshake size estimator|TLS performance budget calculator|certificate chain size calculator|Architecture Design Lab|code signing tool migration matrix|ACVP test vector gap analysis/
      )
      expect(summary).toMatch(/separate/i)
      expect(summary).toMatch(/checklist|self-rat/i)
    }
    for (const summary of [devRag, devCurious, devSimple])
      expect(summary).toContain('/learn/api-security-jwt?tab=workshop&step=4')
    for (const summary of [archRag, archCurious, archSimple])
      expect(summary).toContain('/playground/cert-capacity')
    expect(archManifest.workshopSteps?.map((step) => step.id)).toEqual([
      'why-it-matters',
      'what-to-learn',
      'how-to-act',
      'self-assessment',
      'strangler-fig',
      'trust-hardware',
    ])
    expect(archContent.narratives.workshopSummary).toMatch(/Strangler Fig/)
    expect(archContent.narratives.workshopSummary).toMatch(/Trust Hardware Selector/)
    expect(archRag).toMatch(/Source attribution/)
    expect(archRag).toMatch(/specification\/code status/)
    expect(archContent.standards.length).toBeGreaterThan(0)
  })
})
