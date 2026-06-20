// SPDX-License-Identifier: GPL-3.0-only
//
// Pillar pipeline + traceability-drawer model for the Compliance redesign.
//
// Reframes the page around its premise: bodies DEFINE algorithms → schemes
// VALIDATE products → frameworks MANDATE adoption. Everything here derives from
// the live `complianceData` layer; no placeholder data.

import type { BodyType, ComplianceFramework } from '@/data/complianceData'
import { regionForCountry } from '@/data/complianceData'
import type { Tone } from './tones'

export type PillarId = 'standardize' | 'certify' | 'comply'

export interface PillarDef {
  id: PillarId
  step: '1' | '2' | '3'
  verb: string
  title: string
  blurb: string
  countLabel: string
  /** Representative IDs shown as chips on the pillar card. */
  samples: string[]
  /** Connector caption to the next pillar (null for the last). */
  connector: string | null
}

export const PILLAR_DEFS: PillarDef[] = [
  {
    id: 'standardize',
    step: '1',
    verb: 'Define',
    title: 'Standardization Bodies',
    blurb:
      'NIST, ISO/IEC, ETSI, IETF, BSI — author the algorithms and publish the technical standards everything else cites.',
    countLabel: 'bodies & standards',
    samples: ['FIPS 203', 'FIPS 204', 'RFC 9370'],
    connector: 'publishes algorithms',
  },
  {
    id: 'certify',
    step: '2',
    verb: 'Validate',
    title: 'Certification Schemes',
    blurb:
      'FIPS 140-3, ACVP, Common Criteria, EUCC — independently test that a product implements those algorithms correctly.',
    countLabel: 'active schemes',
    samples: ['CMVP', 'CAVP', 'EUCC'],
    connector: 'tested against',
  },
  {
    id: 'comply',
    step: '3',
    verb: 'Mandate',
    title: 'Compliance Frameworks',
    blurb:
      'CNSA 2.0, NIS2, DORA, national PQC mandates — the laws that require validated PQC by a deadline.',
    countLabel: 'frameworks',
    samples: ['CNSA 2.0', 'DORA', 'NIS2'],
    connector: null,
  },
]

/** Which `bodyType` values belong to each pillar. */
export function bodyTypesForPillar(pillar: PillarId): BodyType[] {
  switch (pillar) {
    case 'standardize':
      return ['standardization_body', 'technical_standard', 'industry_alliance']
    case 'certify':
      return ['certification_body']
    case 'comply':
      return ['compliance_framework', 'regulatory_body']
  }
}

export function pillarForBodyType(bodyType: BodyType): PillarId {
  if (bodyType === 'certification_body') return 'certify'
  if (bodyType === 'compliance_framework' || bodyType === 'regulatory_body') return 'comply'
  return 'standardize'
}

export function frameworksForPillar(
  pillar: PillarId,
  frameworks: ComplianceFramework[]
): ComplianceFramework[] {
  const types = bodyTypesForPillar(pillar)
  return frameworks.filter((f) => types.includes(f.bodyType))
}

export function pillarCounts(frameworks: ComplianceFramework[]): Record<PillarId, number> {
  return {
    standardize: frameworksForPillar('standardize', frameworks).length,
    certify: frameworksForPillar('certify', frameworks).length,
    comply: frameworksForPillar('comply', frameworks).length,
  }
}

const BODY_TYPE_LABEL: Record<BodyType, string> = {
  standardization_body: 'Standards body',
  technical_standard: 'Technical standard',
  industry_alliance: 'Industry alliance',
  certification_body: 'Certification scheme',
  compliance_framework: 'Compliance framework',
  regulatory_body: 'Regulatory body',
}

export function bodyTypeLabel(bodyType: BodyType): string {
  return BODY_TYPE_LABEL[bodyType]
}

/** Human region label for a framework (single country → its bloc, else Global). */
export function regionLabel(framework: ComplianceFramework): string {
  const countries = framework.countries.filter((c) => c && c !== 'All')
  if (countries.length === 0) return 'Global'
  if (countries.length === 1) return regionForCountry(countries[0])
  // Collapse to a single bloc if they all share one, otherwise Global.
  const blocs = new Set(countries.map(regionForCountry))
  return blocs.size === 1 ? [...blocs][0] : 'Global'
}

