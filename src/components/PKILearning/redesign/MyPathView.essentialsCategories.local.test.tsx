// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { MyPathView } from './MyPathView'
import { MobileMyPathView } from '@/components/Mobile/screens/MobileMyPathView'
import {
  PERSONAS,
  PERSONA_IDS,
  essentialsQuizCategories,
  type PersonaId,
} from '@/data/learningPersonas'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { useModuleStore } from '@/store/useModuleStore'
import { useLearnStore } from '@/store/useLearnStore'

// Pinned expected topics: the current Essentials curricula, with shared foundations deduplicated.
// This table is independent of the module-to-category mapping under test.
const EXPECTED = new Map<PersonaId, readonly string[]>([
  [
    'executive',
    [
      'pqc-fundamentals',
      'exec-quantum-impact',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
    ],
  ],
  [
    'grc',
    [
      'pqc-fundamentals',
      'pqc-risk-management',
      'data-asset-sensitivity',
      'pqc-grc',
      'compliance-strategy',
      'pqc-governance',
      'vendor-risk',
      'verification-closure',
    ],
  ],
  [
    'developer',
    [
      'pqc-fundamentals',
      'dev-quantum-impact',
      'tls-basics',
      'hybrid-crypto',
      'crypto-agility',
      'pki-infrastructure',
      'crypto-dev-apis',
    ],
  ],
  [
    'architect',
    [
      'pqc-fundamentals',
      'arch-quantum-impact',
      'crypto-agility',
      'crypto-mgmt-modernization',
      'hybrid-crypto',
      'kms-pqc',
      'hsm-pqc',
      'pki-infrastructure',
    ],
  ],
  [
    'researcher',
    [
      'pqc-fundamentals',
      'research-quantum-impact',
      'entropy-randomness',
      'hybrid-crypto',
      'crypto-agility',
      'standards-bodies',
      'tls-basics',
      'pki-infrastructure',
    ],
  ],
  [
    'cert-engineer',
    [
      'crypto-product-certification',
      'fips-140-3-certification',
      'acvp-lab-workflow',
      'entropy-randomness',
      'cc-eucc-certification',
      'pci-certification',
    ],
  ],
  [
    'ops',
    [
      'pqc-fundamentals',
      'ops-quantum-impact',
      'tls-basics',
      'vpn-ssh-pqc',
      'pki-infrastructure',
      'crypto-agility',
      'migration-program',
      'kms-pqc',
      'hsm-pqc',
    ],
  ],
  ['curious', ['pqc-fundamentals', 'quantum-threats', 'tls-basics']],
])

function markRead(ids: readonly string[]) {
  for (const id of ids) useModuleStore.getState().markAllLearnSectionsComplete(id)
}
function Destination() {
  const location = useLocation()
  return (
    <output aria-label="Quiz destination">
      {location.pathname}
      {location.search}
    </output>
  )
}
function renderPath(persona: PersonaId, phone: boolean) {
  render(
    <MemoryRouter initialEntries={['/learn']}>
      <Routes>
        <Route
          path="/learn"
          element={
            phone ? (
              <MobileMyPathView persona={persona} />
            ) : (
              <MyPathView personaId={persona} onOpenCatalog={() => {}} />
            )
          }
        />
        <Route path="/learn/quiz" element={<Destination />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState({ modules: {} })
  useLearnStore.getState().reset()
})

describe('complete Essentials capstone topic coverage', () => {
  it('pins an expected scope for every supported persona', () => {
    expect([...EXPECTED.keys()]).toEqual(PERSONA_IDS)
  })
  it.each(PERSONA_IDS)(
    '%s includes exactly its studied categories, in curriculum order',
    (persona) => {
      const expected = EXPECTED.get(persona)
      expect(expected).toBeDefined()
      expect(essentialsQuizCategories(persona)).toEqual(expected)
    }
  )
  it.each(PERSONA_IDS)('%s topics all have actual current quiz questions', (persona) => {
    for (const category of EXPECTED.get(persona) ?? []) {
      expect(
        QUIZ_QUESTIONS.filter((question) => question.category === category).length,
        category
      ).toBeGreaterThan(0)
    }
  })
})

for (const phone of [false, true]) {
  describe(phone ? 'native phone Essentials destination' : 'desktop Essentials destination', () => {
    it.each(PERSONA_IDS)(
      '%s capstone routes to every studied category and no mastery-only additions',
      (persona) => {
        // Exercise the real reading-completion store action and real gate/navigation handlers.
        const curriculum = Object.entries(PERSONAS).find(([id]) => id === persona)?.[1]
        expect(curriculum).toBeDefined()
        markRead(curriculum!.essentials)
        renderPath(persona, phone)
        fireEvent.click(
          screen.getByRole('button', { name: phone ? 'Take it' : 'Take the capstone' })
        )
        const destination =
          screen.getByRole('status', { name: 'Quiz destination' }).textContent ?? ''
        const url = new URL(destination, 'https://example.test')
        expect(url.pathname).toBe('/learn/quiz')
        expect(url.searchParams.getAll('category')).toHaveLength(1)
        expect(url.searchParams.get('category')?.split(',')).toEqual(EXPECTED.get(persona))
      }
    )
    it('does not unlock all six certification topics when only entropy was read', () => {
      markRead(['entropy-randomness'])
      renderPath('cert-engineer', phone)
      expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled()
      expect(
        screen.queryByRole('button', { name: phone ? 'Take it' : 'Take the capstone' })
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('status', { name: 'Quiz destination' })).not.toBeInTheDocument()
    })
  })
}
