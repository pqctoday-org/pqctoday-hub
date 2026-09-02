// SPDX-License-Identifier: GPL-3.0-only
/**
 * Live derivation of the /navigate force-cluster graph. Every node and edge is
 * computed at call time from the hub's real, already-live data sources — no
 * hardcoded/frozen dataset. See pqctoday-priv's
 * design_handoff_force_cluster/IMPLEMENTATION-PLAN-2026-08-28.md for the full
 * category/edge rationale this module implements.
 */
import { trustedSources } from './trustedSourcesData'
import { loadPQCAlgorithmsData, type AlgorithmDetail } from './pqcAlgorithmsData'
import { loadIndustryLandscape } from './industryLandscapeData'
import { complianceFrameworks } from './complianceData'
import type { LibraryItem } from './libraryData'
import { loadGlossary } from './glossary'
import { algoProductXrefs } from './algoProductXrefData'
import { softwareData } from './migrateData'
import { SECTOR_VOCABULARY, resolveToNaicsSet } from './sectorVocabularyData'
import { PROTOCOL_MATRIX, type ProtocolMatrixRow } from './pqcProtocolMatrix'
import { standardImplementsAlgoXref } from './standardImplementsAlgoXref'
import { getSourcesForRecord } from './trustedSourceXrefData'
import { resolveLibraryRef } from '@/components/Algorithms/libraryRef'
import { conceptXwalkData } from './conceptXwalkData'
import { conceptIdForRow } from '@/utils/conceptXwalkGraph'
import { algorithmsData as algorithmTransitions } from './algorithmsData'
import { certsByProduct } from './certificationXrefData'
import { cpeByProduct } from './cpeXrefData'
import { purlByProduct } from './purlXrefData'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { patentsData } from './patentsData'
import { leadersData } from './leadersData'
import { expandAlgorithmAliases } from './algorithmNameAliases'

export type ForceClusterNodeType =
  | 'certbody'
  | 'mechanism'
  | 'industry'
  | 'usecase'
  | 'compliance'
  | 'standard'
  | 'glossary'
  | 'product'
  | 'protocol'
  | 'patent'
  | 'leader'

export interface ForceClusterNode {
  id: string
  label: string
  type: ForceClusterNodeType
  sub: string
  description: string
  degree: number
  /** Deep link to the real hub page for this entity — internal ("/library?...") or external (a trusted source's own URL). Undefined where no real destination exists (glossary has no standalone route). */
  href?: string
  /**
   * Additional REAL destinations beyond `href` — a Learn module that
   * teaches this entity, or a Playground tool for it — from each source's
   * own declared reverse-link field (library's moduleIds, migrate's
   * learningModules, compliance's learnModules, industry's learnModuleId/
   * playgroundTools, protocol's playgrounds, glossary's relatedModule).
   * Only populated where that field actually resolves to something real;
   * never guessed/fuzzy-matched. Empty/absent for mechanism/industry/
   * certbody, which have no such declared field.
   */
  extraLinks?: { label: string; href: string }[]
}

const TOOL_NAME_BY_ID = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t.name]))

function learnModuleLink(moduleId: string): { label: string; href: string } {
  // eslint-disable-next-line security/detect-object-injection -- moduleId comes from this same codebase's own CSV-declared reverse-link fields, not user input
  const title = MODULE_CATALOG[moduleId]?.title ?? moduleId
  return { label: `Open Learn module: ${title}`, href: `/learn/${moduleId}` }
}

function playgroundToolLink(toolId: string): { label: string; href: string } {
  const title = TOOL_NAME_BY_ID.get(toolId) ?? toolId
  return { label: `Open tool: ${title}`, href: `/playground/${toolId}` }
}

export interface ForceClusterEdge {
  from: string
  to: string
  rel: string
}

export interface ForceClusterGraph {
  nodes: ForceClusterNode[]
  edges: ForceClusterEdge[]
}

const CAPPED_TYPES: ReadonlySet<ForceClusterNodeType> = new Set([
  'certbody',
  'standard',
  'product',
  'patent',
  'leader',
])