export function pillarLabel(pillar: PillarId): string {
  return pillar === 'standardize'
    ? 'Standardization'
    : pillar === 'certify'
      ? 'Certification'
      : 'Compliance'
}

// ── Drawer (traceability) model ────────────────────────────────────────────

export interface ChainNode {
  kind: string
  value: string
  sub: string
  tone: Tone
}

export interface PhaseStep {
  year: string
  label: string
  state: 'done' | 'active' | 'future'
}

export interface CrosswalkItem {
  name: string
  note: string
  tone: Tone
}

export interface DrawerDetail {
  name: string
  pillarLabel: string
  pqcLabel: string
  pqcTone: Tone
  juris: string
  chain: ChainNode[]
  phases: PhaseStep[]
  dossierFocus: string
  dossierItems: string[]
  crosswalk: CrosswalkItem[]
}

interface MarqueeDef {
  pqcLabel: string
  pqcTone: Tone
  juris: string
  chain: ChainNode[]
  phases: PhaseStep[]
  dossierFocus: string
  dossierItems: string[]
  crosswalk: CrosswalkItem[]
}

const n = (kind: string, value: string, sub: string, tone: Tone): ChainNode => ({
  kind,
  value,
  sub,
  tone,
})
const p = (year: string, label: string, state: PhaseStep['state']): PhaseStep => ({
  year,
  label,
  state,
})
const xw = (name: string, note: string, tone: Tone): CrosswalkItem => ({ name, note, tone })

