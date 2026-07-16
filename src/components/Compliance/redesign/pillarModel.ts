// SPDX-License-Identifier: GPL-3.0-only
//
// Pillar pipeline + traceability-drawer model for the Compliance redesign.
//
// Reframes the page around its premise: bodies DEFINE algorithms → schemes
// VALIDATE products → frameworks MANDATE adoption. Everything here derives from
// the live `complianceData` layer; no placeholder data.

import type { BodyType, ComplianceFramework } from '@/data/complianceData'
import { conceptIdForFramework, regionForCountry } from '@/data/complianceData'
import { conceptXwalkData, type ConceptXwalkRecord } from '@/data/conceptXwalkData'
import { conceptByCanonicalId } from '@/data/conceptRegistry'
import { equivalentCanonicals } from '@/utils/conceptXwalkGraph'
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
  // eslint-disable-next-line security/detect-object-injection
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

// ── Real relationship data (NIST IR 8477 crosswalk) ─────────────────────────
//
// Replaces the old hand-authored MARQUEE overrides (4 rows) and the generic-
// template fallback (everyone else) alike: every row — marquee or not — now
// gets the same treatment, built from actual extracted relationships in
// concept_xwalks_*.csv where they exist, real CSV fields otherwise, and an
// honestly-short chain when neither is available. No row gets a claim
// (\"tested by ACVP/FIPS 140-3\", \"cited by compliance frameworks\") that
// isn't backed by something on the record for THAT row.

const RATIONALE_LABEL: Record<string, string> = {
  syntactic: 'naming match',
  semantic: 'semantic relationship',
  functional: 'functional relationship',
  technical_dependency: 'technical dependency',
  policy_reference: 'policy reference',
  implementation_guidance: 'implementation guidance',
  timeline_anchor: 'timeline anchor',
}

function rationaleLabel(rationaleType: string): string {
  // eslint-disable-next-line security/detect-object-injection
  return RATIONALE_LABEL[rationaleType] ?? rationaleType.replace(/_/g, ' ')
}

/** Verb from `framework`'s perspective — subset/superset flip when framework is the `to` side. */
function relationshipVerb(edge: ConceptXwalkRecord, frameworkIsFromSide: boolean): string {
  switch (edge.relationshipType) {
    case 'subset_of':
      return frameworkIsFromSide ? 'Subset of' : 'Superset of'
    case 'superset_of':
      return frameworkIsFromSide ? 'Superset of' : 'Subset of'
    case 'equivalent':
      return 'Equivalent to'
    case 'intersects_with':
    default:
      return 'Relates to'
  }
}

/**
 * Registry-equivalent display labels for `framework` — e.g. a compliance
 * row `ISO-19790` ("ISO/IEC 19790:2024") and the separately-registered
 * library concept `ISO-IEC-19790` describe the same real-world standard but
 * were extracted from different source tables under different registry ids
 * (see `equivalentCanonicals` in conceptXwalkGraph.ts). Real xwalk edges
 * often land on whichever form the extraction pipeline happened to author
 * against, so matching must consider both.
 */
function equivalentMatchLabels(framework: ComplianceFramework): string[] {
  const canonicalId = conceptIdForFramework(framework)
  if (!canonicalId) return []
  const center = conceptByCanonicalId.get(canonicalId)
  if (!center) return []
  const labels: string[] = []
  for (const equivId of equivalentCanonicals(center)) {
    const r = conceptByCanonicalId.get(equivId)
    if (!r) continue
    labels.push(r.displayLabel)
    if (r.sourceRowId) labels.push(r.sourceRowId)
  }
  return labels
}

/** Every raw xwalk-endpoint string that identifies this framework, including registry-equivalent forms. */
function frameworkMatchIds(framework: ComplianceFramework): Set<string> {
  return new Set([framework.id, framework.label, ...equivalentMatchLabels(framework)])
}

/** Real extracted relationships involving this framework, highest-confidence first. */
function xwalkEdgesForFramework(framework: ComplianceFramework): ConceptXwalkRecord[] {
  const idsToMatch = frameworkMatchIds(framework)
  return conceptXwalkData
    .filter((e) => idsToMatch.has(e.fromConcept) || idsToMatch.has(e.toConcept))
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
}

function otherSide(edge: ConceptXwalkRecord, framework: ComplianceFramework): string {
  const idsToMatch = frameworkMatchIds(framework)
  return idsToMatch.has(edge.fromConcept) ? edge.toConcept : edge.fromConcept
}

function xwalkChainNodes(
  framework: ComplianceFramework,
  edges: ConceptXwalkRecord[],
  max: number
): ChainNode[] {
  const idsToMatch = frameworkMatchIds(framework)
  return edges.slice(0, max).map((edge) => {
    const frameworkIsFromSide = idsToMatch.has(edge.fromConcept)
    return n(
      relationshipVerb(edge, frameworkIsFromSide),
      otherSide(edge, framework),
      rationaleLabel(edge.rationaleType),
      'info'
    )
  })
}

