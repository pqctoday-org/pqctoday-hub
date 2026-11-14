// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { commandCenterIntroFor, type CommandCenterIntro } from './commandCenterIntro'
import { PERSONA_IDS, type PersonaId } from '@/data/personaIds'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

const SRC = join(__dirname, '..')

/** Every top-level and playground route segment App.tsx declares. */
const APP_SEGMENTS = new Set(
  [...readFileSync(join(SRC, 'App.tsx'), 'utf8').matchAll(/path="\/?([a-z0-9-]+)"/g)].map(
    (m) => m[1]
  )
)
const TOOL_IDS = new Set(BUSINESS_TOOLS.map((t) => t.id))
const WORKSHOP_IDS = new Set(WORKSHOP_TOOLS.map((t) => t.id))

/** True when an intro link lands on a real page, tool, module or playground. */
function routeResolves(to: string): boolean {
  const [pathOnly] = to.split(/[?#]/)
  const [top, second, third] = pathOnly.split('/').filter(Boolean)
  if (!top) return false
  if (top === 'business') {
    if (!second) return true
    if (second !== 'tools') return false
    return !third || TOOL_IDS.has(third)
  }
  if (top === 'learn') return Boolean(second && MANIFEST_BY_ID[second])
  if (top === 'playground')
    return Boolean(second && (APP_SEGMENTS.has(second) || WORKSHOP_IDS.has(second)))
  return APP_SEGMENTS.has(top)
}

const OPS_QUESTIONS = [
  [
    'Will capacity hold?',
    'Size HSM and key-operation load for post-quantum algorithms.',
    '/playground/hsm-capacity',
    'HSM capacity calculator',
  ],
  [
    'When can we change it?',
    'Line the migration up with hardware and certificate refresh windows.',
    '/business/tools/refresh-cycle-alignment',
    'Refresh-cycle alignment',
  ],
  [
    'How do we roll it out?',
    'A step-by-step deployment and rollback runbook.',
    '/business/tools/deployment-playbook',
    'Deployment playbook',
  ],
  [
    'How do we track progress?',
    'Migration KPIs over time.',
    '/business/tools/kpi-tracker',
    'KPI tracker',
  ],
] as const

const CERT_QUESTIONS = [
  [
    'Which scheme applies?',
    'FIPS 140-3, Common Criteria / EUCC and other schemes, and how a product gets through them.',
    '/learn/crypto-product-certification',
    'Crypto Product Certification',
  ],
  [
    'What has already been certified?',
    'Certification records by scheme, with the source.',
    '/compliance?tab=records',
    'Certification records',
  ],
  [
    'Is the vendor evidence enough?',
    'Score vendor certificates and claims.',
    '/business/tools/vendor-scorecard',
    'Vendor scorecard',
  ],
  [
    'Is the migration verified?',
    'Check the deployed result against the plan.',
    '/business/tools/migration-verification',
    'Migration verification',
  ],
] as const

function asTuples(intro: CommandCenterIntro) {
  return intro.questions.map((q) => [q.q, q.desc, q.to, q.cta])
}

describe('commandCenterIntroFor', () => {
  it('gives GRC its own questions, with no ROI calculator and no executive walkthrough', () => {
    const grc = commandCenterIntroFor('grc')
    expect(grc.questions.map((q) => q.q)).toEqual([
      'What applies to us?',
      'Who owns each control?',
      'What evidence is missing?',
      'How do exceptions close?',
    ])
    expect(grc.questions.some((q) => q.to.includes('roi-calculator'))).toBe(false)
    expect(grc.showGuidedOverview).toBe(false)
  })

  it('keeps the board questions for the executive and a persona with no role', () => {
    for (const p of ['executive', null] as const) {
      expect(commandCenterIntroFor(p).questions[2].cta).toBe('ROI calculator')
    }
  })

  it('gives operations its own four questions, with no walkthrough', () => {
    const ops = commandCenterIntroFor('ops')
    expect(asTuples(ops)).toEqual(OPS_QUESTIONS)
    expect(ops.showGuidedOverview).toBe(false)
    expect(ops.questions.some((q) => q.cta === 'ROI calculator')).toBe(false)
  })

  it('gives the certification engineer its own four questions, with no walkthrough', () => {
    const cert = commandCenterIntroFor('cert-engineer')
    expect(asTuples(cert)).toEqual(CERT_QUESTIONS)
    expect(cert.showGuidedOverview).toBe(false)
    expect(cert.lede).not.toMatch(/\bIEC\b|\bNIST\b|\bCSWP\b|\bCMVP\b/)
  })

  it('gives the researcher the four research questions, with no walkthrough', () => {
    const r = commandCenterIntroFor('researcher')
    expect(r.questions.map((q) => q.to)).toEqual([
      '/library?qv=new&sort=newest',
      '/playground/drbg-demo',
      '/threats',
      '/patents',
    ])
    expect(r.showGuidedOverview).toBe(false)
  })

  it('links only to tools that exist', () => {
    const ids = new Set(BUSINESS_TOOLS.map((t) => t.id))
    for (const p of [
      'grc',
      'developer',
      'executive',
      'architect',
      'researcher',
      'ops',
      'cert-engineer',
    ] as const) {
      for (const q of commandCenterIntroFor(p).questions) {
        const m = q.to.match(/^\/business\/tools\/([^/?#]+)/)
        if (m) expect(ids.has(m[1]), q.to).toBe(true)
      }
    }
  })

  it('every intro link, for every persona, resolves to a real page, tool, module or playground', () => {
    const personas: (PersonaId | null)[] = [...PERSONA_IDS, null]
    const broken: string[] = []
    for (const p of personas) {
      for (const q of commandCenterIntroFor(p).questions) {
        if (!routeResolves(q.to)) broken.push(`${p ?? 'none'}: ${q.to}`)
      }
    }
    expect(broken).toEqual([])
  })

  it('the resolver rejects a link to a page that does not exist', () => {
    expect(routeResolves('/playground/tls-config-generator')).toBe(false)
    expect(routeResolves('/business/tools/no-such-tool')).toBe(false)
    expect(routeResolves('/learn/no-such-module')).toBe(false)
  })
})