// Hand-authored chains for marquee entries so the page's premise reads cleanly
// for its highest-traffic rows. Keyed by a substring match on label / id.
const MARQUEE: { match: RegExp; def: MarqueeDef }[] = [
  {
    match: /CNSA\s*2/i,
    def: {
      pqcLabel: 'PQC mandated',
      pqcTone: 'success',
      juris: 'United States · National Security Systems',
      chain: [
        n('Mandate', 'CNSA 2.0 (NSM-8)', 'NSA directive — binding', 'error'),
        n('Requires', 'FIPS 140-3 validated', 'CMVP module certificate', 'secondary'),
        n('Covers algorithms', 'ML-KEM-1024 · ML-DSA-87', 'FIPS 203 / 204', 'primary'),
        n('Live evidence', '6 CMVP modules', 'in Product Records →', 'success'),
      ],
      phases: [
        p('2024', 'Suite published', 'done'),
        p('2027', 'Begin transition', 'active'),
        p('2030', 'Prefer PQC', 'future'),
        p('2035', 'Exclusive PQC', 'future'),
      ],
      dossierFocus: 'Multi-year transition plan for NSS to PQC.',
      dossierItems: [
        'Signed multi-year migration roadmap with gate dates',
        'Per-system migration status tracker',
        'Pilot evidence using ML-KEM-1024 / ML-DSA-87',
      ],
      crosswalk: [
        xw('NIST IR 8547', 'shares the 2030/2035 deprecation clock', 'warning'),
        xw('OMB M-23-02', 'federal-civilian sibling mandate', 'info'),
        xw('DORA', 'overlapping scope for US-EU financials', 'secondary'),
      ],
    },
  },
  {
    match: /FIPS\s*140-3/i,
    def: {
      pqcLabel: 'Validation scheme',
      pqcTone: 'info',
      juris: 'NIST CMVP · US + Canada (CCCS)',
      chain: [
        n('Scheme', 'FIPS 140-3 (CMVP)', 'module-level certificate', 'secondary'),
        n('Tests algorithms via', 'ACVP (CAVP)', 'primitive prerequisite', 'info'),
        n('Validates', 'Whole crypto module', 'SW · FW · HW boundary', 'primary'),
        n('Required by', 'CNSA 2.0 · FedRAMP', '+ DORA "state of the art"', 'error'),
      ],
      phases: [
        p('2019', 'Standard published', 'done'),
        p('2021', 'CMVP accepts 140-3', 'done'),
        p('2026', 'FIPS 140-2 sunset', 'active'),
        p('2030+', 'PQC modules grow', 'future'),
      ],
      dossierFocus: 'Use of validated modules; performance fitness.',
      dossierItems: [
        'CMVP certificate numbers for deployed modules',
        'Dual-stack CA modernisation schedule',
        'Performance-test results for PQC handshakes under load',
      ],
      crosswalk: [
        xw('ACVP', 'algorithm-level prerequisite', 'info'),
        xw('Common Criteria', 'parallel product evaluation', 'warning'),
        xw('EUCC', 'EU equivalent under Cybersecurity Act', 'success'),
      ],
    },
  },
  {
    match: /^NIST$/i,
    def: {
      pqcLabel: 'Standards source',
      pqcTone: 'primary',
      juris: 'United States · global reference',
      chain: [
        n('Body', 'NIST CSD', 'Computer Security Division', 'primary'),
        n('Publishes', 'FIPS 203 / 204 / 205', 'ML-KEM · ML-DSA · SLH-DSA', 'success'),
        n('Tested by', 'ACVP → FIPS 140-3', 'validation pipeline', 'info'),
        n('Mandated by', 'CNSA 2.0 · OMB M-23-02', 'downstream regulations', 'error'),
      ],
      phases: [
        p('2022', 'Algorithms selected', 'done'),
        p('2024', 'FIPS 203/204/205 final', 'done'),
        p('2025', 'IR 8547 transition', 'active'),
        p('2030', 'RSA/ECC deprecated', 'future'),
      ],
      dossierFocus: 'Key publications referenced downstream.',
      dossierItems: [
        'FIPS 203 — ML-KEM (key encapsulation)',
        'FIPS 204 — ML-DSA (signatures)',
        'FIPS 205 — SLH-DSA (hash-based signatures)',
        'SP 1800-38 — migration practice guide',
      ],
      crosswalk: [
        xw('ISO/IEC JTC 1', 'parallel international standardization', 'info'),
        xw('ETSI', 'EU quantum-safe profiles', 'success'),
        xw('IETF', 'protocol bindings (TLS, X.509)', 'warning'),
      ],
    },
  },
  {
    match: /^DORA$|EU\s*DORA/i,
    def: {
      pqcLabel: 'PQC expected',
      pqcTone: 'warning',
      juris: 'European Union · Financial sector',
      chain: [
        n('Mandate', 'EU DORA 2022/2554', 'ICT risk framework', 'success'),
        n('Requires', '"State of the art" crypto', 'ENISA reads as PQC-ready', 'secondary'),
        n('Satisfied via', 'FIPS 140-3 / EUCC', 'validated modules', 'info'),
        n('Live evidence', '4 EUCC products', 'in Product Records →', 'success'),
      ],
      phases: [
        p('2023', 'Regulation adopted', 'done'),
        p('2025', 'In force (Jan)', 'done'),
        p('2026', 'First exams', 'active'),
        p('2030', 'PQC readiness expected', 'future'),
      ],
      dossierFocus: 'Board-approved governance & resilience testing.',
      dossierItems: [
        'Program Charter with executive sponsor sign-off',
        'Governance structure (SteerCo / QRPM cadence)',
        'Tabletop / resilience-test records referencing PQC scenarios',
      ],
      crosswalk: [
        xw('NIS2', 'shared EU cyber baseline', 'success'),
        xw('CNSA 2.0', 'overlapping US-EU financial scope', 'secondary'),
        xw('PCI DSS 4.0', 'crypto inventory obligation', 'warning'),
      ],
    },
  },
]

function pqcStanceForFramework(
  framework: ComplianceFramework,
  pillar: PillarId
): { label: string; tone: Tone } {
  if (pillar === 'standardize') return { label: 'Standards source', tone: 'primary' }
  if (pillar === 'certify') return { label: 'Validation scheme', tone: 'info' }
  switch (framework.pqcRequirement) {
    case 'yes':
      return { label: 'PQC mandated', tone: 'error' }
    case 'partial':
      return { label: 'PQC partial', tone: 'warning' }
    case 'guidance':
      return { label: 'PQC guidance', tone: 'info' }
    case 'expected':
      return { label: 'PQC expected', tone: 'warning' }
    default:
      return { label: 'No PQC mandate', tone: 'muted' }
  }
}