function xwalkCrosswalkItems(
  framework: ComplianceFramework,
  edges: ConceptXwalkRecord[],
  max: number
): CrosswalkItem[] {
  const idsToMatch = frameworkMatchIds(framework)
  return edges.slice(0, max).map((edge) => {
    const frameworkIsFromSide = idsToMatch.has(edge.fromConcept)
    return xw(
      otherSide(edge, framework),
      `${relationshipVerb(edge, frameworkIsFromSide).toLowerCase()} · ${rationaleLabel(edge.rationaleType)}`,
      'info'
    )
  })
}

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
 * Build the drawer payload for a row. Every row — including the 4 highest-
 * traffic ones that used to get a hand-authored MARQUEE override — gets the
 * same pillar-appropriate chain, built from real extracted relationships
 * (concept_xwalks_*.csv) first, real CSV fields second, and an honestly-short
 * chain when neither is available. See ACCURACY-0705 / the 2026-07-14
 * traceability-chain remediation for why: a generic per-pillar template used
 * to fabricate identical claims for every row regardless of what was true.
 */
export function buildDrawerDetail(framework: ComplianceFramework, pillar: PillarId): DrawerDetail {
  const region = regionLabel(framework)
  // Prefer real per-row citation data over the tautological fallback
  // (bodyTypeLabel just repeats the row's own category, e.g. "Technical
  // standard" naming nothing) — relatedStandards is usually the most
  // specific when populated, libraryRefs/timelineRefs otherwise.
  const keyRef =
    framework.relatedStandards?.[0] ??
    framework.libraryRefs?.[0] ??
    framework.timelineRefs?.[0] ??
    null
  const issuer = framework.enforcementBody || framework.label
  const stance = pqcStanceForFramework(framework, pillar)
  const edges = xwalkEdgesForFramework(framework)

  let chain: ChainNode[]
  let juris: string
  let dossierFocus: string
  let dossierItems: string[]
  let crosswalk: CrosswalkItem[]

  if (pillar === 'standardize') {
    juris = `${region} · ${bodyTypeLabel(framework.bodyType)}`
    const bodyNode = n(
      'Body',
      framework.label,
      framework.enforcementBody || 'standards organisation',
      'primary'
    )
    chain =
      edges.length > 0
        ? [bodyNode, ...xwalkChainNodes(framework, edges, 3)]
        : keyRef
          ? // No SME-verified relationship exists yet — `keyRef` is only the
            // row's own most-specific citation field, not a confirmed
            // authorship claim, so this must not assert a directional verb
            // like "Publishes" (wrong, e.g. for ISO/IEC 19790:2024 →
            // FIPS-140, which ISO/IEC does not publish — NIST does).
            [bodyNode, n('Related standard', keyRef, 'primary specification', 'success')]
          : [bodyNode]
    dossierFocus = 'Authoritative reference for downstream schemes.'
    dossierItems = keyRef
      ? [
          `${keyRef} — primary specification`,
          'Public review / comment record',
          'Errata & version history',
        ]
      : ['Public review / comment record', 'Errata & version history']
    crosswalk = xwalkCrosswalkItems(framework, edges, 3)
  } else if (pillar === 'certify') {
    juris = `${issuer} · ${region}`
    const schemeNode = n('Scheme', framework.label, 'evaluation scheme', 'secondary')
    chain =
      edges.length > 0
        ? [
            schemeNode,
            ...xwalkChainNodes(framework, edges, 2),
            n('Issued by', issuer, region, 'info'),
          ]
        : [schemeNode, n('Issued by', issuer, region, 'info')]
    dossierFocus = 'Independent proof of correct implementation.'
    dossierItems = [
      'Certificate / evaluation report numbers',
      'Scope statement (modules in evaluation)',
      'Algorithm coverage list',
    ]
    crosswalk = xwalkCrosswalkItems(framework, edges, 3)
  } else {
    juris = `${region} · ${framework.industries[0] ?? 'All sectors'}`
    // ACCURACY-0705: this used to render an IDENTICAL, hardcoded 4-node chain
    // ("Requires FIPS 140-3 validated" -> "Covers ML-KEM · ML-DSA" -> "Live
    // evidence: CMVP modules") for every non-marquee mandate row (verified
    // live: 111 of 115 'comply'-pillar rows), regardless of what that
    // specific mandate actually requires -- ComplianceFramework has no field
    // confirming a FIPS-140-3 dependency or that ML-KEM/ML-DSA are named.
    // Now built only from real per-row fields: `stance` (already derived from
    // `pqcRequirement`, the one genuine per-row PQC signal), `deadline`
    // (curated per-row text, e.g. "Ongoing" or "2030 (NIST IR 8547
    // deprecation target)"), and now real extracted relationships when they
    // exist. A mandate with no PQC requirement gets an honest 2-node chain
    // instead of a fabricated migration path.
    const baseChain =
      framework.pqcRequirement === 'no'
        ? [
            n('Mandate', framework.label, framework.enforcementBody || 'regulation', stance.tone),
            n(
              'PQC posture',
              stance.label,
              'no PQC requirement identified in this framework',
              stance.tone
            ),
          ]
        : [
            n('Mandate', framework.label, framework.enforcementBody || 'regulation', stance.tone),
            n('PQC posture', stance.label, framework.deadline || 'see mandate text', stance.tone),
            n(
              'See also',
              'Product Records',
              'cross-reference validated modules for your vendor',
              'success'
            ),
          ]
    chain = [...baseChain, ...xwalkChainNodes(framework, edges, 2)]
    dossierFocus = 'Risk-based crypto exposure assessment & treatment.'
    dossierItems = [
      'Quantum Risk Assessment (QRA) document',
      'Risk register entries with owners & status',
      'Migration roadmap referencing this mandate',
    ]
    crosswalk = xwalkCrosswalkItems(framework, edges, 3)
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