function norm(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase()
}

function slug(s: string): string {
  return norm(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * migrate_certification_xref/cpe_xref/purl_xref carry real product identity
 * data (§9c gap closure) but none of it is edge-worthy against this graph's
 * 9 categories — certId is a NIST CMVP number in its own id space (doesn't
 * resolve against ComplianceFramework.id), and CPE/PURL point at external
 * NVD/registry identities nothing else in the hub is keyed on. All three are
 * folded into the product node's own description text instead of new edges.
 */
function enrichProductDescription(productId: string, softwareName: string, base: string): string {
  const parts = [base]
  const certs = certsByProduct.get(productId) ?? []
  if (certs.length > 0) {
    parts.push(certs.map((c) => `${c.certType} #${c.certId}`).join('; '))
  }
  const cpe = cpeByProduct.get(softwareName)
  if (cpe && cpe.status === 'matched') parts.push(`CPE: ${cpe.cpeUri}`)
  const purl = purlByProduct.get(softwareName)
  if (purl && purl.status === 'matched') parts.push(`PURL: ${purl.purl}`)
  return parts.join(' — ')
}

/** Builds the full, uncapped node set — one entry per category, id-keyed so edge builders can look nodes up. */
function buildNodes(
  algorithms: AlgorithmDetail[],
  landscape: ReturnType<typeof loadIndustryLandscape>,
  glossaryTerms: Awaited<ReturnType<typeof loadGlossary>>,
  libraryData: LibraryItem[]
) {
  const nodes = new Map<string, ForceClusterNode>()

  for (const src of trustedSources) {
    const id = `cb-${slug(src.sourceId)}`
    nodes.set(id, {
      id,
      label: src.sourceName,
      type: 'certbody',
      sub: src.sourceType.replace(/_/g, ' '),
      description: src.description || `${src.sourceType.replace(/_/g, ' ')} — ${src.region}`,
      degree: 0,
      href: src.primaryUrl || undefined,
    })
  }

  for (const algo of algorithms) {
    const id = `mech-${slug(algo.name)}`
    if (nodes.has(id)) continue
    nodes.set(id, {
      id,
      label: algo.name,
      type: 'mechanism',
      sub: algo.type,
      description: `${algo.type} (${algo.family}) — ${algo.status}`,
      degree: 0,
      // status=All is required, not decorative — AlgorithmsView defaults the
      // status filter to "Certified" (persona default), which hides every
      // Draft/Candidate/Research-tier algorithm from the Detailed Comparison
      // view entirely. Without this, highlight= has nothing to highlight for
      // any non-Certified algorithm — confirmed via direct browser testing
      // with a real Candidate-status algorithm (SecP384r1MLKEM1024), whose
      // deep link rendered a page with no trace of it anywhere.
      href: `/algorithms?tab=detailed&status=All&highlight=${encodeURIComponent(algo.name)}`,
    })
  }

  for (const sector of SECTOR_VOCABULARY) {
    const id = `ind-${slug(sector.sectorKey)}`
    nodes.set(id, {
      id,
      label: sector.displayName,
      type: 'industry',
      sub: sector.crossSector ? 'Cross-sector' : 'NAICS sector',
      description: `${sector.crossSector ? 'Cross-sector grouping' : 'NAICS sector'}: ${sector.displayName}`,
      degree: 0,
      href: '/algorithms?tab=landscape',
    })
  }

  for (const uc of landscape.useCases) {
    const id = `uc-${slug(uc.industry)}-${slug(uc.useCaseId)}`
    const extraLinks = [
      ...(uc.learnModuleId ? [learnModuleLink(uc.learnModuleId)] : []),
      ...uc.playgroundTools.map(playgroundToolLink),
    ]
    nodes.set(id, {
      id,
      label: uc.useCaseLabel,
      type: 'usecase',
      sub: uc.industry,
      description: uc.summary || uc.useCaseLabel,
      degree: 0,
      href: `/algorithms?tab=landscape&industry=${encodeURIComponent(uc.industry)}`,
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
    })
  }

  for (const fw of complianceFrameworks) {
    const id = `comp-${slug(fw.id)}`
    const extraLinks = (fw.learnModules ?? []).map(learnModuleLink)
    nodes.set(id, {
      id,
      label: fw.label,
      type: 'compliance',
      sub: fw.bodyType,
      description: fw.description || fw.label,
      degree: 0,
      href: '/compliance',
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
    })
  }

  for (const doc of libraryData) {
    const id = `std-${slug(doc.referenceId)}`
    const extraLinks = (doc.moduleIds ?? []).map(learnModuleLink)
    nodes.set(id, {
      id,
      label: doc.documentTitle,
      type: 'standard',
      sub: doc.documentType,
      description: doc.shortDescription || doc.documentTitle,
      degree: 0,
      href: `/library?spec=${encodeURIComponent(doc.referenceId)}`,
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
    })
  }

  for (const term of glossaryTerms) {
    const id = `gl-${slug(term.term)}`
    if (nodes.has(id)) continue
    nodes.set(id, {
      id,
      label: term.term,
      type: 'glossary',
      sub: term.category,
      description: term.definition,
      degree: 0,
      // No standalone glossary route — it's a panel opened from other pages, not a deep-linkable page.
      // relatedModule (when present) is already a full route ('/learn/...',
      // but also sometimes '/library?ref=...' etc) — used verbatim, not
      // prefixed like the module-id-keyed fields above.
      extraLinks: term.relatedModule
        ? [{ label: 'Open related page', href: term.relatedModule }]
        : undefined,
    })
  }

  for (const xref of algoProductXrefs) {
    const id = `prod-x-${slug(xref.productId)}`
    if (nodes.has(id)) continue
    const base = xref.notes || `${xref.implementationType} implementation of ${xref.algorithmName}`
    // AlgoProductXref itself carries no learningModules field — the real
    // migrate-catalog row for the same software (if any) does, same match
    // the dupOfXref reconciliation below already uses.
    const matchingSoftware = softwareData.find(
      (sw) => norm(sw.softwareName) === norm(xref.softwareName)
    )
    const extraLinks = (matchingSoftware?.learningModules ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(learnModuleLink)
    nodes.set(id, {
      id,
      label: xref.implementationName || xref.softwareName || xref.productId,
      type: 'product',
      sub: xref.implementationType,
      description: enrichProductDescription(xref.productId, xref.softwareName, base),
      degree: 0,
      href: xref.softwareName
        ? `/migrate?product=${encodeURIComponent(xref.softwareName)}`
        : undefined,
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
    })
  }
  for (const sw of softwareData) {
    const dupOfXref = algoProductXrefs.find((x) => norm(x.softwareName) === norm(sw.softwareName))
    if (dupOfXref) continue // reconciled into the algo_product_xref-origin node instead (§2.11)
    const id = `prod-m-${slug(sw.productId)}`
    if (nodes.has(id)) continue
    const extraLinks = sw.learningModules
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(learnModuleLink)
    nodes.set(id, {
      id,
      label: sw.softwareName,
      type: 'product',
      sub: 'Vendor product',
      description: enrichProductDescription(sw.productId, sw.softwareName, sw.softwareName),
      degree: 0,
      href: `/migrate?product=${encodeURIComponent(sw.softwareName)}`,
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
    })
  }

  for (const row of PROTOCOL_MATRIX) {
    const id = `proto-${slug(row.id)}`
    const extraLinks = row.playgrounds.map((tool) => ({
      label: `Open tool: ${tool.toolName}`,
      href: tool.url ?? `/playground/${tool.toolId}`,
    }))
    nodes.set(id, {
      id,
      label: row.name,
      type: 'protocol',
      sub: row.recommended ? 'Recommended' : row.historical ? 'Historical' : 'Active',
      description: row.description || row.name,
      degree: 0,
      href: `/algorithms?tab=support&protocol=${encodeURIComponent(row.id)}`,
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
    })
  }

  for (const patent of patentsData) {
    const id = `pat-${slug(patent.patentNumber)}`
    nodes.set(id, {
      id,
      label: patent.title,
      type: 'patent',
      sub: patent.applicationDomain[0] || 'Uncategorized',
      description: `${patent.assignee} — ${patent.patentNumber}`,
      degree: 0,
      href: `/patents?patent=${encodeURIComponent(patent.patentNumber)}`,
    })
  }

  for (const leader of leadersData) {
    const id = `ldr-${slug(leader.name)}`
    nodes.set(id, {
      id,
      label: leader.name,
      type: 'leader',
      sub: leader.category,
      description:
        leader.organizations.length > 0
          ? `${leader.title} — ${leader.organizations.join(', ')}`
          : leader.title,
      degree: 0,
      href: `/leaders?leader=${encodeURIComponent(leader.name)}`,
    })
  }

  return nodes
}

function libraryNodeIdFor(
  referenceId: string | undefined | null,
  nodes: Map<string, ForceClusterNode>
): string | null {
  if (!referenceId) return null
  const direct = `std-${slug(referenceId)}`
  if (nodes.has(direct)) return direct
  const resolved = resolveLibraryRef(referenceId)
  if (resolved) {
    const viaResolver = `std-${slug(resolved)}`
    if (nodes.has(viaResolver)) return viaResolver
  }
  return null
}

function productNodeIdFor(productId: string, nodes: Map<string, ForceClusterNode>): string | null {
  const xrefId = `prod-x-${slug(productId)}`
  if (nodes.has(xrefId)) return xrefId
  const migrateId = `prod-m-${slug(productId)}`
  if (nodes.has(migrateId)) return migrateId
  return null
}

function mechanismNodeIdFor(name: string, nodes: Map<string, ForceClusterNode>): string | null {
  const id = `mech-${slug(name)}`
  return nodes.has(id) ? id : null
}

function certbodyNodeIdFor(
  sourceId: string | undefined | null,
  nodes: Map<string, ForceClusterNode>
): string | null {
  if (!sourceId) return null
  const id = `cb-${slug(sourceId)}`
  return nodes.has(id) ? id : null
}

function industryNodeIdsFor(
  label: string | undefined | null,
  nodes: Map<string, ForceClusterNode>
): string[] {
  if (!label) return []
  return resolveToNaicsSet(label)
    .map((sectorKey) => `ind-${slug(sectorKey)}`)
    .filter((id) => nodes.has(id))
}

/** Full inventory of real cross-reference mechanisms — see plan §4. Mutates edges in place. */
function buildEdges(
  nodes: Map<string, ForceClusterNode>,
  algorithms: AlgorithmDetail[],
  landscape: ReturnType<typeof loadIndustryLandscape>,
  glossaryTerms: Awaited<ReturnType<typeof loadGlossary>>,
  libraryData: LibraryItem[]
): ForceClusterEdge[] {
  const edges: ForceClusterEdge[] = []
  const seen = new Set<string>()
  const add = (from: string | null, to: string | null, rel: string) => {
    if (!from || !to || from === to) return
    const key = `${from}|${to}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ from, to, rel })
  }

  // compliance -> standards / certbody
  for (const fw of complianceFrameworks) {
    const compId = `comp-${slug(fw.id)}`
    for (const ref of fw.libraryRefs) add(compId, libraryNodeIdFor(ref, nodes), 'cites')
    add(compId, certbodyNodeIdFor(fw.trustedSourceId, nodes), 'enforces')

    // industries -> compliance, via naicsCodes when present, else resolved from industries[]
    const sectorIds = fw.naicsCodes?.length
      ? fw.naicsCodes.map((code) => `ind-${slug(code)}`).filter((id) => nodes.has(id))
      : fw.industries.flatMap((label) => industryNodeIdsFor(label, nodes))
    for (const sectorId of sectorIds) add(sectorId, compId, 'governs')
  }

  // industries -> standards, via library's applicableIndustries
  for (const doc of libraryData) {
    const stdId = `std-${slug(doc.referenceId)}`
    for (const label of doc.applicableIndustries) {
      for (const sectorId of industryNodeIdsFor(label, nodes)) add(sectorId, stdId, 'related')
    }
  }

  // crypto mechanisms -> standards, via the clean standard<->param-set xref
  for (const xref of standardImplementsAlgoXref) {
    add(
      mechanismNodeIdFor(xref.paramSet, nodes),
      libraryNodeIdFor(xref.standardId, nodes),
      'specifies'
    )
  }

  // crypto mechanisms -> products, via algo_product_xref
  for (const xref of algoProductXrefs) {
    add(
      mechanismNodeIdFor(xref.algorithmName, nodes),
      productNodeIdFor(xref.productId, nodes),
      'implementedby'
    )
  }

  // use cases -> standards / certbody / industries, use cases -> crypto mechanisms (weak)
  for (const uc of landscape.useCases) {
    const ucId = `uc-${slug(uc.industry)}-${slug(uc.useCaseId)}`
    add(ucId, libraryNodeIdFor(uc.sourceLibraryRef, nodes), 'cites')
    add(ucId, certbodyNodeIdFor(uc.trustedSourceId, nodes), 'references')
    for (const sectorId of industryNodeIdsFor(uc.industry, nodes)) add(sectorId, ucId, 'related')
    for (const mechName of [...uc.pqcMechanisms, ...uc.mechanismRefs]) {
      add(ucId, mechanismNodeIdFor(mechName, nodes), 'related')
    }
  }

  // industry_standards rows bridge use cases <-> standards/certbody beyond sourceLibraryRef
  for (const std of landscape.standards) {
    const stdId = libraryNodeIdFor(std.libraryRef, nodes)
    const cbId = certbodyNodeIdFor(std.trustedSourceId, nodes)
    for (const ucRawId of std.useCaseIds) {
      const ucId = `uc-${slug(std.industry)}-${slug(ucRawId)}`
      if (!nodes.has(ucId)) continue
      add(ucId, stdId, 'cites')
      add(ucId, cbId, 'references')
    }
  }

  // certbody -> {standards, compliance, crypto mechanisms, products}, via the broad trusted_source_xref join
  for (const doc of libraryData) {
    const stdId = `std-${slug(doc.referenceId)}`
    for (const xref of getSourcesForRecord('library', doc.referenceId)) {
      add(certbodyNodeIdFor(xref.sourceId, nodes), stdId, 'publishes')
    }
  }
  for (const fw of complianceFrameworks) {
    const compId = `comp-${slug(fw.id)}`
    for (const xref of getSourcesForRecord('compliance', fw.id)) {
      add(certbodyNodeIdFor(xref.sourceId, nodes), compId, 'governs')
    }
  }
  for (const algo of algorithms) {
    const mechId = mechanismNodeIdFor(algo.name, nodes)
    for (const xref of getSourcesForRecord('algorithm', algo.name)) {
      add(certbodyNodeIdFor(xref.sourceId, nodes), mechId, 'publishes')
    }
  }
  for (const sw of softwareData) {
    const prodId = productNodeIdFor(sw.productId, nodes)
    for (const xref of getSourcesForRecord('migrate', sw.productId)) {
      add(certbodyNodeIdFor(xref.sourceId, nodes), prodId, 'references')
    }
  }

  // protocols -> standards / products / protocols / crypto mechanisms (weak)
  const protocolDocIds = (row: ProtocolMatrixRow) =>
    [...row.latestRelease, ...row.latestDraft].map((d) => d.id)
  for (const row of PROTOCOL_MATRIX) {
    const protoId = `proto-${slug(row.id)}`
    for (const docId of protocolDocIds(row))
      add(protoId, libraryNodeIdFor(docId, nodes), 'specifies')
    for (const lib of [...row.ossLibraries, ...row.commercialLibraries]) {
      add(protoId, productNodeIdFor(lib.productId, nodes), 'implementedby')
    }
    if (row.inheritsFromProtocolId)
      add(protoId, `proto-${slug(row.inheritsFromProtocolId)}`, 'related')
    if (row.supersededByProtocolId)
      add(protoId, `proto-${slug(row.supersededByProtocolId)}`, 'related')
    for (const supersededId of row.supersedes ?? [])
      add(protoId, `proto-${slug(supersededId)}`, 'related')

    const haystack = norm(`${row.description} ${row.recommendedReason ?? ''}`)
    for (const algo of algorithms) {
      if (haystack.includes(norm(algo.name)))
        add(protoId, mechanismNodeIdFor(algo.name, nodes), 'related')
    }
  }

  // standards <-> compliance/standards, via typed NIST IR 8477 concept-xwalk relationships (§9c gap
  // closure — highest-quality edges available: real reviewed relationships, not inferred). Reverse-
  // resolves each library/compliance node to its concept id (conceptIdForRow only covers
  // 'compliance'|'library'|'timeline' — no 'timeline' node category exists here to also resolve).
  const conceptIdToNodeId = new Map<string, string>()
  for (const doc of libraryData) {
    const cid = conceptIdForRow('library', doc.referenceId)
    if (cid) conceptIdToNodeId.set(cid, `std-${slug(doc.referenceId)}`)
  }
  for (const fw of complianceFrameworks) {
    const cid = conceptIdForRow('compliance', fw.id)
    if (cid) conceptIdToNodeId.set(cid, `comp-${slug(fw.id)}`)
  }
  for (const xwalk of conceptXwalkData) {
    if (xwalk.relationshipType === 'not_related') continue
    const fromId = conceptIdToNodeId.get(xwalk.fromConceptId)
    const toId = conceptIdToNodeId.get(xwalk.toConceptId)
    if (fromId && toId) add(fromId, toId, xwalk.relationshipType)
  }

  // crypto mechanisms -> crypto mechanisms, via algorithm transitions (classical algorithm being
  // replaced by its PQC successor) — reuses the design's own 'migrating-to' rel vocabulary (§4).
  // classical/pqc values often carry a trailing annotation (e.g. "ML-KEM-768 (NIST Level 3)")
  // that must be stripped before matching the clean mechanism name "ML-KEM-768".
  const stripAnnotation = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim()
  for (const transition of algorithmTransitions) {
    add(
      mechanismNodeIdFor(stripAnnotation(transition.classical), nodes),
      mechanismNodeIdFor(stripAnnotation(transition.pqc), nodes),
      'migrating-to'
    )
  }

  // industries -> certbody, via industry market size's cited trusted source
  for (const marketSize of landscape.marketSizes) {
    const cbId = certbodyNodeIdFor(marketSize.trustedSourceId, nodes)
    for (const sectorId of industryNodeIdsFor(marketSize.industry, nodes))
      add(sectorId, cbId, 'related')
  }

  // glossary -> * : weak term-matching against every other node's label (best-effort, lowest confidence)
  const labelIndex = new Map<string, string[]>()
  for (const node of nodes.values()) {
    if (node.type === 'glossary') continue
    const key = norm(node.label)
    if (key.length < 3) continue
    labelIndex.set(key, [...(labelIndex.get(key) ?? []), node.id])
  }
  for (const term of glossaryTerms) {
    const glId = `gl-${slug(term.term)}`
    const key = norm(term.term)
    for (const targetId of labelIndex.get(key) ?? []) add(glId, targetId, 'related')
  }

  // patents -> mechanism, via the SAME legacy⇄FIPS alias table
  // PatentDetail.tsx already uses to deep-link ("Kyber" patent <-> ML-KEM-*
  // mechanism nodes) — patents cite pre-standardization names, mechanism
  // nodes are exact FIPS parameter sets, so this matches by family-name
  // PREFIX (a "Kyber" patent relates to every ML-KEM-* node, since patents
  // don't specify a parameter set), never an invented exact mapping.
  const mechanismNodes = Array.from(nodes.values()).filter((n) => n.type === 'mechanism')
  const mechanismNodeIdsForPatentAlgo = (name: string): string[] => {
    const candidates = [name, ...expandAlgorithmAliases([name])].map((c) => c.toUpperCase())
    return mechanismNodes
      .filter((mech) => candidates.some((c) => mech.label.toUpperCase().startsWith(c)))
      .map((mech) => mech.id)
  }
  // "PCI-DSS" (patent corpus) vs "PCI DSS" (compliance framework label) —
  // strip hyphens/spaces so the same regulation matches regardless of
  // which punctuation convention either source happened to use.
  const normCompliance = (s: string) => norm(s).replace(/[-\s]+/g, '')
  const complianceIdByNormLabel = new Map(
    complianceFrameworks.map((fw) => [normCompliance(fw.label), `comp-${slug(fw.id)}`])
  )
  for (const patent of patentsData) {
    const patId = `pat-${slug(patent.patentNumber)}`
    for (const algoName of [...patent.pqcAlgorithms, ...patent.classicalAlgorithms]) {
      for (const mechId of mechanismNodeIdsForPatentAlgo(algoName)) add(patId, mechId, 'related')
    }
    for (const ref of patent.standardsReferenced) add(patId, libraryNodeIdFor(ref, nodes), 'cites')
    for (const target of patent.complianceTargets) {
      add(patId, complianceIdByNormLabel.get(normCompliance(target)) ?? null, 'related')
    }
  }

  // leaders -> standard/product/patents/certbody, via each of Leader's own
  // declared proof-anchor fields (keyResourceRefs/migrateCatalogRefs/
  // patentRefs, added 2026-07-30 for exactly this kind of cross-check) plus
  // the dormant-but-populated 'leaders' trusted_source_xref join (349 real
  // rows as of 2026-08-31, unused by any page until now) — none fuzzy-matched.
  for (const leader of leadersData) {
    const ldrId = `ldr-${slug(leader.name)}`
    for (const ref of leader.keyResourceRefs ?? [])
      add(ldrId, libraryNodeIdFor(ref, nodes), 'cites')
    for (const productId of leader.migrateCatalogRefs ?? [])
      add(ldrId, productNodeIdFor(productId, nodes), 'related')
    for (const patentRef of leader.patentRefs ?? []) {
      const patentNumber = /^US/i.test(patentRef) ? patentRef : `US${patentRef}`
      const patId = `pat-${slug(patentNumber)}`
      add(ldrId, nodes.has(patId) ? patId : null, 'related')
    }
    for (const xref of getSourcesForRecord('leaders', leader.name)) {
      add(certbodyNodeIdFor(xref.sourceId, nodes), ldrId, 'references')
    }
  }

  return edges
}

function computeDegrees(nodes: Map<string, ForceClusterNode>, edges: ForceClusterEdge[]): void {
  for (const node of nodes.values()) node.degree = 0
  for (const edge of edges) {
    const from = nodes.get(edge.from)
    const to = nodes.get(edge.to)
    if (from) from.degree += 1
    if (to) to.degree += 1
  }
}

/**
 * Builds the /navigate graph fresh from live hub data. Large categories
 * (certbody/standard/product) are capped to nodes with >=1 derived edge —
 * plan §2.8 — applied after the full edge set is known, so capping never
 * strands an edge pointing at a dropped node.
 */
export async function buildForceClusterGraph(): Promise<ForceClusterGraph> {
  const [algorithms, glossaryTerms, { libraryData }] = await Promise.all([
    loadPQCAlgorithmsData(),
    loadGlossary(),
    import('./libraryData'),
  ])
  const landscape = loadIndustryLandscape()

  const nodes = buildNodes(algorithms, landscape, glossaryTerms, libraryData)
  const edges = buildEdges(nodes, algorithms, landscape, glossaryTerms, libraryData)
  computeDegrees(nodes, edges)

  const survivingIds = new Set(
    Array.from(nodes.values())
      .filter((n) => !CAPPED_TYPES.has(n.type) || n.degree > 0)
      .map((n) => n.id)
  )
  const finalNodes = Array.from(nodes.values()).filter((n) => survivingIds.has(n.id))
  const finalEdges = edges.filter((e) => survivingIds.has(e.from) && survivingIds.has(e.to))

  return { nodes: finalNodes, edges: finalEdges }
}