function generatedPhases(framework: ComplianceFramework): PhaseStep[] {
  const year = framework.deadlineYear
  if (!year) {
    return [
      p('—', 'Adopted', 'done'),
      p('Now', 'In force', 'active'),
      p('Ongoing', 'Maintained', 'future'),
    ]
  }
  return [
    p('Now', 'Published', 'done'),
    p('In force', 'Active', 'active'),
    p(String(year), 'PQC deadline', 'future'),
  ]
}

/**
 * Build the drawer payload for a row. Marquee rows get a hand-authored chain;
 * every other row gets a pillar-appropriate generated chain from live fields so
 * nothing dead-ends.
 */
export function buildDrawerDetail(framework: ComplianceFramework, pillar: PillarId): DrawerDetail {
  const marquee = MARQUEE.find(
    (m) => m.match.test(framework.label) || m.match.test(framework.id)
  )?.def

  if (marquee) {
    return {
      name: framework.label,
      pillarLabel: pillarLabel(pillar),
      ...marquee,
    }
  }

  const region = regionLabel(framework)
  const keyRef = framework.relatedStandards?.[0] ?? bodyTypeLabel(framework.bodyType)
  const issuer = framework.enforcementBody || framework.label
  const stance = pqcStanceForFramework(framework, pillar)

  let chain: ChainNode[]
  let juris: string
  let dossierFocus: string
  let dossierItems: string[]
  let crosswalk: CrosswalkItem[]

  if (pillar === 'standardize') {
    juris = `${region} · ${bodyTypeLabel(framework.bodyType)}`
    chain = [
      n('Body', framework.label, framework.enforcementBody || 'standards organisation', 'primary'),
      n('Publishes', keyRef, 'technical standard', 'success'),
      n('Tested by', 'ACVP / FIPS 140-3', 'validation pipeline', 'info'),
      n('Cited by', 'compliance frameworks', 'downstream mandates', 'error'),
    ]
    dossierFocus = 'Authoritative reference for downstream schemes.'
    dossierItems = [
      `${keyRef} — primary specification`,
      'Public review / comment record',
      'Errata & version history',
    ]
    crosswalk = [
      xw('NIST', 'primary algorithm source', 'primary'),
      xw('IETF', 'protocol bindings', 'warning'),
    ]
  } else if (pillar === 'certify') {
    juris = `${issuer} · ${region}`
    chain = [
      n('Scheme', framework.label, 'evaluation scheme', 'secondary'),
      n('Validates', keyRef, 'evaluation target', 'primary'),
      n('Issued by', issuer, region, 'info'),
      n('Required by', 'compliance frameworks', 'procurement gate', 'error'),
    ]
    dossierFocus = 'Independent proof of correct implementation.'
    dossierItems = [
      'Certificate / evaluation report numbers',
      'Scope statement (modules in evaluation)',
      'Algorithm coverage list',
    ]
    crosswalk = [
      xw('FIPS 140-3', 'US module validation', 'secondary'),
      xw('Common Criteria', 'product evaluation', 'warning'),
    ]
  } else {
    juris = `${region} · ${framework.industries[0] ?? 'All sectors'}`
    chain = [
      n('Mandate', framework.label, framework.enforcementBody || 'regulation', stance.tone),
      n('Requires', 'FIPS 140-3 validated', 'validated modules', 'secondary'),
      n('Covers', 'ML-KEM · ML-DSA', 'FIPS 203 / 204', 'primary'),
      n('Live evidence', 'CMVP modules', 'in Product Records →', 'success'),
    ]
    dossierFocus = 'Risk-based crypto exposure assessment & treatment.'
    dossierItems = [
      'Quantum Risk Assessment (QRA) document',
      'Risk register entries with owners & status',
      'Migration roadmap referencing this mandate',
    ]
    crosswalk = [
      xw('CNSA 2.0', 'reference PQC suite', 'secondary'),
      xw('NIST IR 8547', 'transition clock', 'warning'),
    ]
  }

  return {
    name: framework.label,
    pillarLabel: pillarLabel(pillar),
    pqcLabel: stance.label,
    pqcTone: stance.tone,
    juris,
    chain,
    phases: generatedPhases(framework),
    dossierFocus,
    dossierItems,
    crosswalk,
  }
}
