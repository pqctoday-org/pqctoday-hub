// SPDX-License-Identifier: AGPL-3.0-only
//
// Pillar pipeline + traceability-drawer model for the Compliance redesign.
//
// Reframes the page around its premise: bodies DEFINE algorithms → schemes
// VALIDATE products → frameworks MANDATE adoption. Everything here derives from
// the live `complianceData` layer; no placeholder data.

import type { BodyType, ComplianceFramework } from '@/data/complianceData'
import { conceptIdForFramework, getFrameworkById, regionForCountry } from '@/data/complianceData'
import { findLibraryItemByRef } from '@/data/libraryData'
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
      'CNSA 2.0 and national PQC timelines, plus resilience rules such as NIS2 and DORA — which apply to you, and which set a PQC date.',
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
      return ['compliance_framework', 'regulatory_body', 'executive_order']
  }
}

export function pillarForBodyType(bodyType: BodyType): PillarId {
  if (bodyType === 'certification_body') return 'certify'
  if (
    bodyType === 'compliance_framework' ||
    bodyType === 'regulatory_body' ||
    bodyType === 'executive_order'
  )
    return 'comply'
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
  executive_order: 'Executive order',
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
  /** Reader-facing name to show in place of `value` when `value` is a record id. */
  label?: string
  sub: string
  tone: Tone
}

export interface PhaseStep {
  year: string
  label: string
  /**
   * `recorded` is a date or note the record itself carries. It says nothing
   * about whether the step has been completed or is in force.
   */
  state: 'done' | 'active' | 'future' | 'recorded'
}

export interface CrosswalkItem {
  /** The record as the cross-walk data names it. Used to open the related record; not shown as text. */
  name: string
  /** Reader-facing name to show for the record. */
  label: string
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
const xw = (name: string, label: string, note: string, tone: Tone): CrosswalkItem => ({
  name,
  label,
  note,
  tone,
})

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

/**
 * Verb from `framework`'s perspective — subset/superset, scheme/umbrella and
 * series/member flip when framework is the `to` side. A type this table does
 * not know reads as the neutral "Relates to".
 */
export function relationshipVerb(edge: ConceptXwalkRecord, frameworkIsFromSide: boolean): string {
  switch (edge.relationshipType) {
    case 'subset_of':
      return frameworkIsFromSide ? 'Subset of' : 'Superset of'
    case 'superset_of':
      return frameworkIsFromSide ? 'Superset of' : 'Subset of'
    case 'equivalent':
      return 'Equivalent to'
    case 'scheme_under':
      return frameworkIsFromSide ? 'National scheme under' : 'Umbrella of'
    case 'part_of_series':
      return frameworkIsFromSide ? 'Part of series with' : 'Includes'
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
 *
 * Only registry-curated equivalents (the same source record, or an explicit
 * alias) contribute labels. A publisher, a certification scheme, a series or
 * a companion volume is not the same concept as the framework it relates to,
 * so its relationships never become this framework's own.
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

/** A bare record id such as `NIST-SP800-208`: one token joined by hyphens or underscores. */
function looksLikeRecordId(s: string): boolean {
  return !/\s/.test(s) && /[-_]/.test(s)
}

/**
 * Reader-facing name for one end of a cross-walk edge. The cross-walk stores
 * some records as their id (`NIST-SP800-208`, `CCCS-ITSAP40018`); the registry
 * row for that concept usually carries a proper name, and where the registry
 * too holds only the id, the record's own title is looked up in the framework
 * list or the library. Text that already reads as a name (`FIPS 203`,
 * `CNSSP 15`) is left exactly as stored, and so is an id nothing better is
 * known for.
 */
export function readableEndpointName(conceptId: string, storedName: string): string {
  if (!looksLikeRecordId(storedName)) return storedName
  const row = conceptId ? conceptByCanonicalId.get(conceptId) : undefined
  if (row) {
    if (!looksLikeRecordId(row.displayLabel)) return row.displayLabel
    if (row.sourceTable === 'compliance') {
      const label = getFrameworkById(row.sourceRowId)?.label
      if (label) return label
    }
    if (row.sourceTable === 'library') {
      const title = findLibraryItemByRef(row.sourceRowId)?.documentTitle
      if (title) return title
    }
  }
  return findLibraryItemByRef(storedName)?.documentTitle ?? storedName
}

function otherSideLabel(edge: ConceptXwalkRecord, framework: ComplianceFramework): string {
  const idsToMatch = frameworkMatchIds(framework)
  return idsToMatch.has(edge.fromConcept)
    ? readableEndpointName(edge.toConceptId, edge.toConcept)
    : readableEndpointName(edge.fromConceptId, edge.fromConcept)
}

function xwalkChainNodes(
  framework: ComplianceFramework,
  edges: ConceptXwalkRecord[],
  max: number
): ChainNode[] {
  const idsToMatch = frameworkMatchIds(framework)
  return edges.slice(0, max).map((edge) => {
    const frameworkIsFromSide = idsToMatch.has(edge.fromConcept)
    const node = n(
      relationshipVerb(edge, frameworkIsFromSide),
      otherSide(edge, framework),
      rationaleLabel(edge.rationaleType),
      'info'
    )
    return { ...node, label: otherSideLabel(edge, framework) }
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
      otherSideLabel(edge, framework),
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

/**
 * The steps shown under "Deadline phases". Only what the record states:
 * each structured milestone with its own label (`deadline_dates`), or a single
 * step saying no structured date is recorded. A record with no date is not
 * given an invented "Adopted" or "In force" phase, and a dated draft, advisory
 * target or scheme is not turned into a published-then-active sequence ending
 * in a "PQC deadline": the label is whatever the source called that date.
 */
export const NO_STRUCTURED_DATE_LABEL = 'No structured date recorded'
const UNLABELLED_DATE_LABEL = 'Date recorded; no milestone label'

function generatedPhases(framework: ComplianceFramework): PhaseStep[] {
  const dates = framework.deadlineDates ?? []
  if (dates.length === 0) return [p('—', NO_STRUCTURED_DATE_LABEL, 'recorded')]
  return dates.map((d) => p(String(d.year), d.label || UNLABELLED_DATE_LABEL, 'recorded'))
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
